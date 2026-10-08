/**
 * Procedural scenery helpers for the 2D world layers.
 *
 * Scenes are drawn in a 1600 × 900 SVG space (anchored to the bottom of the
 * window with `xMidYMax slice`). Everything here is deterministic — the same
 * seed always draws the same landscape — and is computed once per scene
 * mount, so there is no per-frame cost.
 */

export const W = 1600;
export const H = 900;

/**
 * Ground line in scene units: the walkable stage (screen 80–93 % from the
 * top, see StageMapper) sits just below it.
 */
export const GROUND_Y = 650;

/** Small deterministic PRNG (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number) => Math.round(n * 10) / 10;

/** Smooth 1D noise built from a few random sine waves. */
function waves(random: () => number, octaves: number): (x: number) => number {
  const parts = Array.from({ length: octaves }, (_, i) => ({
    freq: (0.6 + random() * 0.8) * 2 ** i,
    phase: random() * Math.PI * 2,
    amp: 1 / 1.8 ** i,
  }));
  const total = parts.reduce((sum, p) => sum + p.amp, 0);
  return (x) => parts.reduce((sum, p) => sum + Math.sin(x * p.freq + p.phase) * p.amp, 0) / total;
}

export interface RidgeOptions {
  /** Average height of the ridge line (scene units from the top). */
  y: number;
  /** Peak-to-valley amplitude. */
  amplitude: number;
  /** Number of noise octaves; more = more jagged. */
  roughness?: number;
  /** Horizontal stretch: higher = wider hills. */
  scale?: number;
  /** Bottom of the filled shape. */
  bottom?: number;
}

/** Height of a ridge at x (exposed so props can sit on it). */
export function ridgeHeight(seed: number, options: RidgeOptions): (x: number) => number {
  const noise = waves(rng(seed), options.roughness ?? 3);
  const scale = options.scale ?? 1;
  return (x) => options.y + noise((x / W) * Math.PI * 2 * (1.5 / scale)) * options.amplitude;
}

/** Closed path of a rolling ridge / mountain range filled to the bottom. */
export function ridge(seed: number, options: RidgeOptions): string {
  const height = ridgeHeight(seed, options);
  const bottom = options.bottom ?? H;
  let d = `M0,${bottom} L0,${f(height(0))}`;
  for (let x = 16; x <= W; x += 16) d += ` L${x},${f(height(x))}`;
  return `${d} L${W},${bottom} Z`;
}

/** Sharp mountain range (jagged peaks with shoulders) plus snow caps for the tallest peaks. */
export function mountains(seed: number, y: number, amplitude: number, peaks = 5): { body: string; snow: string } {
  const random = rng(seed);
  const points: [number, number][] = [[0, y + random() * amplitude * 0.4]];
  const step = W / (peaks * 2);
  let snow = '';
  for (let i = 1; i <= peaks * 2; i++) {
    const peak = i % 2 === 1;
    const x = i * step + (random() - 0.5) * step * 0.6;
    const h = peak ? y - amplitude * (0.5 + random() * 0.5) : y - amplitude * random() * 0.25;
    const prev = points[points.length - 1];
    // A shoulder on the way to each peak for a natural silhouette.
    const shoulder: [number, number] = [(prev[0] + x) / 2, (prev[1] + h) / 2 + (random() - 0.6) * amplitude * 0.12];
    points.push(shoulder, [x, h]);
    if (peak && y - h > amplitude * 0.6) {
      const depth = (y - h) * 0.24;
      const left = x + (shoulder[0] - x) * 0.3;
      const leftY = h + (shoulder[1] - h) * 0.3;
      snow +=
        `M${f(left)},${f(leftY)} L${f(x)},${f(h)} L${f(x + step * 0.18)},${f(h + depth)} ` +
        `L${f(x + step * 0.05)},${f(h + depth * 0.7)} L${f(x - step * 0.03)},${f(h + depth * 1.1)} Z `;
    }
  }
  points.push([W, y]);
  return {
    body: `M0,${H} ${points.map(([x, py]) => `L${f(x)},${f(py)}`).join(' ')} L${W},${H} Z`,
    snow: snow.trim(),
  };
}

/** One layered pine tree with its base centre at (x, y). */
function pine(x: number, y: number, height: number, random: () => number): string {
  const tiers = 3 + Math.floor(random() * 2);
  const width = height * (0.36 + random() * 0.1);
  const trunk = height * 0.08;
  let d = `M${f(x - width * 0.06)},${f(y)} L${f(x - width * 0.06)},${f(y - trunk)} L${f(x + width * 0.06)},${f(y - trunk)} L${f(x + width * 0.06)},${f(y)} Z `;
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers;
    const base = y - trunk - (height - trunk) * t * 0.78;
    const top = y - height * (0.45 + t * 0.55) - height * 0.02;
    const w = width * (1 - t * 0.62) * 0.5;
    const droop = height * 0.04;
    d += `M${f(x - w)},${f(base)} Q${f(x - w * 0.5)},${f(base - droop)} ${f(x)},${f(top)} Q${f(x + w * 0.5)},${f(base - droop)} ${f(x + w)},${f(base)} Q${f(x)},${f(base - droop * 2)} ${f(x - w)},${f(base)} Z `;
  }
  return d;
}

export interface TreeRowOptions {
  /** Baseline (scene units); trees grow up from here. */
  y: number;
  count: number;
  minHeight: number;
  maxHeight: number;
  /** Vertical scatter of the baseline. */
  jitter?: number;
  /** Leave a gap (x range) free of trees, e.g. for the stage. */
  gap?: [number, number];
  from?: number;
  to?: number;
}

