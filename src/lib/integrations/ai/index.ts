import { writable } from 'svelte/store';
import { createPoller, createSharedLifecycle } from '$lib/core/scheduling/poller';
import { PlatformUnavailableError, invokeCommand } from '$lib/core/platform/tauri';
import { AI_ADAPTERS, applyReport, initialToolState, markUnavailable } from './adapters';
import type { AIToolState } from '$lib/types';

export { AI_STATUS_LABELS } from './adapters';

export const aiTools = writable<AIToolState[]>(AI_ADAPTERS.map(initialToolState));

const poller = createPoller({
  intervalMs: 20_000,
  hiddenIntervalMs: null, // nothing to show while hidden
  async run() {
    try {
      const report = await invokeCommand('detect_ai_tools');
      aiTools.set(applyReport(report, Date.now()));
    } catch (error) {
      const reason = error instanceof PlatformUnavailableError ? 'Desktop app only' : 'Detection failed';
      aiTools.update((tools) => markUnavailable(tools, reason));
    }
  },
});

/** Detection runs only while at least one consumer (the AI widget) is mounted. */
export const aiService = {
  ...createSharedLifecycle(poller.start, poller.stop),
  refresh: poller.refresh,
};
