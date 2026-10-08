/**
 * App updates through Tauri's updater: signed releases on GitHub
 * (`latest.json` on the latest release). Nothing is downloaded or installed
 * without the user pressing "Update".
 */
import { writable } from 'svelte/store';
import { isTauri } from '$lib/core/platform/tauri';

export type UpdateStatus = 'idle' | 'checking' | 'none' | 'available' | 'installing' | 'error';

export interface UpdateState {
  status: UpdateStatus;
  /** Version on offer, when one is available. */
  version: string | null;
  /** Download progress 0–1 while installing (null when the size is unknown). */
  progress: number | null;
  message: string | null;
  /** The user hid the notice for this session. */
  dismissed: boolean;
}

export const updateState = writable<UpdateState>({
  status: 'idle',
  version: null,
  progress: null,
  message: null,
  dismissed: false,
});

type PendingUpdate = Awaited<ReturnType<typeof import('@tauri-apps/plugin-updater').check>>;
let pending: PendingUpdate = null;

/** Ask GitHub whether a newer signed release exists. */
export async function checkForUpdates(): Promise<void> {
  if (!isTauri()) {
    updateState.update((s) => ({ ...s, status: 'error', message: 'Updates work in the desktop app only' }));
    return;
  }
  updateState.update((s) => ({ ...s, status: 'checking', message: null }));
  try {
    const { check } = await import('@tauri-apps/plugin-updater');
    pending = await check();
    updateState.update((s) => ({
      ...s,
      status: pending ? 'available' : 'none',
      version: pending?.version ?? null,
    }));
  } catch (error) {
    updateState.update((s) => ({ ...s, status: 'error', message: errorText(error) }));
  }
}

/** Download, verify and install the pending update; the installer restarts TickPuff. */
export async function installUpdate(): Promise<void> {
  if (!pending) return;
  let total = 0;
  let received = 0;
  updateState.update((s) => ({ ...s, status: 'installing', progress: null, message: null }));
  try {
    await pending.downloadAndInstall((event) => {
      if (event.event === 'Started') total = event.data.contentLength ?? 0;
      if (event.event === 'Progress') {
        received += event.data.chunkLength;
        updateState.update((s) => ({ ...s, progress: total > 0 ? Math.min(1, received / total) : null }));
      }
    });
  } catch (error) {
    updateState.update((s) => ({ ...s, status: 'error', message: errorText(error) }));
  }
}

export function dismissUpdate(): void {
  updateState.update((s) => ({ ...s, dismissed: true }));
}

let scheduled = false;

/** Check once, quietly, a little while after startup (desktop release builds only). */
export function scheduleStartupCheck(delayMs = 20_000): void {
  if (scheduled || !isTauri() || import.meta.env.DEV) return;
  scheduled = true;
  setTimeout(() => void checkForUpdates(), delayMs);
}

function errorText(error: unknown): string {
  const text = typeof error === 'string' ? error : error instanceof Error ? error.message : '';
  // No release with update info published yet (or GitHub unreachable): nothing to install, not a failure.
  if (/release JSON|404|Not Found/i.test(text)) return 'No update information published yet.';
  if (/network|dns|connect|timed? ?out|offline/i.test(text)) return "Couldn't reach GitHub. Try again later.";
  return text || 'Update check failed.';
}
