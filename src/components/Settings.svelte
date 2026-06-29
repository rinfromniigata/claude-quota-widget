<script lang="ts">
  import { t } from "../lib/i18n";
  import {
    accounts,
    settings,
    setRefreshMinutes,
    setAlertThreshold,
  } from "../lib/stores";
  import AccountSettingsRow from "./AccountSettingsRow.svelte";
  import AddAccountForm from "./AddAccountForm.svelte";
  import LanguageSelect from "./LanguageSelect.svelte";

  let { onAdded }: { onAdded: () => void } = $props();

  const REFRESH_OPTIONS = [5, 10, 15, 30, 60];
  const THRESHOLD_OPTIONS = [0, 50, 60, 70, 75, 80, 85, 90, 95];

  function onRefreshChange(e: Event) {
    void setRefreshMinutes(parseInt((e.currentTarget as HTMLSelectElement).value, 10));
  }
  function onThresholdChange(e: Event) {
    void setAlertThreshold(parseInt((e.currentTarget as HTMLSelectElement).value, 10));
  }
</script>

<section class="view-panel active">
  <div class="settings-card">
    <div class="card-title-row">
      <h3>{$t("settings.connectedAccounts")}</h3>
    </div>
    <div class="accounts-settings-list">
      {#if $accounts.length === 0}
        <div class="settings-empty">{$t("settings.noAccounts")}</div>
      {:else}
        {#each $accounts as account (account.id)}
          <AccountSettingsRow {account} />
        {/each}
      {/if}
    </div>
  </div>

  <div class="settings-card mt-15">
    <h3>{$t("settings.autoRefresh")}</h3>
    <div class="form-group">
      <label for="refresh-interval">{$t("settings.syncInterval")}</label>
      <select id="refresh-interval" value={$settings.refreshMinutes} onchange={onRefreshChange}>
        {#each REFRESH_OPTIONS as n}
          <option value={n}>
            {n === 60 ? $t("settings.everyHour") : $t("settings.everyMinutes", { n })}
          </option>
        {/each}
      </select>
      <span class="field-help">{$t("settings.syncHelp")}</span>
    </div>
  </div>

  <div class="settings-card mt-15">
    <h3>{$t("settings.notifications")}</h3>
    <div class="form-group">
      <label for="alert-threshold">{$t("settings.alertLabel")}</label>
      <select id="alert-threshold" value={$settings.alertThreshold} onchange={onThresholdChange}>
        {#each THRESHOLD_OPTIONS as n}
          <option value={n}>{n === 0 ? $t("settings.off") : `${n}%`}</option>
        {/each}
      </select>
      <span class="field-help">{$t("settings.alertHelp")}</span>
    </div>
  </div>

  <div class="settings-card mt-15">
    <h3>{$t("settings.language")}</h3>
    <LanguageSelect />
  </div>

  <div class="settings-card mt-15">
    <h3>{$t("settings.addAccount")}</h3>
    <AddAccountForm {onAdded} />
  </div>

  <div class="settings-card mt-15">
    <h3>{$t("settings.howto")}</h3>
    <div class="instructions-block">
      <ol>
        <li>{$t("settings.step1")}</li>
        <li>{$t("settings.step2")}</li>
        <li>{$t("settings.step3")}</li>
        <li>{$t("settings.step4")}</li>
        <li>{$t("settings.step5")}</li>
        <li>{$t("settings.step6")}</li>
      </ol>
    </div>
  </div>
</section>

<style>
  .settings-empty {
    color: var(--text-dimmed);
    font-size: 12px;
    text-align: center;
    padding: 15px 0;
  }
</style>
