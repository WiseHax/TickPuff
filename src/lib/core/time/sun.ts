/**
 * Sunrise and sunset from a location and a date (NOAA solar calculator
 * equations, accurate to about a minute away from the poles), and the time of
 * day that follows from them. Pure functions: no clock, no network.
 */
import type { TimeOfDay } from '$lib/types';

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
}

/** Where the sun never sets or never rises on this date. */
export type PolarDay = 'polar-day' | 'polar-night';

const RAD = Math.PI / 180;
const DAY_MS = 86_400_000;
/** Sun's centre 0.833° below the horizon: refraction plus the solar disc's radius. */
const ZENITH = 90.833;

function julianDay(date: Date): number {
  return date.getTime() / DAY_MS + 2440587.5;
}

/**
 * Sunrise and sunset around the given date (UTC day containing `date`'s local
 * noon), or which polar condition applies.
 */
export function sunTimes(date: Date, latitude: number, longitude: number): SunTimes | PolarDay {
  // Solar noon of the local calendar day, approximated from longitude.
  const localNoon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const jd = julianDay(localNoon);
  const t = (jd - 2451545) / 36525;

  const meanLongitude = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
  const meanAnomaly = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const eccentricity = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const center =
    Math.sin(meanAnomaly * RAD) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * meanAnomaly * RAD) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * meanAnomaly * RAD) * 0.000289;
  const trueLongitude = meanLongitude + center;
  const omega = 125.04 - 1934.136 * t;
  const apparentLongitude = trueLongitude - 0.00569 - 0.00478 * Math.sin(omega * RAD);
  const meanObliquity = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const obliquity = meanObliquity + 0.00256 * Math.cos(omega * RAD);
  const declination = Math.asin(Math.sin(obliquity * RAD) * Math.sin(apparentLongitude * RAD)) / RAD;

  const y = Math.tan((obliquity / 2) * RAD) ** 2;
  const equationOfTime =
    (4 / RAD) *
    (y * Math.sin(2 * meanLongitude * RAD) -
      2 * eccentricity * Math.sin(meanAnomaly * RAD) +
      4 * eccentricity * y * Math.sin(meanAnomaly * RAD) * Math.cos(2 * meanLongitude * RAD) -
      0.5 * y * y * Math.sin(4 * meanLongitude * RAD) -
      1.25 * eccentricity * eccentricity * Math.sin(2 * meanAnomaly * RAD));

  const cosHourAngle =
    Math.cos(ZENITH * RAD) / (Math.cos(latitude * RAD) * Math.cos(declination * RAD)) -
    Math.tan(latitude * RAD) * Math.tan(declination * RAD);
  if (cosHourAngle < -1) return 'polar-day';
  if (cosHourAngle > 1) return 'polar-night';
  const hourAngle = Math.acos(cosHourAngle) / RAD;

  // Minutes after UTC midnight of the local calendar day.
  const noonMinutes = 720 - 4 * longitude - equationOfTime;
  const utcMidnight = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const at = (minutes: number) => new Date(utcMidnight + minutes * 60_000);
  return { sunrise: at(noonMinutes - hourAngle * 4), sunset: at(noonMinutes + hourAngle * 4) };
}

/** Clock-based fallback (no location, or the location's sun doesn't rise or set). */
export function timeOfDayByHour(date: Date): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 9) return 'morning';
  if (hour >= 9 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'sunset';
  if (hour >= 20 && hour < 23) return 'night';
  return 'late-night';
}

const MINUTE = 60_000;

/**
 * Time of day from the real sun:
 * - morning: 30 min before sunrise until 2 h after it
 * - day: until 1 h before sunset
 * - sunset: 1 h before until 40 min after sunset (golden hour and dusk)
 * - night: until 23:00 (or 3 h after sunset in summer's long evenings)
 * - late night: until morning starts again
 */
export function timeOfDayFromSun(date: Date, sun: SunTimes | PolarDay): TimeOfDay {
  if (sun === 'polar-day') return 'day';
  if (sun === 'polar-night') return date.getHours() >= 23 || date.getHours() < 5 ? 'late-night' : 'night';
  const now = date.getTime();
  const sunrise = sun.sunrise.getTime();
  const sunset = sun.sunset.getTime();
  if (now >= sunrise - 30 * MINUTE && now < sunrise + 120 * MINUTE) return 'morning';
  if (now >= sunrise + 120 * MINUTE && now < sunset - 60 * MINUTE) return 'day';
  if (now >= sunset - 60 * MINUTE && now < sunset + 40 * MINUTE) return 'sunset';
  const lateFrom = Math.max(
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23).getTime(),
    sunset + 180 * MINUTE,
  );
  if (now >= sunset + 40 * MINUTE && now < lateFrom) return 'night';
  return 'late-night';
}
