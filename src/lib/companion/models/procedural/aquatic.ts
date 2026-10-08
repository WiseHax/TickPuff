import * as THREE from 'three';
import type { CompanionRig } from '../rig';
import {
  at,
  blush,
  bodyAt,
  cylinder,
  detail,
  ellipsoid,
  eye,
  glow,
  limb,
  mesh,
  pair,
  pivot,
  rotated,
  sphere,
  toon,
  torus,
} from '../parts';

/** Thin, flowing fin: a flattened, slightly cupped ellipsoid. */
function fin(rx: number, ry: number, rz: number, material: THREE.Material): THREE.Mesh {
  return detail(ellipsoid(rx, ry, rz, material, 24));
}

export function buildFish(): CompanionRig {
  const pearl = toon(0xfff8ef);
  const orange = toon(0xff7424);
  const red = toon(0xe8432a);
  const finMat = toon(0xffa25a, { transparent: true, opacity: 0.72, side: THREE.DoubleSide });
  const finEdge = toon(0xffffff, { transparent: true, opacity: 0.55, side: THREE.DoubleSide });

  const root = new THREE.Group();
  const body = bodyAt(0.4);
  root.add(body);
  body.add(ellipsoid(0.25, 0.29, 0.62, pearl));
  // Kohaku-style patches.
  body.add(at(ellipsoid(0.22, 0.18, 0.26, orange), 0, 0.13, 0.16));
  body.add(at(ellipsoid(0.2, 0.15, 0.22, red), 0.03, 0.12, -0.26));
  body.add(at(ellipsoid(0.12, 0.1, 0.12, orange), -0.12, 0.03, -0.05));
  // Scale highlights.
  const scale = glow(0xffffff, 0.35);
  for (let i = 0; i < 4; i++) {
    for (const s of [-1, 1]) {
      body.add(detail(at(ellipsoid(0.05, 0.035, 0.03, scale, 8), s * 0.22, 0.02 - (i % 2) * 0.06, 0.2 - i * 0.14)));
    }
  }
  // Dorsal fin.
  body.add(rotated(at(fin(0.015, 0.15, 0.32, finMat), 0, 0.3, -0.06), 0.18));

  const head = pivot(0, 0, 0.42);
  head.add(at(ellipsoid(0.15, 0.12, 0.13, red), 0, 0.15, 0.03));
  const eyes = pair((s) => rotated(at(eye(0.06, 0x14141c, { sparkle: 1 }), s * 0.17, 0.05, 0.1), 0, s * 1.05));
  head.add(...eyes);
  head.add(...pair((s) => rotated(at(blush(0.04, 0xff7d7d, 0.45), s * 0.17, -0.06, 0.08), 0, s * 1.05)));
  head.add(detail(at(torus(0.035, 0.012, toon(0xd6493a)), 0, -0.07, 0.17)));
  const barbel = toon(0xf4d2ad);
  head.add(...pair((s) => detail(rotated(at(limb(0.012, 0.16, barbel), s * 0.07, -0.08, 0.16), 0.7, 0, s * 0.5))));
  body.add(head);

  // Long, double flowing tail.
  const tail = pivot(0, 0, -0.58);
  for (const s of [-1, 1]) {
    tail.add(rotated(at(fin(0.015, 0.28, 0.26, finMat), 0, s * 0.15, -0.2), s * 0.65));
    tail.add(rotated(at(fin(0.016, 0.1, 0.12, finEdge), 0, s * 0.28, -0.38), s * 0.8));
  }
  body.add(tail);

  const arms = pair((s) => {
    const p = pivot(s * 0.21, -0.12, 0.22);
    p.add(rotated(at(fin(0.16, 0.015, 0.1, finMat), s * 0.12, -0.02, -0.02), 0, 0, -s * 0.3));
    return p;
  });
  body.add(...arms);
  body.add(...pair((s) => rotated(at(fin(0.1, 0.015, 0.07, finMat), s * 0.14, -0.22, -0.26), 0, 0, -s * 0.5)));

  return { root, body, head, tail, arms, eyes, height: 0.8, footprint: 0.35 };
}

