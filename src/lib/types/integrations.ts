/**
 * Integration types: external or local data sources.
 *
 * Every integration must be able to say "I don't know". `null` and the
 * `unavailable` states are first-class values, never replaced by guesses.
 */

// ── AI workspace ─────────────────────────────────────────────

export type AIToolId = 'antigravity' | 'claude-code';

/**
 * - `running`     a matching process is running
 * - `installed`   not running, but found in a known install location / PATH
 * - `not-found`   neither running nor found
 * - `unavailable` detection could not run (e.g. browser preview, error)
 */
export type AIStatus = 'running' | 'installed' | 'not-found' | 'unavailable';

export type QuotaStatus =
  { kind: 'unavailable'; reason: string } | { kind: 'available'; windows: QuotaWindow[]; plan: string | null };

export interface QuotaWindow {
  label: string;
  /** 0–100, or null when the source does not report it. */
  remainingPercent: number | null;
  /** Epoch milliseconds of the next reset, when reported. */
  resetsAt: number | null;
}

export interface AIToolState {
  id: AIToolId;
  name: string;
  status: AIStatus;
  /** Human-readable detail, e.g. "IDE and CLI running". */
  detail: string | null;
  quota: QuotaStatus;
  /** Epoch ms of the last successful detection. */
  checkedAt: number | null;
}

/** Raw detection result from the backend (`detect_ai_tools`). */
export interface AIDetectionReport {
  antigravity: { ideRunning: boolean; cliRunning: boolean; installed: boolean };
  claudeCode: { running: boolean; installed: boolean };
}

// ── System monitor ───────────────────────────────────────────

export interface SystemStats {
  /** Overall CPU usage 0–100. */
  cpuPercent: number;
  memoryUsedBytes: number;
  memoryTotalBytes: number;
  /** GPU utilisation 0–100, or null when it cannot be measured. */
  gpuPercent: number | null;
}

export type IntegrationStatus = 'idle' | 'loading' | 'ready' | 'unavailable' | 'error';

// ── Media ────────────────────────────────────────────────────

export type PlaybackStatus = 'playing' | 'paused' | 'stopped' | 'other';

export interface MediaInfo {
  title: string;
  artist: string | null;
  album: string | null;
  /** Source application id as reported by the OS. */
  sourceApp: string | null;
  status: PlaybackStatus;
  canPlayPause: boolean;
  canNext: boolean;
  canPrevious: boolean;
}

export type MediaAction = 'play-pause' | 'next' | 'previous';

// ── Weather (real data, distinct from theme atmosphere) ─────

export interface WeatherLocation {
  name: string;
  region: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  timezone: string | null;
}

export type WeatherCondition =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'heavy-rain'
  | 'snow'
  | 'thunderstorm'
  | 'unknown';

export interface WeatherReport {
  temperature: number;
  apparentTemperature: number | null;
  high: number | null;
  low: number | null;
  condition: WeatherCondition;
  weatherCode: number;
  isDay: boolean;
  windSpeed: number | null;
  units: TemperatureUnit;
  /** Epoch ms when fetched. */
  fetchedAt: number;
}

export type TemperatureUnit = 'celsius' | 'fahrenheit';
