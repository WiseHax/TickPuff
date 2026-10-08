/**
 * Companion model art (cel shading, outlines) and the procedural scenery
 * generators used by the 2D worlds.
 */
import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { PROCEDURAL_MODELS, buildProcedural } from '$lib/companion/models/procedural';
import { disposeObject } from '$lib/companion/models/parts';
import { COMPANION_SIZE_SCALE, companionSizeSpec } from '$lib/stores/settings';
import { COMPANION_SIZES, type ProceduralModelId } from '$lib/types';
import { H, W, mountains, pineRow, ridge, ridgeHeight, rng, starField } from '$lib/themes/scenes/art';

const MODEL_IDS = Object.keys(PROCEDURAL_MODELS) as ProceduralModelId[];

function meshes(root: THREE.Object3D): THREE.Mesh[] {
  const list: THREE.Mesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) list.push(o as THREE.Mesh);
  });
  return list;
}

describe('procedural companion models', () => {
  for (const id of MODEL_IDS) {
    it(`${id}: toon meshes carry shading colours and opaque shells get outlines`, () => {
      const rig = buildProcedural(id);
      const all = meshes(rig.root);
      const hulls = all.filter((m) => m.userData.outline);
      const shells = all.filter((m) => !m.userData.outline);

      // Toon materials use vertex colours; a mesh without them would render black.
      for (const mesh of shells) {
        const material = mesh.material as THREE.Material;
        if (material instanceof THREE.MeshToonMaterial) {
          expect(mesh.geometry.getAttribute('color'), `${id} mesh without vertex colours`).toBeDefined();
        }
      }

      // Every opaque, non-detail shell gets exactly one hull (the translucent jelly gets none).
      const outlined = shells.filter((m) => {
        const material = m.material as THREE.Material;
        return !material.transparent && !(material instanceof THREE.MeshBasicMaterial) && !m.userData.noOutline;
      });
      expect(hulls).toHaveLength(outlined.length);
      if (id !== 'jellyfish') expect(hulls.length).toBeGreaterThan(3);
      for (const hull of hulls) {
        const parent = hull.parent as THREE.Mesh;
        expect(parent.isMesh).toBe(true);
        expect(hull.geometry).toBe(parent.geometry);
        const parentMaterial = parent.material as THREE.Material;
        expect(parentMaterial.transparent).toBe(false);
        expect(parent.userData.noOutline).toBeFalsy();
      }

      // Every geometry and material is released exactly once.
      const geometries = new Set(all.map((m) => m.geometry));
      const disposed = vi.fn();
      for (const geometry of geometries) geometry.addEventListener('dispose', disposed);
      disposeObject(rig.root);
      expect(disposed).toHaveBeenCalledTimes(geometries.size);
    });
  }

  it('builds the same model every time (deterministic shapes)', () => {
    const count = (id: ProceduralModelId) => meshes(buildProcedural(id).root).length;
    for (const id of MODEL_IDS) expect(count(id)).toBe(count(id));
  });
});

describe('companion size setting', () => {
  it('has a scale for every size, growing from small to large', () => {
    const scales = COMPANION_SIZES.map((size) => COMPANION_SIZE_SCALE[size]);
    expect(scales).toEqual([...scales].sort((a, b) => a - b));
    expect(scales.every((s) => s > 0)).toBe(true);
  });

  it('accepts known sizes and rejects anything else', () => {
    expect(companionSizeSpec.sanitize('small')).toBe('small');
    expect(companionSizeSpec.sanitize('huge')).toBeNull();
    expect(companionSizeSpec.sanitize(3)).toBeNull();
    expect(companionSizeSpec.defaults()).toBe('large');
  });
});

describe('scenery generators', () => {
  it('rng is deterministic per seed', () => {
    const a = rng(42);
    const b = rng(42);
    const c = rng(43);
    const seqA = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(seqA);
    expect([c(), c(), c()]).not.toEqual(seqA);
    expect(seqA.every((v) => v >= 0 && v < 1)).toBe(true);
  });

  it('ridges stay within their amplitude and close at the bottom', () => {
    const options = { y: 500, amplitude: 40 };
    const height = ridgeHeight(7, options);
    for (let x = 0; x <= W; x += 50) {
      expect(height(x)).toBeGreaterThanOrEqual(460);
      expect(height(x)).toBeLessThanOrEqual(540);
    }
    const path = ridge(7, options);
    expect(path.startsWith(`M0,${H}`)).toBe(true);
    expect(path.endsWith('Z')).toBe(true);
    expect(ridge(7, options)).toBe(path);
  });

  it('pine rows leave the requested gap free', () => {
    const trees = pineRow(3, { y: 600, count: 40, minHeight: 100, maxHeight: 200, gap: [500, 1100] });
    // Each tree starts with its trunk: "M{x - w},{y} ..." — check every trunk's x.
    const trunks = [...trees.matchAll(/M(-?[\d.]+),[\d.]+ L-?[\d.]+,[\d.]+ L(-?[\d.]+),/g)].map(
      (m) => (Number(m[1]) + Number(m[2])) / 2,
    );
    expect(trunks.length).toBeGreaterThan(5);
    for (const x of trunks) expect(x < 500 || x > 1100).toBe(true);
  });

  it('mountains draw snow only on the tall peaks', () => {
    const range = mountains(11, 430, 230, 4);
    expect(range.body).toMatch(/^M0,900 /);
    expect(range.snow.length).toBeGreaterThan(0);
    expect(mountains(11, 430, 0, 4).snow).toBe('');
  });

  it('stars stay inside the sky', () => {
    const stars = starField(5, 100, 400);
    expect(stars).toHaveLength(100);
    for (const star of stars) {
      expect(star.x).toBeGreaterThanOrEqual(0);
      expect(star.x).toBeLessThanOrEqual(W);
      expect(star.y).toBeLessThanOrEqual(400);
    }
  });
});