export function buildJellyfish(): CompanionRig {
  const bellMaterial = toon(0xc7a4ff, { transparent: true, opacity: 0.78, side: THREE.DoubleSide });
  const inner = glow(0xffc4ec, 0.45);
  const spots = glow(0xffffff, 0.5);
  const frill = toon(0xf2b8ff, { transparent: true, opacity: 0.85 });
  const tentacleMaterial = toon(0xe8d2ff, { transparent: true, opacity: 0.7 });
  const oral = toon(0xf7a8d8, { transparent: true, opacity: 0.8 });

  const root = new THREE.Group();
  const body = bodyAt(0.95);
  root.add(body);

  // The bell is the "head": it tilts toward what the jelly looks at.
  const head = pivot(0, 0, 0);
  const bell = mesh(new THREE.SphereGeometry(0.5, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), bellMaterial, 0.1);
  bell.scale.set(1, 0.88, 1);
  head.add(bell);
  const core = mesh(new THREE.SphereGeometry(0.34, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), inner, 0);
  core.scale.set(1, 0.8, 1);
  head.add(core);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    head.add(at(ellipsoid(0.05, 0.03, 0.05, spots, 10), Math.cos(a) * 0.3, 0.32, Math.sin(a) * 0.3));
  }
  // Scalloped rim.
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    head.add(at(ellipsoid(0.08, 0.05, 0.08, frill, 12), Math.cos(a) * 0.47, -0.01, Math.sin(a) * 0.47));
  }
  const eyes = pair((s) => at(eye(0.065, 0x241433, { sparkle: 1 }), s * 0.16, 0.2, 0.42));
  head.add(...eyes);
  head.add(...pair((s) => at(blush(0.06, 0xff8fc7, 0.65), s * 0.27, 0.1, 0.39)));
  head.add(detail(at(rotated(torus(0.03, 0.01, toon(0x6b3a6b), Math.PI), Math.PI), 0, 0.12, 0.47)));
  body.add(head);

  const tentacles: THREE.Object3D[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const t = pivot(Math.cos(angle) * 0.4, -0.02, Math.sin(angle) * 0.4);
    t.add(limb(0.022, 0.48, tentacleMaterial));
    const lower = pivot(0, -0.46, 0, limb(0.016, 0.46, tentacleMaterial));
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
    const arm = pivot(x, -0.02, z);
    arm.add(at(ellipsoid(0.06, 0.34, 0.035, oral, 16), 0, -0.32, 0));
    tentacles.push(arm);
  }
  body.add(...tentacles);

  return { root, body, head, tentacles, eyes, glows: [inner], height: 1.4, footprint: 0.5 };
}

export function buildTurtle(): CompanionRig {
  const shell = toon(0x356f4e);
  const shellDark = toon(0x2b5c40);
  const scute = toon(0x9ccf8a);
  const belly = toon(0xeadca4);
  const skin = toon(0x93c78a);
  const spot = toon(0x6da866);

  const root = new THREE.Group();
  const body = bodyAt(0.32);
  root.add(body);
  body.add(at(ellipsoid(0.56, 0.31, 0.67, shell), 0, 0.05, 0));
  body.add(at(ellipsoid(0.58, 0.07, 0.69, shellDark), 0, -0.02, 0)); // shell rim
  body.add(at(ellipsoid(0.5, 0.1, 0.6, belly), 0, -0.08, 0));
  // Hexagonal scutes on the dome.
  const hex = (x: number, z: number, r: number) => {
    const plate = cylinder(r, r * 1.05, 0.05, scute, 6);
    plate.position.set(x, 0, z);
    const normal = new THREE.Vector3(x / 0.56 ** 2, 1 / 0.31, z / 0.67 ** 2).normalize();
    plate.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    const y = 0.31 * Math.sqrt(Math.max(0, 1 - (x / 0.56) ** 2 - (z / 0.67) ** 2));
    plate.position.y = 0.05 + y - 0.01;
    return detail(plate);
  };
  body.add(hex(0, 0, 0.15));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    body.add(hex(Math.cos(a) * 0.3, Math.sin(a) * 0.36, 0.12));
  }

  const head = pivot(0, 0.03, 0.62);
  head.add(at(ellipsoid(0.19, 0.17, 0.22, skin), 0, 0.02, 0.12));
  head.add(...[-0.08, 0.06].map((x, i) => detail(at(sphere(0.025, spot, 8), x, 0.15, 0.08 + i * 0.05))));
  const eyes = pair((s) => rotated(at(eye(0.05, 0x14201a, { sparkle: 1 }), s * 0.1, 0.07, 0.27), 0, s * 0.35));
  head.add(...eyes);
  head.add(...pair((s) => at(blush(0.04, 0xff9a8a, 0.45), s * 0.13, -0.02, 0.27)));
  head.add(detail(at(rotated(torus(0.04, 0.009, toon(0x2f5a33), Math.PI), Math.PI), 0, -0.02, 0.33)));
  body.add(head);

  const arms = pair((s) => {
    const flipper = pivot(s * 0.44, -0.04, 0.32);
    flipper.add(rotated(at(ellipsoid(0.32, 0.045, 0.13, skin), s * 0.25, 0, 0.04), 0, -s * 0.4));
    flipper.add(detail(rotated(at(sphere(0.03, spot, 8), s * 0.3, 0.035, 0.0), 0, -s * 0.4)));
    return flipper;
  });
  const legs = pair((s) => {
    const flipper = pivot(s * 0.33, -0.05, -0.46);
    flipper.add(rotated(at(ellipsoid(0.16, 0.045, 0.1, skin), s * 0.1, 0, -0.05), 0, s * 0.4));
    return flipper;
  });
  body.add(...arms, ...legs);

  const tail = pivot(0, -0.02, -0.66, rotated(at(ellipsoid(0.05, 0.04, 0.1, skin), 0, 0, -0.06), 0));
  body.add(tail);

  return { root, body, head, tail, arms, legs, eyes, height: 0.75, footprint: 0.7 };
}
