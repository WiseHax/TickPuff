import { describe, expect, it } from 'vitest';
import * as timer from '$lib/features/focus/timer';
import type { FocusConfig } from '$lib/types';

const MIN = 60_000;
const config: FocusConfig = {
  ...timer.DEFAULT_FOCUS_CONFIG,
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
};
const T0 = 1_700_000_000_000;

describe('focus timer', () => {
  it('counts down from timestamps, not ticks', () => {
    const running = timer.start(timer.createSession(config), T0);
    expect(timer.remainingMs(running, T0)).toBe(25 * MIN);
    // A throttled / minimized window that only wakes up 10 minutes later sees the exact time.
    expect(timer.remainingMs(running, T0 + 10 * MIN)).toBe(15 * MIN);
  });

  it('pauses and resumes without losing or gaining time', () => {
    let s = timer.start(timer.createSession(config), T0);
    s = timer.pause(s, T0 + 5 * MIN);
    expect(s.status).toBe('paused');
    // Time spent paused doesn't count.
    expect(timer.remainingMs(s, T0 + 60 * MIN)).toBe(20 * MIN);
    s = timer.start(s, T0 + 60 * MIN);
    expect(timer.remainingMs(s, T0 + 70 * MIN)).toBe(10 * MIN);
  });

  it('completes a focus phase and moves to a short break', () => {
    const s = timer.start(timer.createSession(config), T0);
    const { session, completions } = timer.advance(s, config, T0 + 25 * MIN + 1);
    expect(completions).toEqual([{ phase: 'focus', minutes: 25, completedAt: T0 + 25 * MIN }]);
    expect(session.phase).toBe('short-break');
    expect(session.status).toBe('idle');
    expect(session.cycleCount).toBe(1);
  });

  it('does nothing before the phase ends', () => {
    const s = timer.start(timer.createSession(config), T0);
    const result = timer.advance(s, config, T0 + 24 * MIN);
    expect(result.completions).toHaveLength(0);
    expect(result.session).toBe(s);
  });

  it('takes a long break after every N focus sessions, then restarts the cycle', () => {
    let s = timer.createSession(config);
    const phases: string[] = [];
    let now = T0;
    for (let i = 0; i < 8; i++) {
      s = timer.start(s, now);
      now += s.durationMs;
      const result = timer.advance(s, config, now);
      phases.push(result.session.phase);
      s = result.session;
    }
    expect(phases).toEqual([
      'short-break',
      'focus',
      'short-break',
      'focus',
      'short-break',
      'focus',
      'long-break',
      'focus',
    ]);
    expect(s.cycleCount).toBe(0);
  });

  it('auto-starts following phases exactly when the previous one ended', () => {
    const auto = { ...config, autoStartNext: true };
    const s = timer.start(timer.createSession(auto), T0);
    // Away for focus (25) + short break (5) + 3 minutes.
    const { session, completions } = timer.advance(s, auto, T0 + 33 * MIN);
    expect(completions.map((c) => c.phase)).toEqual(['focus', 'short-break']);
    expect(session.phase).toBe('focus');
    expect(session.status).toBe('running');
    expect(timer.remainingMs(session, T0 + 33 * MIN)).toBe(22 * MIN);
  });

  it('stops catching up after a very long absence instead of looping forever', () => {
    const auto = { ...config, autoStartNext: true };
    const s = timer.start(timer.createSession(auto), T0);
    const { session, completions } = timer.advance(s, auto, T0 + 30 * 24 * 60 * MIN);
    expect(completions.length).toBeLessThanOrEqual(25);
    expect(session.status).toBe('idle');
  });

  it('only allows custom durations while idle, clamped to the supported range', () => {
    const idle = timer.createSession(config);
    expect(timer.setDurationMinutes(idle, 50).durationMs).toBe(50 * MIN);
    expect(timer.setDurationMinutes(idle, 0).durationMs).toBe(timer.MIN_PHASE_MINUTES * MIN);
    expect(timer.setDurationMinutes(idle, 999).durationMs).toBe(timer.MAX_PHASE_MINUTES * MIN);
    const running = timer.start(idle, T0);
    expect(timer.setDurationMinutes(running, 50)).toBe(running);
  });

  it('skips without crediting and resets to the start of the phase', () => {
    const running = timer.start(timer.createSession(config), T0);
    const skipped = timer.skip(running, config);
    expect(skipped.phase).toBe('short-break');
    expect(skipped.status).toBe('idle');
    const reset = timer.reset(timer.pause(running, T0 + MIN), config);
    expect(reset.status).toBe('idle');
    expect(reset.elapsedMs).toBe(0);
    expect(reset.phase).toBe('focus');
  });

  it('formats remaining time', () => {
    expect(timer.formatClock(25 * MIN)).toBe('25:00');
    expect(timer.formatClock(61_001)).toBe('01:02');
    expect(timer.formatClock(90 * MIN)).toBe('1:30:00');
  });
});
