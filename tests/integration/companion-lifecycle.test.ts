/**
 * Every registered companion builds, animates through every activity without
 * producing NaNs, and releases its GPU resources on dispose. No WebGL needed.
 */
import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { COMPANIONS } from '$lib/companion/registry/companions';
import { loadProceduralCompanion, rigFromScene } from '$lib/companion/engine/CompanionLoader';
import { ClipAnimator } from '$lib/companion/animation/ClipAnimator';
import { THEMES } from '$lib/themes/registry';
import type { CompanionActivity } from '$lib/types';

const ACTIVITIES: CompanionActivity[] = [
  'idle',
  'walk',
  'run',
  'sit',
  'sleep',
  'wake',
  'stretch',
  'look',
  'react',
  'play',
  'celebrate',
  'focus',
  'weather-react',
  'explore',
];

function finite(object: THREE.Object3D): boolean {
  let ok = true;
  object.traverse((o) => {
    for (const value of [...o.position.toArray(), o.rotation.x, o.rotation.y, o.rotation.z, ...o.scale.toArray()]) {
      if (!Number.isFinite(value)) ok = false;
    }
  });
  return ok;
}

describe('companion lifecycle', () => {
  it('every theme only offers registered companions', () => {
    for (const theme of THEMES) {
      for (const id of theme.companions) expect(COMPANIONS[id]).toBeDefined();
      expect(theme.companions).toContain(theme.defaultCompanion);
      expect(theme.allowedWeather).toContain(theme.defaultWeather);
    }
  });

  for (const definition of Object.values(COMPANIONS)) {
    it(`${definition.id}: builds, animates every activity and disposes`, () => {
      const companion = loadProceduralCompanion(definition);
      const { rig, animator } = companion;
      expect(rig.root.children.length).toBeGreaterThan(0);
      expect(rig.height).toBeGreaterThan(0);

      let time = 0;
      for (const activity of ACTIVITIES) {
        for (let frame = 0; frame < 45; frame++) {
          time += 1 / 30;
          animator.update(1 / 30, time, {
            activity,
            activityTime: frame / 30,
            speed: activity === 'walk' || activity === 'run' || activity === 'explore' ? definition.speed.walk : 0,
            runSpeed: definition.speed.run,
            lookYaw: 0.3,
            lookPitch: -0.1,
            lookWeight: activity === 'look' ? 1 : 0,
          });
        }
        expect(finite(rig.root), `${definition.id} / ${activity}`).toBe(true);
      }

      const disposed = vi.fn();
      rig.root.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.addEventListener('dispose', disposed);
      });
      const geometries = disposed.mock.calls.length;
      companion.dispose();
      expect(disposed.mock.calls.length).toBeGreaterThan(geometries);
    });
  }
});

describe('GLB support', () => {
  it('normalizes an imported scene to the authored height with feet on the ground', () => {
    const scene = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 2));
    body.position.set(5, 10, 0);
    const head = new THREE.Object3D();
    head.name = 'Head';
    scene.add(body, head);
    const rig = rigFromScene(scene);
    const box = new THREE.Box3().setFromObject(rig.root);
    expect(box.max.y - box.min.y).toBeCloseTo(1.6, 5);
    expect(box.min.y).toBeCloseTo(0, 5);
    expect((box.min.x + box.max.x) / 2).toBeCloseTo(0, 5);
    expect(rig.head).toBe(head);
  });

  it('maps activities to clips with a sensible fallback chain', () => {
    const root = new THREE.Object3D();
    const clip = (name: string) => new THREE.AnimationClip(name, 1, []);
    const animator = new ClipAnimator(new THREE.AnimationMixer(root), [clip('Idle'), clip('Walk'), clip('Sleep')], {
      idle: 'Idle',
      walk: 'Walk',
      sleep: 'Sleep',
      play: 'Missing',
    });
    expect(animator.clipFor('sleep', false)).toBe('Sleep');
    expect(animator.clipFor('run', true)).toBe('Walk');
    expect(animator.clipFor('play', false)).toBe('Idle');
  });
});
