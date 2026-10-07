import * as THREE from 'three';
import type { CompanionRig } from '../rig';
import { at, cone, ellipsoid, eye, glow, limb, pair, pivot, rotated, toon, torus } from '../parts';

function bodyAt(y: number): THREE.Group {
  const body = pivot(0, y, 0);
  body.userData.restY = y;
  return body;
}

export function buildFish(): CompanionRig {
  const scales = toon(0xfbf6ee);
  const orange = toon(0xff7a21);
  const red = toon(0xe94b2a);
  const fin = toon(0xff9a4d, { transparent: true, opacity: 0.85, side: THREE.DoubleSide });

  const root = new THREE.Group();
  const body = bodyAt(0.4);
  root.add(body);
  body.add(ellipsoid(0.24, 0.28, 0.62, scales));
  body.add(at(ellipsoid(0.21, 0.17, 0.25, orange), 0, 0.13, 0.15));
  body.add(at(ellipsoid(0.19, 0.15, 0.22, orange), 0.02, 0.11, -0.27));
  body.add(rotated(at(ellipsoid(0.02, 0.13, 0.3, fin), 0, 0.28, -0.06), 0.15));

  const head = pivot(0, 0, 0.4);
  head.add(at(ellipsoid(0.13, 0.11, 0.13, red), 0, 0.15, 0.04));
  const eyes = pair((s) => rotated(at(eye(0.045), s * 0.17, 0.05, 0.1), 0, s * 1.1));
  head.add(...eyes);
  const barbel = toon(0xf0c8a0);
  head.add(...pair((s) => rotated(at(limb(0.01, 0.12, barbel), s * 0.07, -0.08, 0.2), 0.6, 0, s * 0.4)));
  body.add(head);

  const tail = pivot(0, 0, -0.58);
  tail.add(rotated(at(ellipsoid(0.02, 0.22, 0.2, fin), 0, 0.12, -0.16), 0.6));
  tail.add(rotated(at(ellipsoid(0.02, 0.22, 0.2, fin), 0, -0.12, -0.16), -0.6));
  body.add(tail);

  const arms = pair((s) => {
    const p = pivot(s * 0.2, -0.1, 0.22);
    p.add(at(ellipsoid(0.13, 0.02, 0.08, fin), s * 0.09, 0, 0));
    return p;
  });
  body.add(...arms);

  return { root, body, head, tail, arms, eyes, height: 0.8, footprint: 0.35 };
}

export function buildJellyfish(): CompanionRig {
  const bellMaterial = toon(0xc9a6ff, { transparent: true, opacity: 0.82, side: THREE.DoubleSide });
  const inner = glow(0xffc4ec, 0.35);
  const frill = toon(0xf0b6ff, { transparent: true, opacity: 0.9 });
  const tentacleMaterial = toon(0xe4ccff, { transparent: true, opacity: 0.7 });
  const oral = toon(0xf7a8d8, { transparent: true, opacity: 0.8 });

  const root = new THREE.Group();
  const body = bodyAt(0.95);
  root.add(body);

  // The bell is the "head": it tilts toward what the jelly looks at.
  const head = pivot(0, 0, 0);
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), bellMaterial);
  bell.scale.set(1, 0.85, 1);
  head.add(bell);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), inner);
  core.scale.set(1, 0.8, 1);
  head.add(core);
  head.add(rotated(torus(0.48, 0.05, frill), Math.PI / 2));
  const eyes = pair((s) => at(eye(0.05), s * 0.15, 0.2, 0.41));
  head.add(...eyes);
  head.add(...pair((s) => at(ellipsoid(0.06, 0.03, 0.02, glow(0xff8fc7, 0.6), 10), s * 0.25, 0.1, 0.4)));
  body.add(head);

  const tentacles: THREE.Object3D[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const t = pivot(Math.cos(angle) * 0.4, -0.02, Math.sin(angle) * 0.4);
    t.add(limb(0.024, 0.46, tentacleMaterial));
    const lower = pivot(0, -0.44, 0, limb(0.018, 0.42, tentacleMaterial));
    lower.userData.segment = true;
    t.add(lower);
    tentacles.push(t);
  }
  for (const [x, z] of [
    [0.08, 0.06],
    [-0.08, 0.06],
    [0.06, -0.08],
    [-0.06, -0.08],
  ]) {
    const arm = pivot(x, -0.02, z, limb(0.05, 0.62, oral));
    tentacles.push(arm);
  }
  body.add(...tentacles);

  return { root, body, head, tentacles, eyes, glows: [inner], height: 1.4, footprint: 0.5 };
}

export function buildTurtle(): CompanionRig {
  const shell = toon(0x3f7d58);
  const scute = toon(0x6aa874);
  const belly = toon(0xe4d7a1);
  const skin = toon(0x8cc084);

  const root = new THREE.Group();
  const body = bodyAt(0.32);
  root.add(body);
  body.add(at(ellipsoid(0.55, 0.3, 0.66, shell), 0, 0.05, 0));
  body.add(at(ellipsoid(0.5, 0.1, 0.6, belly), 0, -0.07, 0));
  body.add(at(ellipsoid(0.18, 0.05, 0.2, scute), 0, 0.34, 0));
  for (const [x, z] of [
    [-0.22, 0.2],
    [0.22, 0.2],
    [-0.22, -0.2],
    [0.22, -0.2],
  ]) {
    body.add(rotated(at(ellipsoid(0.15, 0.04, 0.16, scute), x, 0.27, z), z * 1.2, 0, -x * 1.3));
  }

  const head = pivot(0, 0.02, 0.62);
  head.add(at(ellipsoid(0.17, 0.15, 0.2, skin), 0, 0, 0.12));
  const eyes = pair((s) => rotated(at(eye(0.035), s * 0.1, 0.05, 0.25), 0, s * 0.35));
  head.add(...eyes);
  body.add(head);

  const arms = pair((s) => {
    const flipper = pivot(s * 0.42, -0.04, 0.32);
    flipper.add(rotated(at(ellipsoid(0.3, 0.04, 0.12, skin), s * 0.24, 0, 0.04), 0, -s * 0.4));
    return flipper;
  });
  const legs = pair((s) => {
    const flipper = pivot(s * 0.32, -0.05, -0.45);
    flipper.add(rotated(at(ellipsoid(0.15, 0.04, 0.09, skin), s * 0.1, 0, -0.05), 0, s * 0.4));
    return flipper;
  });
  body.add(...arms, ...legs);

  const tail = pivot(0, -0.02, -0.64, rotated(cone(0.05, 0.14, skin, 8), -Math.PI / 2));
  body.add(tail);

  return { root, body, head, tail, arms, legs, eyes, height: 0.75, footprint: 0.7 };
}
