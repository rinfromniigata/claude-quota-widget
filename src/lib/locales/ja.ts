// 日本語の文字列辞書。キーは en.ts と共通。
export const ja: Record<string, string> = {
  // アプリ / ウィンドウ
  "app.name": "Claude クォータウィジェット",

  // ヘッダー
  "header.title": "Claude クォータ",
  "header.home": "ホーム",
  "header.refreshAll": "すべて更新",
  "header.settings": "設定",

  // ダッシュボード空状態
  "empty.title": "アカウント未接続",
  "empty.desc":
    "右上の歯車アイコンをクリックして sessionKey クッキーを設定すると、クォータの追跡を開始できます。",
  "empty.cta": "設定を開く",

  // アカウントカード
  "card.refresh": "このアカウントを更新",
  "card.session": "現在のセッション（5時間枠）",
  "card.weekly": "週次アカウント上限",
  "card.usedPct": "{pct}% 使用",
  "card.syncFailed": "同期失敗:",
  "card.invalidKey": "認証エラー / 無効なキー",
  "card.syncing": "クォータを同期中...",

  // クォータのリセット表記
  "quota.resets": "リセット: {time}",
  "quota.resetsPeriodic": "定期的にリセット",
  "quota.resetsWeekly": "週次でリセット",

  // 相対リセット時刻
  "reset.anyMoment": "まもなく",
  "reset.inHoursMinutes": "{h}時間{m}分後",
  "reset.inMinutes": "{m}分後",
  "reset.soon": "まもなく",

  // フッター / 全体ステータス
  "status.offline": "オフライン",
  "status.syncing": "同期中...",
  "status.synced": "同期済み",
  "status.issues": "同期に問題あり",
  "status.error": "オフライン / エラー",
  "status.noAccounts": "アカウント未接続",
  "footer.lastSync": "最終同期: {time}",
  "footer.lastSyncNone": "最終同期: --",

  // 設定 — 接続中アカウント
  "settings.connectedAccounts": "接続中のアカウント",
  "settings.noAccounts": "アカウントはまだありません。",

  // 設定 — 自動更新
  "settings.autoRefresh": "自動更新",
  "settings.syncInterval": "バックグラウンド同期の間隔",
  "settings.everyMinutes": "{n}分ごと",
  "settings.everyHour": "1時間ごと",
  "settings.syncHelp": "ウィジェットを開くたびにも即座に更新されます。",

  // 設定 — 通知
  "settings.notifications": "通知",
  "settings.alertLabel": "セッション使用率がこの値に達したら通知",
  "settings.off": "オフ",
  "settings.alertHelp":
    "5時間セッションがこの水準を初めて超えたときにネイティブ通知を送ります。",

  // 設定 — 言語
  "settings.language": "言語",
  "settings.langAuto": "自動（システム）",
  "settings.langJa": "日本語",
  "settings.langEn": "English",

  // 設定 — アカウント追加
  "settings.addAccount": "Claude アカウントを追加",
  "settings.accountLabel": "アカウント名",
  "settings.labelPlaceholder": "例: 個人、仕事、クライアントA",
  "settings.sessionKey": "セッションキー（sessionKey）",
  "settings.keyPlaceholder": "sk-ant-sid02-... を貼り付け",
  "settings.keyHelp": "claude.ai の sessionKey クッキーの値",
  "settings.addBtn": "アカウントを追加",
  "settings.keyUnchanged": "変更しなければ既存のキーを保持します。",

  // 設定 — 取得手順
  "settings.howto": "sessionKey の取得方法",
  "settings.step1": "ブラウザで claude.ai にログインします。",
  "settings.step2": "ページを右クリックして「検証」を選び、開発者ツールを開きます。",
  "settings.step3":
    "「Application」タブ（Chrome/Edge/Safari）または「ストレージ」タブ（Firefox）を開きます。",
  "settings.step4": "左メニューの「Cookies」を展開し https://claude.ai を選びます。",
  "settings.step5": "sessionKey という名前のクッキーを見つけ、値全体をコピーします。",
  "settings.step6": "上の入力欄に貼り付け、名前を付けて「追加」をクリックします。",

  // ボタン
  "btn.edit": "編集",
  "btn.remove": "削除",
  "btn.save": "保存",
  "btn.cancel": "キャンセル",

  // ダイアログ
  "confirm.remove": "アカウント「{label}」を削除しますか？",
  "alert.required": "アカウント名とセッションキーの両方が必要です。",
  "alert.saveFailed": "アカウントの保存に失敗しました。",
  "alert.removeFailed": "アカウントの削除に失敗しました。",

  // 通知
  "notif.title": "{label} — セッションの{pct}%を使用",
  "notif.body": "現在の5時間セッションが使用率{threshold}%を超えました。",
};
