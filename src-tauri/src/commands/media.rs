use serde::Deserialize;

use crate::platform::media::{self, MediaInfo};

/// The only media actions the frontend may request.
#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum MediaAction {
    PlayPause,
    Next,
    Previous,
}

/// The OS's current media session, or `None` when nothing is playing.
#[tauri::command]
pub async fn media_current() -> Result<Option<MediaInfo>, String> {
    super::blocking(media::current_session).await
}

#[tauri::command]
pub async fn media_control(action: MediaAction) -> Result<(), String> {
    super::blocking(move || media::control(action)).await
}
