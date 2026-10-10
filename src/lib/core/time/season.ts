/**
 * Seasons for the worlds' scenery (snow in winter, autumn leaves, spring
 * blossoms). Meteorological seasons by month, flipped south of the equator.
 */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export const SEASONS: readonly Season[] = ['spring', 'summer', 'autumn', 'winter'];

const NORTHERN: Season[] = [
  'winter', // Jan
  'winter',
  'spring',
  'spring',
  'spring',
  'summer',
  'summer',
  'summer',
  'autumn',
  'autumn',
  'autumn',
  'winter', // Dec
];

const OPPOSITE: Record<Season, Season> = { spring: 'autumn', summer: 'winter', autumn: 'spring', winter: 'summer' };

/** Season on `date`; southern-hemisphere latitudes (< 0) get the opposite season. */
export function seasonFor(date: Date, latitude: number | null = null): Season {
  const northern = NORTHERN[date.getMonth()];
  return latitude !== null && latitude < 0 ? OPPOSITE[northern] : northern;
}
