import { writable, get } from 'svelte/store';

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────
export type AIProviderStatus = 'NOT INSTALLED' | 'NOT DETECTED' | 'RUNNING' | 'ACTIVE' | 'IDLE' | 'UNKNOWN';
export type DataFreshness = 'FRESH' | 'STALE' | 'UNAVAILABLE';

export interface QuotaInfo {
  label: string;           // e.g. "Five-Hour" or "Weekly"
  remainingPercent: number | null;
  refreshStr: string | null;  // "3h 12m" or "4d 8h"
  resetsAt: string | null;    // "6:42 PM"
}

export interface AIProvider {
  id: string;
  name: string;
  status: AIProviderStatus;
  quotas: QuotaInfo[];
  dataFreshness: DataFreshness;
  lastUpdated: string | null;       // "12:43 PM"
  plan: string | null;              // "Google AI Pro" or null
  errorMessage: string | null;
}

// ─────────────────────────────────────────────────
// Default Provider State
// ─────────────────────────────────────────────────
function createDefaultProvider(id: string, name: string): AIProvider {
  return {
    id,
    name,
    status: 'NOT DETECTED',
    quotas: [],
    dataFreshness: 'UNAVAILABLE',
    lastUpdated: null,
    plan: null,
    errorMessage: null,
  };
}

// ─────────────────────────────────────────────────
// AI Store
// ─────────────────────────────────────────────────
const initialProviders: AIProvider[] = [
  createDefaultProvider('antigravity', 'Antigravity IDE'),
  createDefaultProvider('claude_code', 'Claude Code'),
];

export const aiStore = writable<AIProvider[]>(initialProviders);

// ─────────────────────────────────────────────────
// Detection Adapters
// ─────────────────────────────────────────────────

/** Detect running processes via Tauri command */
async function detectProcess(processName: string): Promise<boolean> {
  try {
    // Use Tauri's shell API to detect processes
    const { invoke } = await import('@tauri-apps/api/core');
    const result: boolean = await invoke('check_process', { name: processName });
    return result;
  } catch {
    // Fallback: we cannot detect, return unknown
    return false;
  }
}

