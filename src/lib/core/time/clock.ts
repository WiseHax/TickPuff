import { derived, readable } from 'svelte/store';
import type { TimeOfDay } from '$lib/types';

/**
 * Current time, updated on each wall-clock second boundary.
 * Scheduling against `Date.now()` (instead of a fixed 1 s interval) keeps the
 * display from drifting and corrects itself after sleep/minimize.
 */
export const now = readable(new Date(), (set) => {
  let timer: ReturnType<typeof setTimeout>;
  const tick = () => {
    const date = new Date();
    set(date);
    timer = setTimeout(tick, 1000 - date.getMilliseconds() + 5);
  };
  tick();
  const onVisible = () => {
    if (document.visibilityState === 'visible') {
      clearTimeout(timer);
      tick();
    }
  };
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisible);
  return () => {
    clearTimeout(timer);
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible);
  };
});

export function timeOfDayFor(date: Date): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 9) return 'morning';
  if (hour >= 9 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'sunset';
  if (hour >= 20 && hour < 23) return 'night';
  return 'late-night';
}

export const timeOfDay = derived(now, ($now, set) => set(timeOfDayFor($now)), timeOfDayFor(new Date()));

/** Local calendar date as YYYY-MM-DD (not UTC). */
export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Today's local date key, changing at midnight. */
export const today = derived(now, ($now, set) => set(localDateKey($now)), localDateKey(new Date()));
