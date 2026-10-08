/**
 * Native window modes owned by the backend: the always-on-top mini window
 * and start with Windows. The backend is the source of truth (the tray menu
 * changes them too), so these stores mirror it rather than persist anything.
 */
import { writable } from 'svelte/store';
import { invokeCommand, isTauri } from '$lib/core/platform/tauri';

/** Mirrors the backend's `tickpuff://mini-mode` event. */
export const MINI_MODE_EVENT = 'tickpuff://mini-mode';

export const miniMode = writable(false);
/** null until known (and always null outside the desktop app). */
export const autostart = writable<boolean | null>(null);

let initialized = false;

/** Read the current state and follow changes made from the tray. Safe to call more than once. */
export async function initWindowModes(): Promise<void> {
  if (initialized || !isTauri()) return;
  initialized = true;
  const { listen } = await import('@tauri-apps/api/event');
  await listen<boolean>(MINI_MODE_EVENT, (event) => miniMode.set(event.payload));
  miniMode.set(await invokeCommand('mini_mode'));
  if (!__STORE_BUILD__) autostart.set(await invokeCommand('autostart'));
}

export async function setMiniMode(enabled: boolean): Promise<void> {
  if (!isTauri()) return;
  miniMode.set(await invokeCommand('set_mini_mode', { enabled }));
}

export async function setAutostart(enabled: boolean): Promise<void> {
  if (!isTauri()) return;
  try {
    autostart.set(await invokeCommand('set_autostart', { enabled }));
  } catch (error) {
    console.warn('[tickpuff] could not change start with Windows', error);
    autostart.set(await invokeCommand('autostart'));
  }
}
