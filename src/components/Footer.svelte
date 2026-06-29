<script lang="ts">
  import { t, locale } from "../lib/i18n";
  import { accounts, globalStatus, lastSyncTime } from "../lib/stores";

  const dotClass = $derived(
    $accounts.length === 0
      ? "error"
      : $globalStatus === "syncing"
        ? "warning"
        : $globalStatus === "online"
          ? "online"
          : $globalStatus === "warning"
            ? "warning"
            : "error",
  );

  const statusText = $derived(
    $accounts.length === 0
      ? $t("status.noAccounts")
      : $globalStatus === "syncing"
        ? $t("status.syncing")
        : $globalStatus === "online"
          ? $t("status.synced")
          : $globalStatus === "warning"
            ? $t("status.issues")
            : $globalStatus === "offline"
              ? $t("status.offline")
              : $t("status.error"),
  );

  const lastSyncText = $derived(
    $lastSyncTime > 0
      ? $t("footer.lastSync", {
          time: new Date($lastSyncTime).toLocaleTimeString(
            $locale === "ja" ? "ja-JP" : "en-US",
            { hour: "2-digit", minute: "2-digit", second: "2-digit" },
          ),
        })
      : $t("footer.lastSyncNone"),
  );
</script>

<footer class="widget-footer">
  <div class="sync-status">
    <span class="pulse-dot {dotClass}"></span>
    <span class="status-text">{statusText}</span>
  </div>
  <div class="last-updated">{lastSyncText}</div>
</footer>
