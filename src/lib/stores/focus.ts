/**
 * Focus timer state. Owns one ticker that only runs while a phase is running.
 * Remaining time is always derived from timestamps (see features/focus/timer).
 */
import { derived, get, writable } from 'svelte/store';
import { asBoolean, asNumber, asOneOf, isRecord, persisted, type PersistSpec } from '$lib/core/persistence';
import { emit } from '$lib/core/events/bus';
import { playChime } from '$lib/core/platform/sound';
import { localDateKey, today } from '$lib/core/time/clock';
import * as timer from '$lib/features/focus/timer';
import { computeStreak, dayStats, emptyHistory, recordCompletion } from '$lib/features/focus/history';
import type { FocusConfig, FocusHistory, FocusPhase, FocusSession } from '$lib/types';

const PHASES: readonly FocusPhase[] = ['focus', 'short-break', 'long-break'];

// ── Persistence specs ────────────────────────────────────────

export const focusConfigSpec: PersistSpec<FocusConfig> = {
  key: 'tickpuff-focus-config',
  version: 1,
  defaults: () => ({ ...timer.DEFAULT_FOCUS_CONFIG }),
  sanitize: (raw) => {
    if (!isRecord(raw)) return null;
    const d = timer.DEFAULT_FOCUS_CONFIG;
    const minutes = (v: unknown, fallback: number) =>
      Math.round(asNumber(v, fallback, timer.MIN_PHASE_MINUTES, timer.MAX_PHASE_MINUTES));
    return {
      focusMinutes: minutes(raw.focusMinutes, d.focusMinutes),
      shortBreakMinutes: minutes(raw.shortBreakMinutes, d.shortBreakMinutes),
      longBreakMinutes: minutes(raw.longBreakMinutes, d.longBreakMinutes),
      longBreakEvery: Math.round(asNumber(raw.longBreakEvery, d.longBreakEvery, 1, 12)),
      autoStartNext: asBoolean(raw.autoStartNext, d.autoStartNext),
      sound: asBoolean(raw.sound, d.sound),
    };
  },
};

export function sanitizeSession(raw: unknown): FocusSession | null {
  if (!isRecord(raw)) return null;
  const status = asOneOf(raw.status, ['idle', 'running', 'paused'] as const, 'idle');
  const startedAt = typeof raw.startedAt === 'number' && Number.isFinite(raw.startedAt) ? raw.startedAt : null;
  if (status === 'running' && startedAt === null) return null;
  return {
    phase: asOneOf(raw.phase, PHASES, 'focus'),
    status,
    durationMs: asNumber(raw.durationMs, 25 * 60_000, 60_000, timer.MAX_PHASE_MINUTES * 60_000),
    startedAt: status === 'running' ? startedAt : null,
    elapsedMs: asNumber(raw.elapsedMs, 0, 0),
    cycleCount: Math.round(asNumber(raw.cycleCount, 0, 0, 1000)),
  };
}

export const focusSessionSpec: PersistSpec<FocusSession> = {
  key: 'tickpuff-focus-session',
  version: 1,
  defaults: () => timer.createSession(timer.DEFAULT_FOCUS_CONFIG),
  sanitize: sanitizeSession,
};

export function sanitizeHistory(raw: unknown): FocusHistory | null {
  if (!isRecord(raw) || !isRecord(raw.days)) return null;
  const days: FocusHistory['days'] = {};
  for (const [key, value] of Object.entries(raw.days)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !isRecord(value)) continue;
    days[key] = {
      sessions: Math.round(asNumber(value.sessions, 0, 0)),
      minutes: Math.round(asNumber(value.minutes, 0, 0)),
    };
  }
  const carry = raw.carryOver;
  const carryOver =
    isRecord(carry) && typeof carry.lastDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(carry.lastDate)
      ? { count: Math.round(asNumber(carry.count, 0, 0)), lastDate: carry.lastDate }
      : null;
  return { days, carryOver };
}

/** Pre-0.1 `tickpuff-progress`: daily counters plus a streak counter. */
export function migrateLegacyProgress(raw: unknown): FocusHistory | null {
  if (!isRecord(raw)) return null;
  const date = new Date(String(raw.lastActiveDate));
  if (Number.isNaN(date.getTime())) return emptyHistory();
  const key = localDateKey(date);
  const sessions = Math.round(asNumber(raw.completedPomodoros, 0, 0));
  const minutes = Math.round(asNumber(raw.totalFocusMinutes, 0, 0));
  const streak = Math.round(asNumber(raw.streakDays, 0, 0));
  return {
    days: sessions > 0 ? { [key]: { sessions, minutes } } : {},
    carryOver: streak > 0 ? { count: streak, lastDate: key } : null,
  };
}

