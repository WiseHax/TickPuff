//! TickPuff desktop backend.
//!
//! `lib.rs` only wires the app together. Commands live in [`commands`],
//! long-lived state in [`services`], and OS-specific code in [`platform`].

mod commands;
mod platform;
mod services;
mod tray;

use services::{ai_detect::AiDetector, system_monitor::SystemMonitor, window_modes::WindowModes};
use tauri_plugin_autostart::MacosLauncher;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))
        .manage(SystemMonitor::new())
        .manage(AiDetector::new())
        .manage(WindowModes::default())
        .setup(|app| {
            tray::create(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::system::system_stats,
            commands::ai::detect_ai_tools,
            commands::media::media_current,
            commands::media::media_control,
            commands::window::mini_mode,
            commands::window::set_mini_mode,
            commands::window::autostart,
            commands::window::set_autostart,
        ])
        .run(tauri::generate_context!())
        .expect("error while running TickPuff");
}
