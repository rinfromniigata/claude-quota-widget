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
