import { get, writable } from "svelte/store";
import * as api from "./api";
import {
  getSessionUtilization,
  getWeeklyUtilization,
  type QuotaData,
} from "./quota";
import { langSetting, locale, t, type LangSetting } from "./i18n";

export type AccountStatus = "offline" | "syncing" | "online" | "error";
export type GlobalStatus = "offline" | "syncing" | "online" | "warning" | "error";

export interface Account {
  id: string;
  label: string;
  sessionKey: string;
  quotaData: QuotaData;
  lastFetchTime: number;
  status: AccountStatus;
  errorMsg?: string;
  alertedHighUsage?: boolean;
}

export interface Settings {
  refreshMinutes: number;
  alertThreshold: number;
  language: LangSetting;
}

export const DEFAULT_REFRESH_MINUTES = 15;
export const DEFAULT_ALERT_THRESHOLD = 80;

export const accounts = writable<Account[]>([]);
export const settings = writable<Settings>({
  refreshMinutes: DEFAULT_REFRESH_MINUTES,
  alertThreshold: DEFAULT_ALERT_THRESHOLD,
  language: "auto",
});
export const globalStatus = writable<GlobalStatus>("offline");
export const lastSyncTime = writable<number>(0);

let autoRefreshTimer: ReturnType<typeof setInterval> | null = null;

// Persist the current store state in a single notify-after-mutation helper.
function notifyAccounts(list: Account[]) {
  accounts.set([...list]);
}

// --- Load / persist -------------------------------------------------------

export async function loadAllData(): Promise<void> {
  try {
    const tracker = (await api.getTrackerSettings()) as Record<string, unknown>;

    const loaded = Array.isArray(tracker.accounts)
      ? (tracker.accounts as Array<Partial<Account>>)
      : [];

    const list: Account[] = loaded.map((a) => ({
      id: a.id ?? "acc_" + Math.random().toString(36).slice(2, 11),
      label: a.label ?? "",
      sessionKey: a.sessionKey ?? "",
      quotaData: null,
      lastFetchTime: 0,
      status: "syncing",
    }));
    accounts.set(list);

    settings.update((s) => ({
      refreshMinutes:
        typeof tracker.refreshMinutes === "number"
          ? tracker.refreshMinutes
          : s.refreshMinutes,
      alertThreshold:
        typeof tracker.alertThreshold === "number"
          ? tracker.alertThreshold
          : s.alertThreshold,
      language:
        tracker.language === "ja" || tracker.language === "en"
          ? tracker.language
          : "auto",
    }));

    // Apply the persisted language to the i18n store.
    langSetting.set(get(settings).language);

    if (list.length > 0) {
      await refreshAllAccounts();
    } else {
      updateGlobalStatusAfter();
    }
  } catch (err) {
    console.error("Error loading account settings:", err);
    updateGlobalStatusAfter();
  }
}

export async function saveAccountsToDisk(): Promise<boolean> {
  // Strip transient runtime fields before writing config.
  const accountsToSave = get(accounts).map((a) => ({
    id: a.id,
    label: a.label,
    sessionKey: a.sessionKey,
  }));
  const s = get(settings);
  const result = await api.saveTrackerSettings({
    accounts: accountsToSave,
    refreshMinutes: s.refreshMinutes,
    alertThreshold: s.alertThreshold,
    language: s.language,
  });
  return !!(result && result.success);
}

// --- Refresh / fetch ------------------------------------------------------

export function startAutoRefresh(): void {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  const minutes = get(settings).refreshMinutes || DEFAULT_REFRESH_MINUTES;
  autoRefreshTimer = setInterval(() => {
    void refreshAllAccounts();
  }, minutes * 60 * 1000);
}

export async function refreshAllAccounts(): Promise<void> {
  const list = get(accounts);
  if (list.length === 0) return;

  // Restart the timer to avoid double updates.
  startAutoRefresh();

  globalStatus.set("syncing");
  list.forEach((a) => (a.status = "syncing"));
  notifyAccounts(list);

  await Promise.all(list.map((a) => fetchAccountQuota(a)));

  notifyAccounts(list);
  updateGlobalStatusAfter();
}

// Fetch live limits for a single account (mutates the account in place).
export async function fetchAccountQuota(account: Account): Promise<void> {
  try {
    const result = await api.fetchLiveLimits(account.sessionKey);
    if (result && result.success && result.data) {
      account.quotaData = result.data as QuotaData;
      account.lastFetchTime = Date.now();
      account.status = "online";
      checkSessionUsageAlert(account);
    } else {
      account.quotaData = null;
      account.status = "error";
      account.errorMsg = result ? result.error : "Connection error";
    }
  } catch (e) {
    account.quotaData = null;
    account.status = "error";
    account.errorMsg = e instanceof Error ? e.message : String(e);
  }
  notifyAccounts(get(accounts));
}

// --- Alerts ---------------------------------------------------------------

