# Claude Quota Widget 📊

A lightweight, modern macOS menu-bar widget built with **Tauri 2.0 + Svelte**. It lives in your macOS status bar and lets you monitor rolling 5-hour session limits and weekly utilization quotas across multiple Anthropic **Claude.ai** accounts simultaneously. **Japanese / English bilingual UI** included.

![Platform](https://img.shields.io/badge/Platform-macOS-orange?style=flat-square&logo=apple)
![Tauri](https://img.shields.io/badge/Tauri-2.0-24C8DB?style=flat-square&logo=tauri)
![Svelte](https://img.shields.io/badge/Svelte-5-FF3E00?style=flat-square&logo=svelte)
![Bun](https://img.shields.io/badge/Bun-runtime-000000?style=flat-square&logo=bun)

> **v2.0 rewrite:** Previously an Electron app, now rebuilt on a Rust (Tauri) backend with a Svelte frontend, packaged/run with Bun. The result is a much smaller, faster native binary. Cross-platform builds (Windows/Linux) are in scope; macOS is the primary, fully supported target.

---

## Key Features 🚀

- **Mac Menu Bar Widget:** Lives in the status bar. Left-click the icon to toggle the compact window; right-click for a Show / Hide / Quit menu. On macOS the Dock icon shows/hides in sync with the window.
- **日本語対応 (Bilingual UI):** Automatically follows your system language (Japanese/English) and can be switched manually from Settings → Language. Your choice is saved.
- **Multi-Account Quota Tracking:** Add and track multiple Claude accounts (e.g. *Personal*, *Work*, *Enterprise*) with custom labels.
- **Inline Account Editing:** Update a label or rotate an expired `sessionKey` directly from the settings list — changing the key automatically re-validates the account.
- **Configurable Auto-Refresh:** Choose a background sync interval (5/10/15/30/60 min). Quotas also refresh instantly whenever you open the widget, and when the local Claude CLI data changes.
- **Usage Alerts:** Get a native notification the first time a 5-hour session crosses a threshold you pick (50%–95%), or turn alerts **Off**. Each account alerts once per session window and re-arms after the session resets.
- **Live Syncing & Isolation:** The Rust backend talks directly to Anthropic's private web endpoints (no browser CORS limits). Accounts are fetched concurrently; an expired/failed key is isolated to its own card without affecting the others.
- **Privacy First:** Session cookies are stored locally in `~/.claude/tracker-settings.json` and are transmitted only to Claude.ai.

---

## App Interface Preview 📱

![Claude Quota Widget Preview](assets/preview.png)

---

## How to Get Your `sessionKey` 🔑

To sync live usage metrics, you'll need the `sessionKey` cookie value for each account:

1. Open your browser and log into [claude.ai](https://claude.ai).
2. Right-click on the page and select **Inspect** to open Developer Tools.
3. Head to the **Application** tab (Chrome/Safari) or the **Storage** tab (Firefox).
4. Expand **Cookies** in the left sidebar and click `https://claude.ai`.
5. Find the row named `sessionKey` and copy its entire value (starting with `sk-ant-sid02-...`).
6. Click the gear icon `[⚙]` in the widget header, type a label (e.g. *Personal*), paste the key, and click **Add Account**.

> **Key expired?** `sessionKey` cookies are rotated periodically by Anthropic. When an account shows a *Sync Failed* warning, open Settings, click **Edit** on that account, and paste a fresh key.

---

## Installation & Setup 🛠️

### Prerequisites
- **[Bun](https://bun.sh)** (package manager + script runner)
- **[Rust](https://rustup.rs)** (stable toolchain — required by Tauri)
- **macOS:** Xcode Command Line Tools (`xcode-select --install`)
- Linux/Windows: see the [Tauri prerequisites](https://tauri.app/start/prerequisites/)

### 1. Install Dependencies
```bash
bun install
```

### 2. Run in Development
```bash
bun run dev
```
This starts the Vite dev server and launches the Tauri window, mounting the monochrome burst icon in your status bar. Closing the window keeps the app running in the menu bar (on macOS the Dock icon hides automatically).

---

## Compiling Distribution Packages 📦

Build an optimized native bundle (`.app` and `.dmg`):
```bash
bun run build
```
Output lands in `src-tauri/target/release/bundle/`.

*Note: Built locally without a paid Apple Developer certificate, macOS Gatekeeper may show a verification warning. On first run, right-click the `.app`, select **Open**, then **Open anyway**.*

---

## File Structure 📂

```
claude-quota-widget/
├── index.html                   # Vite entry (mounts the Svelte app)
├── package.json                 # Bun scripts & frontend deps
├── vite.config.ts / svelte.config.js / tsconfig.json
├── src/                         # Frontend (Svelte + TypeScript)
│   ├── main.ts                  # App mount
│   ├── App.svelte               # Root: dashboard/settings + tray drag area
│   ├── app.css                  # macOS glassmorphism styles
│   ├── components/              # Header, Dashboard, AccountCard, Settings, …
│   └── lib/
│       ├── api.ts               # invoke()/listen() wrappers (replaces preload)
│       ├── stores.ts            # accounts/settings/status stores + actions
│       ├── quota.ts             # snake/camel normalization + time formatting
│       ├── i18n.ts              # locale store + t() translator
│       └── locales/{en,ja}.ts   # string dictionaries
├── src-tauri/                   # Rust backend
│   ├── Cargo.toml / tauri.conf.json
│   ├── capabilities/default.json
│   ├── icons/                   # app + tray template icons
│   └── src/
│       ├── main.rs / lib.rs     # entry + builder wiring
│       ├── commands.rs          # #[tauri::command] handlers (ApiResult)
│       ├── quota.rs             # claude.ai usage fetch (reqwest)
│       ├── settings.rs          # tracker-settings.json I/O
│       ├── watcher.rs           # debounced fs watch → "data-changed"
│       ├── tray.rs              # menu-bar tray + menu
│       └── window.rs            # show/hide + macOS Dock activation policy
└── README.md
```

---

## Security & Privacy 🔒

- All requests are initiated **directly** from your local machine to `claude.ai` endpoints (made by the Rust backend).
- No central server, tracking, or proxy is used.
- Keys are saved locally as JSON in `~/.claude/tracker-settings.json`. They are stored in plaintext, so keep your machine secure.
