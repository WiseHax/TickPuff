//! System tray icon and menu: show the window, mini mode, start with Windows, quit.

use tauri::menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{App, Manager};

use crate::services::window_modes::{self, TrayChecks, WindowModes};

pub fn create(app: &App) -> tauri::Result<()> {
    let handle = app.handle();
    let show = MenuItem::with_id(handle, "show", "Show TickPuff", true, None::<&str>)?;
    let mini = CheckMenuItem::with_id(handle, "mini", "Mini mode", true, false, None::<&str>)?;
    let autostart = CheckMenuItem::with_id(
        handle,
        "autostart",
        "Start with Windows",
        true,
        window_modes::autostart_enabled(handle),
        None::<&str>,
    )?;
    let quit = MenuItem::with_id(handle, "quit", "Quit TickPuff", true, None::<&str>)?;
    let separator_top = PredefinedMenuItem::separator(handle)?;
    let separator_bottom = PredefinedMenuItem::separator(handle)?;
    // The Store package starts with Windows through its own startup task (Windows Settings).
    let mut items: Vec<&dyn tauri::menu::IsMenuItem<tauri::Wry>> = vec![&show, &separator_top, &mini];
    if !crate::STORE_BUILD {
        items.push(&autostart);
    }
    items.push(&separator_bottom);
    items.push(&quit);
    let menu = Menu::with_items(handle, &items)?;
    app.manage(TrayChecks { mini, autostart });

    let mut builder = TrayIconBuilder::with_id("main")
        .tooltip("TickPuff")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "show" => window_modes::show_main(app),
            "mini" => {
                let next = !app.state::<WindowModes>().is_mini();
                if let Err(error) = window_modes::set_mini_mode(app, next) {
                    eprintln!("[tickpuff] mini mode: {error}");
                }
            }
            "autostart" => {
                let next = !window_modes::autostart_enabled(app);
                if let Err(error) = window_modes::set_autostart(app, next) {
                    eprintln!("[tickpuff] start with Windows: {error}");
                }
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                window_modes::show_main(tray.app_handle());
            }
        });
    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }
    builder.build(app)?;
    Ok(())
}
