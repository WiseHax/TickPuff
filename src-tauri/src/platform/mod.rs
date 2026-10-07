//! OS-specific functionality behind small, platform-neutral interfaces.
//!
//! TickPuff currently targets Windows. On other platforms these modules
//! compile to explicit "unsupported" results rather than fake values.

pub mod gpu;
pub mod media;
