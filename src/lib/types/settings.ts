/** Global settings types. */

export type PerformanceMode = 'ECO' | 'BALANCED' | 'BEAUTIFUL';

export const PERFORMANCE_MODES: readonly PerformanceMode[] = ['ECO', 'BALANCED', 'BEAUTIFUL'];

/** Concrete rendering policy derived from a PerformanceMode. */
export interface PerformanceProfile {
  mode: PerformanceMode;
  /** Frame cap for the WebGL layer. */
  maxFps: number;
  /** Frame cap while the companion sleeps and no particles are moving. */
  restingFps: number;
  pixelRatioCap: number;
  antialias: boolean;
  /** Multiplier applied to particle counts; 0 = GPU particles off (CSS fallback). */
  particleDensity: number;
  /** Mouse parallax on the 2D scenery. */
  parallax: boolean;
}

/** How large the companion is drawn in the world. */
export type CompanionSize = 'small' | 'medium' | 'large';

export const COMPANION_SIZES: readonly CompanionSize[] = ['small', 'medium', 'large'];

export type ClockFont = 'Theme' | 'Pixelify Sans' | 'VT323' | 'Space Mono' | 'Outfit' | 'Inter' | 'System';

export const CLOCK_FONTS: readonly ClockFont[] = [
  'Theme',
  'Pixelify Sans',
  'VT323',
  'Space Mono',
  'Outfit',
  'Inter',
  'System',
];

export interface ClockSettings {
  font: ClockFont;
  /** rem */
  size: number;
  weight: number;
  /** px */
  letterSpacing: number;
  showSeconds: boolean;
  use24Hour: boolean;
  /** CSS colour, or null to follow the theme text colour. */
  color: string | null;
}

/** Session-level UI modes. */
export interface UIState {
  /** Dimmed world, sleeping companion. */
  sleepMode: boolean;
  /** Only the world and the companion; no clock or widgets. */
  ambientMode: boolean;
  /** Widgets docks visible. */
  widgetsVisible: boolean;
  /** Show the 3D companion at all. */
  companionVisible: boolean;
}
