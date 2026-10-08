# Development

## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 20.19+ (CI uses 22) | |
| Rust | 1.88+ | `rustup` recommended |
| Tauri prerequisites | — | [v2.tauri.app/start/prerequisites](https://v2.tauri.app/start/prerequisites/). On Windows: Microsoft C++ Build Tools ("Desktop development with C++") and WebView2 (included in Windows 11). |

No environment variables or API keys are needed. (`TAURI_DEV_HOST` is honoured by `vite.config.js` for
Tauri's mobile tooling but isn't used by the desktop app.)

## Everyday commands

| Command | What it does |
| --- | --- |
| `npm install` | Install JavaScript dependencies |
| `npm run tauri dev` | Run the desktop app with hot reload (starts Vite on port 1420) |
| `npm run dev` | Run only the interface in a browser at http://localhost:1420 |
| `npm run check` | Svelte + TypeScript type checking |
| `npm run lint` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm test` | Unit and integration tests (Vitest) |
| `npm run build` | Build the static frontend into `build/` |
| `npm run verify` | All of the above, as CI runs them |
| `npm run tauri build` | Build the release app and installers into `src-tauri/target/release/bundle/` |

Rust checks (run inside `src-tauri/`):

```bash
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo test
cargo test -- --ignored --nocapture   # live checks against this machine: stats, AI detection, media
```

## Browser preview vs. desktop app

`npm run dev` is the fastest loop for UI work. Everything renders, but backend features show as unavailable
("Desktop app only") because there's no Tauri runtime. Use `npm run tauri dev` to work on integrations.

## Debugging tools

- **Companion viewer** — with `npm run dev` running, open http://localhost:1420/dev/companions. It shows every
  companion side by side and lets you play each activity and turn the models. The route returns 404 in
  production builds.
- **`__tickpuff`** — in development builds the 3D renderer is exposed on `window.__tickpuff` for the devtools
  console (e.g. `__tickpuff.behavior.current`, `__tickpuff.navigator.position`).
- **WebView devtools** — in `tauri dev`, right-click → Inspect (or <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>I</kbd>).

## Tests

Tests live in `tests/` and run in Node (no browser, no WebGL):

- `tests/unit/` — pure logic: focus timer and streaks, persistence and migrations, widget layout, behavior state
  machine, navigator, poller, weather parsing and atmosphere rules, AI adapters.
- `tests/integration/` — stores against an in-memory storage across simulated restarts; integrations with the
  Tauri bridge mocked; every companion model built, animated through every activity and disposed.

Write tests for behavior that could regress. Use `seededRandom()` for anything random, fake timers for
anything timed, and `setStorageBackend(new MemoryBackend())` for persisted stores (re-import modules with
`vi.resetModules()` to simulate an app restart — see `tests/integration/world.test.ts`).

## Project conventions

- Svelte 5 runes (`$props`, `$state`, `$derived`, `$effect`) in components; `svelte/store` stores for shared state.
- Imports use the `$lib` alias.
- Comments explain *why*, not *what*.
- See [CONTRIBUTING.md](../CONTRIBUTING.md) for the pull request checklist and
  [architecture.md](architecture.md) for where things belong.

## Releasing

1. Update the version in `package.json`, `src-tauri/Cargo.toml` and `src-tauri/tauri.conf.json`.
2. Move "Unreleased" entries in `CHANGELOG.md` under the new version.
3. `npm run verify` and the Rust checks; smoke-test with `npm run tauri build`.
4. Commit, then tag and push: `git tag -a vX.Y.Z -m "TickPuff X.Y.Z"` and `git push origin vX.Y.Z`.
5. The **Release** workflow (`.github/workflows/release.yml`) builds the Windows installers, signs the update
   packages and uploads everything — including `latest.json` for the updater — to a **draft** release.
6. Check the draft and press **Publish release**. Installed copies find the update on their next start (or
   Settings → About → Check for updates).

### Update signing

Updates are verified with a minisign key pair (this is not Windows code signing; SmartScreen still warns until
the installer is code-signed). The public key is in `tauri.conf.json` under `plugins.updater`. The private key
and its password live only with the maintainer and in the repository secrets `TAURI_SIGNING_PRIVATE_KEY` and
`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. Never commit them. Losing the private key means installed copies can no
longer be updated automatically.

Local `npm run tauri build` does not produce update packages (they need the key); only the Release workflow
does, via `src-tauri/tauri.release.conf.json`.
