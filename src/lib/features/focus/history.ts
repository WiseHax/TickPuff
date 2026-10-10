/** Focus history and streak calculation (pure). */
import { localDateKey } from '$lib/core/time/clock';
import type { FocusCompletion, FocusHistory } from '$lib/types';

export const emptyHistory = (): FocusHistory => ({ days: {}, carryOver: null });

const DAY_MS = 86_400_000;
const KEEP_DAYS = 400;

/** Parse YYYY-MM-DD as a local date at noon (avoids DST edge cases). */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(key: string, days: number): string {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

/** Whole days from `a` to `b` (positive when b is later). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseDateKey(b).getTime() - parseDateKey(a).getTime()) / DAY_MS);
}

export function recordCompletion(history: FocusHistory, completion: FocusCompletion): FocusHistory {
  if (completion.phase !== 'focus') return history;
  const key = localDateKey(new Date(completion.completedAt));
  const day = history.days[key] ?? { sessions: 0, minutes: 0 };
  return prune({
    ...history,
    days: { ...history.days, [key]: { sessions: day.sessions + 1, minutes: day.minutes + completion.minutes } },
  });
}

function prune(history: FocusHistory): FocusHistory {
  const keys = Object.keys(history.days).sort();
  if (keys.length <= KEEP_DAYS) return history;
  const days: FocusHistory['days'] = {};
  for (const key of keys.slice(-KEEP_DAYS)) days[key] = history.days[key];
  return { ...history, days };
}

export function dayStats(history: FocusHistory, key: string) {
  return history.days[key] ?? { sessions: 0, minutes: 0 };
}

/** Focus minutes for the last `count` days ending today, oldest first. */
export function recentDays(history: FocusHistory, todayKey: string, count = 7) {
  return Array.from({ length: count }, (_, i) => {
    const key = addDays(todayKey, i - (count - 1));
    return { key, minutes: dayStats(history, key).minutes, weekday: parseDateKey(key).getDay() };
  });
}

/**
 * Consecutive days with at least one completed focus session, ending today
 * (or yesterday — a streak isn't broken until a full day is missed).
 */
export function computeStreak(history: FocusHistory, todayKey: string): number {
  const active = (key: string) => (history.days[key]?.sessions ?? 0) > 0;

  let end = active(todayKey) ? todayKey : addDays(todayKey, -1);
  let run = 0;
  if (active(end)) {
    let cursor = end;
    while (active(cursor)) {
      run += 1;
      cursor = addDays(cursor, -1);
    }
  } else {
    end = todayKey;
  }

  const carry = history.carryOver;
  if (!carry || carry.count <= 0) return run;

  if (run === 0) {
    // Legacy streak still alive if it was last extended today or yesterday.
    const gap = daysBetween(carry.lastDate, todayKey);
    return gap >= 0 && gap <= 1 ? carry.count : 0;
  }
  const runStart = addDays(end, -(run - 1));
  // The legacy streak connects if it ended inside the run or the day before it.
  if (daysBetween(carry.lastDate, runStart) <= 1 && daysBetween(carry.lastDate, end) >= 0) {
    return Math.max(run, daysBetween(carry.lastDate, end) + carry.count);
  }
  return run;
}
