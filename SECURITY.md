# Security policy

## Reporting a vulnerability

**Please don't report security problems in public issues, discussions or pull requests.**

Report them privately with GitHub's private vulnerability reporting: open the repository's
[**Security** tab](https://github.com/WiseHax/TickPuff/security) and choose **Report a vulnerability**.
Only the maintainers can see the report.

Please include:

- what the problem is and what an attacker could do with it,
- the TickPuff version (Settings → About) and your operating system,
- steps to reproduce, or a proof of concept,
- any ideas you have for a fix.

Please don't publish details, exploits or proofs of concept until a fix is released and you've heard back
from us. We'll acknowledge reports as soon as we can, keep you updated, and credit you in the release notes
unless you'd rather stay anonymous.

## Supported versions

TickPuff is pre-1.0. Security fixes go into the latest release only.

## What's in scope

TickPuff is a local desktop app. Areas where a vulnerability would matter most:

- **Tauri commands** (`src-tauri/src/commands`). They are deliberately narrow — no generic shell, file or
  process access. Anything that lets the frontend run arbitrary programs, read arbitrary files or reach other
  processes is a vulnerability.
- **Capabilities and CSP** (`src-tauri/capabilities`, `src-tauri/tauri.conf.json`). The window may only open
  links to the project repository and Open-Meteo, and may only contact Open-Meteo over the network.
- **Untrusted text** shown in the UI: media titles from other apps, weather location names and responses.
  These must never be rendered as HTML.
- **Persisted data** in the app's local storage.

Out of scope: issues that need an attacker who already controls your user account, and bugs in third-party
dependencies that don't affect TickPuff (report those upstream).
