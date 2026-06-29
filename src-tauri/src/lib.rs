mod commands;
mod quota;
mod settings;
mod tray;
mod watcher;
mod window;

use tauri::{Manager, WindowEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_tracker_settings,
            commands::save_tracker_settings,
            commands::fetch_live_limits,
            commands::notify,
            commands::set_tray_title,
        ])
        .setup(|app| {
            let handle = app.handle().clone();
            tray::create(&handle)?;
            watcher::start(handle.clone());

            // Hide (don't destroy) the window when the user closes it, so the
            // app keeps living in the menu bar.
            if let Some(window) = app.get_webview_window("main") {
                let close_handle = handle.clone();
                window.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        window::hide(&close_handle);
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
