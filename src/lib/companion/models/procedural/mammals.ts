import * as THREE from 'three';
import type { CompanionRig } from '../rig';
import { at, cone, cylinder, ellipsoid, eye, limb, pair, pivot, rotated, sphere, toon } from '../parts';

/** Body pivot with its rest height remembered for the animator. */
function bodyAt(y: number): THREE.Group {
  const body = pivot(0, y, 0);
  body.userData.restY = y;
  return body;
}

export function buildFox(): CompanionRig {
  const orange = toon(0xe8742c);
  const white = toon(0xfbf3ea);
  const dark = toon(0x2d2220);

  const root = new THREE.Group();
  const body = bodyAt(0.72);
  root.add(body);

  body.add(ellipsoid(0.36, 0.33, 0.62, orange));
  body.add(at(ellipsoid(0.27, 0.27, 0.3, white), 0, -0.06, 0.38));
  body.add(at(ellipsoid(0.27, 0.18, 0.44, white), 0, -0.15, 0));

  const head = pivot(0, 0.36, 0.5);
  head.add(ellipsoid(0.33, 0.3, 0.3, orange));
  const [cheekL, cheekR] = pair((s) => at(ellipsoid(0.2, 0.15, 0.16, white), s * 0.15, -0.1, 0.12));
  head.add(cheekL, cheekR);
  head.add(at(ellipsoid(0.13, 0.11, 0.24, white), 0, -0.08, 0.3));
  head.add(at(sphere(0.055, toon(0x1a1414), 12), 0, -0.04, 0.53));
  const eyes = pair((s) => rotated(at(eye(0.06), s * 0.13, 0.05, 0.25), 0, s * 0.3));
  head.add(...eyes);
  const ears = pair((s) => {
    const ear = rotated(pivot(s * 0.17, 0.2, -0.02), -0.1, 0, -s * 0.28);
    ear.add(cone(0.12, 0.34, orange, 20));
    ear.add(at(cone(0.065, 0.22, white, 16), 0, 0.02, 0.04));
    ear.add(at(cone(0.05, 0.1, dark, 12), 0, 0.25, 0));
    return ear;
  });
  head.add(...ears);
  body.add(head);

  const legs = [
    [-0.2, 0.4],
    [0.2, 0.4],
    [-0.2, -0.38],
    [0.2, -0.38],
  ].map(([x, z]) => {
    const leg = pivot(x, -0.2, z);
    leg.add(limb(0.085, 0.54, dark));
    return leg;
  });
  body.add(...legs);

  const tail = pivot(0, 0.05, -0.56);
  tail.add(rotated(at(ellipsoid(0.17, 0.17, 0.5, orange), 0, 0.12, -0.38), -0.5));
  tail.add(at(ellipsoid(0.12, 0.12, 0.17, white), 0, 0.3, -0.74));
  body.add(tail);

  return { root, body, head, tail, ears, legs, eyes, height: 1.6, footprint: 0.55 };
}

export function buildCat(): CompanionRig {
  const fur = toon(0x2a2b36);
  const muzzle = toon(0x3f4050);
  const pink = toon(0xf2a0b0);
  const whisker = toon(0xcfd2de);

  const root = new THREE.Group();
  const body = bodyAt(0.58);
  root.add(body);
  body.add(ellipsoid(0.3, 0.28, 0.56, fur));

  const head = pivot(0, 0.34, 0.46);
  head.add(ellipsoid(0.31, 0.28, 0.27, fur));
  head.add(at(ellipsoid(0.14, 0.09, 0.09, muzzle), 0, -0.09, 0.21));
  head.add(at(sphere(0.032, pink, 10), 0, -0.05, 0.29));
  const eyes = pair((s) => at(eye(0.075, 0xd8e24a, { pupil: 0x101014, slit: true }), s * 0.12, 0.03, 0.2));
  head.add(...eyes);
  const ears = pair((s) => {
    const ear = rotated(pivot(s * 0.16, 0.19, 0), 0, 0, -s * 0.22);
    ear.add(rotated(cone(0.12, 0.26, fur, 4), 0, Math.PI / 4));
    ear.add(at(rotated(cone(0.065, 0.17, pink, 4), 0, Math.PI / 4), 0, 0.01, 0.04));
    return ear;
  });
  head.add(...ears);
  for (const side of [-1, 1]) {
    for (const tilt of [-0.15, 0, 0.15]) {
      const w = cylinder(0.005, 0.005, 0.32, whisker, 4);
      w.rotation.set(0, 0, side * (Math.PI / 2 + tilt));
      w.position.set(side * 0.2, -0.08 + tilt * 0.2, 0.24);
      head.add(w);
    }
  }
  body.add(head);

  const legs = [
    [-0.15, 0.32],
    [0.15, 0.32],
    [-0.15, -0.32],
    [0.15, -0.32],
  ].map(([x, z]) => pivot(x, -0.16, z, limb(0.07, 0.43, fur)));
  body.add(...legs);

  // Three-segment tail so it can curl.
  const tail = rotated(pivot(0, 0.06, -0.52), 2.2);
  const segments: THREE.Object3D[] = [];
  let parent: THREE.Object3D = tail;
  for (let i = 0; i < 3; i++) {
    const segment = i === 0 ? tail : pivot(0, -0.24, 0);
    if (i > 0) {
      parent.add(segment);
      segments.push(segment);
    }
    segment.add(limb(0.052 - i * 0.008, 0.26, fur));
    parent = segment;
  }
  body.add(tail);

  return { root, body, head, tail, tailSegments: segments, ears, legs, eyes, height: 1.4, footprint: 0.45 };
}

