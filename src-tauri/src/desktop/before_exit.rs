use tauri::{WindowEvent, Manager, Emitter, Listener, AppHandle};

fn trigger_before_exit_event(app_handle: &AppHandle) -> bool {
    let main_window = app_handle.get_webview_window("main").unwrap();

    // 发送同步事件到前端
    let (tx, rx) = std::sync::mpsc::channel();

    let tx_clone = tx.clone();
    let _ = main_window.once("confirm-close-response", move |event| {
        let should_close = event.payload().parse::<bool>().unwrap_or(false);
        let _ = tx_clone.send(should_close);
    });

    let _ = app_handle.emit("before-exit", ());

    rx.recv().unwrap_or_else(|_| false)
}

pub fn setup_desktop_before_exit(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use std::sync::Arc;

    let main_window = app.get_webview_window("main").unwrap();
    let app_handle = Arc::new(app.handle().clone());

    main_window.on_window_event(move |event: &WindowEvent| {
        if let WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();

            let app_handle_clone1 = app_handle.clone();

            tauri::async_runtime::spawn(async move {
                let app_handle_clone2 = app_handle_clone1.clone();
                let should_close = tokio::task::spawn_blocking(move || {
                    trigger_before_exit_event(&app_handle_clone2)
                }).await.unwrap_or(false);

                if should_close {
                    app_handle_clone1.exit(0);
                }
            });
        }
    });

    Ok(())
}
