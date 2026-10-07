//! Tauri commands exposed to the frontend.
//!
//! Every command is narrow and read-only except `media_control`, which only
//! accepts a fixed set of actions. There is no generic process or shell access.

pub mod ai;
pub mod media;
pub mod system;

/// Run blocking work off the async runtime's worker threads.
pub(crate) async fn blocking<T, F>(work: F) -> Result<T, String>
where
    T: Send + 'static,
    F: FnOnce() -> Result<T, String> + Send + 'static,
{
    tauri::async_runtime::spawn_blocking(work)
        .await
        .map_err(|error| format!("background task failed: {error}"))?
}
