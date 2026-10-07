# Architecture

TickPuff is a [Tauri 2](https://v2.tauri.app/) desktop app. The interface is a static
[SvelteKit](https://svelte.dev/docs/kit) site (Svelte 5, TypeScript) rendered in the system WebView; a small
Rust backend provides the few things a web page can't do (process detection, system stats, media session).

```
┌──────────────────────────── WebView (SvelteKit SPA) ───────────────────────────┐
│  World (2D scenery, CSS)  ←  theme definitions                                 │
│  Companion layer (three.js canvas)  ←  companion engine + GPU effects          │
│  Clock / widget docks / settings  ←  stores  ←  features & integrations        │
└───────────────────────────────┬────────────────────────────────────────────────┘
                                │ invoke() — 4 narrow commands
┌───────────────────────────────┴────────────── Rust (Tauri) ────────────────────┐
│  commands/  →  services/ (sysinfo, process scan)  →  platform/ (Windows APIs)  │
└────────────────────────────────────────────────────────────────────────────────┘
```

## Concepts

These stay separate on purpose; most design decisions follow from them.

| Concept | Is | Is not |
| --- | --- | --- |
| **Theme** | A visual world: colours per time of day, 2D scenery, allowed atmosphere effects, available companions, the stage the companion roams | A container for widgets or data |
| **Companion** | The character: model, animation, behavior, movement | Aware of widgets, except through events like "focus completed" |
| **Widget** | A tool in a dock (focus, tasks, AI, …); works in every theme | Responsible for fetching its own data |
| **Preset** | A named widget layout | A theme |
| **Integration** | A data source (backend command or web API) with explicit unavailable/error states | Allowed to guess or fake values |
| **Performance** | A rendering policy (frame caps, particle density, pixel ratio) | Theme- or widget-specific |

"Weather" exists twice and the two are kept apart: the theme's **atmosphere** is a visual effect the user
picks; the **weather integration** is real data. `stores/atmosphere.ts` is the only place they meet — and the
theme still decides which effects it can show.

## Source layout

```
src/
├── app.html, app.css          Page shell, global tokens and base styles
├── routes/
│   ├── +layout.svelte          Applies theme colours as CSS variables, loads fonts
│   ├── +page.svelte            Composes the app; idle hiding, keyboard shortcuts
│   └── dev/companions/         Dev-only companion viewer (404 in production)
└── lib/
    ├── types/                  Canonical types shared by everything
    ├── core/                   Framework-level building blocks
    │   ├── persistence/        Versioned storage, migrations, persisted stores
    │   ├── scheduling/         Poller (visibility-aware) and shared lifecycles
    │   ├── platform/           Tauri bridge, window controls, sound
    │   ├── events/             Tiny typed event bus
    │   ├── time/               Second-aligned clock, time of day, local dates
    │   └── math.ts             Damping, angles, seeded RNG, weighted picks
    ├── themes/
    │   ├── definitions/        One data file per world (colours, stage, zones…)
    │   ├── scenes/             One Svelte component per world's 2D scenery
    │   └── registry.ts
    ├── companion/
    │   ├── registry/           CompanionDefinition per companion
    │   ├── models/             Rig contract, primitives, procedural models
    │   ├── animation/          ProceduralAnimator, ClipAnimator (GLB clips)
    │   ├── behavior/           BehaviorController + personalities (pure logic)
    │   ├── navigation/         Navigator (movement), StageMapper (stage ↔ world)
    │   ├── interaction/        Pointer hit box, look-at
    │   └── engine/             CompanionLoader, CompanionRenderer
    ├── effects/                GPU particle presets, ParticleField, EffectsLayer
    ├── features/focus/         Pure focus-timer state machine and streak history
    ├── integrations/           ai/, system/, media/, weather/ — data + lifecycles
    ├── stores/                 App state: world, settings, widgets, focus, …
    └── components/             UI: world/, companion/, clock/, widgets/, settings/, ui/

src-tauri/src/
├── lib.rs                      App setup and command registration only
├── commands/                   system.rs, ai.rs, media.rs — thin, typed commands
├── services/                   system_monitor.rs (sysinfo), ai_detect.rs (process scan)
└── platform/                   gpu.rs (PDH counters), media.rs (Windows media session)

tests/
├── unit/                       Pure logic: timer, persistence, behavior, navigator, …
└── integration/                Stores and integrations with storage / Tauri mocked
```

## State ownership

Each piece of state has exactly one owner store. Components read stores and call their methods; they don't
keep copies.

| State | Owner | Persisted as |
| --- | --- | --- |
| Active theme; per-theme weather & companion | `stores/world.ts` | `tickpuff-world` |
| Clock appearance | `stores/settings.ts` (`clockSettings`) | `tickpuff-clock-settings` |
| Performance mode | `stores/settings.ts` (`performanceMode`) | `tickpuff-perf` |
| Sleep / ambient / widgets / companion visibility | `stores/settings.ts` (`ui`) | `tickpuff-ui` |
| Widget layout and hero (clock/date) visibility | `stores/widgets.ts` | `tickpuff-widgets` |
| Focus settings, running session, history | `stores/focus.ts` | `tickpuff-focus-*` |
| Tasks, note, countdown | `stores/productivity.ts` | `tickpuff-tasks`, `tickpuff-note`, `tickpuff-countdown` |
| Weather location and units | `integrations/weather` | `tickpuff-weather` |
| AI tools, system stats, media, weather report | their integration module | not persisted |
| Companion activity (for accessibility) | `companion/status.ts` | not persisted |

### Persistence and migrations

`core/persistence` stores every value as `{ "v": <version>, "data": … }`. A `PersistSpec` declares the key,
version, defaults, a `sanitize` validator, an optional `migrate` step, and optionally a `legacy` reader for data
spread over old keys. On load:

- missing → defaults;
- older version or pre-0.1 unversioned value → `migrate`, then `sanitize`, then re-saved;
- invalid or corrupt → the raw value is copied to `<key>.backup`, defaults are used;
- written by a newer version → read best-effort, and a backup is kept.

Pre-0.1 builds stored `tickpuff-theme`, `tickpuff-theme-state-<id>`, `tickpuff-features` and
`tickpuff-progress`; those are migrated on first launch and then removed.

## Recurring work and lifecycles

Nothing polls unless something visible needs it:

| Process | Owner | Runs when | Rate |
| --- | --- | --- | --- |
| Render loop | `CompanionRenderer` | window visible | Eco 24 fps, Balanced 30, Beautiful 60; lower while resting |
| Clock tick | `core/time/clock.ts` (`now`) | any subscriber | each second boundary |
| Focus ticker | `stores/focus.ts` | a phase is running | 4×/s (display only; time is timestamp-based) |
| AI detection | `integrations/ai` | AI widget mounted, window visible | 20 s |
| System stats | `integrations/system` | System widget mounted, window visible | 3 s |
| Media session | `integrations/media` | Now Playing widget mounted, window visible | 3 s |
| Weather | `integrations/weather` | Weather widget mounted or atmosphere sync on | 30 min |

Integrations use `createPoller` (no overlapping runs, abortable, pauses when hidden) wrapped in
`createSharedLifecycle` (reference counted: widgets `acquire()` on mount and release on destroy).

## The companion engine

`CompanionRenderer` owns one transparent, full-window WebGL canvas above the 2D scenery and below the UI. Per
frame:

1. **BehaviorController** decides the activity and destination from context (sleep mode, focus, hover,
   weather, time of day, personality, zones). It's deterministic given its random source, and contains no
   three.js code.
2. **StageMapper** converts the theme's normalized stage coordinates to world space by ray-casting onto the
   ground plane, so the companion stands on the scenery's ground at any window size.
3. **Navigator** turns, accelerates, walks along its heading and brakes on arrival. Positions only change by
   movement — no teleporting.
4. The **animator** (`ProceduralAnimator`, or `ClipAnimator` for GLB clips) blends toward the activity's pose.
5. **InteractionController** moves an invisible, focusable button over the companion's projected bounds; hover
   and click/Enter feed back into the behavior.
6. **EffectsLayer** advances GPU particles (a single uniform per effect).

See [companions.md](companions.md) for definitions, models and behavior details.

## Backend

Rust commands are deliberately narrow:

| Command | Does |
| --- | --- |
| `system_stats` | CPU and memory via `sysinfo`; GPU via Windows PDH "GPU Engine" counters (`None` elsewhere) |
| `detect_ai_tools` | Scans process names/paths and checks a few known install locations |
| `media_current` | Reads the current Windows media session (title, artist, app, capabilities) |
| `media_control` | `play-pause`, `next` or `previous` — nothing else is accepted |

Commands run their work on Tauri's blocking thread pool. There's no shell plugin and no generic process or file
access. The capability file grants only window controls and opening two HTTPS origins; the CSP limits network
access to Open-Meteo.

## Platform support

Windows-specific code lives in `src-tauri/src/platform` behind `#[cfg(windows)]`, each with a non-Windows
implementation that reports "unsupported". The frontend treats those like any other unavailable state. Porting a
feature to another OS means adding an implementation there — nothing else needs to change.
