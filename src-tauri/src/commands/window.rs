//! Window mode commands: mini mode and start with Windows.

use tauri::{AppHandle, State};

use crate::services::window_modes::{self, WindowModes};

/// Turn the always-on-top mini window on or off; returns the new state.
#[tauri::command]
pub fn set_mini_mode(app: AppHandle, enabled: bool) -> Result<bool, String> {
    window_modes::set_mini_mode(&app, enabled)
}

#[tauri::command]
pub fn mini_mode(modes: State<'_, WindowModes>) -> bool {
    modes.is_mini()
}

/// Whether TickPuff starts when the user signs in.
#[tauri::command]
pub fn autostart(app: AppHandle) -> bool {
    window_modes::autostart_enabled(&app)
}

#[tauri::command]
pub fn set_autostart(app: AppHandle, enabled: bool) -> Result<bool, String> {
    window_modes::set_autostart(&app, enabled)
}
