import { writable } from 'svelte/store';

export type PerformanceLevel = 'ECO' | 'BALANCED' | 'BEAUTIFUL';

function createPerformanceStore() {
  const isBrowser = typeof window !== 'undefined';
  const saved = isBrowser ? localStorage.getItem('tickpuff-perf') : null;
  const initial: PerformanceLevel = (saved as PerformanceLevel) || 'BALANCED';

  const { subscribe, set, update } = writable<PerformanceLevel>(initial);

  return {
    subscribe,
    setLevel: (level: PerformanceLevel) => {
      if (isBrowser) localStorage.setItem('tickpuff-perf', level);
      set(level);
    }
  };
}

export const performanceStore = createPerformanceStore();
