use tauri::State;

use crate::services::ai_detect::{AiDetectionReport, AiDetector};

/// Detect Antigravity and Claude Code (running processes and install locations).
#[tauri::command]
pub async fn detect_ai_tools(detector: State<'_, AiDetector>) -> Result<AiDetectionReport, String> {
    let detector = detector.inner().clone();
    super::blocking(move || Ok(detector.detect())).await
}
