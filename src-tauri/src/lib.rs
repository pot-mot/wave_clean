use tauri::{Builder};

#[cfg(desktop)]
mod desktop;
#[cfg(desktop)]
use desktop::before_exit::setup_desktop_before_exit;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init());

    #[cfg(desktop)]
    let builder = builder.setup(|app| {
        setup_desktop_before_exit(app)?;
        Ok(())
    });

    builder.run(tauri::generate_context!())
        .expect("error while running tauri application");
}