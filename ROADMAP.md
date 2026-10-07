# Roadmap

A realistic view of where TickPuff is going. Nothing here is a promise or a date; priorities shift with
feedback. The guiding rule doesn't change: **a calm clock with a living world first, optional tools second.**

## Now — polishing 0.1

- Windows installers on GitHub Releases.
- Keyboard and screen-reader pass over every widget and the settings panel.
- Fixes for issues reported by early users.

## Next

- **Companion art** — replace procedural placeholders with proper GLB models and animation clips, one companion
  at a time, under licenses compatible with the project (the loader already supports this).
- **Window options** — always on top, start with Windows, remember window size and position.
- **Ambient audio** — optional per-world soundscapes (needs openly licensed recordings).
- **More scene interactions** — new zones only where a world's scenery already has the object.

## Experimental

Ideas being explored; they may change or be dropped.

- **macOS and Linux builds** — platform code is isolated behind `cfg`, but GPU usage, Now Playing and install
  detection need native implementations, and nothing is tested yet.
- **Calendar sync** — reading events from standard sources (ICS) without requiring accounts.
- **AI tool quota** — only if Antigravity or Claude Code publish a supported way for other apps to read it.

## Future

- Companion "memory": favourite spots and simple routines that develop over time (deterministic, offline).
- A documented way to share worlds and companions.

## Not planned

- Turning TickPuff into a dashboard, project manager or IDE.
- Accounts, telemetry, or cloud services.
- LLM-driven companion behavior.
