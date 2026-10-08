# Themes (worlds)

A theme is a visual world. It has two parts:

1. **Data** — `src/lib/themes/definitions/<id>.ts`, a `ThemeDefinition`.
2. **Scenery** — `src/lib/themes/scenes/<Name>Scene.svelte`, the 2D layers drawn behind the companion.

Both are registered by id: data in `themes/registry.ts` (`THEMES`), scenery in `themes/scenes/index.ts`
(`SCENES`).

> The current focus is improving the five existing worlds, so new worlds aren't being added to the main
> project right now. This guide documents how the system works for maintenance and for forks.

## ThemeDefinition

```ts
{
  id: 'forest',
  name: 'Cozy Forest',
  description: 'A deep woodland clearing',
  allowedWeather: ['clear', 'fog', 'rain', 'heavy-rain', 'snow', 'leaves'],
  defaultWeather: 'fog',
  companions: ['cat', 'fox', 'bear'],
  defaultCompanion: 'cat',
  clock: { font: 'Pixelify Sans', shadow: '0 4px 20px rgba(0,0,0,0.8)' },
  ambient: [{ effect: 'fireflies', when: ['night', 'late-night'] }],
  colors: { morning: {…}, day: {…}, sunset: {…}, night: {…}, 'late-night': {…} },
  stage: { minX, maxX, medium, zones: [...] },
}
```

| Field | Notes |
| --- | --- |
| `allowedWeather` | Atmosphere effects the user may pick in this world. Must include `defaultWeather`. |
| `companions` | Companion ids from the companion registry. Must include `defaultCompanion`. |
| `clock.font` | Used when the clock font setting is "Theme". One of the bundled fonts. |
| `clock.shadow` | CSS `text-shadow` for the clock, giving each world its glow. |
| `ambient` | Particle effects the world adds on its own, optionally by time of day (`fireflies`, `sparks`, `dust`). |
| `colors` | Per time of day: background gradient, text, muted text, accent, glass. Applied as CSS variables. |

Time-of-day boundaries: morning 5–9, day 9–17, sunset 17–20, night 20–23, late night 23–5 (local time).

## The stage

The stage is where the companion can go, in **normalized** coordinates so it works at any window size:

- `x`: 0 = left edge of the window, 1 = right edge.
- `depth`: 0 = the front of the ground band (near the bottom of the window), 1 = the back.

The ground band's position on screen is fixed (`GROUND_FRONT` / `GROUND_BACK` in
`companion/navigation/StageMapper.ts`), so scenery should draw its ground in roughly the bottom 20% of the window.

```ts
stage: {
  minX: 0.36,          // keep clear of the left widget drawer
  maxX: 0.84,
  medium: 'ground',    // or 'water' (swimmers use their altitude range)
  zones: [
    { id: 'pine', label: 'Under the pine', kind: 'shelter', x: 0.82, depth: 0.35,
      activity: 'sleep', stay: [12, 25] },
  ],
}
```

### Zones

Zones are meaningful spots the companion walks to. **Only add a zone where the scenery actually has the
object** — a "campfire" zone needs a campfire in the scene.

| Field | Notes |
| --- | --- |
| `kind` | `interact` (something to look at or play with), `rest` (a place to sit), `shelter` (preferred in rain and snow) |
| `activity` | What the companion does on arrival: `sit`, `sleep`, `look`, `play`, `idle`, … |
| `stay` | Seconds to stay, `[min, max]` |
| `altitude` | Swimmers/hoverers only: 0–1 within the companion's altitude range |
| `when` | Times of day the zone is meaningful (e.g. a candle that's only lit in the evening) |

## Scenery components

A scene receives `time` (the current `TimeOfDay`) and renders a stack of parallax layers, far to near:

```svelte
<Sky {time} seed={1} sunX={0.7} />  <!-- shared sky: glow, sun/moon, stars, clouds -->
<div class="world-layer" style="--depth: 6"> mountains </div>
<div class="world-layer" style="--depth: 20"> midground </div>
<div class="world-layer" style="--depth: 40"> ground, props, framing </div>
```

`--depth` is the parallax strength in pixels; `World.svelte` drives it from the pointer (disabled in Eco mode).

Scenery is SVG drawn in a 1600 × 900 space with `preserveAspectRatio="xMidYMax slice"`, so it stays anchored
to the bottom of the window. `scenes/art.ts` has deterministic generators — `ridge`, `mountains` (with snow
caps), `pineRow`, `canopy`, `grass`, `specks`, `starField`, `clouds` — and `mix()` for colours derived from the
theme's CSS variables (`TOP`, `BOTTOM`, `ACCENT`), so a scene follows every time of day without its own palette.
`GROUND_Y` is where the walkable stage sits.

Rules that keep scenery cheap:

- Generate geometry once (top-level `const` in the component), never per frame.
- Animate only whole elements (`transform` / `opacity` on an HTML element or a small standalone `<svg>`), never
  shapes inside a full-screen SVG — that repaints the whole layer every frame.
- Props that the companion visits (a zone's mushroom, candle, lantern) are absolutely positioned in % of the
  window so they line up with the stage at any aspect ratio.
- Don't put weather in scenes: atmosphere is rendered by the effects layer.

In development, preview any time of day with `?time=night` (or `morning`, `day`, `sunset`, `late-night`).

## Checklist for changes to a world

- Colours are readable for all five times of day (check the clock, widgets and settings).
- Zones line up with the scenery at a few window sizes (1024×600, 1920×1080, a narrow window).
- `npm test` passes (`companion-lifecycle.test.ts` checks every theme's companions and defaults are valid).
