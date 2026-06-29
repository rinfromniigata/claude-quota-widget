<script lang="ts">
  import { t } from "../lib/i18n";
  import { addAccount } from "../lib/stores";

  let { onAdded }: { onAdded: () => void } = $props();

  let label = $state("");
  let sessionKey = $state("");

  async function submit(e: Event) {
    e.preventDefault();
    const l = label.trim();
    const k = sessionKey.trim();
    if (!l || !k) return;

    const ok = await addAccount(l, k);
    if (ok) {
      label = "";
      sessionKey = "";
      onAdded();
    } else {
      alert($t("alert.saveFailed"));
    }
  }
</script>

<form onsubmit={submit}>
  <div class="form-group">
    <label for="account-label">{$t("settings.accountLabel")}</label>
    <input
      id="account-label"
      type="text"
      bind:value={label}
      placeholder={$t("settings.labelPlaceholder")}
      required
    />
  </div>
  <div class="form-group">
    <label for="account-session-key">{$t("settings.sessionKey")}</label>
    <input
      id="account-session-key"
      type="password"
      bind:value={sessionKey}
      placeholder={$t("settings.keyPlaceholder")}
      required
    />
    <span class="field-help">{$t("settings.keyHelp")}</span>
  </div>
  <button type="submit" class="btn btn-primary w-100">{$t("settings.addBtn")}</button>
</form>
