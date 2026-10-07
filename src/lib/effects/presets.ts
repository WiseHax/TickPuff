/**
 * Particle effect presets. Counts are for density 1 (BEAUTIFUL); the
 * performance profile scales them down.
 */
import type { AmbientEffect, WeatherType } from '$lib/types';

export type ParticleShape = 'streak' | 'soft' | 'petal' | 'leaf' | 'bubble' | 'glow' | 'spark';

export const SHAPE_IDS: Record<ParticleShape, number> = {
  streak: 0,
  soft: 1,
  petal: 2,
  leaf: 3,
  bubble: 4,
  glow: 5,
  spark: 6,
};

export interface ParticlePreset {
  shape: ParticleShape;
  count: number;
  /** Fall speed in units/s; negative values rise. */
  fall: number;
  /** Sideways sway amplitude and frequency. */
  drift: number;
  swirl: number;
  /** Constant sideways wind, units/s. */
  wind: number;
  /** Slow 3D wandering amplitude (fireflies). */
  wander: number;
  /** World-space sprite size. */
  size: number;
  colors: string[];
  opacity: number;
  additive: boolean;
  /** Volume [width, height, depth] and its minimum corner. */
  volume: [number, number, number];
  origin: [number, number, number];
  /** Fewest particles kept even at low density. */
  minCount: number;
}

const SKY_VOLUME: Pick<ParticlePreset, 'volume' | 'origin'> = { volume: [34, 14, 13], origin: [-17, -1, -9] };
const LOW_VOLUME: Pick<ParticlePreset, 'volume' | 'origin'> = { volume: [26, 5, 10], origin: [-13, 0, -6] };

const base: Omit<ParticlePreset, 'shape' | 'count' | 'size' | 'colors'> = {
  fall: 1,
  drift: 0,
  swirl: 0.5,
  wind: 0,
  wander: 0,
  opacity: 0.9,
  additive: false,
  minCount: 20,
  ...SKY_VOLUME,
};

export const WEATHER_PRESETS: Partial<Record<WeatherType, ParticlePreset>> = {
  rain: {
    ...base,
    shape: 'streak',
    count: 1400,
    fall: 9,
    wind: -1.2,
    size: 0.55,
    colors: ['#aeb8d6'],
    opacity: 0.5,
    minCount: 200,
  },
  'heavy-rain': {
    ...base,
    shape: 'streak',
    count: 2800,
    fall: 13,
    wind: -2.5,
    size: 0.65,
    colors: ['#b8c2de'],
    opacity: 0.55,
    minCount: 400,
  },
  snow: {
    ...base,
    shape: 'soft',
    count: 1200,
    fall: 0.9,
    drift: 0.5,
    swirl: 0.6,
    size: 0.16,
    colors: ['#ffffff', '#eef4ff'],
    opacity: 0.9,
    minCount: 150,
  },
  petals: {
    ...base,
    shape: 'petal',
    count: 220,
    fall: 0.7,
    drift: 0.9,
    swirl: 0.5,
    wind: 0.4,
    size: 0.26,
    colors: ['#ffc1d6', '#ffb0c8', '#ffe0ea'],
    opacity: 0.95,
    minCount: 40,
  },
  leaves: {
    ...base,
    shape: 'leaf',
    count: 160,
    fall: 0.8,
    drift: 1,
    swirl: 0.45,
    wind: 0.5,
    size: 0.3,
    colors: ['#d9822b', '#c1572b', '#e8b04a', '#8a5a2b'],
    opacity: 0.95,
    minCount: 30,
  },
  bubbles: {
    ...base,
    shape: 'bubble',
    count: 200,
    fall: -0.7,
    drift: 0.25,
    swirl: 1.2,
    size: 0.24,
    colors: ['#d6efff'],
    opacity: 0.75,
    minCount: 40,
  },
  dust: {
    ...base,
    shape: 'soft',
    count: 320,
    fall: -0.04,
    drift: 0.35,
    swirl: 0.25,
    size: 0.07,
    colors: ['#ffe6a8'],
    opacity: 0.65,
    additive: true,
    minCount: 60,
  },
};

export const AMBIENT_PRESETS: Record<AmbientEffect, ParticlePreset> = {
  fireflies: {
    ...base,
    ...LOW_VOLUME,
    shape: 'glow',
    count: 36,
    fall: 0,
    drift: 0.6,
    swirl: 0.3,
    wander: 0.8,
    size: 0.3,
    colors: ['#d8f26a', '#f3ff9e'],
    opacity: 1,
    additive: true,
    minCount: 12,
  },
  sparks: {
    ...base,
    ...LOW_VOLUME,
    shape: 'spark',
    count: 70,
    fall: -0.5,
    drift: 0.2,
    wind: 0.3,
    size: 0.14,
    colors: ['#ff7ee8', '#7ff6ff'],
    opacity: 1,
    additive: true,
    minCount: 16,
  },
  dust: {
    ...base,
    shape: 'soft',
    count: 160,
    fall: -0.04,
    drift: 0.35,
    swirl: 0.25,
    size: 0.06,
    colors: ['#ffe6a8'],
    opacity: 0.5,
    additive: true,
    minCount: 30,
  },
};

/** Number of particles to create for a preset at a density (0 disables). */
export function particleCount(preset: ParticlePreset, density: number): number {
  if (density <= 0) return 0;
  return Math.max(preset.minCount, Math.round(preset.count * density));
}
