<script lang="ts">
  import { t } from "../lib/i18n";
  import { removeAccount, updateAccount, type Account } from "../lib/stores";

  let { account }: { account: Account } = $props();

  let editing = $state(false);
  let editLabel = $state("");
  let editKey = $state("");

  const maskedKey = $derived(
    account.sessionKey.length > 20
      ? account.sessionKey.slice(0, 12) + "..." + account.sessionKey.slice(-6)
      : "••••••••••••",
  );

  function startEdit() {
    editLabel = account.label;
    editKey = account.sessionKey;
    editing = true;
  }

  function cancelEdit() {
    editing = false;
  }

  async function commit() {
    const l = editLabel.trim();
    const k = editKey.trim();
    if (!l || !k) {
      alert($t("alert.required"));
      return;
    }
    const ok = await updateAccount(account.id, l, k);
    if (!ok) {
      alert($t("alert.saveFailed"));
      return;
    }
    editing = false;
  }

  async function remove() {
    if (!confirm($t("confirm.remove", { label: account.label }))) return;
    const ok = await removeAccount(account.id);
    if (!ok) alert($t("alert.removeFailed"));
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") commit();
  }
</script>

<div class="account-settings-row" class:editing>
  {#if editing}
    <div class="account-settings-edit">
      <div class="form-group">
        <label for="edit-label-{account.id}">{$t("settings.accountLabel")}</label>
        <input
          id="edit-label-{account.id}"
          type="text"
          bind:value={editLabel}
          placeholder={$t("settings.labelPlaceholder")}
          onkeydown={onKeydown}
        />
      </div>
      <div class="form-group">
        <label for="edit-key-{account.id}">{$t("settings.sessionKey")}</label>
        <input
          id="edit-key-{account.id}"
          type="password"
          bind:value={editKey}
          placeholder={$t("settings.keyPlaceholder")}
          onkeydown={onKeydown}
        />
        <span class="field-help">{$t("settings.keyUnchanged")}</span>
      </div>
      <div class="account-settings-actions">
        <button class="btn btn-primary btn-action" onclick={commit}>{$t("btn.save")}</button>
        <button class="btn btn-secondary btn-action" onclick={cancelEdit}>{$t("btn.cancel")}</button>
      </div>
    </div>
  {:else}
    <div class="account-settings-info">
      <span class="account-settings-label">{account.label}</span>
      <span class="account-settings-mask">{maskedKey}</span>
    </div>
    <div class="account-settings-actions">
      <button class="btn btn-secondary btn-action" onclick={startEdit}>{$t("btn.edit")}</button>
      <button class="btn btn-danger btn-action" onclick={remove}>{$t("btn.remove")}</button>
    </div>
  {/if}
</div>
