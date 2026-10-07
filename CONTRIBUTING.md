# Contributing to TickPuff

Thanks for helping make TickPuff better! This guide covers how to set up, what we look for in changes, and
how to get them merged.

## Ground rules

- Be kind. Everyone participating agrees to the [Code of Conduct](CODE_OF_CONDUCT.md).
- Report security problems privately — see [SECURITY.md](SECURITY.md). Don't open public issues for them.
- Keep TickPuff's identity: a calm clock with a living world first, optional tools second. Proposals that
  turn it into a dashboard or productivity suite will likely be declined.

## Getting set up

You need Node.js 20.19+, Rust 1.88+ and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/).

```bash
git clone https://github.com/WiseHax/TickPuff.git
cd TickPuff
npm install
npm run tauri dev
```

[docs/development.md](docs/development.md) explains the project layout, scripts and debugging tools.

## Before you open a pull request

1. **Open an issue first for anything bigger than a small fix**, so we can agree on the approach.
2. Keep changes focused. One feature or fix per pull request.
3. Run the full check suite and make sure it passes:

   ```bash
   npm run verify                       # types, lint, format, unit/integration tests, frontend build
   cd src-tauri
   cargo fmt --check
   cargo clippy --all-targets -- -D warnings
   cargo test
   ```

4. Run the app (`npm run tauri dev`) and try what you changed.
5. Add or update tests for behavior you change. Tests should catch real regressions — please don't add tests
   that only raise coverage numbers.
6. Update the docs (`README.md`, `docs/`) and add a line to `CHANGELOG.md` under "Unreleased".

## Code guidelines

- **Respect the concept boundaries** described in [docs/architecture.md](docs/architecture.md): themes don't own
  widgets, widgets don't fetch data directly, components consume stores.
- **No fake data.** If something can't be measured, show it as unavailable. This applies to system stats,
  AI quota, media and weather alike.
- **Every recurring process needs an owner and cleanup.** Use `createPoller` / `createSharedLifecycle`
  (`src/lib/core/scheduling/poller.ts`) and release them when the consumer unmounts.
- **Persisted data is versioned.** Use `persisted()` with a `PersistSpec`, validate with `sanitize`, and add a
  `migrate` step when you change a stored shape — never silently drop a user's preferences.
- **Keep the backend narrow.** New Tauri commands must do one specific thing; no generic shell, file or process
  access. Put OS-specific code in `src-tauri/src/platform` behind a `cfg` with an honest fallback.
- Strict TypeScript: avoid `any`, `as any` and non-null assertions where a type guard would do.
- Formatting is handled by Prettier (`npm run format`) and `cargo fmt`.

## Assets

Only contribute art, models, sounds or fonts you made yourself or that have a license compatible with MIT
redistribution (for example CC0, CC BY, OFL). State the source and license in the pull request and add it to
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Assets with unknown provenance can't be merged.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `refactor:`, `docs:`,
`test:`, `chore:`, `perf:`. Keep the subject line short and explain the *why* in the body when it isn't obvious.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
