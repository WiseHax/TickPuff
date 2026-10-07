//! TickPuff desktop backend.
//!
//! `lib.rs` only wires the app together. Commands live in [`commands`],
//! long-lived state in [`services`], and OS-specific code in [`platform`].

mod commands;
mod platform;
mod services;

use services::{ai_detect::AiDetector, system_monitor::SystemMonitor};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(SystemMonitor::new())
        .manage(AiDetector::new())
        .invoke_handler(tauri::generate_handler![
            commands::system::system_stats,
            commands::ai::detect_ai_tools,
            commands::media::media_current,
            commands::media::media_control,
        ])
        .run(tauri::generate_context!())
        .expect("error while running TickPuff");
}
