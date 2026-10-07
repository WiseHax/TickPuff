/**
 * Now Playing: reads the OS media session (Windows System Media Transport
 * Controls) through the backend. Shows nothing when no session exists.
 */
import { writable } from 'svelte/store';
import { createPoller, createSharedLifecycle } from '$lib/core/scheduling/poller';
import { PlatformUnavailableError, invokeCommand } from '$lib/core/platform/tauri';
import type { IntegrationStatus, MediaAction, MediaInfo } from '$lib/types';

export interface MediaState {
  status: IntegrationStatus;
  media: MediaInfo | null;
  message: string | null;
}

export const nowPlaying = writable<MediaState>({ status: 'idle', media: null, message: null });

async function readMedia() {
  try {
    const media = await invokeCommand('media_current');
    nowPlaying.set({ status: 'ready', media, message: null });
  } catch (error) {
    const unavailable = error instanceof PlatformUnavailableError;
    nowPlaying.set({
      status: unavailable ? 'unavailable' : 'error',
      media: null,
      message: unavailable ? 'Desktop app only' : typeof error === 'string' ? error : 'Media info unavailable',
    });
  }
}

const poller = createPoller({ intervalMs: 3_000, hiddenIntervalMs: null, run: readMedia });

export const mediaService = createSharedLifecycle(poller.start, poller.stop);

export async function controlMedia(action: MediaAction): Promise<void> {
  try {
    await invokeCommand('media_control', { action });
  } finally {
    // Media apps update their session asynchronously.
    setTimeout(() => poller.refresh(), 350);
  }
}

/** Friendly name from an app user model id like "Spotify.exe" or "Microsoft.ZuneMusic_8wekyb3d8bbwe!Microsoft.ZuneMusic". */
export function sourceAppName(id: string | null): string | null {
  if (!id) return null;
  const base = id.split('!').pop() ?? id;
  const cleaned =
    base
      .replace(/\.exe$/i, '')
      .split('.')
      .pop() ?? base;
  return cleaned.length > 0 ? cleaned : null;
}