/** Format a duration in ms to "Xh Xm" or "Xm Xs" */
function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds}s`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// ─────────────────────────────────────────────────
// Antigravity Adapter
// ─────────────────────────────────────────────────
class AntigravityAdapter {
  private sessionStart: number | null = null;

  async detect(): Promise<Partial<AIProvider>> {
    // Attempt to detect the Antigravity IDE process
    const isRunning = await detectProcess('antigravity');
    
    if (!isRunning) {
      return {
        status: 'NOT DETECTED',
        quotas: [],
        dataFreshness: 'UNAVAILABLE',
        lastUpdated: null,
        plan: null,
        errorMessage: null,
      };
    }

    // Attempt to read quota from the Antigravity CLI
    const quotaResult = await this.fetchQuota();

    const finalStatus = quotaResult.freshness === 'FRESH' ? 'ACTIVE' : 'RUNNING';

    return {
      status: finalStatus,
      quotas: quotaResult.quotas,
      dataFreshness: quotaResult.freshness,
      lastUpdated: quotaResult.freshness !== 'UNAVAILABLE' ? formatTime(new Date()) : null,
      plan: quotaResult.plan,
      errorMessage: quotaResult.error,
    };
  }

  private async fetchQuota(): Promise<{
    quotas: QuotaInfo[];
    freshness: DataFreshness;
    plan: string | null;
    error: string | null;
  }> {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const raw: string = await invoke('run_antigravity_quota');
      
      // Parse the CLI output
      return this.parseQuotaOutput(raw);
    } catch {
      return {
        quotas: [],
        freshness: 'UNAVAILABLE',
        plan: null,
        error: 'Quota source unavailable',
      };
    }
  }

  private parseQuotaOutput(raw: string): {
    quotas: QuotaInfo[];
    freshness: DataFreshness;
    plan: string | null;
    error: string | null;
  } {
    // Attempt to parse structured quota output
    // This handles common formats from Antigravity CLI
    const quotas: QuotaInfo[] = [];
    let plan: string | null = null;

    try {
      // Try JSON first
      const data = JSON.parse(raw);
      if (data.plan) plan = data.plan;
      if (data.fiveHour) {
        quotas.push({
          label: 'Five-Hour',
          remainingPercent: data.fiveHour.remainingPercent ?? null,
          refreshStr: data.fiveHour.refreshIn ?? null,
          resetsAt: data.fiveHour.resetsAt ?? null,
        });
      }
      if (data.weekly) {
        quotas.push({
          label: 'Weekly',
          remainingPercent: data.weekly.remainingPercent ?? null,
          refreshStr: data.weekly.refreshIn ?? null,
          resetsAt: data.weekly.resetsAt ?? null,
        });
      }
      return { quotas, freshness: 'FRESH', plan, error: null };
    } catch {
      // Not JSON, try line-by-line parsing
    }

    // Line-by-line fallback parser
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      const percentMatch = line.match(/(\d+)%\s*remaining/i);
      const refreshMatch = line.match(/refresh(?:es)?\s+in\s+(.+)/i);
      
      if (line.toLowerCase().includes('five') || line.toLowerCase().includes('5-hour')) {
        quotas.push({
          label: 'Five-Hour',
          remainingPercent: percentMatch ? parseInt(percentMatch[1]) : null,
          refreshStr: refreshMatch ? refreshMatch[1].trim() : null,
          resetsAt: null,
        });
      }
      if (line.toLowerCase().includes('weekly') || line.toLowerCase().includes('week')) {
        quotas.push({
          label: 'Weekly',
          remainingPercent: percentMatch ? parseInt(percentMatch[1]) : null,
          refreshStr: refreshMatch ? refreshMatch[1].trim() : null,
          resetsAt: null,
        });
      }
      if (line.toLowerCase().includes('plan')) {
        const planMatch = line.match(/plan[:\s]+(.+)/i);
        if (planMatch) plan = planMatch[1].trim();
      }
    }

    if (quotas.length > 0 || plan) {
      return { quotas, freshness: 'FRESH', plan, error: null };
    }

    return { quotas: [], freshness: 'UNAVAILABLE', plan: null, error: 'Could not parse quota data' };
  }
}

// ─────────────────────────────────────────────────
// Claude Code Adapter
// ─────────────────────────────────────────────────
class ClaudeCodeAdapter {
  async detect(): Promise<Partial<AIProvider>> {
    const isRunning = await detectProcess('claude');

    if (!isRunning) {
      return {
        status: 'NOT DETECTED',
        quotas: [],
        dataFreshness: 'UNAVAILABLE',
        lastUpdated: null,
        plan: null,
        errorMessage: null,
      };
    }

    return {
      status: 'RUNNING',
      quotas: [],
      dataFreshness: 'UNAVAILABLE',
      lastUpdated: null,
      plan: null,
      errorMessage: 'Usage data unavailable',
    };
  }
}

// ─────────────────────────────────────────────────
// AI Manager — Polling Loop
// ─────────────────────────────────────────────────
const antigravityAdapter = new AntigravityAdapter();
const claudeAdapter = new ClaudeCodeAdapter();

let aiPollInterval: ReturnType<typeof setInterval> | null = null;
let isPolling = false;

async function pollProviders() {
  if (!isPolling) return;
  const [antigravityUpdate, claudeUpdate] = await Promise.all([
    antigravityAdapter.detect(),
    claudeAdapter.detect(),
  ]);

  aiStore.update(providers => {
    return providers.map(p => {
      if (p.id === 'antigravity') return { ...p, ...antigravityUpdate };
      if (p.id === 'claude_code') return { ...p, ...claudeUpdate };
      return p;
    });
  });
}

function startPolling(intervalMs: number) {
  if (aiPollInterval) clearInterval(aiPollInterval);
  isPolling = true;
  aiPollInterval = setInterval(pollProviders, intervalMs);
}

// Start polling on browser side with Visibility API
if (typeof window !== 'undefined') {
  pollProviders(); // Initial
  startPolling(30_000); // Active polling

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Reduce polling significantly when window is hidden
      startPolling(300_000); // 5 minutes
    } else {
      // Resume normal polling
      pollProviders(); // Immediate update on focus
      startPolling(30_000); // 30 seconds
    }
  });
}
