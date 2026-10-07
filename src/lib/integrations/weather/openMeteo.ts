/**
 * Open-Meteo client (https://open-meteo.com). Free for non-commercial use,
 * no API key. Weather data is licensed CC BY 4.0 — the widget shows the
 * required attribution.
 */
import type { TemperatureUnit, WeatherCondition, WeatherLocation, WeatherReport, WeatherType } from '$lib/types';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

/** WMO weather interpretation codes → condition. */
export function conditionFromCode(code: number): WeatherCondition {
  if (code === 0) return 'clear';
  if (code === 1 || code === 2) return 'partly-cloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code === 65 || code === 82) return 'heavy-rain';
  if ((code >= 61 && code <= 67) || code === 80 || code === 81) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95 && code <= 99) return 'thunderstorm';
  return 'unknown';
}

export const CONDITION_LABELS: Record<WeatherCondition, string> = {
  clear: 'Clear',
  'partly-cloudy': 'Partly cloudy',
  cloudy: 'Cloudy',
  fog: 'Fog',
  drizzle: 'Drizzle',
  rain: 'Rain',
  'heavy-rain': 'Heavy rain',
  snow: 'Snow',
  thunderstorm: 'Thunderstorm',
  unknown: 'Unknown',
};

/**
 * Atmosphere effect that best matches a real condition, in preference order.
 * The theme decides which of these it can actually show.
 */
export function atmosphereCandidates(condition: WeatherCondition): WeatherType[] {
  switch (condition) {
    case 'clear':
    case 'partly-cloudy':
    case 'cloudy':
      return ['clear'];
    case 'fog':
      return ['fog', 'clear'];
    case 'drizzle':
    case 'rain':
      return ['rain', 'heavy-rain'];
    case 'heavy-rain':
    case 'thunderstorm':
      return ['heavy-rain', 'rain'];
    case 'snow':
      return ['snow'];
    default:
      return [];
  }
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function parseForecast(json: unknown, units: TemperatureUnit, fetchedAt: number): WeatherReport {
  const data = json as {
    current?: Record<string, unknown>;
    daily?: { temperature_2m_max?: unknown[]; temperature_2m_min?: unknown[] };
  };
  const current = data?.current;
  const temperature = num(current?.temperature_2m);
  const code = num(current?.weather_code);
  if (temperature === null || code === null) throw new Error('Unexpected forecast response');
  return {
    temperature,
    apparentTemperature: num(current?.apparent_temperature),
    high: num(data.daily?.temperature_2m_max?.[0]),
    low: num(data.daily?.temperature_2m_min?.[0]),
    condition: conditionFromCode(code),
    weatherCode: code,
    isDay: current?.is_day === 1,
    windSpeed: num(current?.wind_speed_10m),
    units,
    fetchedAt,
  };
}

export function forecastUrl(location: WeatherLocation, units: TemperatureUnit): string {
  const params = new URLSearchParams({
    latitude: location.latitude.toFixed(4),
    longitude: location.longitude.toFixed(4),
    current: 'temperature_2m,apparent_temperature,weather_code,is_day,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: '1',
    temperature_unit: units,
    wind_speed_unit: units === 'fahrenheit' ? 'mph' : 'kmh',
  });
  return `${FORECAST_URL}?${params}`;
}

export async function fetchForecast(
  location: WeatherLocation,
  units: TemperatureUnit,
  signal?: AbortSignal,
): Promise<WeatherReport> {
  const response = await fetch(forecastUrl(location, units), { signal });
  if (!response.ok) throw new Error(`Forecast request failed (${response.status})`);
  return parseForecast(await response.json(), units, Date.now());
}

export function parseGeocoding(json: unknown): WeatherLocation[] {
  const results = (json as { results?: unknown[] })?.results;
  if (!Array.isArray(results)) return [];
  const locations: WeatherLocation[] = [];
  for (const entry of results) {
    const r = entry as Record<string, unknown>;
    const latitude = num(r.latitude);
    const longitude = num(r.longitude);
    if (typeof r.name !== 'string' || latitude === null || longitude === null) continue;
    locations.push({
      name: r.name,
      region: typeof r.admin1 === 'string' ? r.admin1 : null,
      country: typeof r.country === 'string' ? r.country : null,
      latitude,
      longitude,
      timezone: typeof r.timezone === 'string' ? r.timezone : null,
    });
  }
  return locations;
}

export async function searchLocations(query: string, signal?: AbortSignal): Promise<WeatherLocation[]> {
  const name = query.trim();
  if (name.length < 2) return [];
  const params = new URLSearchParams({ name, count: '6', language: 'en', format: 'json' });
  const response = await fetch(`${GEOCODING_URL}?${params}`, { signal });
  if (!response.ok) throw new Error(`Location search failed (${response.status})`);
  return parseGeocoding(await response.json());
}
