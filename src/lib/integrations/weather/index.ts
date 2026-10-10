/**
 * Real-world weather. Disabled until the user picks a location; no
 * location is ever guessed or looked up automatically.
 */
import { get, writable } from 'svelte/store';
import { asBoolean, asOneOf, isRecord, persisted, type PersistSpec } from '$lib/core/persistence';
import { createPoller, createSharedLifecycle } from '$lib/core/scheduling/poller';
import { setObserver } from '$lib/core/time/clock';
import { fetchForecast } from './openMeteo';
import type { IntegrationStatus, TemperatureUnit, WeatherLocation, WeatherReport } from '$lib/types';

export * from './openMeteo';

export interface WeatherSettings {
  location: WeatherLocation | null;
  units: TemperatureUnit;
  /** Let real conditions drive the world's atmosphere effect. */
  syncAtmosphere: boolean;
}

function sanitizeLocation(raw: unknown): WeatherLocation | null {
  if (!isRecord(raw) || typeof raw.name !== 'string') return null;
  const { latitude, longitude } = raw;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  const str = (v: unknown) => (typeof v === 'string' ? v : null);
  return {
    name: raw.name.slice(0, 120),
    region: str(raw.region),
    country: str(raw.country),
    latitude,
    longitude,
    timezone: str(raw.timezone),
  };
}

export const weatherSettingsSpec: PersistSpec<WeatherSettings> = {
  key: 'tickpuff-weather',
  version: 1,
  defaults: () => ({ location: null, units: 'celsius', syncAtmosphere: false }),
  sanitize: (raw) =>
    isRecord(raw)
      ? {
          location: sanitizeLocation(raw.location),
          units: asOneOf(raw.units, ['celsius', 'fahrenheit'] as const, 'celsius'),
          syncAtmosphere: asBoolean(raw.syncAtmosphere, false),
        }
      : null,
};

export const weatherSettings = persisted(weatherSettingsSpec);

// With a location set, the world's time of day follows the real sunrise and sunset there.
weatherSettings.subscribe((settings) => setObserver(settings.location));

export interface WeatherState {
  status: IntegrationStatus;
  report: WeatherReport | null;
  message: string | null;
}

export const weather = writable<WeatherState>({ status: 'idle', report: null, message: null });

const REFRESH_MS = 30 * 60_000;
/** Don't refetch on every focus/un-hide; this is how old data may be. */
const MIN_AGE_MS = 10 * 60_000;

async function refreshWeather(signal: AbortSignal) {
  const { location, units } = get(weatherSettings);
  if (!location) {
    weather.set({ status: 'idle', report: null, message: 'Choose a location in Settings → Integrations' });
    return;
  }
  const current = get(weather).report;
  if (current && current.units === units && Date.now() - current.fetchedAt < MIN_AGE_MS) return;
  weather.update((s) => ({ ...s, status: s.report ? s.status : 'loading' }));
  try {
    const report = await fetchForecast(location, units, signal);
    weather.set({ status: 'ready', report, message: null });
  } catch (error) {
    if (signal.aborted) return;
    weather.update((s) => ({
      status: s.report ? 'ready' : 'error',
      report: s.report,
      message: error instanceof Error ? error.message : 'Weather unavailable',
    }));
  }
}

const poller = createPoller({ intervalMs: REFRESH_MS, hiddenIntervalMs: REFRESH_MS, run: refreshWeather });

/** Weather is fetched while the widget is shown or atmosphere sync is on. */
export const weatherService = createSharedLifecycle(poller.start, poller.stop);

// Location or unit changes invalidate the current report.
let previous = get(weatherSettings);
weatherSettings.subscribe((settings) => {
  const changed =
    settings.units !== previous.units ||
    settings.location?.latitude !== previous.location?.latitude ||
    settings.location?.longitude !== previous.location?.longitude;
  previous = settings;
  if (changed) {
    weather.set({ status: 'idle', report: null, message: null });
    if (poller.running) poller.refresh();
  }
});
