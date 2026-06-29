import type { Lang } from "./i18n";

// The upstream private API is not guaranteed to use a stable casing, so every
// accessor tolerates both snake_case and camelCase shapes.
type QuotaWindow = {
  utilization?: number;
  resets_at?: string;
  resetsAt?: string;
};

export type QuotaData = {
  five_hour?: QuotaWindow;
  fiveHour?: QuotaWindow;
  seven_day?: QuotaWindow;
  sevenDay?: QuotaWindow;
} | null;

export function getFiveHour(q: QuotaData): QuotaWindow | null {
  return q?.five_hour ?? q?.fiveHour ?? null;
}

export function getSevenDay(q: QuotaData): QuotaWindow | null {
  return q?.seven_day ?? q?.sevenDay ?? null;
}

export function getResetsAt(w: QuotaWindow | null): string | null {
  return w?.resets_at ?? w?.resetsAt ?? null;
}

export function getUtilization(w: QuotaWindow | null): number {
  if (w && w.utilization !== undefined) return Math.round(w.utilization);
  return 0;
}

// Current 5-hour session utilization (%) — used for alerts and the session bar.
export function getSessionUtilization(q: QuotaData): number {
  return getUtilization(getFiveHour(q));
}

// Progress-bar severity class shared by both quota bars.
export function barClass(pct: number, base = ""): string {
  if (pct >= 95) return "danger";
  if (pct >= 80) return "warning";
  return base;
}

type Translate = (key: string, params?: Record<string, string | number>) => string;

// Format an ISO reset timestamp as a localized countdown / target time.
export function formatTimeUntil(
  iso: string | null,
  locale: Lang,
  t: Translate,
): string {
  if (!iso) return "--";
  try {
    const target = new Date(iso);
    const diffMs = target.getTime() - Date.now();
    if (diffMs <= 0) return t("reset.anyMoment");

    const totalMin = Math.floor(diffMs / 60000);
    const hrs = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    const lc = locale === "ja" ? "ja-JP" : "en-US";

    if (hrs >= 24) {
      const dayName = target.toLocaleDateString(lc, { weekday: "short" });
      const timeStr = target.toLocaleTimeString(lc, {
        hour: "numeric",
        minute: "2-digit",
        hour12: locale === "en",
      });
      return `${dayName} ${timeStr}`;
    }
    if (hrs > 0) return t("reset.inHoursMinutes", { h: hrs, m: mins });
    return t("reset.inMinutes", { m: mins });
  } catch {
    return t("reset.soon");
  }
}
