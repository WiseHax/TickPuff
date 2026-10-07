/**
 * AI tool adapters. Each adapter turns *its own* slice of the backend
 * detection report into a display state. Adapters never look at another
 * tool's data, so one tool can't be inferred from the other.
 *
 * Quota: neither Antigravity nor Claude Code offers a documented way for a
 * third-party app to read usage or quota, so both report `unavailable`.
 * A future adapter can return `{ kind: 'available', ... }` once a supported
 * source exists — see docs/integrations.md.
 */
import type { AIDetectionReport, AIStatus, AIToolId, AIToolState, QuotaStatus } from '$lib/types';

export interface AIAdapter {
  id: AIToolId;
  name: string;
  read(report: AIDetectionReport): { status: AIStatus; detail: string | null; quota: QuotaStatus };
}

const NO_QUOTA_SOURCE = (tool: string): QuotaStatus => ({
  kind: 'unavailable',
  reason: `${tool} doesn't provide a supported way for other apps to read quota.`,
});

export const antigravityAdapter: AIAdapter = {
  id: 'antigravity',
  name: 'Antigravity',
  read({ antigravity }) {
    const { ideRunning, cliRunning, installed } = antigravity;
    const status: AIStatus = ideRunning || cliRunning ? 'running' : installed ? 'installed' : 'not-found';
    const detail =
      ideRunning && cliRunning
        ? 'IDE and CLI running'
        : ideRunning
          ? 'IDE running'
          : cliRunning
            ? 'CLI running'
            : installed
              ? 'Installed, not running'
              : null;
    return { status, detail, quota: NO_QUOTA_SOURCE('Antigravity') };
  },
};

export const claudeCodeAdapter: AIAdapter = {
  id: 'claude-code',
  name: 'Claude Code',
  read({ claudeCode }) {
    const status: AIStatus = claudeCode.running ? 'running' : claudeCode.installed ? 'installed' : 'not-found';
    const detail = claudeCode.running ? 'Session running' : claudeCode.installed ? 'Installed, not running' : null;
    return { status, detail, quota: NO_QUOTA_SOURCE('Claude Code') };
  },
};

export const AI_ADAPTERS: readonly AIAdapter[] = [antigravityAdapter, claudeCodeAdapter];

export function initialToolState(adapter: AIAdapter): AIToolState {
  return {
    id: adapter.id,
    name: adapter.name,
    status: 'unavailable',
    detail: null,
    quota: NO_QUOTA_SOURCE(adapter.name),
    checkedAt: null,
  };
}

/** Apply a fresh report to every adapter. */
export function applyReport(report: AIDetectionReport, checkedAt: number): AIToolState[] {
  return AI_ADAPTERS.map((adapter) => ({ id: adapter.id, name: adapter.name, ...adapter.read(report), checkedAt }));
}

/** Detection failed: keep the last known state but mark it unavailable. */
export function markUnavailable(previous: AIToolState[], reason: string): AIToolState[] {
  return previous.map((tool) => ({ ...tool, status: 'unavailable', detail: reason }));
}

export const AI_STATUS_LABELS: Record<AIStatus, string> = {
  running: 'Running',
  installed: 'Not running',
  'not-found': 'Not found',
  unavailable: 'Unavailable',
};
