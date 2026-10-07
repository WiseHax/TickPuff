use tauri::State;

use crate::services::system_monitor::{SystemMonitor, SystemStats};

/// Current CPU, memory and (when measurable) GPU utilisation.
#[tauri::command]
pub async fn system_stats(monitor: State<'_, SystemMonitor>) -> Result<SystemStats, String> {
    let monitor = monitor.inner().clone();
    super::blocking(move || Ok(monitor.sample())).await
}
