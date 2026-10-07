/**
 * World (theme) types.
 *
 * A *theme* is a visual world: sky colours, 2D scenery, the companions that
 * live there, the atmosphere effects it allows and the "stage" the companion
 * can roam on. Themes never own widgets or integrations.
 */
import type { CompanionActivity, CompanionId } from './companion';

export type TimeOfDay = 'morning' | 'day' | 'sunset' | 'night' | 'late-night';

export const TIMES_OF_DAY: readonly TimeOfDay[] = ['morning', 'day', 'sunset', 'night', 'late-night'];

/** Visual atmosphere effect rendered over the world. Not real weather data. */
export type WeatherType = 'clear' | 'rain' | 'heavy-rain' | 'snow' | 'fog' | 'petals' | 'leaves' | 'bubbles' | 'dust';

export const WEATHER_TYPES: readonly WeatherType[] = [
  'clear',
  'rain',
  'heavy-rain',
  'snow',
  'fog',
  'petals',
  'leaves',
  'bubbles',
  'dust',
];

export const WEATHER_LABELS: Record<WeatherType, string> = {
  clear: 'Clear',
  rain: 'Rain',
  'heavy-rain': 'Heavy rain',
  snow: 'Snow',
  fog: 'Fog',
  petals: 'Falling petals',
  leaves: 'Falling leaves',
  bubbles: 'Bubbles',
  dust: 'Floating dust',
};

export interface ThemeColors {
  bgTop: string;
  bgBottom: string;
  text: string;
  textMuted: string;
  accent: string;
  glass: string;
}

/** Ambient particle effects a theme adds on its own (e.g. fireflies at night). */
export type AmbientEffect = 'fireflies' | 'sparks' | 'dust';

export interface AmbientEffectRule {
  effect: AmbientEffect;
  /** Times of day the effect is active. Omit for "always". */
  when?: TimeOfDay[];
}

export type StageZoneKind = 'rest' | 'interact' | 'shelter';

/**
 * A meaningful spot in the scenery the companion can walk to.
 * Coordinates are normalized: `x` 0 = left edge, 1 = right edge;
 * `depth` 0 = front of the stage (closest to the viewer), 1 = back.
 */
export interface StageZone {
  id: string;
  label: string;
  kind: StageZoneKind;
  x: number;
  depth: number;
  /** What the companion does once it arrives. */
  activity: CompanionActivity;
  /** How long (seconds) the companion stays, [min, max]. */
  stay: [number, number];
  /** For swimmers and hovering companions: 0 = lowest, 1 = highest of their range. */
  altitude?: number;
  /** Times of day the zone is meaningful (e.g. a lit candle). Omit for always. */
  when?: TimeOfDay[];
}

export interface StageDefinition {
  /** Roaming bounds, normalized (see StageZone). */
  minX: number;
  maxX: number;
  /** Medium the stage represents. Water lets swimmers use altitude freely. */
  medium: 'ground' | 'water';
  zones: StageZone[];
}

export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  allowedWeather: WeatherType[];
  defaultWeather: WeatherType;
  companions: CompanionId[];
  defaultCompanion: CompanionId;
  colors: Record<TimeOfDay, ThemeColors>;
  clock: {
    /** Font used when the clock font setting is "Theme". */
    font: string;
    shadow: string;
  };
  ambient: AmbientEffectRule[];
  stage: StageDefinition;
}

/** Per-theme user choices, remembered when switching worlds. */
export interface ThemeState {
  weather: WeatherType;
  companion: CompanionId;
}

/** Persisted world selection. */
export interface WorldState {
  themeId: string;
  perTheme: Record<string, ThemeState>;
}
