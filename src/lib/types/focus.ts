/** Focus (pomodoro) timer types. All times are epoch milliseconds. */

export type FocusPhase = 'focus' | 'short-break' | 'long-break';

export type FocusStatus = 'idle' | 'running' | 'paused';

export interface FocusConfig {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  /** A long break follows every N completed focus sessions. */
  longBreakEvery: number;
  /** Start the next phase automatically when one completes. */
  autoStartNext: boolean;
  /** Play a short chime when a phase completes. */
  sound: boolean;
}

export interface FocusSession {
  phase: FocusPhase;
  status: FocusStatus;
  /** Length of the current phase. */
  durationMs: number;
  /** When the current running stretch started (null unless running). */
  startedAt: number | null;
  /** Time accumulated in earlier running stretches of this phase. */
  elapsedMs: number;
  /** Focus sessions completed in the current cycle (resets after a long break). */
  cycleCount: number;
}

export interface FocusCompletion {
  phase: FocusPhase;
  /** Minutes credited (focus phases only). */
  minutes: number;
  completedAt: number;
}

/** Focus history, keyed by local date (YYYY-MM-DD). */
export interface FocusHistory {
  days: Record<string, { sessions: number; minutes: number }>;
  /** Streak carried over from pre-0.1 data, which only stored a counter. */
  carryOver: { count: number; lastDate: string } | null;
}
