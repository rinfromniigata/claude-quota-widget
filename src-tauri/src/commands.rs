use serde::Serialize;
use serde_json::Value;
use tauri::AppHandle;
use tauri_plugin_notification::NotificationExt;

// Mirrors the old Electron IPC contract `{ success, data?, error? }` so the
// frontend can keep branching on `result.success`.
#[derive(Serialize)]
pub struct ApiResult<T> {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

impl<T> ApiResult<T> {
    pub fn ok(data: T) -> Self {
        Self { success: true, data: Some(data), error: None }
    }
    pub fn fail(msg: impl Into<String>) -> Self {
        Self { success: false, data: None, error: Some(msg.into()) }
    }
}

#[tauri::command]
pub fn get_tracker_settings() -> Value {
    crate::settings::read_tracker_settings()
}

#[tauri::command]
pub fn save_tracker_settings(settings: Value) -> ApiResult<()> {
    match crate::settings::write_tracker_settings(&settings) {
        Ok(()) => ApiResult::ok(()),
        Err(e) => ApiResult::fail(e),
    }
}

#[tauri::command]
pub async fn fetch_live_limits(session_key: String) -> ApiResult<Value> {
    match crate::quota::fetch_live_limits(&session_key).await {
        Ok(data) => ApiResult::ok(data),
        Err(e) => ApiResult::fail(e),
    }
}

// Update the tray to reflect current quota state.
// macOS: set menu-bar title text next to the icon.
// Windows/Linux: render a bar-meter icon (blue→orange→red→purple by usage)
//   and set the tooltip to the same text for on-hover detail.
#[tauri::command]
pub fn update_tray(app: AppHandle, title: String, session_pct: f64) -> ApiResult<()> {
    let Some(tray) = app.tray_by_id("main-tray") else {
        return ApiResult::fail("tray not found");
    };

    #[cfg(target_os = "macos")]
    {
        let value = if title.is_empty() { None } else { Some(title.as_str()) };
        if let Err(e) = tray.set_title(value) {
            return ApiResult::fail(e.to_string());
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        // Tooltip: same text format as macOS title for on-hover detail.
        let tooltip = if title.is_empty() { None } else { Some(title.as_str()) };
        let _ = tray.set_tooltip(tooltip);

        // Icon: bar meter, or restore original icon when there is no data.
        if title.is_empty() {
            if let Ok(icon) = tauri::image::Image::from_bytes(
                include_bytes!("../icons/tray-iconTemplate.png"),
            ) {
                let _ = tray.set_icon(Some(icon));
            }
        } else {
            let icon = crate::tray_meter::render(session_pct as f32);
            let _ = tray.set_icon(Some(icon));
        }
    }

    ApiResult::ok(())
}

#[tauri::command]
pub fn notify(app: AppHandle, title: String, body: String) -> ApiResult<()> {
    match app
        .notification()
        .builder()
        .title(title)
        .body(body)
        .show()
    {
        Ok(()) => ApiResult::ok(()),
        Err(e) => ApiResult::fail(e.to_string()),
    }
}
