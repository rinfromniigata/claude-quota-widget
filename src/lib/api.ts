import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

// Mirrors the Rust `ApiResult<T>` shape returned by privileged commands.
export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// --- Privileged command wrappers (replaces the old preload `claudeAPI`) ---

export function getTrackerSettings(): Promise<Record<string, unknown>> {
  return invoke("get_tracker_settings");
}

export function saveTrackerSettings(
  settings: Record<string, unknown>,
): Promise<ApiResult<null>> {
  return invoke("save_tracker_settings", { settings });
}

// Tauri converts camelCase JS args (sessionKey) to snake_case Rust params (session_key).
export function fetchLiveLimits(
  sessionKey: string,
): Promise<ApiResult<unknown>> {
  return invoke("fetch_live_limits", { sessionKey });
}

export function notify(title: string, body: string): Promise<ApiResult<null>> {
  return invoke("notify", { title, body });
}

// Update the tray: macOS sets menu-bar title; Windows/Linux renders a meter icon
// and sets the tooltip. `sessionPct` (0–100) drives the meter color/fill.
// Pass empty title + 0 to clear back to the original icon.
export function updateTray(title: string, sessionPct: number): Promise<ApiResult<null>> {
  return invoke("update_tray", { title, sessionPct });
}

// --- Event subscriptions (replaces onDataChanged / onWindowShown) ---

export function onDataChanged(cb: () => void): Promise<UnlistenFn> {
  return listen("data-changed", () => cb());
}

export function onWindowShown(cb: () => void): Promise<UnlistenFn> {
  return listen("window-shown", () => cb());
}
