import { describe, expect, it } from 'vitest';
import {
  DAILY_PET_CAP,
  LEVEL_THRESHOLDS,
  addPet,
  bondsSpec,
  cleanName,
  levelFor,
  levelProgress,
  sanitizeBonds,
  unlockedAccessories,
  type CompanionBond,
} from '$lib/stores/bond';

const fresh = (): CompanionBond => ({ name: null, points: 0, petsToday: 0, petDay: null });

describe('friendship levels', () => {
  it('maps points to levels at the thresholds', () => {
    expect(levelFor(0)).toBe(0);
    expect(levelFor(LEVEL_THRESHOLDS[1] - 1)).toBe(0);
    expect(levelFor(LEVEL_THRESHOLDS[1])).toBe(1);
    expect(levelFor(10_000)).toBe(LEVEL_THRESHOLDS.length - 1);
  });

  it('reports progress toward the next level', () => {
    expect(levelProgress(0)).toBe(0);
    const mid = (LEVEL_THRESHOLDS[1] + LEVEL_THRESHOLDS[2]) / 2;
    expect(levelProgress(mid)).toBeCloseTo(0.5);
    expect(levelProgress(10_000)).toBe(1);
  });

  it('unlocks accessories as friendship grows', () => {
    expect(unlockedAccessories(0)).toEqual([]);
    expect(unlockedAccessories(LEVEL_THRESHOLDS[2])).toEqual(['flower']);
    expect(unlockedAccessories(LEVEL_THRESHOLDS[4])).toEqual(['flower', 'crown']);
  });
});

describe('petting', () => {
  const day = (d: number, h = 10) => new Date(2026, 9, d, h);

  it('counts pets toward friendship up to a daily cap', () => {
    let bond = fresh();
    for (let i = 0; i < DAILY_PET_CAP + 10; i++) bond = addPet(bond, day(10));
    expect(bond.points).toBe(DAILY_PET_CAP);
    expect(bond.petsToday).toBe(DAILY_PET_CAP + 10);
  });

  it('resets the cap on a new day', () => {
    let bond = fresh();
    for (let i = 0; i < DAILY_PET_CAP; i++) bond = addPet(bond, day(10));
    bond = addPet(bond, day(11, 8));
    expect(bond.points).toBe(DAILY_PET_CAP + 1);
    expect(bond.petsToday).toBe(1);
  });
});

describe('stored bonds', () => {
  it('cleans names: trims, strips control characters and limits the length', () => {
    expect(cleanName('  Mochi \n')).toBe('Mochi');
    expect(cleanName('a'.repeat(100))).toHaveLength(24);
    expect(cleanName('   ')).toBeNull();
    expect(cleanName(42)).toBeNull();
  });

  it('fills in every companion and repairs bad values', () => {
    const bonds = sanitizeBonds({ fox: { name: 'Kit', points: -5, petDay: 'yesterday' }, nope: {} });
    expect(bonds?.fox).toEqual({ name: 'Kit', points: 0, petsToday: 0, petDay: null });
    expect(bonds?.cat).toEqual(fresh());
    expect(bonds && 'nope' in bonds).toBe(false);
    expect(Object.keys(bondsSpec.defaults())).toContain('drone');
  });
});
