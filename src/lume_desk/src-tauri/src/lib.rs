mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_os::init())
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_window_state::Builder::default().build())
    .invoke_handler(tauri::generate_handler![
      commands::start_show,
      commands::stop_show,
      commands::get_show_status,
      commands::get_system_info,
      commands::scan_controllers,
      commands::test_controller_connection,
      commands::export_show,
      commands::validate_show_data,
      commands::send_system_notification,
      commands::get_performance_stats
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      
      // TODO: System tray will be added when tauri-plugin-system-tray is ready for v2
      
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
