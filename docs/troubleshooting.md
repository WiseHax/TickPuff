# Troubleshooting

## Building

**`npm run tauri dev` says port 1420 is in use.**
Another Vite dev server is running. Stop it, or find it with `netstat -ano | findstr :1420` (Windows) and end
that process.

**Rust errors like "rustc X is not supported by package Y".**
Update Rust: `rustup update stable`. TickPuff needs Rust 1.88 or newer.

**Linker errors on Windows (`link.exe` not found).**
Install the Microsoft C++ Build Tools with the "Desktop development with C++" workload, then open a new
terminal.

**The installer build fails while downloading WiX or NSIS.**
`tauri build` downloads these bundler tools on first use. Check your network or proxy, or build just the app
binary with `npm run tauri build -- --no-bundle`.

## Running

**The window has no title bar — how do I move or close it?**
TickPuff is frameless. Drag any empty part of the window to move it. Minimize and close are the small buttons
at the top right (move the mouse to reveal the controls). <kbd>F11</kbd> toggles full screen; <kbd>Esc</kbd>
leaves it.

**The controls disappeared.**
They fade out after a few seconds without mouse movement. Move the mouse or press any key.

**There's no companion.**
Check Settings → Companion → "Show companion". If Settings → Performance says the 3D renderer is unavailable,
your system's WebGL support is disabled or blocked; updating graphics drivers usually helps.

**AI workspace says "Not found" even though the tool is installed.**
Detection looks for running processes and a few default install locations (see
[integrations.md](integrations.md#ai-workspace)). Custom install folders that aren't on `PATH` are reported as
"Not found" until the tool is running.

**AI workspace shows "Unavailable — Desktop app only".**
You're running the browser preview (`npm run dev`). Use `npm run tauri dev`.

**GPU shows "Unavailable".**
GPU usage needs Windows' "GPU Engine" performance counters (WDDM 2.x drivers). Some virtual machines and older
drivers don't provide them, and other operating systems aren't supported yet.

**Now Playing says "Nothing is playing" while music plays.**
The player must publish a Windows media session (most do: Spotify, browsers, Media Player). If the Windows volume
flyout doesn't show the track, TickPuff can't see it either.

**Weather doesn't load.**
Pick a location in Settings → Integrations. TickPuff needs network access to `api.open-meteo.com`; corporate
proxies or firewalls may block it.

**The focus timer finished while TickPuff was closed.**
That's expected: the timer is based on timestamps, so a running phase keeps going while the app is closed and is
counted when it ends.

## Settings and data

Settings, tasks and notes are kept in the WebView's local storage in the app's data folder
(on Windows: `%LOCALAPPDATA%\com.tickpuff.app\`). If a stored value is ever unreadable, TickPuff saves a copy
under `<key>.backup` and starts that setting fresh, so nothing is silently lost.

To reset everything, close TickPuff and delete that folder.
