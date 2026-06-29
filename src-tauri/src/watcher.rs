use std::time::Duration;

use notify_debouncer_mini::new_debouncer;
use notify_debouncer_mini::notify::RecursiveMode;
use tauri::{AppHandle, Emitter};

// Watch the active profile's CLI artifacts and emit `data-changed` (debounced
// 500ms) so the frontend re-syncs, mirroring the old fs.watch behavior.
pub fn start(app: AppHandle) {
    std::thread::spawn(move || {
        let claude_dir = crate::settings::claude_dir();
        let (tx, rx) = std::sync::mpsc::channel();

        let mut debouncer = match new_debouncer(Duration::from_millis(500), tx) {
            Ok(d) => d,
            Err(e) => {
                eprintln!("Failed to create file watcher: {e}");
                return;
            }
        };

        for name in ["history.jsonl", "stats-cache.json"] {
            let path = claude_dir.join(name);
            if path.exists() {
                if let Err(e) = debouncer.watcher().watch(&path, RecursiveMode::NonRecursive) {
                    eprintln!("Failed to watch {}: {e}", path.display());
                }
            }
        }

        // Block on the channel; keeps `debouncer` alive for the app's lifetime.
        for result in rx {
            if result.is_ok() {
                let _ = app.emit("data-changed", ());
            }
        }
    });
}
