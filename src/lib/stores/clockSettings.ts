import { writable } from 'svelte/store';

export type ClockFont = 'Pixelify Sans' | 'VT323' | 'Inter' | 'Space Mono' | 'Outfit' | 'System';

export interface ClockSettings {
  font: ClockFont;
  size: number;
  weight: number;
  letterSpacing: number;
  showSeconds: boolean;
  use24Hour: boolean;
  color: string;
}

const defaultSettings: ClockSettings = {
  font: 'Pixelify Sans',
  size: 8, // rem
  weight: 500,
  letterSpacing: -2,
  showSeconds: false,
  use24Hour: false,
  color: '#ffffff'
};

function createClockSettingsStore() {
  const isBrowser = typeof window !== 'undefined';
  let initialSettings = { ...defaultSettings };

  if (isBrowser) {
    const saved = localStorage.getItem('tickpuff-clock-settings');
    if (saved) {
      try {
        initialSettings = { ...defaultSettings, ...JSON.parse(saved) };
      } catch (e) {
        console.error("Failed to parse clock settings", e);
      }
    }
  }

  const { subscribe, set, update } = writable<ClockSettings>(initialSettings);

  return {
    subscribe,
    updateSettings: (newSettings: Partial<ClockSettings>) => {
      update(settings => {
        const updated = { ...settings, ...newSettings };
        if (isBrowser) {
          localStorage.setItem('tickpuff-clock-settings', JSON.stringify(updated));
        }
        return updated;
      });
    },
    reset: () => {
      if (isBrowser) localStorage.setItem('tickpuff-clock-settings', JSON.stringify(defaultSettings));
      set(defaultSettings);
    }
  };
}

export const clockSettings = createClockSettingsStore();
