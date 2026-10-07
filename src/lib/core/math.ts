/** Small numeric helpers shared by the engine (no three.js dependency). */

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Frame-rate independent exponential smoothing toward `target`. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

/** Wrap an angle to (-PI, PI]. */
export function wrapAngle(angle: number): number {
  const twoPi = Math.PI * 2;
  let a = angle % twoPi;
  if (a <= -Math.PI) a += twoPi;
  if (a > Math.PI) a -= twoPi;
  return a;
}

/** Smooth an angle toward a target along the shortest arc. */
export function dampAngle(current: number, target: number, lambda: number, dt: number): number {
  return current + wrapAngle(target - current) * (1 - Math.exp(-lambda * dt));
}

/** Deterministic PRNG (mulberry32). Returns numbers in [0, 1). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Random = () => number;

export const randomBetween = (random: Random, min: number, max: number) => min + (max - min) * random();

/** Pick a key with probability proportional to its weight. */
export function weightedPick<K extends string>(random: Random, weights: Partial<Record<K, number>>): K | null {
  let total = 0;
  for (const weight of Object.values(weights) as number[]) total += Math.max(0, weight);
  if (total <= 0) return null;
  let roll = random() * total;
  for (const [key, weight] of Object.entries(weights) as [K, number][]) {
    roll -= Math.max(0, weight);
    if (roll < 0) return key;
  }
  return null;
}
