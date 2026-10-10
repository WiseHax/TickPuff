import { describe, expect, it } from 'vitest';
import { sunTimes, timeOfDayByHour, timeOfDayFromSun, type SunTimes } from '$lib/core/time/sun';

/** Minutes after UTC midnight of the date's UTC day. */
const utcMinutes = (date: Date) => date.getUTCHours() * 60 + date.getUTCMinutes();

describe('sunTimes', () => {
  it('matches published times for London at the June solstice', () => {
    // timeanddate.com: sunrise 04:43 BST (03:43 UTC), sunset 21:21 BST (20:21 UTC).
    const sun = sunTimes(new Date(2026, 5, 21, 12), 51.5074, -0.1278) as SunTimes;
    expect(Math.abs(utcMinutes(sun.sunrise) - (3 * 60 + 43))).toBeLessThanOrEqual(3);
    expect(Math.abs(utcMinutes(sun.sunset) - (20 * 60 + 21))).toBeLessThanOrEqual(3);
  });

  it('matches published times for Manila in December', () => {
    // Dec 21: sunrise 06:16 PHT (22:16 UTC the day before), sunset 17:31 PHT (09:31 UTC).
    const sun = sunTimes(new Date(2026, 11, 21, 12), 14.5995, 120.9842) as SunTimes;
    expect(Math.abs(utcMinutes(sun.sunrise) - (22 * 60 + 16))).toBeLessThanOrEqual(4);
    expect(Math.abs(utcMinutes(sun.sunset) - (9 * 60 + 31))).toBeLessThanOrEqual(4);
    expect(sun.sunset.getTime()).toBeGreaterThan(sun.sunrise.getTime());
  });

  it('reports polar day and polar night', () => {
    expect(sunTimes(new Date(2026, 5, 21, 12), 78.22, 15.63)).toBe('polar-day'); // Svalbard, June
    expect(sunTimes(new Date(2026, 11, 21, 12), 78.22, 15.63)).toBe('polar-night'); // Svalbard, December
  });
});

describe('timeOfDayFromSun', () => {
  const day = (h: number, m = 0) => new Date(2026, 3, 10, h, m);
  const sun: SunTimes = { sunrise: day(6, 0), sunset: day(18, 30) };

  it.each([
    [day(5, 40), 'morning'],
    [day(7, 30), 'morning'],
    [day(12, 0), 'day'],
    [day(17, 40), 'sunset'],
    [day(19, 0), 'sunset'],
    [day(20, 0), 'night'],
    [day(23, 30), 'late-night'],
    [day(3, 0), 'late-night'],
  ] as const)('%s → %s', (date, expected) => {
    expect(timeOfDayFromSun(date, sun)).toBe(expected);
  });

  it('keeps long summer evenings as night for 3 h after sunset', () => {
    const summer: SunTimes = { sunrise: day(4, 45), sunset: day(21, 20) };
    expect(timeOfDayFromSun(day(23, 30), summer)).toBe('night');
    expect(timeOfDayFromSun(day(0, 30), summer)).toBe('late-night');
  });

  it('handles polar day and night', () => {
    expect(timeOfDayFromSun(day(2, 0), 'polar-day')).toBe('day');
    expect(timeOfDayFromSun(day(14, 0), 'polar-night')).toBe('night');
    expect(timeOfDayFromSun(day(1, 0), 'polar-night')).toBe('late-night');
  });

  it('falls back to the clock without a location', () => {
    expect(timeOfDayByHour(day(6))).toBe('morning');
    expect(timeOfDayByHour(day(18))).toBe('sunset');
    expect(timeOfDayByHour(day(23))).toBe('late-night');
  });
});

describe('timeOfDayFor with a location', () => {
  it('follows the real sun when a location is known, and the clock otherwise', async () => {
    const { timeOfDayFor } = await import('$lib/core/time/clock');
    const date = (h: number, m = 0) => new Date(2026, 2, 20, h, m); // equinox: ~12 h of daylight everywhere
    // A place on the equator whose solar noon is local 12:00 in this machine's timezone:
    // sunrise ≈ 06:00 and sunset ≈ 18:00 local, whatever timezone the tests run in.
    const here = { latitude: 0, longitude: -date(12).getTimezoneOffset() / 4 };

    expect(timeOfDayFor(date(18, 20), here)).toBe('sunset'); // dusk right after sunset
    expect(timeOfDayFor(date(18, 20))).toBe('sunset'); // the clock agrees (17–20)
    expect(timeOfDayFor(date(19, 30), here)).toBe('night'); // the sun has been down 1.5 h…
    expect(timeOfDayFor(date(19, 30))).toBe('sunset'); // …but the clock still says sunset
    expect(timeOfDayFor(date(7, 0), here)).toBe('morning');
    expect(timeOfDayFor(date(12, 0), here)).toBe('day');
  });
});

describe('seasonFor', () => {
  it('uses meteorological seasons in the northern hemisphere', async () => {
    const { seasonFor } = await import('$lib/core/time/season');
    expect(seasonFor(new Date(2026, 0, 15))).toBe('winter');
    expect(seasonFor(new Date(2026, 3, 15))).toBe('spring');
    expect(seasonFor(new Date(2026, 6, 15))).toBe('summer');
    expect(seasonFor(new Date(2026, 9, 15))).toBe('autumn');
    expect(seasonFor(new Date(2026, 11, 1), 51.5)).toBe('winter');
  });

  it('flips the season south of the equator', async () => {
    const { seasonFor } = await import('$lib/core/time/season');
    expect(seasonFor(new Date(2026, 6, 15), -33.9)).toBe('winter'); // Sydney in July
    expect(seasonFor(new Date(2026, 11, 25), -33.9)).toBe('summer');
  });
});
