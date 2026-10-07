import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { createPoller, createSharedLifecycle } from '$lib/core/scheduling/poller';
import { localDateKey, timeOfDayFor } from '$lib/core/time/clock';
import { seededRandom, weightedPick, wrapAngle } from '$lib/core/math';
import { EffectsLayer } from '$lib/effects/EffectsLayer';
import { AMBIENT_PRESETS, WEATHER_PRESETS, particleCount } from '$lib/effects/presets';
import { sanitizeClock } from '$lib/stores/settings';

describe('time of day', () => {
  it('uses the documented boundaries', () => {
    const at = (h: number) => timeOfDayFor(new Date(2026, 0, 1, h, 30));
    expect([5, 8, 9, 16, 17, 19, 20, 22, 23, 2].map(at)).toEqual([
      'morning',
      'morning',
      'day',
      'day',
      'sunset',
      'sunset',
      'night',
      'night',
      'late-night',
      'late-night',
    ]);
  });

  it('formats local (not UTC) date keys', () => {
    expect(localDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('poller', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('never overlaps runs and stops cleanly', async () => {
    let active = 0;
    let maxActive = 0;
    let runs = 0;
    const poller = createPoller({
      intervalMs: 100,
      run: async () => {
        active++;
        runs++;
        maxActive = Math.max(maxActive, active);
        await new Promise((r) => setTimeout(r, 250)); // slower than the interval
        active--;
      },
    });
    poller.start();
    await vi.advanceTimersByTimeAsync(1000);
    expect(maxActive).toBe(1);
    poller.stop();
    const before = runs;
    await vi.advanceTimersByTimeAsync(2000);
    expect(runs).toBe(before);
    expect(poller.running).toBe(false);
  });

  it('aborts the in-flight run on stop', async () => {
    let signal: AbortSignal | undefined;
    const poller = createPoller({ intervalMs: 100, run: (s) => ((signal = s), new Promise(() => undefined)) });
    poller.start();
    await vi.advanceTimersByTimeAsync(1);
    poller.stop();
    expect(signal?.aborted).toBe(true);
  });

  it('shared lifecycle runs while any consumer holds it', () => {
    const start = vi.fn();
    const stop = vi.fn();
    const lifecycle = createSharedLifecycle(start, stop);
    const a = lifecycle.acquire();
    const b = lifecycle.acquire();
    expect(start).toHaveBeenCalledTimes(1);
    a();
    a(); // double release is harmless
    expect(stop).not.toHaveBeenCalled();
    b();
    expect(stop).toHaveBeenCalledTimes(1);
  });
});

describe('math', () => {
  it('wraps angles and picks weights deterministically', () => {
    expect(wrapAngle(Math.PI * 3)).toBeCloseTo(Math.PI);
    expect(wrapAngle(-Math.PI * 1.5)).toBeCloseTo(Math.PI / 2);
    const random = seededRandom(1);
    const picks = Array.from({ length: 2000 }, () => weightedPick(random, { a: 1, b: 3, c: 0 }));
    expect(picks).not.toContain('c');
    const ratio = picks.filter((p) => p === 'b').length / picks.length;
    expect(ratio).toBeGreaterThan(0.7);
    expect(ratio).toBeLessThan(0.8);
  });
});

describe('effects', () => {
  it('scales particle counts with density and turns off at 0', () => {
    const rain = WEATHER_PRESETS.rain!;
    expect(particleCount(rain, 1)).toBe(rain.count);
    expect(particleCount(rain, 0.5)).toBe(Math.round(rain.count / 2));
    expect(particleCount(rain, 0.01)).toBe(rain.minCount);
    expect(particleCount(rain, 0)).toBe(0);
    expect(particleCount(AMBIENT_PRESETS.fireflies, 0.1)).toBeGreaterThanOrEqual(AMBIENT_PRESETS.fireflies.minCount);
  });

  it('adds one draw call per effect and cleans up on change', () => {
    const scene = new THREE.Scene();
    const layer = new EffectsLayer(scene);
    const points = () => scene.children.filter((c) => (c as THREE.Points).isPoints).length;
    layer.setWeather('rain');
    layer.setAmbient(['fireflies']);
    expect(points()).toBe(2);
    layer.setWeather('fog'); // fog is CSS, no particles
    expect(points()).toBe(1);
    layer.setDensity(0);
    expect(points()).toBe(0);
    expect(layer.active).toBe(false);
    layer.setDensity(1);
    expect(points()).toBe(1); // remembered ambient effect comes back
    layer.dispose();
    expect(points()).toBe(0);
  });
});

describe('clock settings', () => {
  it('keeps valid custom colours and clamps out-of-range values', () => {
    expect(sanitizeClock({ font: 'Comic Sans', size: 99, weight: 450, color: '#FFFFFF' })).toMatchObject({
      font: 'Pixelify Sans',
      size: 16,
      weight: 500,
      color: '#ffffff',
    });
    expect(sanitizeClock({ color: 'red; background: url(x)' })?.color).toBeNull();
  });
});
