//! Window modes that need native control: the always-on-top **mini mode**
//! and **start with Windows**. Both are driven from the tray menu and from
//! commands, and every change is broadcast so the UI and tray stay in sync.

use std::sync::Mutex;

use tauri::menu::CheckMenuItem;
use tauri::{AppHandle, Emitter, LogicalSize, Manager, PhysicalPosition, PhysicalSize, Runtime, WebviewWindow};
use tauri_plugin_autostart::ManagerExt;

/// Event sent to the frontend whenever mini mode turns on or off (payload: bool).
pub const MINI_MODE_EVENT: &str = "tickpuff://mini-mode";

/// Normal minimum window size (matches `tauri.conf.json`).
const NORMAL_MIN: LogicalSize<f64> = LogicalSize::new(480.0, 320.0);
/// Size of the mini window.
const MINI_SIZE: LogicalSize<f64> = LogicalSize::new(360.0, 230.0);
/// Gap between the mini window and the screen corner, in logical pixels.
const MINI_MARGIN: f64 = 20.0;

/// Remembers where the window was before entering mini mode.
#[derive(Default)]
pub struct WindowModes {
    previous: Mutex<Option<(PhysicalPosition<i32>, PhysicalSize<u32>)>>,
}

/// Tray menu checkboxes that mirror the current state.
pub struct TrayChecks<R: Runtime> {
    pub mini: CheckMenuItem<R>,
    pub autostart: CheckMenuItem<R>,
}

impl WindowModes {
    pub fn is_mini(&self) -> bool {
        self.previous.lock().map(|p| p.is_some()).unwrap_or(false)
    }
}

/// Turn mini mode on or off. Returns the resulting state.
pub fn set_mini_mode<R: Runtime>(app: &AppHandle<R>, enabled: bool) -> Result<bool, String> {
    let window = main_window(app)?;
    let modes = app.state::<WindowModes>();
    let mut previous = modes
        .previous
        .lock()
        .map_err(|_| "window state is unavailable".to_string())?;

    if enabled && previous.is_none() {
        let _ = window.set_fullscreen(false);
        *previous = Some((
            window.outer_position().map_err(stringify)?,
            window.inner_size().map_err(stringify)?,
        ));
        window.set_min_size(None::<LogicalSize<f64>>).map_err(stringify)?;
        window.set_size(MINI_SIZE).map_err(stringify)?;
        window.set_always_on_top(true).map_err(stringify)?;
        place_in_corner(&window)?;
    } else if !enabled {
        if let Some((position, size)) = previous.take() {
            window.set_always_on_top(false).map_err(stringify)?;
            window.set_min_size(Some(NORMAL_MIN)).map_err(stringify)?;
            window.set_size(size).map_err(stringify)?;
            window.set_position(position).map_err(stringify)?;
        }
    }

    let state = previous.is_some();
    drop(previous);
    if let Some(checks) = app.try_state::<TrayChecks<R>>() {
        let _ = checks.mini.set_checked(state);
    }
    let _ = app.emit(MINI_MODE_EVENT, state);
    Ok(state)
}

/// Enable or disable launching TickPuff when the user signs in.
pub fn set_autostart<R: Runtime>(app: &AppHandle<R>, enabled: bool) -> Result<bool, String> {
    let launcher = app.autolaunch();
    if enabled {
        launcher.enable().map_err(stringify)?;
    } else {
        launcher.disable().map_err(stringify)?;
    }
    let state = launcher.is_enabled().map_err(stringify)?;
    if let Some(checks) = app.try_state::<TrayChecks<R>>() {
        let _ = checks.autostart.set_checked(state);
    }
    Ok(state)
}

pub fn autostart_enabled<R: Runtime>(app: &AppHandle<R>) -> bool {
    app.autolaunch().is_enabled().unwrap_or(false)
}

/// Bring the main window to the front (from the tray).
pub fn show_main<R: Runtime>(app: &AppHandle<R>) {
    if let Ok(window) = main_window(app) {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn main_window<R: Runtime>(app: &AppHandle<R>) -> Result<WebviewWindow<R>, String> {
    app.get_webview_window("main")
        .ok_or_else(|| "main window not found".to_string())
}

/// Bottom-right corner of the monitor's work area (above the taskbar).
fn place_in_corner<R: Runtime>(window: &WebviewWindow<R>) -> Result<(), String> {
    let Some(monitor) = window.current_monitor().map_err(stringify)? else {
        return Ok(());
    };
    let area = monitor.work_area();
    let scale = monitor.scale_factor();
    let size = window.outer_size().map_err(stringify)?;
    let margin = (MINI_MARGIN * scale).round() as i32;
    let x = area.position.x + area.size.width as i32 - size.width as i32 - margin;
    let y = area.position.y + area.size.height as i32 - size.height as i32 - margin;
    window.set_position(PhysicalPosition::new(x, y)).map_err(stringify)
}

fn stringify(error: impl std::fmt::Display) -> String {
    error.to_string()
}
