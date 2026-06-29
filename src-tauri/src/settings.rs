use std::path::PathBuf;

use serde_json::Value;

// State lives in the active Claude CLI profile directory (~/.claude), shared with
// the CLI artifacts. Session keys are stored here in plaintext, local-only.
pub fn claude_dir() -> PathBuf {
    dirs::home_dir().unwrap_or_default().join(".claude")
}

pub fn tracker_settings_path() -> PathBuf {
    claude_dir().join("tracker-settings.json")
}

// Returns the parsed settings object, or `{}` when missing / unreadable.
pub fn read_tracker_settings() -> Value {
    match std::fs::read_to_string(tracker_settings_path()) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_else(|_| serde_json::json!({})),
        Err(_) => serde_json::json!({}),
    }
}

pub fn write_tracker_settings(settings: &Value) -> Result<(), String> {
    let path = tracker_settings_path();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let serialized = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    std::fs::write(&path, serialized).map_err(|e| e.to_string())
}
