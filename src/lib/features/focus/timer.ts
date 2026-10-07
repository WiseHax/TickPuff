/**
 * Pure focus-timer state machine.
 *
 * Time is never counted by ticks. A running phase stores when it started;
 * remaining time is always derived from the wall clock, so a hidden,
 * throttled or minimized window cannot make the timer drift, and a session
 * keeps running across app restarts.
 */
import type { FocusCompletion, FocusConfig, FocusPhase, FocusSession } from '$lib/types';

export const DEFAULT_FOCUS_CONFIG: FocusConfig = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
  autoStartNext: false,
  sound: true,
};

export const MIN_PHASE_MINUTES = 1;
export const MAX_PHASE_MINUTES = 180;

const MINUTE = 60_000;
/** Safety cap when catching up on many auto-started phases after a long absence. */
const MAX_CATCH_UP_PHASES = 24;

export function phaseDurationMs(config: FocusConfig, phase: FocusPhase): number {
  const minutes =
    phase === 'focus'
      ? config.focusMinutes
      : phase === 'short-break'
        ? config.shortBreakMinutes
        : config.longBreakMinutes;
  return clampMinutes(minutes) * MINUTE;
}

const clampMinutes = (minutes: number) => Math.min(MAX_PHASE_MINUTES, Math.max(MIN_PHASE_MINUTES, Math.round(minutes)));

export function createSession(config: FocusConfig, phase: FocusPhase = 'focus', cycleCount = 0): FocusSession {
  return {
    phase,
    status: 'idle',
    durationMs: phaseDurationMs(config, phase),
    startedAt: null,
    elapsedMs: 0,
    cycleCount,
  };
}

export function elapsedMs(session: FocusSession, now: number): number {
  const running = session.status === 'running' && session.startedAt !== null ? now - session.startedAt : 0;
  return Math.max(0, session.elapsedMs + Math.max(0, running));
}

export function remainingMs(session: FocusSession, now: number): number {
  return Math.max(0, session.durationMs - elapsedMs(session, now));
}

/** Fraction of the phase completed, 0–1. */
export function progress(session: FocusSession, now: number): number {
  return session.durationMs > 0 ? Math.min(1, elapsedMs(session, now) / session.durationMs) : 0;
}

/** Start from idle, or resume from paused. */
export function start(session: FocusSession, now: number): FocusSession {
  if (session.status === 'running') return session;
  return { ...session, status: 'running', startedAt: now };
}

export function pause(session: FocusSession, now: number): FocusSession {
  if (session.status !== 'running') return session;
  return { ...session, status: 'paused', elapsedMs: elapsedMs(session, now), startedAt: null };
}

/** Back to the start of the current phase. */
export function reset(session: FocusSession, config: FocusConfig): FocusSession {
  return createSession(config, session.phase, session.cycleCount);
}

/** Return to a fresh focus phase and forget the current cycle. */
export function resetCycle(config: FocusConfig): FocusSession {
  return createSession(config, 'focus', 0);
}

/** Change the length of an idle phase (custom duration). */
export function setDurationMinutes(session: FocusSession, minutes: number): FocusSession {
  if (session.status !== 'idle') return session;
  return { ...session, durationMs: clampMinutes(minutes) * MINUTE };
}

/** Which phase follows the current one. */
export function nextPhase(session: FocusSession, config: FocusConfig): { phase: FocusPhase; cycleCount: number } {
  if (session.phase === 'focus') {
    const cycleCount = session.cycleCount + 1;
    const every = Math.max(1, Math.round(config.longBreakEvery));
    return { phase: cycleCount % every === 0 ? 'long-break' : 'short-break', cycleCount };
  }
  if (session.phase === 'long-break') return { phase: 'focus', cycleCount: 0 };
  return { phase: 'focus', cycleCount: session.cycleCount };
}

/** Skip the current phase without crediting it. */
export function skip(session: FocusSession, config: FocusConfig): FocusSession {
  const next = nextPhase(session, config);
  return createSession(config, next.phase, next.cycleCount);
}

/**
 * Resolve any phases that finished by `now`.
 * With `autoStartNext`, following phases start exactly when the previous one
 * ended, so several phases can complete if the app was away for a while.
 */
export function advance(
  session: FocusSession,
  config: FocusConfig,
  now: number,
): { session: FocusSession; completions: FocusCompletion[] } {
  const completions: FocusCompletion[] = [];
  let current = session;

  for (let i = 0; i < MAX_CATCH_UP_PHASES; i++) {
    if (current.status !== 'running' || current.startedAt === null) break;
    if (remainingMs(current, now) > 0) break;

    const completedAt = current.startedAt + (current.durationMs - current.elapsedMs);
    completions.push({
      phase: current.phase,
      minutes: current.phase === 'focus' ? Math.round(current.durationMs / MINUTE) : 0,
      completedAt,
    });

    const next = nextPhase(current, config);
    const fresh = createSession(config, next.phase, next.cycleCount);
    current = config.autoStartNext ? { ...fresh, status: 'running', startedAt: completedAt } : fresh;
  }

  // Too far behind (e.g. auto-start left on for days): stop instead of looping on.
  if (current.status === 'running' && remainingMs(current, now) === 0) {
    const next = nextPhase(current, config);
    current = createSession(config, next.phase, next.cycleCount);
  }

  return { session: current, completions };
}

export function formatClock(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

export const PHASE_LABELS: Record<FocusPhase, string> = {
  focus: 'Focus',
  'short-break': 'Short break',
  'long-break': 'Long break',
};
