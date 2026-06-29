<script lang="ts">
  import { t } from "../lib/i18n";

  let { onGoToSettings }: { onGoToSettings: () => void } = $props();
</script>

<div class="empty-state">
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
  <h3>{$t("empty.title")}</h3>
  <p>{$t("empty.desc")}</p>
  <button class="btn btn-primary mt-10" onclick={onGoToSettings}>{$t("empty.cta")}</button>
</div>
