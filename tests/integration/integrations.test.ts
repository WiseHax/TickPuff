/**
 * Integration state transitions with the Tauri bridge mocked:
 * browser preview → "unavailable", desktop → real data, failures → error.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

const invoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({ invoke: (...args: unknown[]) => invoke(...args) }));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function asDesktop(enabled: boolean) {
  const g = globalThis as unknown as { window?: Record<string, unknown> };
  if (enabled) g.window = { __TAURI_INTERNALS__: {} };
  else delete g.window;
}

beforeEach(() => {
  vi.resetModules();
  invoke.mockReset();
});

afterEach(() => asDesktop(false));

describe('system monitor', () => {
  it('is unavailable outside the desktop app and never shows fake numbers', async () => {
    const { systemMonitor, systemService } = await import('$lib/integrations/system');
    const release = systemService.acquire();
    await flush();
    expect(get(systemMonitor)).toMatchObject({ status: 'unavailable', stats: null });
    release();
  });

  it('shows real values and keeps GPU unknown when the backend reports null', async () => {
    asDesktop(true);
    invoke.mockResolvedValue({ cpuPercent: 12.5, memoryUsedBytes: 4e9, memoryTotalBytes: 8e9, gpuPercent: null });
    const { systemMonitor, systemService } = await import('$lib/integrations/system');
    const release = systemService.acquire();
    await flush();
    expect(invoke).toHaveBeenCalledWith('system_stats', undefined);
    expect(get(systemMonitor)).toMatchObject({ status: 'ready', stats: { cpuPercent: 12.5, gpuPercent: null } });
    release();
  });

  it('polls only while a consumer holds it', async () => {
    vi.useFakeTimers();
    try {
      asDesktop(true);
      invoke.mockResolvedValue({ cpuPercent: 1, memoryUsedBytes: 1, memoryTotalBytes: 2, gpuPercent: 3 });
      const { systemService } = await import('$lib/integrations/system');
      const release = systemService.acquire();
      await vi.advanceTimersByTimeAsync(9_100);
      const calls = invoke.mock.calls.length;
      expect(calls).toBeGreaterThanOrEqual(3);
      release();
      await vi.advanceTimersByTimeAsync(30_000);
      expect(invoke.mock.calls.length).toBe(calls);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('AI workspace', () => {
  it('maps a detection report to tool states', async () => {
    asDesktop(true);
    invoke.mockResolvedValue({
      antigravity: { ideRunning: false, cliRunning: true, installed: true },
      claudeCode: { running: false, installed: true },
    });
    const { aiTools, aiService } = await import('$lib/integrations/ai');
    const release = aiService.acquire();
    await flush();
    expect(invoke).toHaveBeenCalledWith('detect_ai_tools', undefined);
    const [antigravity, claude] = get(aiTools);
    expect(antigravity).toMatchObject({ status: 'running', detail: 'CLI running' });
    expect(claude).toMatchObject({ status: 'installed' });
    release();
  });

  it('becomes unavailable when detection fails', async () => {
    asDesktop(true);
    invoke.mockRejectedValue(new Error('boom'));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { aiTools, aiService } = await import('$lib/integrations/ai');
    const release = aiService.acquire();
    await flush();
    expect(get(aiTools).every((tool) => tool.status === 'unavailable' && tool.detail === 'Detection failed')).toBe(
      true,
    );
    release();
    vi.restoreAllMocks();
  });
});

describe('now playing', () => {
  it('reports an empty session as nothing playing', async () => {
    asDesktop(true);
    invoke.mockResolvedValue(null);
    const { nowPlaying, mediaService } = await import('$lib/integrations/media');
    const release = mediaService.acquire();
    await flush();
    expect(get(nowPlaying)).toMatchObject({ status: 'ready', media: null });
    release();
  });

  it('sends only whitelisted control actions', async () => {
    asDesktop(true);
    invoke.mockResolvedValue(undefined);
    const { controlMedia } = await import('$lib/integrations/media');
    await controlMedia('next');
    expect(invoke).toHaveBeenCalledWith('media_control', { action: 'next' });
  });
});