export function buildBear(): CompanionRig {
  const fur = toon(0x8a5a3b);
  const tan = toon(0xd4b08c);
  const dark = toon(0x2b1d16);

  const root = new THREE.Group();
  const body = bodyAt(0.78);
  root.add(body);
  body.add(ellipsoid(0.5, 0.46, 0.68, fur));
  body.add(at(ellipsoid(0.36, 0.32, 0.4, tan), 0, -0.1, 0.3));

  const head = pivot(0, 0.42, 0.56);
  head.add(ellipsoid(0.38, 0.35, 0.36, fur));
  head.add(at(ellipsoid(0.18, 0.14, 0.17, tan), 0, -0.1, 0.3));
  head.add(at(ellipsoid(0.075, 0.05, 0.05, dark), 0, -0.03, 0.46));
  const eyes = pair((s) => at(eye(0.05), s * 0.15, 0.07, 0.31));
  head.add(...eyes);
  const ears = pair((s) => {
    const ear = pivot(s * 0.27, 0.27, -0.02);
    ear.add(sphere(0.12, fur, 16));
    ear.add(at(ellipsoid(0.07, 0.07, 0.035, tan, 12), 0, 0, 0.08));
    return ear;
  });
  head.add(...ears);
  body.add(head);

  const legs = [
    [-0.28, 0.4],
    [0.28, 0.4],
    [-0.28, -0.4],
    [0.28, -0.4],
  ].map(([x, z]) => pivot(x, -0.3, z, limb(0.15, 0.48, fur)));
  body.add(...legs);

  const tail = pivot(0, 0.05, -0.66, sphere(0.1, fur, 12));
  body.add(tail);

  return { root, body, head, tail, ears, legs, eyes, height: 1.65, footprint: 0.75 };
}

export function buildBunny(): CompanionRig {
  const fur = toon(0xf3efe9);
  const fluff = toon(0xffffff);
  const pink = toon(0xf4a7b9);

  const root = new THREE.Group();
  const body = bodyAt(0.46);
  root.add(body);
  body.add(ellipsoid(0.36, 0.36, 0.42, fur));
  body.add(at(ellipsoid(0.24, 0.24, 0.18, fluff), 0, -0.02, 0.26));

  const head = pivot(0, 0.36, 0.26);
  head.add(ellipsoid(0.3, 0.28, 0.27, fur));
  const cheeks = pair((s) => at(ellipsoid(0.12, 0.1, 0.1, fluff), s * 0.13, -0.1, 0.17));
  head.add(...cheeks);
  head.add(at(sphere(0.035, pink, 10), 0, -0.04, 0.27));
  const eyes = pair((s) => at(eye(0.055, 0x3a1f2a), s * 0.13, 0.06, 0.21));
  head.add(...eyes);
  const ears = pair((s) => {
    const ear = rotated(pivot(s * 0.1, 0.22, -0.04), -0.15, 0, -s * 0.14);
    ear.add(at(ellipsoid(0.075, 0.3, 0.045, fur), 0, 0.3, 0));
    ear.add(at(ellipsoid(0.045, 0.24, 0.02, pink), 0, 0.3, 0.03));
    return ear;
  });
  head.add(...ears);
  body.add(head);

  const front = [-0.12, 0.12].map((x) => pivot(x, -0.18, 0.24, limb(0.05, 0.26, fur)));
  const back = [-0.2, 0.2].map((x) => pivot(x, -0.3, -0.12, at(ellipsoid(0.1, 0.08, 0.2, fur), 0, -0.1, 0.06)));
  const legs = [...front, ...back];
  body.add(...legs);

  const tail = pivot(0, 0.02, -0.42, sphere(0.11, fluff, 14));
  body.add(tail);

  return { root, body, head, tail, ears, legs, eyes, height: 1.4, footprint: 0.45 };
}
