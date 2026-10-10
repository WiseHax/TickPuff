import { derived, readable, writable } from 'svelte/store';
import { sunTimes, timeOfDayByHour, timeOfDayFromSun } from './sun';
import { TIMES_OF_DAY, type TimeOfDay } from '$lib/types';

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

/** Where the user is, for following the real sun (null = use clock hours). */
export interface Observer {
  latitude: number;
  longitude: number;
}

const observer = writable<Observer | null>(null);

/** The user's location for sun and season calculations, if they set one. */
export const observerLocation = { subscribe: observer.subscribe };

/** Set by the weather integration when the user picks (or clears) a location. */
export function setObserver(location: Observer | null): void {
  observer.set(location ? { latitude: location.latitude, longitude: location.longitude } : null);
}

let cache: { key: string; sun: ReturnType<typeof sunTimes> } | null = null;

/** Time of day from the real sun when a location is known, otherwise from clock hours. */
export function timeOfDayFor(date: Date, at: Observer | null = null): TimeOfDay {
  if (!at) return timeOfDayByHour(date);
  const key = `${localDateKey(date)}@${at.latitude.toFixed(2)},${at.longitude.toFixed(2)}`;
  if (cache?.key !== key) cache = { key, sun: sunTimes(date, at.latitude, at.longitude) };
  return timeOfDayFromSun(date, cache.sun);
}

/** Dev builds only: preview a time of day with `?time=night` (any TimeOfDay). */
function devTimeOverride(): TimeOfDay | null {
  if (!import.meta.env.DEV || typeof location === 'undefined') return null;
  const value = new URLSearchParams(location.search).get('time');
  return (TIMES_OF_DAY as readonly string[]).includes(value ?? '') ? (value as TimeOfDay) : null;
}

const override = devTimeOverride();

export const timeOfDay = derived(
  [now, observer],
  ([$now, $observer], set) => set(override ?? timeOfDayFor($now, $observer)),
  override ?? timeOfDayFor(new Date()),
);

/** Local calendar date as YYYY-MM-DD (not UTC). */
export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Today's local date key, changing at midnight. */
export const today = derived(now, ($now, set) => set(localDateKey($now)), localDateKey(new Date()));
