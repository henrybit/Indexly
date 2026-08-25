mod commands;
mod error;
mod es;

use commands::connection::{connect, disconnect};
use commands::indices::{delete_indices, search_indices};
use commands::ttl::{apply_expiration, preview_expiration};
use commands::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            connect,
            disconnect,
            search_indices,
            delete_indices,
            preview_expiration,
            apply_expiration
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
