# Integrations

An integration is a source of external or local data. Each lives in `src/lib/integrations/<name>/` and
exposes a store plus a reference-counted service; widgets `acquire()` the service while mounted. Every
integration has explicit states for *unavailable* (wrong platform, browser preview) and *error*, and none of
them fill gaps with invented values.

## AI workspace

**Files:** `integrations/ai/` (adapters + store), `src-tauri/src/services/ai_detect.rs`.

The backend command `detect_ai_tools` scans the process list once and checks a few install locations. It never
starts a program, runs a CLI, or reads account files.

| Tool | Running if a process… | Installed if… |
| --- | --- | --- |
| Antigravity | is named `Antigravity.exe` / `Antigravity IDE.exe` (IDE) or `agy.exe` (CLI) | `%LOCALAPPDATA%\Programs\Antigravity*`, `%LOCALAPPDATA%\agy\bin\agy.exe`, or `agy` on `PATH` |
| Claude Code | is `claude.exe` **outside** the Claude desktop app's install folders, or Node running `@anthropic-ai/claude-code` | `~\.local\bin\claude.exe`, the desktop app's bundled `%APPDATA%\Claude\claude-code`, or `claude` on `PATH` |

The Claude desktop app's own executable is also called `claude.exe`; it is recognized by its install path and
excluded, so it is never reported as Claude Code. If a process path can't be read, it is not counted.

Each adapter reads only its own part of the report — Antigravity's state can't affect Claude Code's and vice
versa.

**Quota:** neither tool offers a documented way for another application to read usage or quota, so adapters
return `{ kind: 'unavailable' }` and the widget says "Not available". The type supports real quota windows
(`{ kind: 'available', windows, plan }`) for when a supported source exists. Don't scrape private files or
undocumented endpoints to fill it in.

## System monitor

**Files:** `integrations/system/`, `src-tauri/src/services/system_monitor.rs`, `src-tauri/src/platform/gpu.rs`.

- **CPU and memory** come from the `sysinfo` crate (no child processes), on every platform.
- **GPU** (Windows) comes from the `\GPU Engine(*)\Utilization Percentage` performance counters — the source
  Task Manager uses. Usage is summed per physical engine across processes and the busiest engine is reported.
  If the counters don't exist (old drivers, some VMs) or on other platforms, the value is `null` and the widget
  shows "Unavailable".

## Now playing

**Files:** `integrations/media/`, `src-tauri/src/platform/media.rs`.

On Windows, reads the current session from the System Media Transport Controls (what the volume flyout shows):
title, artist, album, source app, playback status and which controls the app allows. `media_control` accepts
only `play-pause`, `next` and `previous`. No session → "Nothing is playing". Other platforms → unavailable.

## Weather

**Files:** `integrations/weather/` (`openMeteo.ts` client, store), `stores/atmosphere.ts`.

- Disabled until the user searches for and picks a location in Settings → Integrations. Nothing is looked up
  automatically (no IP geolocation).
- Uses [Open-Meteo](https://open-meteo.com/): geocoding to find the place, then the forecast API with only the
  coordinates and unit options. No API key.
- Refreshes every 30 minutes while the widget is shown or atmosphere sync is on, and never more than once every
  10 minutes.
- The CSP allows only `api.open-meteo.com` and `geocoding-api.open-meteo.com`.
- Data is CC BY 4.0; the widget shows the attribution. The free API is for non-commercial use.

**Atmosphere sync** (off by default) lets real conditions choose the world's effect. `resolveAtmosphere` keeps
the theme in charge: it only picks effects the theme allows, never touches indoor or underwater worlds, and keeps
decorative effects such as falling petals on calm days.

## Adding an integration

1. Put the data logic in `src/lib/integrations/<name>/` with a store whose state includes `unavailable` and
   `error` cases.
2. Wrap polling in `createPoller` + `createSharedLifecycle`; acquire it from the widget's `onMount`.
3. If it needs the backend, add a narrow command under `src-tauri/src/commands/`, OS code under
   `src-tauri/src/platform/` with an "unsupported" fallback, and the command's types to `BackendCommands` in
   `core/platform/tauri.ts`.
4. If it needs the network, add the exact origin to the CSP `connect-src` in `tauri.conf.json` and document it
   in the README's privacy section.
5. Add tests for parsing and state transitions (see `tests/integration/integrations.test.ts`).
