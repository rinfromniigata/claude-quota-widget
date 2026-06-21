# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm install` — install dependencies
- `npm start` — run the widget in development mode (`electron .`)
- `npm run dist` — build distributable macOS `.dmg` and `.zip` into `dist/` via electron-builder

There is no test suite, linter, or build step for the renderer (vanilla HTML/CSS/JS loaded directly).

## Architecture

A macOS menu-bar (Tray) Electron app that displays Claude.ai usage quotas for multiple accounts. Three processes/layers communicate strictly over IPC:

- **`main.js`** (main process) — owns the `BrowserWindow`, the `Tray`, all filesystem access, and all network calls. The window is hidden (not destroyed) on close, and the Dock icon is shown/hidden in sync with window visibility so the app lives in the status bar. All privileged work happens here via `ipcMain.handle('claude:*')` handlers.
- **`preload.js`** — the only bridge. Exposes a frozen `window.claudeAPI` to the renderer via `contextBridge` (contextIsolation on, nodeIntegration off). Every renderer capability must be added here as an `ipcRenderer.invoke` wrapper.
- **`src/renderer.js` + `src/index.html` + `src/styles.css`** — UI. Holds all view state in a single `appState` object (`accounts`, `activeView`, `globalStatus`) and renders cards imperatively via `document.createElement`. No framework.

### Data flow & live quota fetching

The live quota path is the core feature. `fetchLiveLimits(sessionKey)` in `main.js` runs entirely in the main process (to bypass browser CORS/cookie restrictions):
1. GET `https://claude.ai/api/organizations` with `Cookie: sessionKey=...` to resolve the first org's `uuid`.
2. GET `https://claude.ai/api/organizations/{orgId}/usage` for the rate-limit payload.

The renderer normalizes both snake_case and camelCase shapes from that payload (`five_hour`/`fiveHour`, `seven_day`/`sevenDay`, `resets_at`/`resetsAt`) — preserve this dual handling when touching quota parsing, as the upstream private API field naming is not guaranteed. Accounts are fetched concurrently (`Promise.all`); a failed/expired key sets that account's `status` to `error` without affecting others, and `globalStatus` aggregates to `online`/`warning`/`error`.

IPC handlers return `{ success, data?, error? }` objects rather than throwing across the boundary; the renderer branches on `result.success`.

### Persistence & profiles

State is stored as JSON in a Claude CLI profile directory, defaulting to `currentClaudeDir = ~/.claude`:
- `tracker-settings.json` — the account list (`{ id, label, sessionKey }`). Transient runtime fields (`status`, `quotaData`, `lastFetchTime`) are stripped before writing in `saveAccountsToDisk()`.
- The app also reads CLI artifacts from the active profile: `stats-cache.json`, `settings.json`, `history.jsonl`, `projects/`, `plans/`.

Multiple profiles are discovered by scanning `~` for directories named `.claude` or `.claude-*` that contain CLI files. `switchProfile` repoints `currentClaudeDir` and re-binds the file watchers. **Session keys are stored in plaintext** on disk — keep them local and never transmit them anywhere except Claude.ai.

### Refresh triggers

The renderer re-syncs all accounts on three events, all routed through `refreshAllAccounts()`:
- `claude:window-shown` IPC (foreground/instant sync when the tray window is opened) — fired from `main.js` `mainWindow.on('show')`.
- `claude:data-changed` IPC — `fs.watch` on `history.jsonl`/`stats-cache.json` in the active profile, debounced 500ms in main.
- A 15-minute `setInterval` background timer. `backgroundThrottling: false` is set on the window so this keeps firing while hidden.
