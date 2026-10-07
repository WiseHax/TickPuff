# Third-party notices

TickPuff's own code and artwork (including the app icon in `assets/icons/` and the procedural companion
models) are MIT licensed. TickPuff bundles or depends on the following third-party work.

## Bundled fonts

All fonts are installed from [Fontsource](https://fontsource.org/) npm packages and bundled with the app.
They are licensed under the [SIL Open Font License 1.1](https://openfontlicense.org/); the full license text
ships in each package's `LICENSE` file under `node_modules/@fontsource*/`.

| Font | Copyright | Package |
| --- | --- | --- |
| Inter | Copyright 2016 The Inter Project Authors | `@fontsource-variable/inter` |
| Outfit | Copyright 2021 The Outfit Project Authors | `@fontsource-variable/outfit` |
| Pixelify Sans | Copyright 2021 The Pixelify Sans Project Authors | `@fontsource-variable/pixelify-sans` |
| Space Mono | Copyright 2016 The Space Mono Project Authors | `@fontsource/space-mono` |
| VT323 | Copyright 2011 The VT323 Project Authors | `@fontsource/vt323` |

## Icons

Interface icons are SVG paths from [Feather](https://feathericons.com/) — MIT License,
Copyright (c) 2013–2023 Cole Bemis.

## Libraries

| Library | License |
| --- | --- |
| [three.js](https://threejs.org/) | MIT |
| [Svelte](https://svelte.dev/) / [SvelteKit](https://svelte.dev/docs/kit) | MIT |
| [Tauri](https://tauri.app/) and its plugins | MIT or Apache-2.0 |
| [sysinfo](https://github.com/GuillaumeGomez/sysinfo) | MIT |
| [windows-rs](https://github.com/microsoft/windows-rs) | MIT or Apache-2.0 |
| [serde](https://serde.rs/) | MIT or Apache-2.0 |

The complete dependency trees are recorded in `package-lock.json` and `src-tauri/Cargo.lock`.

## Data

Weather data (only when you choose a location) comes from [Open-Meteo](https://open-meteo.com/) and is
licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The weather widget shows the
required attribution. Open-Meteo's free API is intended for non-commercial use.
