import * as THREE from 'three';
import type { CompanionRig } from '../rig';
import { at, cone, ellipsoid, eye, limb, pair, pivot, rotated, sphere, toon } from '../parts';

function bodyAt(y: number): THREE.Group {
  const body = pivot(0, y, 0);
  body.userData.restY = y;
  return body;
}

export function buildOwl(): CompanionRig {
  const tawny = toon(0xbf8f5f);
  const wing = toon(0x9c7048);
  const cream = toon(0xf6ead6);
  const face = toon(0xfdf7ee);
  const beakColor = toon(0xe2b26b);

  const root = new THREE.Group();
  const body = bodyAt(0.62);
  root.add(body);
  body.add(ellipsoid(0.4, 0.48, 0.38, tawny));
  body.add(at(ellipsoid(0.3, 0.38, 0.26, cream), 0, -0.05, 0.14));
  const speckle = toon(0xa27a52);
  for (const [x, y] of [
    [-0.1, 0.05],
    [0.08, -0.06],
    [-0.04, -0.18],
    [0.12, 0.12],
    [-0.14, -0.08],
  ]) {
    body.add(at(sphere(0.022, speckle, 6), x, y, 0.385));
  }

  const head = pivot(0, 0.55, 0);
  head.add(ellipsoid(0.4, 0.36, 0.36, tawny));
  // Heart-shaped facial disc from two overlapping lobes.
  const lobes = pair((s) => at(ellipsoid(0.18, 0.26, 0.1, face), s * 0.1, -0.02, 0.27));
  head.add(...lobes);
  const eyes = pair((s) => at(eye(0.075, 0x1a120c), s * 0.12, 0.02, 0.35));
  head.add(...eyes);
  head.add(rotated(at(cone(0.04, 0.12, beakColor, 12), 0, -0.04, 0.37), 2.4));
  body.add(head);

  const arms = pair((s) => {
    const w = rotated(pivot(s * 0.36, 0.25, -0.02), 0, 0, s * 0.08);
    w.add(at(ellipsoid(0.08, 0.34, 0.24, wing), 0, -0.24, -0.04));
    return w;
  });
  body.add(...arms);

  const legs = pair((s) => {
    const leg = pivot(s * 0.12, -0.45, 0.06);
    leg.add(limb(0.04, 0.17, beakColor));
    for (const spread of [-0.4, 0, 0.4]) {
      leg.add(rotated(at(ellipsoid(0.025, 0.02, 0.06, beakColor, 8), Math.sin(spread) * 0.05, -0.16, 0.04), 0, spread));
    }
    return leg;
  });
  body.add(...legs);

  return { root, body, head, arms, legs, eyes, height: 1.55, footprint: 0.45 };
}

export function buildPenguin(): CompanionRig {
  const navy = toon(0x22314a);
  const white = toon(0xf6f6f2);
  const orange = toon(0xf5a524);
  const blush = toon(0xf7a1b3);

  const root = new THREE.Group();
  const body = bodyAt(0.62);
  root.add(body);
  body.add(ellipsoid(0.38, 0.55, 0.36, navy));
  body.add(at(ellipsoid(0.3, 0.46, 0.26, white), 0, -0.04, 0.13));

  const head = pivot(0, 0.56, 0.02);
  head.add(sphere(0.3, navy, 24));
  head.add(at(ellipsoid(0.22, 0.18, 0.16, white), 0, -0.03, 0.15));
  const eyes = pair((s) => at(eye(0.045), s * 0.1, 0.02, 0.27));
  head.add(...eyes);
  head.add(...pair((s) => at(ellipsoid(0.04, 0.025, 0.02, blush, 10), s * 0.16, -0.06, 0.27)));
  head.add(rotated(at(cone(0.06, 0.18, orange, 12), 0, -0.06, 0.26), Math.PI / 2));
  body.add(head);

  const arms = pair((s) => {
    const flipper = rotated(pivot(s * 0.36, 0.2, 0), 0, 0, s * 0.15);
    flipper.add(at(ellipsoid(0.06, 0.3, 0.14, navy), 0, -0.26, 0));
    return flipper;
  });
  body.add(...arms);

  const legs = pair((s) => pivot(s * 0.13, -0.55, 0.06, at(ellipsoid(0.1, 0.04, 0.15, orange), 0, -0.03, 0.06)));
  body.add(...legs);

  const tail = pivot(0, -0.48, -0.3, rotated(cone(0.08, 0.16, navy, 10), -2.2));
  body.add(tail);

  return { root, body, head, tail, arms, legs, eyes, height: 1.48, footprint: 0.4 };
}
