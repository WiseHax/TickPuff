/**
 * Global settings that apply in every theme: clock appearance, performance
 * policy and UI modes.
 */
import { derived } from 'svelte/store';
import { asBoolean, asNumber, asOneOf, isRecord, persisted, type PersistSpec } from '$lib/core/persistence';
import { CLOCK_FONTS, COMPANION_SIZES, PERFORMANCE_MODES } from '$lib/types';
import type { ClockSettings, CompanionSize, PerformanceMode, PerformanceProfile, UIState } from '$lib/types';

// ── Clock ────────────────────────────────────────────────────

export const DEFAULT_CLOCK: ClockSettings = {
  font: 'Pixelify Sans',
  size: 8,
  weight: 500,
  letterSpacing: -2,
  showSeconds: false,
  use24Hour: false,
  color: null,
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function sanitizeClock(raw: unknown): ClockSettings | null {
  if (!isRecord(raw)) return null;
  return {
    font: asOneOf(raw.font, CLOCK_FONTS, DEFAULT_CLOCK.font),
    size: asNumber(raw.size, DEFAULT_CLOCK.size, 3, 16),
    weight: Math.round(asNumber(raw.weight, DEFAULT_CLOCK.weight, 300, 700) / 100) * 100,
    letterSpacing: asNumber(raw.letterSpacing, DEFAULT_CLOCK.letterSpacing, -10, 20),
    showSeconds: asBoolean(raw.showSeconds, DEFAULT_CLOCK.showSeconds),
    use24Hour: asBoolean(raw.use24Hour, DEFAULT_CLOCK.use24Hour),
    color: typeof raw.color === 'string' && HEX_COLOR.test(raw.color) ? raw.color.toLowerCase() : null,
  };
}

export const clockSpec: PersistSpec<ClockSettings> = {
  key: 'tickpuff-clock-settings',
  version: 1,
  defaults: () => ({ ...DEFAULT_CLOCK }),
  sanitize: sanitizeClock,
  // v0 had the same shape (without the "Theme" font); sanitize handles it.
};

function createClockSettings() {
  const store = persisted(clockSpec);
  return {
    subscribe: store.subscribe,
    patch: (patch: Partial<ClockSettings>) =>
      store.update((current) => sanitizeClock({ ...current, ...patch }) ?? current),
    reset: store.reset,
  };
}

export const clockSettings = createClockSettings();

// ── Performance ──────────────────────────────────────────────

export const PERFORMANCE_PROFILES: Record<PerformanceMode, PerformanceProfile> = {
  ECO: {
    mode: 'ECO',
    maxFps: 24,
    restingFps: 8,
    pixelRatioCap: 1,
    antialias: false,
    particleDensity: 0,
    parallax: false,
  },
  BALANCED: {
    mode: 'BALANCED',
    maxFps: 30,
    restingFps: 15,
    pixelRatioCap: 1,
    antialias: false,
    particleDensity: 0.55,
    parallax: true,
  },
  BEAUTIFUL: {
    mode: 'BEAUTIFUL',
    maxFps: 60,
    restingFps: 30,
    pixelRatioCap: 2,
    antialias: true,
    particleDensity: 1,
    parallax: true,
  },
};

export const PERFORMANCE_DESCRIPTIONS: Record<PerformanceMode, string> = {
  ECO: 'Companion at a low frame rate, CSS weather, no parallax. Lowest power use.',
  BALANCED: 'Companion at 30 fps with GPU particles at reduced density.',
  BEAUTIFUL: 'Full frame rate, antialiasing, high-DPI rendering and dense particles.',
};

export const performanceSpec: PersistSpec<PerformanceMode> = {
  key: 'tickpuff-perf',
  version: 1,
  defaults: () => 'BALANCED',
  sanitize: (raw) =>
    typeof raw === 'string' && (PERFORMANCE_MODES as string[]).includes(raw) ? (raw as PerformanceMode) : null,
};

export const performanceMode = persisted(performanceSpec);

export const performanceProfile = derived(performanceMode, ($mode) => PERFORMANCE_PROFILES[$mode]);

// ── Companion size ───────────────────────────────────────────

/** World-space scale multiplier for each companion size. */
export const COMPANION_SIZE_SCALE: Record<CompanionSize, number> = {
  small: 1.3,
  medium: 1.75,
  large: 2.2,
};

export const companionSizeSpec: PersistSpec<CompanionSize> = {
  key: 'tickpuff-companion-size',
  version: 1,
  defaults: () => 'large',
  sanitize: (raw) =>
    typeof raw === 'string' && (COMPANION_SIZES as string[]).includes(raw) ? (raw as CompanionSize) : null,
};

export const companionSize = persisted(companionSizeSpec);

// ── Updates ──────────────────────────────────────────────────

/** Check GitHub for a new release shortly after startup (desktop app only). */
export const autoUpdateCheckSpec: PersistSpec<boolean> = {
  key: 'tickpuff-update-check',
  version: 1,
  defaults: () => true,
  sanitize: (raw) => (typeof raw === 'boolean' ? raw : null),
};

export const autoUpdateCheck = persisted(autoUpdateCheckSpec);

// ── UI modes ─────────────────────────────────────────────────

export const DEFAULT_UI: UIState = {
  sleepMode: false,
  ambientMode: false,
  widgetsVisible: false,
  companionVisible: true,
};

export const uiSpec: PersistSpec<UIState> = {
  key: 'tickpuff-ui',
  // v2: widgets moved into drawers that start closed, so the world is the first thing you see.
  version: 2,
  migrate: (raw, from) => (from < 2 && isRecord(raw) ? { ...raw, widgetsVisible: false } : raw),
  defaults: () => ({ ...DEFAULT_UI }),
  sanitize: (raw) =>
    isRecord(raw)
      ? {
          sleepMode: asBoolean(raw.sleepMode, DEFAULT_UI.sleepMode),
          ambientMode: asBoolean(raw.ambientMode, DEFAULT_UI.ambientMode),
          widgetsVisible: asBoolean(raw.widgetsVisible, DEFAULT_UI.widgetsVisible),
          companionVisible: asBoolean(raw.companionVisible, DEFAULT_UI.companionVisible),
        }
      : null,
};

function createUIStore() {
  const store = persisted(uiSpec);
  return {
    subscribe: store.subscribe,
    toggle: (key: keyof UIState) => store.update((state) => ({ ...state, [key]: !state[key] })),
    set: (key: keyof UIState, value: boolean) => store.update((state) => ({ ...state, [key]: value })),
  };
}

export const ui = createUIStore();
