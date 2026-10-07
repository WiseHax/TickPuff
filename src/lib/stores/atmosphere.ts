/**
 * The atmosphere actually rendered: the user's per-theme choice, or — when
 * "match real weather" is on and data is available — the closest effect the
 * current theme supports. Real weather never forces an effect a theme lacks.
 */
import { derived } from 'svelte/store';
import { atmosphereCandidates, weather, weatherService, weatherSettings } from '$lib/integrations/weather';
import { ambientEffectsFor } from '$lib/themes/registry';
import { timeOfDay } from '$lib/core/time/clock';
import { activeTheme, activeThemeState } from './world';
import type { ThemeDefinition, WeatherCondition, WeatherType } from '$lib/types';

/** Effects that represent the sky; the rest (petals, bubbles, ...) are decorative. */
const SKY_EFFECTS: readonly WeatherType[] = ['rain', 'heavy-rain', 'snow', 'fog'];

export function resolveAtmosphere(
  theme: ThemeDefinition,
  chosen: WeatherType,
  sync: boolean,
  condition: WeatherCondition | null,
): WeatherType {
  if (!sync || condition === null) return chosen;
  const allowed = (effect: WeatherType) => theme.allowedWeather.includes(effect);
  // Indoor and underwater worlds have no sky to sync.
  if (!theme.allowedWeather.some((effect) => SKY_EFFECTS.includes(effect))) return chosen;
  const match = atmosphereCandidates(condition).find(allowed);
  // A calm real sky keeps decorative effects like falling petals.
  if (match === 'clear' && !SKY_EFFECTS.includes(chosen)) return chosen;
  if (match) return match;
  return allowed('clear') ? 'clear' : chosen;
}

export const effectiveWeather = derived(
  [activeTheme, activeThemeState, weatherSettings, weather],
  ([$theme, $state, $settings, $weather]) =>
    resolveAtmosphere(
      $theme,
      $state.weather,
      $settings.syncAtmosphere && $settings.location !== null,
      $weather.report?.condition ?? null,
    ),
);

export const ambientEffects = derived([activeTheme, timeOfDay], ([$theme, $time]) => ambientEffectsFor($theme, $time));

// Keep weather data flowing while atmosphere sync needs it.
let releaseSync: (() => void) | null = null;
weatherSettings.subscribe(($settings) => {
  const needed = $settings.syncAtmosphere && $settings.location !== null;
  if (needed && !releaseSync) releaseSync = weatherService.acquire();
  if (!needed && releaseSync) {
    releaseSync();
    releaseSync = null;
  }
});
