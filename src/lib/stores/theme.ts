import { writable, derived } from 'svelte/store';
import { themeRegistry } from '../engine/themeRegistry';
import { timeOfDay } from '../engine/time';
import type { WeatherType, ThemeColors, ThemeConfig } from '../engine/types';

interface PerThemeState {
  weather: WeatherType;
  petId: string;
}

interface EngineState {
  themeId: string;
  weather: WeatherType;
  petId: string;
}

const isBrowser = typeof window !== 'undefined';

/** Load per-theme settings from localStorage */
function loadPerThemeState(themeId: string): PerThemeState | null {
  if (!isBrowser) return null;
  const raw = localStorage.getItem(`tickpuff-theme-state-${themeId}`);
  if (raw) {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return null;
}

/** Save per-theme settings to localStorage */
function savePerThemeState(themeId: string, state: PerThemeState) {
  if (!isBrowser) return;
  localStorage.setItem(`tickpuff-theme-state-${themeId}`, JSON.stringify(state));
}

function createEngineStore() {
  let initialTheme = 'forest';

  if (isBrowser) {
    initialTheme = localStorage.getItem('tickpuff-theme') || 'forest';
  }

  const config = themeRegistry[initialTheme] || themeRegistry['forest'];
  const saved = loadPerThemeState(initialTheme);

  const initial: EngineState = {
    themeId: initialTheme,
    weather: saved?.weather || config.defaultWeather,
    petId: saved?.petId || config.defaultPet,
  };

  const { subscribe, set, update } = writable<EngineState>(initial);

  return {
    subscribe,
    setTheme: (id: string) => {
      const config = themeRegistry[id];
      if (!config) return;

      // Save current theme state before switching
      update(currentState => {
        savePerThemeState(currentState.themeId, {
          weather: currentState.weather,
          petId: currentState.petId,
        });

        // Load the target theme's saved state, or use defaults
        const restored = loadPerThemeState(id);
        const newState: EngineState = {
          themeId: id,
          weather: restored?.weather || config.defaultWeather,
          petId: restored?.petId || config.defaultPet,
        };
        if (isBrowser) localStorage.setItem('tickpuff-theme', id);
        return newState;
      });
    },
    setWeather: (weather: WeatherType) => {
      update(state => {
        const newState = { ...state, weather };
        savePerThemeState(state.themeId, { weather: newState.weather, petId: newState.petId });
        return newState;
      });
    },
    setPet: (petId: string) => {
      update(state => {
        const newState = { ...state, petId };
        savePerThemeState(state.themeId, { weather: newState.weather, petId: newState.petId });
        return newState;
      });
    }
  };
}

export const engineStore = createEngineStore();

// Derived active theme config
export const activeTheme = derived(engineStore, $state => themeRegistry[$state.themeId] || themeRegistry['forest']);

// Derived active colors based on time of day
export const activeColors = derived(
  [activeTheme, timeOfDay],
  ([$theme, $timeOfDay]) => {
    return $theme.colors[$timeOfDay] || $theme.colors['day'];
  }
);
