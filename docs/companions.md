# Companions

The companion engine lives in `src/lib/companion/`. It is generic: nothing in the renderer, behavior or
navigation knows about a specific animal.

## Definitions

Every companion is a `CompanionDefinition` in `companion/registry/companions.ts`:

```ts
fox: {
  id: 'fox',
  name: 'Red Fox',
  model: { kind: 'procedural', id: 'fox' },
  locomotion: 'quadruped',     // quadruped | biped | hop | hover | swim | pulse
  personality: 'curious',      // calm | playful | curious | energetic | sleepy
  scale: 1,
  speed: { walk: 1.3, run: 3.2 },   // world units per second
  altitude: { min, max },           // swimmers and hoverers only
}
```

`locomotion` selects the animation set; `personality` weights what the companion chooses to do.

| Companion | Worlds | Locomotion | Personality |
| --- | --- | --- | --- |
| Red Fox | Forest, Sakura | quadruped | curious |
| Black Cat | Forest, Sakura, Library | quadruped | sleepy |
| Brown Bear | Forest | quadruped | calm |
| Snow Bunny | Sakura | hop | playful |
| Little Penguin | Aquarium | swim | playful |
| Barn Owl | Library | biped | calm |
| Koi Fish | Aquarium | swim | curious |
| Ghost Jelly | Aquarium | pulse | calm |
| Sea Turtle | Aquarium | swim | sleepy |
| Helper Bot | Cyber City | hover | energetic |
| Scout Drone | Cyber City | hover | curious |

## Models

### Procedural models (current)

All companions currently use procedural models from `companion/models/procedural/`, built at runtime from
smooth primitives (`models/parts.ts`) with a shared three-step toon ramp. **They are placeholders**: designed to
be recognizable and expressive, but not final art.

Each builder returns a `CompanionRig` (`models/rig.ts`): `root`, `body`, `head`, and optional `tail`,
`tailSegments`, `ears`, `legs`, `arms`, `eyes`, `spinners`, `tentacles`, `glows`. Conventions:

- facing +Z, feet at y = 0, about 1.6 units tall;
- each part's pivot is where it rotates (legs hang down from the hip, ears rise from their base);
- `body.userData.restY` is the body's resting height;
- `eyes` are scaled on Y to blink; `glows` are dimmed while sleeping.

### GLB / GLTF models

Point a definition at a model file and keep a procedural fallback (shown while loading and if loading fails):

```ts
model: {
  kind: 'gltf',
  url: 'companions/fox/fox.glb',          // served from static/
  clips: { idle: 'Idle', walk: 'Walk', run: 'Run', sit: 'Sit', sleep: 'Sleep', celebrate: 'Jump' },
  fallback: 'fox',
},
```

`CompanionLoader.rigFromScene` normalizes the model to the authored height with its feet on the ground. If the
file has animation clips, `ClipAnimator` cross-fades between them (missing activities fall back to `walk` while
moving, otherwise `idle`; walk speed is matched to movement). Without clips, the procedural animator is used on
nodes named `head` and `tail` when present.

**Asset rules:** only add models you made or that are licensed for redistribution under MIT-compatible terms
(e.g. CC0, CC BY). Record source and license in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md). Keep files
small (aim for under 1 MB, a few thousand triangles, compressed textures).

Use the **companion viewer** (`npm run dev` → http://localhost:1420/dev/companions) to check models and every
activity.

## Behavior

`behavior/BehaviorController.ts` is a deterministic state machine with injected randomness (seeded in tests).
Priority, highest first:

1. **Sleep mode** — sleep in place; wake up (yawn) when it ends.
2. **Events** — `poke()` (the user clicked or pressed Enter on the companion) → `react`, sometimes `play`;
   `celebrate()` (a focus session finished) → `celebrate`.
3. **Focus** — while a focus phase runs, sit quietly (`focus`); stretch afterwards.
4. **Hover** — stop and watch the pointer (`look`).
5. **Travel** — walk or run to the destination; on arrival do the zone's activity for its stay time.
6. **Free choice** — when the current activity ends, pick the next one with personality weights adjusted for
   time of day (sleepier at night) and weather (`weather-react` and shelter-seeking in rain or snow).

Activities: `idle`, `walk`, `run`, `sit`, `sleep`, `wake`, `stretch`, `look`, `react`, `play`, `celebrate`,
`focus`, `weather-react`, `explore`.

## Movement

`navigation/Navigator.ts` handles destination following: turn toward the target (turning in place when facing
away), accelerate, walk along the current heading (so paths curve), brake within the last 0.6 units and stop.
While idle the companion slowly turns to face the viewer. `StageMapper` clamps it to the theme's stage after
every step. Switching companions keeps the position (with a small pop-in); switching worlds moves the companion
to the new world's stage.

## Interaction

The canvas never receives pointer events. `interaction/InteractionController.ts` positions an invisible button
over the companion each frame. Hovering it makes the companion look at the cursor; clicking it (or focusing it
with <kbd>Tab</kbd> and pressing <kbd>Enter</kbd>) pokes it. The button's accessible label describes what the
companion is doing.

## Adding a companion

1. Build a model: a procedural builder returning a `CompanionRig`, or a GLB file with a procedural fallback.
2. Add the id to `CompanionId` (`src/lib/types/companion.ts`) and a definition to the registry.
3. Add it to the `companions` list of the world(s) it belongs in.
4. Check it in the companion viewer, then run `npm test` — the lifecycle test animates every companion through
   every activity and checks disposal.
