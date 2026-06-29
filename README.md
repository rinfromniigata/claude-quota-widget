# Claude Quota Widget 📊

**Tauri 2.0 + Svelte** で構築された、軽量でモダンな macOS メニューバーウィジェット。macOS ステータスバーに常駐し、複数の Anthropic **Claude.ai** アカウントのローリング 5 時間セッション制限と週間利用クォータをリアルタイムで監視できます。**日本語 / 英語バイリンガル UI** に対応。

![Platform](https://img.shields.io/badge/Platform-macOS-orange?style=flat-square&logo=apple)
![Tauri](https://img.shields.io/badge/Tauri-2.0-24C8DB?style=flat-square&logo=tauri)
![Svelte](https://img.shields.io/badge/Svelte-5-FF3E00?style=flat-square&logo=svelte)
![Bun](https://img.shields.io/badge/Bun-runtime-000000?style=flat-square&logo=bun)

> **v2.1 update:** v2.0 では Electron から Rust（Tauri）バックエンド + Svelte フロントエンドに全面リビルド。Bun でパッケージ化・実行され、より小さく、より高速なネイティブバイナリを実現。クロスプラットフォーム対応（Windows/Linux）は検討中で、macOS が主要でフル対応されたターゲット。

---

## 主な機能 🚀

- **Mac メニューバーウィジェット:** ステータスバーに常駐。アイコンを左クリックで次のコンパクトウィンドウをトグル、右クリックで表示 / 非表示 / 終了メニュー。macOS では Dock アイコンがウィンドウの表示・非表示に同期。
- **日本語・英語対応 (バイリンガル UI):** システム言語（日本語 / 英語）に自動対応し、設定から手動で言語を切り替え可能。選択は保存されます。
- **マルチアカウント対応:** 複数の Claude アカウント（例：*個人*、*仕事*、*企業*）をカスタムラベルで追加・管理。
- **インライン編集:** ラベルの更新や期限切れ `sessionKey` のローテーションを設定リストから直接実行。キーを変更すると自動的にアカウント検証が行われます。
- **自動更新間隔設定:** バックグラウンド同期間隔を選択可能（5/10/15/30/60 分）。ウィジェットを開いた時と Claude CLI データの変更時は即座に更新。
- **利用アラート:** 5 時間セッションが指定した閾値（50% ～ 95%）に達すると、ネイティブ通知を送信。アラートはオフにも設定可。各アカウントはセッションごとに 1 回アラートし、セッションリセット後に再度有効化。
- **ライブシンク & アカウント隔離:** Rust バックエンドが Anthropic のプライベート Web エンドポイントに直接通信（ブラウザ CORS 制限なし）。アカウントは並列で取得され、期限切れ / 失敗したキーは他のアカウントに影響を与えずに隔離。
- **プライバシー第一:** セッションキーは `~/.claude/tracker-settings.json` にローカル保存され、Claude.ai にのみ送信されます。

---

## アプリインターフェース プレビュー 📱

![Claude Quota Widget Preview](assets/preview.png)

---

## `sessionKey` の取得方法 🔑

ライブ利用状況メトリクスを同期するには、各アカウントの `sessionKey` クッキー値が必要です：

1. ブラウザを開き [claude.ai](https://claude.ai) にログイン。
2. ページ上で右クリックして **検査**（または **Inspect**）を選択し、開発者ツールを開く。
3. **Application**（Chrome / Safari）または **Storage**（Firefox）タブに移動。
4. 左サイドバーの **Cookies** を展開し、`https://claude.ai` をクリック。
5. `sessionKey` という行を見つけ、値全体をコピー（`sk-ant-sid02-...` で始まります）。
6. ウィジェットヘッダの歯車アイコン `[⚙]` をクリック、ラベル（例：*個人*）を入力、キーを貼り付け、**Add Account**（アカウント追加）をクリック。

> **キーが期限切れ？** `sessionKey` クッキーは Anthropic によって定期的にローテーションされます。アカウントが *Sync Failed*（同期失敗）警告を表示する場合、設定を開き、そのアカウントの **Edit**（編集）をクリックして新しいキーを貼り付けてください。

---

## インストール & セットアップ 🛠️

### 最も簡単な方法：リリース版をダウンロード

GitHub の [最新リリース](https://github.com/ofuchirin/claude-quota-widget/releases) から、あなたのシステムに合わせたアプリをダウンロードしてください：

- **macOS (Apple Silicon + Intel Universal):** `Claude.Quota.Widget_*.dmg`
- **Windows (x64):** `Claude.Quota.Widget_*.exe`

`.dmg` をダウンロードしたら、ファイルをダブルクリック → Applications フォルダにドラッグ &ドロップ。
`.exe` をダウンロードしたら、インストーラーを実行してインストール完了。

---

### ローカルで開発・ビルドする場合

#### 前提条件
- **[Bun](https://bun.sh)** (パッケージマネージャー + スクリプトランナー)
- **[Rust](https://rustup.rs)** (安定版ツールチェーン — Tauri で必須)
- **macOS:** Xcode Command Line Tools (`xcode-select --install`)
- Linux/Windows: [Tauri の前提条件](https://tauri.app/start/prerequisites/)を参照

#### 1. 依存関係のインストール
```bash
bun install
```

#### 2. 開発モードで実行
```bash
bun run dev
```
Vite 開発サーバーを起動し、Tauri ウィンドウを立ち上げます。モノクロバーストアイコンがステータスバーにマウントされます。ウィンドウを閉じてもアプリはメニューバーで実行継続（macOS では Dock アイコンが自動的に非表示）。

#### 3. ローカルでビルド
```bash
bun run build
```
最適化されたネイティブバンドル（`.app` と `.dmg`/`.exe`）を生成します。出力は `src-tauri/target/release/bundle/` に生成されます。

*注：有料の Apple Developer 証明書なしでローカルビルドした場合、macOS Gatekeeper が検証警告を表示することがあります。初回実行時は `.app` を右クリックして**開く**を選択し、その後**開く**をクリックしてください。*

---

## ファイル構成 📂

```
claude-quota-widget/
├── index.html                   # Vite エントリーポイント（Svelte アプリをマウント）
├── package.json                 # Bun スクリプト & フロントエンド依存
├── vite.config.ts / svelte.config.js / tsconfig.json
├── src/                         # フロントエンド（Svelte + TypeScript）
│   ├── main.ts                  # アプリマウント
│   ├── App.svelte               # ルート：ダッシュボード/設定 + トレイドラッグエリア
│   ├── app.css                  # macOS グラスモーフィズムスタイル
│   ├── components/              # Header, Dashboard, AccountCard, Settings, …
│   └── lib/
│       ├── api.ts               # invoke()/listen() ラッパー（preload に代替）
│       ├── stores.ts            # accounts/settings/status ストア + アクション
│       ├── quota.ts             # スネークケース/キャメルケース正規化 + 時間フォーマット
│       ├── i18n.ts              # ロケールストア + t() 翻訳機
│       └── locales/{en,ja}.ts   # 文字列辞書
├── src-tauri/                   # Rust バックエンド
│   ├── Cargo.toml / tauri.conf.json
│   ├── capabilities/default.json
│   ├── icons/                   # アプリ + トレイテンプレートアイコン
│   └── src/
│       ├── main.rs / lib.rs     # エントリー + ビルダー配線
│       ├── commands.rs          # #[tauri::command] ハンドラー（ApiResult）
│       ├── quota.rs             # claude.ai 利用状況取得（reqwest）
│       ├── settings.rs          # tracker-settings.json I/O
│       ├── watcher.rs           # デバウンス fs watch → "data-changed"
│       ├── tray.rs              # メニューバー トレイ + メニュー
│       └── window.rs            # 表示/非表示 + macOS Dock アクティベーション ポリシー
└── README.md
```

---

## セキュリティ & プライバシー 🔒

- すべてのリクエストはローカルマシンから **直接** `claude.ai` エンドポイントに送信されます（Rust バックエンドが実行）。
- 中央サーバー、トラッキング、プロキシは使用されません。
- キーは `~/.claude/tracker-settings.json` にローカル JSON として保存されます。プレーンテキストで保存されるため、マシンのセキュリティを維持してください。
