/**
 * The bond with each companion: a name the user chooses and a friendship that
 * grows from petting and finished focus sessions. Friendship never goes down —
 * TickPuff is a calm companion, not a chore.
 */
import { derived } from 'svelte/store';
import { asNumber, isRecord, persisted, type PersistSpec } from '$lib/core/persistence';
import { localDateKey } from '$lib/core/time/clock';
import { COMPANION_IDS } from '$lib/companion/registry/companions';
import type { CompanionId } from '$lib/types';

export interface CompanionBond {
  /** Name chosen by the user (null = use the species name). */
  name: string | null;
  /** Friendship points (only ever increase). */
  points: number;
  /** Pets counted today, and which day that is (for the daily cap). */
  petsToday: number;
  petDay: string | null;
}

export type Bonds = Record<CompanionId, CompanionBond>;

export const NAME_MAX_LENGTH = 24;
/** Petting counts toward friendship up to this many times a day. */
export const DAILY_PET_CAP = 15;
export const POINTS_PER_PET = 1;
export const POINTS_PER_FOCUS = 5;

/** Points needed to reach each level (level = index). */
export const LEVEL_THRESHOLDS = [0, 10, 30, 60, 100, 160] as const;

export const LEVEL_NAMES = ['New friend', 'Buddy', 'Pal', 'Close friend', 'Best friend', 'Soulmate'] as const;

/** Accessories unlocked at friendship levels. */
export type Accessory = 'flower' | 'crown';
export const ACCESSORY_LEVELS: Record<Accessory, number> = { flower: 2, crown: 4 };

const emptyBond = (): CompanionBond => ({ name: null, points: 0, petsToday: 0, petDay: null });

export function levelFor(points: number): number {
  let level = 0;
  LEVEL_THRESHOLDS.forEach((threshold, i) => {
    if (points >= threshold) level = i;
  });
  return level;
}

/** Progress to the next level, 0–1 (1 at the top level). */
export function levelProgress(points: number): number {
  const level = levelFor(points);
  const next = LEVEL_THRESHOLDS[level + 1];
  if (next === undefined) return 1;
  const from = LEVEL_THRESHOLDS[level];
  return (points - from) / (next - from);
}

export function unlockedAccessories(points: number): Accessory[] {
  const level = levelFor(points);
  return (Object.keys(ACCESSORY_LEVELS) as Accessory[]).filter((a) => level >= ACCESSORY_LEVELS[a]);
}

export function cleanName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  // Drop control characters (newlines, tabs, …) so a name stays one tidy line.
  const printable = [...raw].filter((c) => c.charCodeAt(0) >= 32 && c.charCodeAt(0) !== 127).join('');
  const name = printable.trim().slice(0, NAME_MAX_LENGTH);
  return name.length > 0 ? name : null;
}

export function sanitizeBonds(raw: unknown): Bonds | null {
  if (!isRecord(raw)) return null;
  const bonds = {} as Bonds;
  for (const id of COMPANION_IDS) {
    const entry = raw[id];
    bonds[id] = isRecord(entry)
      ? {
          name: cleanName(entry.name),
          points: Math.floor(asNumber(entry.points, 0, 0, 1_000_000)),
          petsToday: Math.floor(asNumber(entry.petsToday, 0, 0, 1000)),
          petDay: typeof entry.petDay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(entry.petDay) ? entry.petDay : null,
        }
      : emptyBond();
  }
  return bonds;
}

export const bondsSpec: PersistSpec<Bonds> = {
  key: 'tickpuff-bonds',
  version: 1,
  defaults: () => sanitizeBonds({}) as Bonds,
  sanitize: sanitizeBonds,
};

/** Pure update for a pet: counts toward friendship until the daily cap. */
export function addPet(bond: CompanionBond, now: Date): CompanionBond {
  const day = localDateKey(now);
  const petsToday = bond.petDay === day ? bond.petsToday : 0;
  const counts = petsToday < DAILY_PET_CAP;
  return {
    ...bond,
    petDay: day,
    petsToday: petsToday + 1,
    points: bond.points + (counts ? POINTS_PER_PET : 0),
  };
}

function createBonds() {
  const store = persisted(bondsSpec);
  const update = (id: CompanionId, change: (bond: CompanionBond) => CompanionBond) =>
    store.update((bonds) => ({ ...bonds, [id]: change(bonds[id] ?? emptyBond()) }));
  return {
    subscribe: store.subscribe,
    pet: (id: CompanionId) => update(id, (bond) => addPet(bond, new Date())),
    focusCompleted: (id: CompanionId) => update(id, (bond) => ({ ...bond, points: bond.points + POINTS_PER_FOCUS })),
    rename: (id: CompanionId, name: string) => update(id, (bond) => ({ ...bond, name: cleanName(name) })),
  };
}

export const bonds = createBonds();

/** Display name: the user's name for it, or the species name. */
export const nameFor = (bonds: Bonds, id: CompanionId, species: string): string => bonds[id]?.name ?? species;

/** Bond of one companion, for components that only care about the active one. */
export const bondOf = (id: CompanionId) => derived(bonds, ($bonds) => $bonds[id] ?? emptyBond());
