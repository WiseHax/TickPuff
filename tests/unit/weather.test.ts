import { describe, expect, it } from 'vitest';
import { conditionFromCode, forecastUrl, parseForecast, parseGeocoding } from '$lib/integrations/weather/openMeteo';
import { resolveAtmosphere } from '$lib/stores/atmosphere';
import { getTheme } from '$lib/themes/registry';

describe('Open-Meteo parsing', () => {
  it('maps WMO codes to conditions', () => {
    expect(conditionFromCode(0)).toBe('clear');
    expect(conditionFromCode(2)).toBe('partly-cloudy');
    expect(conditionFromCode(45)).toBe('fog');
    expect(conditionFromCode(53)).toBe('drizzle');
    expect(conditionFromCode(63)).toBe('rain');
    expect(conditionFromCode(65)).toBe('heavy-rain');
    expect(conditionFromCode(75)).toBe('snow');
    expect(conditionFromCode(95)).toBe('thunderstorm');
    expect(conditionFromCode(42)).toBe('unknown');
  });

  it('parses a forecast response', () => {
    const report = parseForecast(
      {
        current: { temperature_2m: 12.4, apparent_temperature: 10.1, weather_code: 61, is_day: 1, wind_speed_10m: 14 },
        daily: { temperature_2m_max: [15.2], temperature_2m_min: [8.9] },
      },
      'celsius',
      42,
    );
    expect(report).toMatchObject({
      temperature: 12.4,
      high: 15.2,
      low: 8.9,
      condition: 'rain',
      isDay: true,
      fetchedAt: 42,
    });
  });

  it('rejects a response without current conditions', () => {
    expect(() => parseForecast({ error: true }, 'celsius', 0)).toThrow();
  });

  it('parses geocoding results and skips incomplete entries', () => {
    const results = parseGeocoding({
      results: [
        {
          name: 'Manila',
          latitude: 14.6,
          longitude: 120.98,
          country: 'Philippines',
          admin1: 'Metro Manila',
          timezone: 'Asia/Manila',
        },
        { name: 'Nowhere' },
      ],
    });
    expect(results).toEqual([
      {
        name: 'Manila',
        region: 'Metro Manila',
        country: 'Philippines',
        latitude: 14.6,
        longitude: 120.98,
        timezone: 'Asia/Manila',
      },
    ]);
    expect(parseGeocoding({})).toEqual([]);
  });

  it('only sends coordinates and display options', () => {
    const url = new URL(
      forecastUrl(
        { name: 'X', region: null, country: null, latitude: 1.23456, longitude: 2, timezone: null },
        'fahrenheit',
      ),
    );
    expect(url.origin).toBe('https://api.open-meteo.com');
    expect(url.searchParams.get('latitude')).toBe('1.2346');
    expect(url.searchParams.get('temperature_unit')).toBe('fahrenheit');
    expect([...url.searchParams.keys()]).not.toContain('name');
  });
});

describe('atmosphere resolution (theme decides what it can show)', () => {
  const forest = getTheme('forest');
  const sakura = getTheme('sakura');
  const aquarium = getTheme('aquarium');

  it('uses the chosen effect when sync is off or data is missing', () => {
    expect(resolveAtmosphere(forest, 'snow', false, 'rain')).toBe('snow');
    expect(resolveAtmosphere(forest, 'snow', true, null)).toBe('snow');
  });

  it('follows real precipitation in outdoor worlds', () => {
    expect(resolveAtmosphere(forest, 'clear', true, 'rain')).toBe('rain');
    expect(resolveAtmosphere(forest, 'clear', true, 'thunderstorm')).toBe('heavy-rain');
    expect(resolveAtmosphere(sakura, 'petals', true, 'thunderstorm')).toBe('rain');
  });

  it('keeps decorative effects on calm days', () => {
    expect(resolveAtmosphere(sakura, 'petals', true, 'clear')).toBe('petals');
    expect(resolveAtmosphere(forest, 'rain', true, 'clear')).toBe('clear');
  });

  it('never syncs indoor or underwater worlds', () => {
    expect(resolveAtmosphere(aquarium, 'bubbles', true, 'snow')).toBe('bubbles');
    expect(resolveAtmosphere(getTheme('library'), 'dust', true, 'rain')).toBe('dust');
  });

  it('falls back to clear when the world lacks the real condition', () => {
    expect(resolveAtmosphere(sakura, 'rain', true, 'snow')).toBe('clear');
  });
});
