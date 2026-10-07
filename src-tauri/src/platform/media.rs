//! Now Playing.
//!
//! Windows: Global System Media Transport Controls (the session shown in the
//! Windows volume flyout). Elsewhere: unsupported.

use serde::Serialize;

use crate::commands::media::MediaAction;

#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum PlaybackStatus {
    Playing,
    Paused,
    Stopped,
    Other,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaInfo {
    pub title: String,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub source_app: Option<String>,
    pub status: PlaybackStatus,
    pub can_play_pause: bool,
    pub can_next: bool,
    pub can_previous: bool,
}

pub(crate) fn non_empty(value: String) -> Option<String> {
    let trimmed = value.trim();
    (!trimmed.is_empty()).then(|| trimmed.to_string())
}

#[cfg(windows)]
pub use windows_impl::{control, current_session};

#[cfg(not(windows))]
pub fn current_session() -> Result<Option<MediaInfo>, String> {
    Err("Now Playing is currently only supported on Windows".into())
}

#[cfg(not(windows))]
pub fn control(_action: MediaAction) -> Result<(), String> {
    Err("Now Playing is currently only supported on Windows".into())
}

#[cfg(windows)]
mod windows_impl {
    use windows::{
        Media::Control::{
            GlobalSystemMediaTransportControlsSession as Session,
            GlobalSystemMediaTransportControlsSessionManager as SessionManager,
            GlobalSystemMediaTransportControlsSessionPlaybackStatus as Status,
        },
        Win32::System::Com::{CoInitializeEx, COINIT_MULTITHREADED},
    };

    use super::{non_empty, MediaAction, MediaInfo, PlaybackStatus};

    fn describe(error: windows::core::Error) -> String {
        format!("media session error: {}", error.message())
    }

    fn current() -> Result<Option<Session>, String> {
        // WinRT needs COM on this (blocking-pool) thread. Repeated calls are
        // harmless; the thread keeps its multithreaded apartment.
        // SAFETY: no reserved pointer is passed.
        unsafe {
            let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
        }
        let manager = SessionManager::RequestAsync()
            .and_then(|operation| operation.join())
            .map_err(describe)?;
        // A missing session comes back as an error from the projection.
        Ok(manager.GetCurrentSession().ok())
    }

    pub fn current_session() -> Result<Option<MediaInfo>, String> {
        let Some(session) = current()? else {
            return Ok(None);
        };

        let playback = session.GetPlaybackInfo().map_err(describe)?;
        let raw_status = playback.PlaybackStatus().map_err(describe)?;
        if raw_status == Status::Closed {
            return Ok(None);
        }
        let status = match raw_status {
            Status::Playing => PlaybackStatus::Playing,
            Status::Paused => PlaybackStatus::Paused,
            Status::Stopped => PlaybackStatus::Stopped,
            _ => PlaybackStatus::Other,
        };

        let properties = session
            .TryGetMediaPropertiesAsync()
            .and_then(|operation| operation.join())
            .map_err(describe)?;
        let text =
            |value: windows::core::Result<windows::core::HSTRING>| value.ok().and_then(|s| non_empty(s.to_string()));
        let controls = playback.Controls().map_err(describe)?;

        Ok(Some(MediaInfo {
            title: text(properties.Title()).unwrap_or_default(),
            artist: text(properties.Artist()),
            album: text(properties.AlbumTitle()),
            source_app: text(session.SourceAppUserModelId()),
            status,
            can_play_pause: controls.IsPlayPauseToggleEnabled().unwrap_or(false),
            can_next: controls.IsNextEnabled().unwrap_or(false),
            can_previous: controls.IsPreviousEnabled().unwrap_or(false),
        }))
    }

    pub fn control(action: MediaAction) -> Result<(), String> {
        let session = current()?.ok_or_else(|| "No media is playing".to_string())?;
        let operation = match action {
            MediaAction::PlayPause => session.TryTogglePlayPauseAsync(),
            MediaAction::Next => session.TrySkipNextAsync(),
            MediaAction::Previous => session.TrySkipPreviousAsync(),
        };
        let accepted = operation.and_then(|operation| operation.join()).map_err(describe)?;
        if accepted {
            Ok(())
        } else {
            Err("The media app ignored the request".into())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn blank_metadata_becomes_none() {
        assert_eq!(non_empty("   ".into()), None);
        assert_eq!(non_empty(" Song ".into()), Some("Song".into()));
    }

    #[test]
    fn status_serializes_lowercase() {
        assert_eq!(serde_json::to_string(&PlaybackStatus::Playing).unwrap(), "\"playing\"");
    }
}

#[cfg(all(test, windows))]
mod live {
    /// Prints the current media session: `cargo test -- --ignored --nocapture`.
    #[test]
    #[ignore = "reads the live media session"]
    fn live_media() {
        println!("{:?}", super::current_session());
    }
}
