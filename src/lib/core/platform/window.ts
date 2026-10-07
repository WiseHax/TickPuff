/**
 * Window controls for the frameless TickPuff window.
 * Falls back to the Fullscreen API in a browser preview.
 */
import { isTauri } from './tauri';

async function currentWindow() {
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  return getCurrentWindow();
}

/** Whether minimize / close are available (desktop app only). */
export const hasNativeWindow = (): boolean => isTauri();

export async function minimizeWindow(): Promise<void> {
  if (isTauri()) await (await currentWindow()).minimize();
}

export async function closeWindow(): Promise<void> {
  if (isTauri()) await (await currentWindow()).close();
}

export async function isFullscreen(): Promise<boolean> {
  if (isTauri()) return (await currentWindow()).isFullscreen();
  return typeof document !== 'undefined' && document.fullscreenElement !== null;
}

export async function setFullscreen(value: boolean): Promise<void> {
  if (isTauri()) {
    await (await currentWindow()).setFullscreen(value);
    return;
  }
  if (value && !document.fullscreenElement) await document.documentElement.requestFullscreen();
  if (!value && document.fullscreenElement) await document.exitFullscreen();
}

export async function toggleFullscreen(): Promise<boolean> {
  const next = !(await isFullscreen());
  await setFullscreen(next);
  return next;
}
