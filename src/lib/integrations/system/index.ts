/** System monitor: real CPU / memory / GPU values from the backend, or nothing. */
import { writable } from 'svelte/store';
import { createPoller, createSharedLifecycle } from '$lib/core/scheduling/poller';
import { PlatformUnavailableError, invokeCommand } from '$lib/core/platform/tauri';
import type { IntegrationStatus, SystemStats } from '$lib/types';

export interface SystemMonitorState {
  status: IntegrationStatus;
  stats: SystemStats | null;
  message: string | null;
}

export const systemMonitor = writable<SystemMonitorState>({ status: 'idle', stats: null, message: null });

const poller = createPoller({
  intervalMs: 3_000,
  hiddenIntervalMs: null,
  async run() {
    try {
      const stats = await invokeCommand('system_stats');
      systemMonitor.set({ status: 'ready', stats, message: null });
    } catch (error) {
      systemMonitor.set({
        status: error instanceof PlatformUnavailableError ? 'unavailable' : 'error',
        stats: null,
        message: error instanceof PlatformUnavailableError ? 'Desktop app only' : 'Could not read system stats',
      });
    }
  },
});

export const systemService = createSharedLifecycle(() => {
  systemMonitor.update((s) => (s.status === 'idle' ? { ...s, status: 'loading' } : s));
  poller.start();
}, poller.stop);

export function formatBytes(bytes: number): string {
  const gb = bytes / 1024 ** 3;
  return gb >= 10 ? `${gb.toFixed(0)} GB` : `${gb.toFixed(1)} GB`;
}
