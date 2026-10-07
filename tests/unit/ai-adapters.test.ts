import { describe, expect, it } from 'vitest';
import { antigravityAdapter, applyReport, claudeCodeAdapter, markUnavailable } from '$lib/integrations/ai/adapters';
import type { AIDetectionReport } from '$lib/types';

const report = (
  patch: {
    antigravity?: Partial<AIDetectionReport['antigravity']>;
    claudeCode?: Partial<AIDetectionReport['claudeCode']>;
  } = {},
): AIDetectionReport => ({
  antigravity: { ideRunning: false, cliRunning: false, installed: false, ...patch.antigravity },
  claudeCode: { running: false, installed: false, ...patch.claudeCode },
});

describe('AI adapters', () => {
  it('report each tool independently', () => {
    const tools = applyReport(report({ antigravity: { ideRunning: true, installed: true } }), 1000);
    const [antigravity, claude] = tools;
    expect(antigravity).toMatchObject({ id: 'antigravity', status: 'running', detail: 'IDE running', checkedAt: 1000 });
    // Antigravity running must not make Claude Code look active (and vice versa).
    expect(claude).toMatchObject({ id: 'claude-code', status: 'not-found' });
    const reversed = applyReport(report({ claudeCode: { running: true } }), 1000);
    expect(reversed[0].status).toBe('not-found');
    expect(reversed[1].status).toBe('running');
  });

  it('distinguishes installed from not found', () => {
    expect(antigravityAdapter.read(report({ antigravity: { installed: true } })).status).toBe('installed');
    expect(claudeCodeAdapter.read(report({ claudeCode: { installed: true } })).status).toBe('installed');
    expect(antigravityAdapter.read(report()).status).toBe('not-found');
  });

  it('describes which Antigravity surfaces are running', () => {
    expect(antigravityAdapter.read(report({ antigravity: { ideRunning: true, cliRunning: true } })).detail).toBe(
      'IDE and CLI running',
    );
    expect(antigravityAdapter.read(report({ antigravity: { cliRunning: true } })).detail).toBe('CLI running');
  });

  it('never fabricates quota', () => {
    for (const tool of applyReport(report({ antigravity: { ideRunning: true }, claudeCode: { running: true } }), 1)) {
      expect(tool.quota.kind).toBe('unavailable');
    }
  });

  it('marks tools unavailable when detection fails', () => {
    const previous = applyReport(report({ claudeCode: { running: true } }), 5);
    const failed = markUnavailable(previous, 'Desktop app only');
    expect(failed.every((t) => t.status === 'unavailable' && t.detail === 'Desktop app only')).toBe(true);
  });
});