/** A row of pine silhouettes as a single path. */
export function pineRow(seed: number, options: TreeRowOptions): string {
  const random = rng(seed);
  const from = options.from ?? -40;
  const to = options.to ?? W + 40;
  const step = (to - from) / options.count;
  let d = '';
  for (let i = 0; i < options.count; i++) {
    const x = from + step * (i + 0.5) + (random() - 0.5) * step * 0.9;
    const h = options.minHeight + random() * (options.maxHeight - options.minHeight);
    const y = options.y + (random() - 0.5) * (options.jitter ?? 0);
    if (options.gap && x > options.gap[0] && x < options.gap[1]) continue;
    d += pine(x, y, h, random);
  }
  return d;
}

/** Soft, puffy canopy (blossoms, round trees) made of overlapping circles. */
export function canopy(seed: number, cx: number, cy: number, rx: number, ry: number, puffs = 14): string {
  const random = rng(seed);
  let d = '';
  for (let i = 0; i < puffs; i++) {
    const a = random() * Math.PI * 2;
    const r = Math.sqrt(random());
    const x = cx + Math.cos(a) * rx * r * 0.8;
    const y = cy + Math.sin(a) * ry * r * 0.7;
    const size = (rx + ry) * (0.16 + random() * 0.14);
    d += `M${f(x - size)},${f(y)} a${f(size)},${f(size)} 0 1,0 ${f(size * 2)},0 a${f(size)},${f(size)} 0 1,0 ${f(-size * 2)},0 `;
  }
  return d;
}

export interface Star {
  x: number;
  y: number;
  r: number;
  delay: number;
  duration: number;
}

/** Star field in the upper part of the sky. */
export function starField(seed: number, count: number, maxY = H * 0.55): Star[] {
  const random = rng(seed);
  return Array.from({ length: count }, () => {
    const big = random() > 0.9;
    return {
      x: f(random() * W),
      y: f(random() ** 1.4 * maxY),
      r: f(big ? 1.6 + random() * 1.2 : 0.6 + random() * 0.9),
      delay: f(random() * 6),
      duration: f(2.5 + random() * 4),
    };
  });
}

export interface Cloud {
  d: string;
  x: number;
  y: number;
  scale: number;
  duration: number;
  delay: number;
  opacity: number;
}

/** Fluffy flat-bottomed clouds that drift across the sky. */
export function clouds(seed: number, count: number, minY: number, maxY: number): Cloud[] {
  const random = rng(seed);
  return Array.from({ length: count }, (_, i) => {
    const width = 160 + random() * 200;
    let d = '';
    const puffs = 4 + Math.floor(random() * 3);
    for (let p = 0; p < puffs; p++) {
      const t = p / (puffs - 1);
      const r = width * (0.12 + Math.sin(t * Math.PI) * 0.14 + random() * 0.05);
      const x = t * width;
      d += `M${f(x - r)},0 a${f(r)},${f(r)} 0 1,1 ${f(r * 2)},0 Z `;
    }
    d += `M${f(-width * 0.08)},0 L${f(width * 1.08)},0 L${f(width * 1.08)},${f(width * 0.05)} Q${f(width / 2)},${f(width * 0.1)} ${f(-width * 0.08)},${f(width * 0.05)} Z`;
    return {
      d,
      x: f((i / count) * W + random() * 120),
      y: f(minY + random() * (maxY - minY)),
      scale: f(0.45 + random() * 0.45),
      duration: Math.round(160 + random() * 140),
      delay: -Math.round(random() * 300),
      opacity: f(0.5 + random() * 0.4),
    };
  });
}

/** Grass blades along a baseline as one path. */
export function grass(seed: number, y: number, count: number, minH: number, maxH: number, from = 0, to = W): string {
  const random = rng(seed);
  let d = '';
  for (let i = 0; i < count; i++) {
    const x = from + random() * (to - from);
    const h = minH + random() * (maxH - minH);
    const lean = (random() - 0.5) * h * 0.6;
    const w = 2 + random() * 3;
    d += `M${f(x - w)},${f(y)} Q${f(x + lean * 0.3)},${f(y - h * 0.6)} ${f(x + lean)},${f(y - h)} Q${f(x + lean * 0.3 + w * 0.4)},${f(y - h * 0.5)} ${f(x + w)},${f(y)} Z `;
  }
  return d;
}

export interface Speck {
  x: number;
  y: number;
  r: number;
  hue: number;
}

/** Scattered small dots (flowers, pebbles) within a band, smaller toward the back. */
export function specks(seed: number, count: number, top: number, bottom: number, size: number): Speck[] {
  const random = rng(seed);
  return Array.from({ length: count }, () => {
    const depth = random();
    return {
      x: f(random() * W),
      y: f(top + depth * (bottom - top)),
      r: f(size * (0.45 + depth * 0.8) * (0.7 + random() * 0.5)),
      hue: random(),
    };
  });
}

/** `color-mix` shorthand for theme-tinted fills (`a` at `pct` %, rest `b`). */
export function mix(a: string, b: string, pct: number): string {
  return `color-mix(in oklab, ${a} ${pct}%, ${b})`;
}

/** Theme colour variables (set on :root by the layout). */
export const TOP = 'var(--bg-top)';
export const BOTTOM = 'var(--bg-bottom)';
export const ACCENT = 'var(--accent-color)';
