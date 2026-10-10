/**
 * The season shown in the worlds: follows the calendar (and the hemisphere of
 * the weather location, if set) unless the user pins one.
 */
import { derived } from 'svelte/store';
import { persisted, type PersistSpec } from '$lib/core/persistence';
import { observerLocation, today } from '$lib/core/time/clock';
import { SEASONS, seasonFor, type Season } from '$lib/core/time/season';

export type SeasonSetting = 'auto' | Season;

export const SEASON_SETTINGS: readonly SeasonSetting[] = ['auto', ...SEASONS];

export const seasonSettingSpec: PersistSpec<SeasonSetting> = {
  key: 'tickpuff-season',
  version: 1,
  defaults: () => 'auto',
  sanitize: (raw) =>
    typeof raw === 'string' && (SEASON_SETTINGS as readonly string[]).includes(raw) ? (raw as SeasonSetting) : null,
};

export const seasonSetting = persisted(seasonSettingSpec);

/** Dev builds only: preview a season with `?season=winter`. */
function devSeasonOverride(): Season | null {
  if (!import.meta.env.DEV || typeof location === 'undefined') return null;
  const value = new URLSearchParams(location.search).get('season');
  return (SEASONS as readonly string[]).includes(value ?? '') ? (value as Season) : null;
}

const override = devSeasonOverride();

/** Recomputed when the day changes, the location changes or the setting changes. */
export const season = derived(
  [seasonSetting, today, observerLocation],
  ([$setting, , $location]): Season =>
    override ?? ($setting === 'auto' ? seasonFor(new Date(), $location?.latitude ?? null) : $setting),
);
