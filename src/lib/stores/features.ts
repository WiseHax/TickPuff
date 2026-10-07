import { writable } from 'svelte/store';

export interface Features {
  clock: boolean;
  date: boolean;
  focus: boolean;
  tasks: boolean;
  notes: boolean;
  aiUsage: boolean;
  systemMonitor: boolean;
  weather: boolean;
  calendar: boolean;
  nowPlaying: boolean;
  countdown: boolean;
}

const defaultFeatures: Features = {
  clock: true,
  date: true,
  focus: true,
  tasks: false,
  notes: false,
  aiUsage: true,
  systemMonitor: false,
  weather: false,
  calendar: false,
  nowPlaying: false,
  countdown: false,
};

function createFeatureStore() {
  const isBrowser = typeof window !== 'undefined';
  const saved = isBrowser ? localStorage.getItem('tickpuff-features') : null;
  let savedFeatures = {};
  if (saved) {
    try {
      savedFeatures = JSON.parse(saved);
    } catch(e) {
      console.error("Failed to parse features", e);
    }
  }
  const initial = { ...defaultFeatures, ...savedFeatures };

  const { subscribe, set, update } = writable<Features>(initial);

  return {
    subscribe,
    toggle: (feature: keyof Features) => {
      update(f => {
        const nf = { ...f, [feature]: !f[feature] };
        if (isBrowser) localStorage.setItem('tickpuff-features', JSON.stringify(nf));
        return nf;
      });
    },
    setFeatures: (features: Partial<Features>) => {
      update(f => {
        const nf = { ...f, ...features };
        if (isBrowser) localStorage.setItem('tickpuff-features', JSON.stringify(nf));
        return nf;
      });
    }
  };
}

export const featuresStore = createFeatureStore();
