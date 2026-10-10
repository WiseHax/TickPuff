# Changelog

All notable changes to TickPuff are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.4.0] — seasons, the real sun and friendship

### Worlds

- Day and night follow the real sunrise and sunset when a weather location is set (calculated on your
  computer); without one, they follow the clock as before.
- Seasons: every world changes through the year — snowy pines and autumn colours in the forest; blossoms,
  summer leaves, momiji and snow in the sakura garden; snow on the cyber city rooftop; a seasonal tree outside
  the library window. Seasons follow the calendar (flipped south of the equator) or stay fixed, in
  Settings → World.
- Life in the background: shooting stars at night, flocks of birds by day, schools of fish in the aquarium and
  a train gliding through the cyber city.
- Click the lanterns, the candle, the lamp or the ramen sign to switch them on or off; the forest mushrooms
  bounce.

### Companion

- Give your companion a name (Settings → Companion); it's used in tooltips and for screen readers.
- Friendship grows as you pet your companion and finish focus sessions, and never goes down. Petting counts up
  to 15 times a day.
- Friendship unlocks a flower and then a crown for your companion to wear.
- The first time you open TickPuff each day, your companion runs over to say good morning.

### Focus

- The daily summary widget shows a chart of your focus over the last seven days.

### Updates and distribution

- In-app updates for the GitHub version: TickPuff checks GitHub for a new release a little after it starts and
  shows a small notice; nothing is downloaded or installed until you press **Update**. Updates are signed and
  verified before installing. Turn the startup check off, or check by hand, in Settings → About.
- Release workflow: pushing a version tag builds the Windows installers and the signed update packages into a
  draft GitHub release.
- TickPuff is on the [Microsoft Store](https://apps.microsoft.com/detail/9NCCLZRSL5WV); the Store version is
  signed by Microsoft and updated by the Store.

## [0.3.0] — a calmer layout, reactions, tray and mini mode

### Layout

- Widgets now live in drawers that slide in from the edges of the window instead of floating panels, so the
  clock, the world and the companion are all you see by default. Open them with the widgets button or
  <kbd>W</kbd>; close them with <kbd>Esc</kbd> or a click on the world. Existing installs start with the drawers
  closed once after updating.
- A small glance chip under the clock shows a running focus or break phase (click to pause / resume), so there is
  no need to open the drawers for it.
- Lighter, borderless widget cards.

### Companion

- Greets you when you come back after three minutes or more away: it runs to the front of the stage and bounces
  happily (or wakes up if it was napping). It never interrupts a focus session.
- Dances while music plays on the computer (Windows media session); playful and energetic companions dance the
  most. It stops when the music does.

### Desktop

- System tray icon: show TickPuff, mini mode, start with Windows, quit.
- Mini mode: a small always-on-top window in the corner of the screen with just the clock and the companion.
  Leaving it restores the previous size and position.
- Start with Windows, from the tray or Settings → Performance → Startup (off by default).

## [0.2.0] — detailed companions and redrawn worlds

### Companions

- Every companion rebuilt with far more detail: big glossy eyes with irises and catch-lights, blush, noses,
  paws with toe beans, cheek and chest fluff, a brush tail for the fox, a collar and bell for the cat, scarves
  for the bear and penguin, feathered chests and ear tufts for the owl, koi patterns and flowing fins,
  hexagonal turtle scutes, a screen face for the robot and a camera eye with rotor guards for the drone.
- New look: four-step cel shading, painted top-to-bottom shading, a rim light that follows the world's sky and
  accent colour, and ink outlines that stay the same width at any size.
- Companions are much bigger on screen, with a new **Size** setting (Small / Medium / Large, default Large).

### Worlds

- All five worlds redrawn as layered, parallax illustrations that follow the time of day: a shared sky with a
  sun or moon on an arc, twinkling stars and drifting clouds.
  - **Cozy Forest**: snow-capped peaks, three depths of pine forest, drifting fog, a flowery clearing with mossy
    boulders, a footpath, glowing mushrooms and a lantern at night.
  - **Sakura Dream**: a snowy volcano, blossom groves, a pagoda with lit windows, a torii gate, stepping stones,
    a great cherry tree and a stone lantern.
  - **Deep Aquarium**: shimmering surface and light rays, a rock arch, swaying kelp, branching corals that glow
    at night, sea grass, rippled sand, a starfish and glowing plankton.
  - **Cyber City**: two depths of skyline with lit windows, vertical neon signs, a billboard, flying-car light
    trails, a wet rooftop with neon reflections, a water tank and a flickering ramen sign.
  - **Magic Library**: an arched window onto the town and sky, curtains, full bookcases, a rug, a plant, a
    globe, a hanging lamp and a candle.
- Scenery animations run on the compositor, pause in Eco mode and respect the system's reduced-motion setting.

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
