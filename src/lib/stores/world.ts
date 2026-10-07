/**
 * World state: the active theme plus per-theme weather and companion choices.
 * Switching themes restores what the user last picked in that world.
 */
import { derived } from 'svelte/store';
import { persisted, isRecord, type KeyValueBackend, type PersistSpec } from '$lib/core/persistence';
import { timeOfDay } from '$lib/core/time/clock';
import { DEFAULT_THEME_ID, THEMES, getTheme, hasTheme } from '$lib/themes/registry';
import { isCompanionId } from '$lib/companion/registry/companions';
import type { CompanionId, ThemeState, WeatherType, WorldState } from '$lib/types';

const LEGACY_THEME_KEY = 'tickpuff-theme';
const legacyThemeStateKey = (id: string) => `tickpuff-theme-state-${id}`;

export function defaultThemeState(themeId: string): ThemeState {
  const theme = getTheme(themeId);
  return { weather: theme.defaultWeather, companion: theme.defaultCompanion };
}

/** Keep only choices the theme actually supports. */
export function sanitizeThemeState(themeId: string, raw: unknown): ThemeState {
  const theme = getTheme(themeId);
  const fallback = defaultThemeState(themeId);
  if (!isRecord(raw)) return fallback;
  const weather = theme.allowedWeather.includes(raw.weather as WeatherType)
    ? (raw.weather as WeatherType)
    : fallback.weather;
  const companion =
    isCompanionId(raw.companion) && theme.companions.includes(raw.companion) ? raw.companion : fallback.companion;
  return { weather, companion };
}

export function sanitizeWorldState(raw: unknown): WorldState | null {
  if (!isRecord(raw)) return null;
  const themeId = typeof raw.themeId === 'string' && hasTheme(raw.themeId) ? raw.themeId : DEFAULT_THEME_ID;
  const perTheme: Record<string, ThemeState> = {};
  const rawPerTheme = isRecord(raw.perTheme) ? raw.perTheme : {};
  for (const theme of THEMES) {
    if (theme.id in rawPerTheme) perTheme[theme.id] = sanitizeThemeState(theme.id, rawPerTheme[theme.id]);
  }
  return { themeId, perTheme };
}

/** Pre-0.1 builds stored `{ weather, petId }` per theme under separate keys. */
function readLegacy(backend: KeyValueBackend): unknown {
  const themeId = backend.getItem(LEGACY_THEME_KEY);
  const perTheme: Record<string, unknown> = {};
  for (const theme of THEMES) {
    const raw = backend.getItem(legacyThemeStateKey(theme.id));
    if (raw === null) continue;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isRecord(parsed)) perTheme[theme.id] = { weather: parsed.weather, companion: parsed.petId };
    } catch {
      // Skip unreadable entries; defaults apply for that theme.
    }
  }
  if (themeId === null && Object.keys(perTheme).length === 0) return undefined;
  return { themeId: themeId ?? DEFAULT_THEME_ID, perTheme };
}

export const worldSpec: PersistSpec<WorldState> = {
  key: 'tickpuff-world',
  version: 1,
  defaults: () => ({ themeId: DEFAULT_THEME_ID, perTheme: {} }),
  sanitize: sanitizeWorldState,
  legacy: {
    read: readLegacy,
    keys: () => [LEGACY_THEME_KEY, ...THEMES.map((theme) => legacyThemeStateKey(theme.id))],
  },
};

function createWorldStore() {
  const store = persisted(worldSpec);

  const updateActive = (patch: Partial<ThemeState>) =>
    store.update((state) => {
      const current = state.perTheme[state.themeId] ?? defaultThemeState(state.themeId);
      const next = sanitizeThemeState(state.themeId, { ...current, ...patch });
      return { ...state, perTheme: { ...state.perTheme, [state.themeId]: next } };
    });

  return {
    subscribe: store.subscribe,
    setTheme(themeId: string) {
      if (!hasTheme(themeId)) return;
      store.update((state) => ({ ...state, themeId }));
    },
    setWeather: (weather: WeatherType) => updateActive({ weather }),
    setCompanion: (companion: CompanionId) => updateActive({ companion }),
    reset: store.reset,
  };
}

export const world = createWorldStore();

export const activeTheme = derived(world, ($world) => getTheme($world.themeId));

/** The active theme's remembered (or default) weather and companion. */
export const activeThemeState = derived(
  world,
  ($world) => $world.perTheme[$world.themeId] ?? defaultThemeState($world.themeId),
);

export const activeColors = derived([activeTheme, timeOfDay], ([$theme, $time]) => $theme.colors[$time]);