const LEGACY_PROGRESS_KEY = 'tickpuff-progress';

export const focusHistorySpec: PersistSpec<FocusHistory> = {
  key: 'tickpuff-focus-history',
  version: 1,
  defaults: emptyHistory,
  sanitize: sanitizeHistory,
  migrate: (raw, from) => (from === 0 ? migrateLegacyProgress(raw) : raw),
  legacy: {
    read: (backend) => {
      const raw = backend.getItem(LEGACY_PROGRESS_KEY);
      return raw === null ? undefined : JSON.parse(raw);
    },
    keys: () => [LEGACY_PROGRESS_KEY],
  },
};

// ── Stores ───────────────────────────────────────────────────

export const focusConfig = persisted(focusConfigSpec);
export const focusSession = persisted(focusSessionSpec);
export const focusHistory = persisted(focusHistorySpec);

/** Wall-clock milliseconds, refreshed by the ticker while a phase runs. */
const nowMs = writable(Date.now());

/** Completions older than this when detected (e.g. at startup) don't chime. */
const CHIME_WINDOW_MS = 15_000;

function advanceNow() {
  const now = Date.now();
  nowMs.set(now);
  const { session, completions } = timer.advance(get(focusSession), get(focusConfig), now);
  if (completions.length === 0) return;
  focusSession.set(session);
  for (const completion of completions) {
    focusHistory.update((history) => recordCompletion(history, completion));
    emit('focus:completed', completion);
  }
  const last = completions[completions.length - 1];
  if (get(focusConfig).sound && now - last.completedAt < CHIME_WINDOW_MS) playChime();
}

// The ticker: alive only while a phase is running.
let tickTimer: ReturnType<typeof setInterval> | null = null;

function syncTicker(session: FocusSession) {
  const shouldRun = session.status === 'running';
  if (shouldRun && tickTimer === null) tickTimer = setInterval(advanceNow, 250);
  if (!shouldRun && tickTimer !== null) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
}

if (typeof window !== 'undefined') {
  advanceNow(); // resolve phases that ended while the app was closed
  focusSession.subscribe(syncTicker);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') advanceNow();
  });
}

// Keep an untouched idle phase in sync with edited durations.
focusConfig.subscribe((config) => {
  const session = get(focusSession);
  if (session.status === 'idle' && session.elapsedMs === 0) {
    const fresh = timer.createSession(config, session.phase, session.cycleCount);
    if (fresh.durationMs !== session.durationMs) focusSession.set(fresh);
  }
});

export const focus = {
  toggle() {
    const session = get(focusSession);
    const now = Date.now();
    focusSession.set(session.status === 'running' ? timer.pause(session, now) : timer.start(session, now));
    nowMs.set(now);
  },
  reset: () => focusSession.set(timer.reset(get(focusSession), get(focusConfig))),
  skip: () => focusSession.set(timer.skip(get(focusSession), get(focusConfig))),
  resetCycle: () => focusSession.set(timer.resetCycle(get(focusConfig))),
  setDurationMinutes: (minutes: number) => focusSession.set(timer.setDurationMinutes(get(focusSession), minutes)),
  patchConfig: (patch: Partial<FocusConfig>) =>
    focusConfig.update((config) => focusConfigSpec.sanitize({ ...config, ...patch }) ?? config),
};

export const focusView = derived([focusSession, nowMs], ([$session, $now]) => ({
  phase: $session.phase,
  status: $session.status,
  remainingMs: timer.remainingMs($session, $now),
  progress: timer.progress($session, $now),
  durationMinutes: Math.round($session.durationMs / 60_000),
  cycleCount: $session.cycleCount,
}));

/** True while a focus (not break) phase is running. */
export const focusActive = derived(focusSession, ($s) => $s.phase === 'focus' && $s.status === 'running');

export const todayFocus = derived([focusHistory, today], ([$history, $today]) => dayStats($history, $today));

export const focusStreak = derived([focusHistory, today], ([$history, $today]) => computeStreak($history, $today));
