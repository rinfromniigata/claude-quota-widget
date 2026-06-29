use tauri::{AppHandle, Emitter, Manager};

#[cfg(target_os = "macos")]
use tauri::ActivationPolicy;

// Show the widget and (on macOS) bring the Dock icon back, then notify the
// frontend so it can run a foreground quota sync.
pub fn show(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        #[cfg(target_os = "macos")]
        let _ = app.set_activation_policy(ActivationPolicy::Regular);
        let _ = window.show();
        let _ = window.set_focus();
        let _ = app.emit("window-shown", ());
    }
}

// Hide the widget and (on macOS) drop the Dock icon so it lives in the menu bar.
pub fn hide(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
        #[cfg(target_os = "macos")]
        let _ = app.set_activation_policy(ActivationPolicy::Accessory);
    }
}

pub fn toggle(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            hide(app);
        } else {
            show(app);
        }
    }
}