// Fire a native notification the first time usage crosses the threshold, and
// re-arm only after usage drops back below it.
export function checkSessionUsageAlert(account: Account): void {
  const threshold = get(settings).alertThreshold;
  if (!threshold || threshold <= 0) return;

  const sessionPct = getSessionUtilization(account.quotaData);
  if (sessionPct >= threshold) {
    if (!account.alertedHighUsage) {
      account.alertedHighUsage = true;
      const translate = get(t);
      void api.notify(
        translate("notif.title", { label: account.label, pct: sessionPct }),
        translate("notif.body", { threshold }),
      );
    }
  } else {
    account.alertedHighUsage = false;
  }
}

// Re-evaluate alerts (e.g. after the threshold changes).
export function reevaluateAlerts(): void {
  const list = get(accounts);
  list.forEach((a) => (a.alertedHighUsage = false));
  list.forEach((a) => {
    if (a.status === "online") checkSessionUsageAlert(a);
  });
}

// --- Mutations ------------------------------------------------------------

export async function addAccount(label: string, sessionKey: string): Promise<boolean> {
  const account: Account = {
    id: "acc_" + Math.random().toString(36).slice(2, 11),
    label,
    sessionKey,
    quotaData: null,
    lastFetchTime: 0,
    status: "syncing",
  };
  accounts.update((l) => [...l, account]);
  const ok = await saveAccountsToDisk();
  if (!ok) {
    accounts.update((l) => l.filter((a) => a.id !== account.id));
    return false;
  }
  await fetchAccountQuota(account);
  updateGlobalStatusAfter();
  return true;
}

export async function removeAccount(id: string): Promise<boolean> {
  const prev = get(accounts);
  accounts.set(prev.filter((a) => a.id !== id));
  const ok = await saveAccountsToDisk();
  if (!ok) {
    accounts.set(prev);
    return false;
  }
  updateGlobalStatusAfter();
  return true;
}

export async function updateAccount(
  id: string,
  label: string,
  sessionKey: string,
): Promise<boolean> {
  const list = get(accounts);
  const account = list.find((a) => a.id === id);
  if (!account) return false;

  const keyChanged = sessionKey !== account.sessionKey;
  account.label = label;
  account.sessionKey = sessionKey;
  notifyAccounts(list);

  const ok = await saveAccountsToDisk();
  if (!ok) return false;

  if (keyChanged) {
    account.status = "syncing";
    notifyAccounts(list);
    await fetchAccountQuota(account);
  }
  updateGlobalStatusAfter();
  return true;
}

// --- Settings mutations ---------------------------------------------------

export async function setRefreshMinutes(minutes: number): Promise<void> {
  if (!minutes || minutes <= 0) return;
  settings.update((s) => ({ ...s, refreshMinutes: minutes }));
  await saveAccountsToDisk();
  startAutoRefresh();
}

export async function setAlertThreshold(threshold: number): Promise<void> {
  settings.update((s) => ({
    ...s,
    alertThreshold: isNaN(threshold) ? 0 : threshold,
  }));
  reevaluateAlerts();
  await saveAccountsToDisk();
}

export async function setLanguage(language: LangSetting): Promise<void> {
  settings.update((s) => ({ ...s, language }));
  langSetting.set(language);
  await saveAccountsToDisk();
}

// --- Global status helper -------------------------------------------------

// Recompute the aggregate status + last-sync time from current account states.
// Called after any settle (full refresh, single refresh, add/remove/edit).
// Build the compact tray status text from the current online accounts.
// Windows tray has limited space, so display only 5-hour session utilization.
// One account → "42%"; multiple → "A:42% B:13%".
function buildTrayTitle(list: Account[]): string {
  const online = list.filter((a) => a.status === "online" && a.quotaData);
  if (online.length === 0) return "";
  if (online.length === 1) {
    const q = online[0].quotaData;
    return `${getSessionUtilization(q)}%`;
  }
  return online
    .map((a) => {
      const label = a.label.length > 3 ? a.label.slice(0, 3) : a.label;
      return `${label}:${getSessionUtilization(a.quotaData)}%`;
    })
    .join(" ");
}

export function updateGlobalStatusAfter(): void {
  const list = get(accounts);
  void api.setTrayTitle(buildTrayTitle(list));
  if (list.length === 0) {
    globalStatus.set("offline");
    lastSyncTime.set(0);
    return;
  }

  // Don't override a transient "syncing" aggregate while a sync is in flight.
  const anySyncing = list.some((a) => a.status === "syncing");
  if (!anySyncing) {
    const allOnline = list.every((a) => a.status === "online");
    const anyOnline = list.some((a) => a.status === "online");
    globalStatus.set(allOnline ? "online" : anyOnline ? "warning" : "error");
  }

  const latest = Math.max(...list.map((a) => a.lastFetchTime || 0));
  lastSyncTime.set(latest);
}

// Keep locale exported for convenience in components.
export { locale };
