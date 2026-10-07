import { writable } from 'svelte/store';

export const systemStore = writable({
  cpu: 0,
  ram: 0,
  gpu: 'Unavailable' as number | string
});

let systemPollInterval: ReturnType<typeof setInterval> | null = null;
let isPollingSystem = false;

// Poll real system stats via Tauri
async function pollSystemStats() {
  if (!isPollingSystem) return;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const result: [number, number] = await invoke('get_system_stats');
    systemStore.update(s => ({
      ...s,
      cpu: result[0],
      ram: result[1],
    }));
  } catch {
    // Tauri not available or command failed — leave at current values
  }
}

function startSystemPolling(intervalMs: number) {
  if (systemPollInterval) clearInterval(systemPollInterval);
  isPollingSystem = true;
  systemPollInterval = setInterval(pollSystemStats, intervalMs);
}

if (typeof window !== 'undefined') {
  pollSystemStats();
  startSystemPolling(5000);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      startSystemPolling(300_000); // 5 minutes when hidden
    } else {
      pollSystemStats();
      startSystemPolling(5000); // 5 seconds when visible
    }
  });
}
