<script lang="ts">
  import { t } from "../lib/i18n";
  import { refreshAllAccounts } from "../lib/stores";

  let {
    activeView,
    onHome,
    onToggleSettings,
  }: {
    activeView: "dashboard" | "settings";
    onHome: () => void;
    onToggleSettings: () => void;
  } = $props();
</script>

<header class="widget-header">
  <div class="header-title">
    <svg width="18" height="18" viewBox="90 90 844 844" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(512 512)">
        <rect x="-28" y="-420" width="56" height="420" rx="28" fill="#E67E4F" />
        <rect x="-28" y="-420" width="56" height="420" rx="28" fill="#E67E4F" transform="rotate(36)" />
        <rect x="-28" y="-420" width="56" height="420" rx="28" fill="#E67E4F" transform="rotate(72)" />
        <rect x="-28" y="-420" width="56" height="420" rx="28" fill="#E67E4F" transform="rotate(108)" />
        <rect x="-28" y="-420" width="56" height="420" rx="28" fill="#E67E4F" transform="rotate(144)" />
        <rect x="-28" y="-420" width="56" height="420" rx="28" fill="#E67E4F" transform="rotate(180)" />
        <rect x="-28" y="-420" width="56" height="420" rx="28" fill="#E67E4F" transform="rotate(216)" />
        <rect x="-28" y="-420" width="56" height="420" rx="28" fill="#E67E4F" transform="rotate(252)" />
        <rect x="-28" y="-420" width="56" height="420" rx="28" fill="#E67E4F" transform="rotate(288)" />
        <rect x="-28" y="-420" width="56" height="420" rx="28" fill="#E67E4F" transform="rotate(324)" />
      </g>
    </svg>
    <span>{$t("header.title")}</span>
  </div>
  <div class="header-actions">
    <button class="btn-icon" title={$t("header.home")} onclick={onHome} aria-label={$t("header.home")}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5" /><path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" /><path d="M9 21v-6h6v6" /></svg>
    </button>
    <button class="btn-icon" title={$t("header.refreshAll")} onclick={() => refreshAllAccounts()} aria-label={$t("header.refreshAll")}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
    </button>
    <button class="btn-icon" class:active={activeView === "settings"} title={$t("header.settings")} onclick={onToggleSettings} aria-label={$t("header.settings")}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
    </button>
  </div>
</header>
