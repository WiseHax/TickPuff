# Changelog

All notable changes to TickPuff are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] — first open-source release

The first public version: the prototype restructured into a maintainable, tested codebase.

### Clock and worlds

- Customizable clock and date (five bundled fonts or the world's own font, size, weight, spacing, colour,
  seconds, 12/24-hour); clock and date can be hidden individually.
- Five worlds — Cozy Forest, Sakura Dream, Deep Aquarium, Cyber City, Magic Library — with colours for five
  times of day. Each world remembers its own companion and atmosphere.
- Atmosphere effects: rain, heavy rain, snow, fog, petals, leaves, bubbles, dust; ambient fireflies and sparks.
  GPU particles in Balanced/Beautiful, lightweight CSS in Eco.
- Optional sync of the atmosphere with real local weather.

### Companion

- Eleven companions with procedural placeholder models: fox, cat, bear, bunny, penguin, owl, koi, jellyfish,
  turtle, robot, drone.
- Companion engine with separate loader, animator, behavior, navigation and interaction modules; GLB/GLTF model
  support with animation clips and a procedural fallback.
- Behavior: roaming, visiting scene spots, sitting, sleeping, waking, stretching, playing, looking at the
  pointer, reacting when petted, celebrating focus sessions, keeping company during focus, reacting to weather.
  Personality and time of day shape its choices.
- Pet the companion by clicking it, or with <kbd>Tab</kbd> + <kbd>Enter</kbd>.

### Widgets

- Focus timer with short/long breaks, custom durations, auto-start, chime and a daily streak; timestamp-based so
  it can't drift and survives restarts.
- Tasks, notes, countdown, month calendar and a daily summary.
- AI workspace (Windows): Antigravity and Claude Code running/installed detection. Quota is reported as not
  available because neither tool exposes it to other apps.
- System monitor: real CPU and memory; GPU utilisation on Windows.
- Now playing (Windows): current media session with play/pause and skip.
- Weather from Open-Meteo after choosing a location.
- Every widget can be enabled, docked left or right and reordered; presets: Classic, Calm, Deep work, Developer.

### App

- Frameless window with minimize/close controls, drag to move, full screen (<kbd>F11</kbd>), ambient mode and
  sleep mode.
- Performance modes (Eco / Balanced / Beautiful); rendering stops while hidden and slows while resting;
  background polling only while the relevant widget is visible.
- Versioned settings storage with migration from pre-release data and backups of unreadable values.
- Fonts bundled locally; no network access unless weather is configured.
- Strict content security policy and minimal Tauri capabilities.

### Fixed (compared with the prototype)

- Claude Code was reported as running whenever the Claude desktop app was open.
- The Antigravity quota check ran a CLI command that doesn't exist, every 30 seconds.
- System stats spawned PowerShell every 5 seconds (even while the widget was hidden), which could flash console
  windows in release builds.
- Weather particles only rendered inside a 250 px box around the companion, and fog did nothing.
- The companion never roamed while the Focus widget was enabled (the default).
- Jellyfish and turtle rendered as a cat; the drone reused the robot model.
- Switching weather rebuilt the companion model and leaked GPU memory.
- The focus timer reset when the widget was hidden, and its streak counted app launches instead of focus.
- Corrupt saved progress crashed the app on start; saved values weren't validated.
- The window couldn't be moved or closed without the keyboard.
- "Now playing" showed a hard-coded track; sleep mode didn't dim anything.
