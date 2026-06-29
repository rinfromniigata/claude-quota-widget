<script lang="ts">
  import { t, locale } from "../lib/i18n";
  import {
    fetchAccountQuota,
    updateGlobalStatusAfter,
    type Account,
  } from "../lib/stores";
  import {
    getFiveHour,
    getSevenDay,
    getResetsAt,
    getUtilization,
    barClass,
    formatTimeUntil,
  } from "../lib/quota";

  let { account }: { account: Account } = $props();

  const dotClass = $derived(
    account.status === "error"
      ? "error"
      : account.status === "syncing"
        ? "warning"
        : "online",
  );

  const fh = $derived(getFiveHour(account.quotaData));
  const sd = $derived(getSevenDay(account.quotaData));
  const sessionPct = $derived(getUtilization(fh));
  const weeklyPct = $derived(getUtilization(sd));
  const sessionResetsAt = $derived(getResetsAt(fh));
  const weeklyResetsAt = $derived(getResetsAt(sd));

  function resetLabel(iso: string | null, fallbackKey: string): string {
    if (!iso) return $t(fallbackKey);
    return $t("quota.resets", {
      time: formatTimeUntil(iso, $locale, $t),
    });
  }

  async function refreshThis() {
    account.status = "syncing";
    await fetchAccountQuota(account);
    updateGlobalStatusAfter();
  }
</script>

<div class="account-card">
  <div class="account-card-header">
    <div class="account-info">
      <span class="pulse-dot {dotClass}"></span>
      <span class="account-name">{account.label}</span>
    </div>
    <button class="btn-icon" title={$t("card.refresh")} aria-label={$t("card.refresh")} onclick={refreshThis}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
    </button>
  </div>

  <div class="account-card-body">
    {#if account.status === "error"}
      <div class="card-error">
        <strong>{$t("card.syncFailed")}</strong><br />{account.errorMsg || $t("card.invalidKey")}
      </div>
    {:else if account.status === "syncing" && !account.quotaData}
      <div class="card-syncing">{$t("card.syncing")}</div>
    {:else}
      <div class="quota-item">
        <div class="quota-header-row">
          <span class="quota-title">{$t("card.session")}</span>
          <span class="quota-desc">{$t("card.usedPct", { pct: sessionPct })}</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill {barClass(sessionPct)}" style="width: {sessionPct}%;"></div>
        </div>
        <div class="quota-footer-row">{resetLabel(sessionResetsAt, "quota.resetsPeriodic")}</div>
      </div>

      <div class="quota-item">
        <div class="quota-header-row">
          <span class="quota-title">{$t("card.weekly")}</span>
          <span class="quota-desc">{$t("card.usedPct", { pct: weeklyPct })}</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill {barClass(weeklyPct, 'weekly')}" style="width: {weeklyPct}%;"></div>
        </div>
        <div class="quota-footer-row">{resetLabel(weeklyResetsAt, "quota.resetsWeekly")}</div>
      </div>
    {/if}
  </div>
</div>

<style>
  .card-error {
    color: var(--error-color);
    font-size: 12px;
    text-align: center;
    padding: 10px 0;
    line-height: 1.4;
  }
  .card-syncing {
    color: var(--text-dimmed);
    font-size: 12px;
    text-align: center;
    padding: 10px 0;
  }
</style>
