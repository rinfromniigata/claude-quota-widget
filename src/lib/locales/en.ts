// English string dictionary. Keys are shared across all locales.
export const en: Record<string, string> = {
  // App / window
  "app.name": "Claude Quota Widget",

  // Header
  "header.title": "Claude Quotas",
  "header.home": "Home",
  "header.refreshAll": "Refresh All Accounts",
  "header.settings": "Settings",

  // Dashboard empty state
  "empty.title": "No Accounts Connected",
  "empty.desc":
    "Please click the settings gear icon in the top right to configure your sessionKey cookies and start tracking quotas.",
  "empty.cta": "Configure Settings",

  // Account card
  "card.refresh": "Refresh Account",
  "card.session": "Current Session (5h Window)",
  "card.weekly": "Weekly Account Limits",
  "card.usedPct": "{pct}% used",
  "card.syncFailed": "Sync Failed:",
  "card.invalidKey": "Unauthorized / Invalid Key",
  "card.syncing": "Syncing quotas...",

  // Quota reset footers
  "quota.resets": "Resets {time}",
  "quota.resetsPeriodic": "Resets periodically",
  "quota.resetsWeekly": "Resets weekly",

  // Relative reset time
  "reset.anyMoment": "any moment",
  "reset.inHoursMinutes": "in {h}h {m}m",
  "reset.inMinutes": "in {m}m",
  "reset.soon": "soon",

  // Footer / global status
  "status.offline": "Offline",
  "status.syncing": "Syncing...",
  "status.synced": "Synced",
  "status.issues": "Sync issues",
  "status.error": "Offline / Error",
  "status.noAccounts": "No Accounts Connected",
  "footer.lastSync": "Last Sync: {time}",
  "footer.lastSyncNone": "Last Sync: --",

  // Settings — connected accounts
  "settings.connectedAccounts": "Connected Accounts",
  "settings.noAccounts": "No accounts added yet.",

  // Settings — auto refresh
  "settings.autoRefresh": "Auto-Refresh",
  "settings.syncInterval": "Background sync interval",
  "settings.everyMinutes": "Every {n} minutes",
  "settings.everyHour": "Every hour",
  "settings.syncHelp": "Quotas also refresh instantly whenever you open the widget.",

  // Settings — notifications
  "settings.notifications": "Notifications",
  "settings.alertLabel": "Alert when session usage reaches",
  "settings.off": "Off",
  "settings.alertHelp":
    "Sends a native notification the first time your 5-hour session crosses this level.",

  // Settings — language
  "settings.language": "Language",
  "settings.langAuto": "Automatic (system)",
  "settings.langJa": "日本語",
  "settings.langEn": "English",

  // Settings — add account
  "settings.addAccount": "Add Claude Account",
  "settings.accountLabel": "Account Label",
  "settings.labelPlaceholder": "e.g. Personal, Work, Client A",
  "settings.sessionKey": "Session Key (sessionKey)",
  "settings.keyPlaceholder": "Paste sk-ant-sid02-...",
  "settings.keyHelp": "Your sessionKey cookie value from claude.ai",
  "settings.addBtn": "Add Account",
  "settings.keyUnchanged": "Leave unchanged to keep the existing key.",

  // Settings — how to
  "settings.howto": "How to locate your sessionKey",
  "settings.step1": "Log in to claude.ai in your browser.",
  "settings.step2": "Right-click on the page and select Inspect to open Developer Tools.",
  "settings.step3":
    "Navigate to the Application tab (Chrome/Edge/Safari) or Storage tab (Firefox).",
  "settings.step4": "Expand Cookies in the left menu and select https://claude.ai.",
  "settings.step5": "Find the cookie named sessionKey and copy its entire value.",
  "settings.step6": "Paste the key into the input field above, name it, and click Add.",

  // Buttons
  "btn.edit": "Edit",
  "btn.remove": "Remove",
  "btn.save": "Save",
  "btn.cancel": "Cancel",

  // Dialogs
  "confirm.remove": 'Remove account "{label}"?',
  "alert.required": "Both label and session key are required.",
  "alert.saveFailed": "Failed to save account.",
  "alert.removeFailed": "Failed to remove account.",

  // Notification
  "notif.title": "{label} — {pct}% of session used",
  "notif.body": "Your current 5-hour session has crossed {threshold}% usage.",
};
