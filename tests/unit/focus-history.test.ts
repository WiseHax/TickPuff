import { describe, expect, it } from 'vitest';
import { addDays, computeStreak, emptyHistory, recordCompletion } from '$lib/features/focus/history';
import { migrateLegacyProgress, sanitizeHistory, sanitizeSession } from '$lib/stores/focus';
import type { FocusHistory } from '$lib/types';

const day = (key: string, sessions = 1) => ({ [key]: { sessions, minutes: sessions * 25 } });
const history = (days: FocusHistory['days'], carryOver: FocusHistory['carryOver'] = null): FocusHistory => ({
  days,
  carryOver,
});

describe('focus history', () => {
  it('records only focus completions, on the local day they finished', () => {
    const at = new Date(2026, 9, 7, 23, 50).getTime();
    let h = recordCompletion(emptyHistory(), { phase: 'focus', minutes: 25, completedAt: at });
    h = recordCompletion(h, { phase: 'short-break', minutes: 0, completedAt: at });
    expect(h.days).toEqual({ '2026-10-07': { sessions: 1, minutes: 25 } });
  });

  it('counts consecutive days ending today', () => {
    const h = history({ ...day('2026-10-05'), ...day('2026-10-06'), ...day('2026-10-07') });
    expect(computeStreak(h, '2026-10-07')).toBe(3);
  });

  it("keeps yesterday's streak alive until a full day is missed", () => {
    const h = history({ ...day('2026-10-05'), ...day('2026-10-06') });
    expect(computeStreak(h, '2026-10-07')).toBe(2);
    expect(computeStreak(h, '2026-10-08')).toBe(0);
  });

  it('is broken by a gap', () => {
    const h = history({ ...day('2026-10-03'), ...day('2026-10-05'), ...day('2026-10-06') });
    expect(computeStreak(h, '2026-10-06')).toBe(2);
  });

  it('continues a streak carried over from pre-0.1 data', () => {
    const carry = { count: 5, lastDate: '2026-10-04' };
    expect(computeStreak(history({ ...day('2026-10-05') }, carry), '2026-10-05')).toBe(6);
    expect(computeStreak(history({}, carry), '2026-10-05')).toBe(5);
    expect(computeStreak(history({}, carry), '2026-10-06')).toBe(0);
    // A gap breaks the carried streak too.
    expect(computeStreak(history({ ...day('2026-10-07') }, carry), '2026-10-07')).toBe(1);
  });

  it('handles month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    const h = history({ ...day('2026-12-31'), ...day('2027-01-01') });
    expect(computeStreak(h, '2027-01-01')).toBe(2);
  });
});

describe('focus persistence', () => {
  it('migrates the legacy progress counter without inventing history', () => {
    const migrated = migrateLegacyProgress({
      completedPomodoros: 3,
      totalFocusMinutes: 75,
      streakDays: 4,
      lastActiveDate: new Date(2026, 9, 7).toDateString(),
    });
    expect(migrated).toEqual({
      days: { '2026-10-07': { sessions: 3, minutes: 75 } },
      carryOver: { count: 4, lastDate: '2026-10-07' },
    });
  });

  it('drops malformed history entries', () => {
    const clean = sanitizeHistory({
      days: { '2026-10-07': { sessions: 2, minutes: 50 }, nonsense: 1, '2026-10-08': 'x' },
      carryOver: 'bad',
    });
    expect(clean).toEqual({ days: { '2026-10-07': { sessions: 2, minutes: 50 } }, carryOver: null });
  });

  it('rejects a running session without a start time', () => {
    expect(sanitizeSession({ phase: 'focus', status: 'running', startedAt: null, durationMs: 1_500_000 })).toBeNull();
    expect(sanitizeSession({ phase: 'focus', status: 'paused', elapsedMs: 1000, durationMs: 1_500_000 })?.status).toBe(
      'paused',
    );
  });
});
