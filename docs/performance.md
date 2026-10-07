# Performance

TickPuff is meant to sit on screen all day, so idle cost matters more than peak effects.

## Performance modes

Defined in `src/lib/stores/settings.ts` (`PERFORMANCE_PROFILES`):

| | Eco | Balanced (default) | Beautiful |
| --- | --- | --- | --- |
| Frame cap | 24 fps | 30 fps | 60 fps |
| Frame cap while resting¹ | 8 fps | 15 fps | 30 fps |
| Pixel ratio cap | 1 | 1 | 2 |
| Antialiasing | off | off | on |
| GPU particles | off (CSS fallback) | 55% density | 100% density |
| Mouse parallax | off | on | on |
| WebGL power preference | low-power | low-power | default |

¹ Resting = the companion is asleep (or hidden) and no particles are on screen.

Changing antialiasing requires a new WebGL context; the renderer is recreated and the companion continues from
the same position.

## What runs, and when

- **Render loop** — owned by `CompanionRenderer`; stopped entirely while the window is hidden or minimized.
- **Particles** — every effect is one `THREE.Points` draw call animated in the vertex shader from per-particle
  seeds. Per frame the CPU writes one time uniform per effect; no particle positions are updated in JavaScript.
- **Atmosphere fallback** — fog is always CSS (a gradient); in Eco mode rain, snow and fireflies are a handful of
  CSS layers, never one element per particle.
- **Parallax** — pointer movement writes two CSS variables at most once per animation frame; no component
  re-renders.
- **Polling** — integrations poll only while their widget is mounted and pause while the window is hidden (see
  the table in [architecture.md](architecture.md#recurring-work-and-lifecycles)).
- **Clock** — one timer aligned to wall-clock seconds.
- **Focus** — a 250 ms display ticker that exists only while a phase runs; time itself is derived from
  timestamps.
- **Backend** — CPU/memory via `sysinfo` and process detection via one process-table refresh; no PowerShell,
  `tasklist` or other child processes.

## Cleanup

Everything with a lifecycle has a `dispose`/release path that's exercised in tests:

- `CompanionRenderer.dispose()` cancels the loop, disconnects the resize observer, removes listeners, disposes
  geometries, materials, textures and the renderer, and forces a context loss.
- Swapping companions disposes the previous model's geometry and materials (`disposeObject`).
- `EffectsLayer` disposes fields as effects change.
- Services stop when their last consumer releases them.

## Measuring

- **WebView devtools** (Performance tab) in `npm run tauri dev`.
- Windows Task Manager → Details → `tickpuff.exe` and its `msedgewebview2.exe` children for CPU/GPU/memory.
- `__tickpuff` (dev builds) exposes the renderer: e.g. `__tickpuff.renderer.info.render` for draw calls and
  triangles.

Reference figure (measured with `renderer.info`, forest at night with the cat and fireflies): 29 draw calls and
about 6,200 triangles per frame — 27 of those calls are the companion's small meshes, one is the shadow and one
per particle effect. A GLB companion with merged meshes would cut the call count to a handful.
