import { derived } from 'svelte/store';
import { time } from '$lib/stores/time';
import type { TimeOfDay } from './types';

export const timeOfDay = derived<typeof time, TimeOfDay>(time, ($time) => {
  const hour = $time.getHours();
  
  if (hour >= 5 && hour < 9) return 'morning';
  if (hour >= 9 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'sunset';
  if (hour >= 20 && hour < 23) return 'night';
  return 'late-night';
});
