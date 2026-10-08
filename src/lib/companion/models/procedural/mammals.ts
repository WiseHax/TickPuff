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
  mesh,
  pair,
  paw,
  pivot,
  rotated,
  softCone,
  sphere,
  taperedLimb,
  toon,
  torus,
} from '../parts';

/** Glossy nose: a dark bead with a small highlight. */
function nose(radius: number, color: THREE.ColorRepresentation = 0x1c1416): THREE.Group {
  const group = new THREE.Group();
  group.add(ellipsoid(radius * 1.25, radius * 0.85, radius * 0.9, toon(color), 16));
  group.add(at(sphere(radius * 0.32, glow(0xffffff, 0.75), 8), radius * 0.35, radius * 0.4, radius * 0.6));
  return detail(group);
}

/**
 * Bushy tail pointing back along -Z from its pivot: a smooth brush shape with
 * a differently coloured tip.
 */
function brushTail(length: number, radius: number, material: THREE.Material, tip: THREE.Material): THREE.Mesh[] {
  const profile = (t: number) => radius * Math.max(0.02, Math.sin(Math.PI * Math.min(1, t ** 0.75)) ** 0.8);
  const section = (from: number, to: number, mat: THREE.Material) => {
    const points: THREE.Vector2[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = from + ((to - from) * i) / 16;
      points.push(new THREE.Vector2(t >= 0.999 ? 0 : profile(t), t * length));
    }
    if (from > 0) points.unshift(new THREE.Vector2(0, from * length));
    const part = mesh(new THREE.LatheGeometry(points, 22), mat, 0.12);
    part.rotation.x = -Math.PI / 2; // +Y → -Z
    return part;
  };
  return [section(0, 0.72, material), section(0.7, 1, tip)];
}

export function buildFox(): CompanionRig {
  const orange = toon(0xec7a32);
  const cream = toon(0xfff4e6);
  const dark = toon(0x3a2622);
  const pink = toon(0xf3a3a0);

  const root = new THREE.Group();
  const body = bodyAt(0.7);
  root.add(body);

  // Body: lean orange torso, cream chest and belly, a fluffy chest ruff.
  body.add(ellipsoid(0.34, 0.31, 0.56, orange));
  body.add(at(ellipsoid(0.3, 0.26, 0.28, orange), 0, 0.03, -0.32));
  body.add(at(ellipsoid(0.25, 0.22, 0.42, cream), 0, -0.13, 0.02));
  body.add(at(ellipsoid(0.27, 0.3, 0.22, cream), 0, 0.03, 0.38));
  for (const [x, y, tilt] of [
    [0, -0.12, 0],
    [-0.11, -0.08, 0.35],
    [0.11, -0.08, -0.35],
  ]) {
    body.add(rotated(at(softCone(0.1, 0.13, cream, 0.45), x, y, 0.5), 2.6, 0, tilt));
  }

  const head = pivot(0, 0.38, 0.5);
  head.add(ellipsoid(0.34, 0.3, 0.3, orange));
  // Cheek fluff sweeping out to the sides.
  head.add(
    ...pair((s) => {
      const cheek = pivot(s * 0.2, -0.1, 0.08);
      cheek.add(ellipsoid(0.17, 0.14, 0.16, cream));
      return cheek;
    }),
  );
  // Tapered snout with a cream underside.
  head.add(at(ellipsoid(0.13, 0.1, 0.22, orange), 0, -0.04, 0.28));
  head.add(at(ellipsoid(0.12, 0.08, 0.21, cream), 0, -0.09, 0.29));
  head.add(at(nose(0.045), 0, -0.02, 0.5));
  head.add(detail(at(ellipsoid(0.035, 0.012, 0.02, toon(0x5b2f2a)), 0, -0.13, 0.47)));
  const eyes = pair((s) => rotated(at(eye(0.07, 0x1d1218, { iris: 0xe8a33a }), s * 0.14, 0.06, 0.24), 0, s * 0.28));
  head.add(...eyes);
  head.add(...pair((s) => at(blush(0.06), s * 0.21, -0.06, 0.2)));
  const ears = pair((s) => {
    const ear = rotated(pivot(s * 0.17, 0.2, -0.03), -0.12, 0, -s * 0.3);
    ear.add(rotated(softCone(0.13, 0.38, orange, 0.15), 0, 0, 0));
    ear.add(at(softCone(0.075, 0.26, pink, 0.1), 0, 0.03, 0.055));
    ear.add(at(softCone(0.085, 0.14, dark, 0.05), 0, 0.25, 0));
    return ear;
  });
  head.add(...ears);
  body.add(head);

  // Legs with dark "socks" and round paws.
  const legs = [
    [-0.19, 0.38, false],
    [0.19, 0.38, false],
    [-0.19, -0.38, true],
    [0.19, -0.38, true],
  ].map(([x, z, back]) => {
    const leg = pivot(x as number, -0.18, z as number);
    if (back) leg.add(at(ellipsoid(0.13, 0.17, 0.17, orange), 0, -0.04, 0));
    leg.add(at(taperedLimb(0.085, 0.07, 0.32, orange), 0, 0, 0));
    leg.add(at(taperedLimb(0.074, 0.068, 0.24, dark), 0, -0.26, 0));
    leg.add(at(paw(0.075, dark), 0, -0.48, 0));
    return leg;
  });
  body.add(...legs);

  // Big brush tail with a cream tip.
  const tail = rotated(pivot(0, 0.08, -0.5), 0.45);
  tail.add(...brushTail(0.95, 0.21, orange, cream));
  body.add(tail);

  return { root, body, head, tail, ears, legs, eyes, height: 1.6, footprint: 0.55 };
}

export function buildCat(): CompanionRig {
  const fur = toon(0x2b2d3a);
  const sheen = toon(0x3d4052);
  const muzzle = toon(0x4a4d61);
  const pink = toon(0xf5a3b5);
  const whisker = glow(0xe4e7f2, 0.85);
  const collarRed = toon(0xd9433f);
  const gold = toon(0xf4c542, { emissive: 0x5a3a00, emissiveIntensity: 0.4 });

  const root = new THREE.Group();
  const body = bodyAt(0.56);
  root.add(body);
  body.add(ellipsoid(0.29, 0.27, 0.54, fur));
  body.add(at(ellipsoid(0.27, 0.27, 0.26, fur), 0, 0.04, -0.3)); // haunches
  body.add(at(ellipsoid(0.2, 0.22, 0.2, sheen), 0, -0.02, 0.34)); // chest

  const head = pivot(0, 0.34, 0.44);
  head.add(ellipsoid(0.32, 0.28, 0.28, fur));
  head.add(...pair((s) => at(ellipsoid(0.16, 0.13, 0.15, fur), s * 0.17, -0.09, 0.08))); // cheek ruffs
  head.add(...pair((s) => at(ellipsoid(0.085, 0.07, 0.07, muzzle), s * 0.055, -0.1, 0.22)));
  head.add(at(ellipsoid(0.04, 0.03, 0.03, pink), 0, -0.055, 0.27));
  head.add(detail(at(ellipsoid(0.03, 0.012, 0.02, toon(0x1a1a22)), 0, -0.14, 0.24)));
  const eyes = pair((s) =>
    rotated(at(eye(0.085, 0x0f1015, { iris: 0xd6e84a, slit: true, aspect: 0.95 }), s * 0.13, 0.03, 0.2), 0, s * 0.2),
  );
  head.add(...eyes);
  head.add(...pair((s) => at(blush(0.055, 0xff7d9a, 0.35), s * 0.2, -0.07, 0.19)));
  const ears = pair((s) => {
    const ear = rotated(pivot(s * 0.17, 0.17, -0.02), -0.05, 0, -s * 0.28);
    ear.add(rotated(softCone(0.135, 0.28, fur, 0.1), 0, Math.PI / 4));
    ear.add(at(softCone(0.075, 0.19, pink, 0.1), 0, 0.02, 0.05));
    return ear;
  });
  head.add(...ears);
  for (const side of [-1, 1]) {
    for (const tilt of [-0.12, 0.02, 0.16]) {
      const w = cylinder(0.004, 0.0025, 0.34, whisker, 4);
      w.rotation.set(0, 0, side * (Math.PI / 2 + tilt));
      w.position.set(side * 0.24, -0.09 + tilt * 0.25, 0.22);
      head.add(detail(w));
    }
  }
  body.add(head);

  // Collar with a little bell.
  const collar = at(rotated(torus(0.2, 0.03, collarRed), Math.PI / 2 - 0.35), 0, 0.22, 0.38);
  body.add(collar);
  body.add(at(sphere(0.05, gold, 16), 0, 0.1, 0.55));

  const legs = [
    [-0.14, 0.32],
    [0.14, 0.32],
    [-0.15, -0.3],
    [0.15, -0.3],
  ].map(([x, z]) => {
    const leg = pivot(x, -0.14, z);
    leg.add(taperedLimb(0.075, 0.06, 0.4, fur));
    leg.add(at(paw(0.065, fur, pink), 0, -0.38, 0));
    return leg;
  });
  body.add(...legs);

  // Four-segment tail so it can curl.
  const tail = rotated(pivot(0, 0.08, -0.52), 2.2);
  const segments: THREE.Object3D[] = [];
  let parent: THREE.Object3D = tail;
  for (let i = 0; i < 4; i++) {
    const segment = i === 0 ? tail : pivot(0, -0.2, 0);
    if (i > 0) {
      parent.add(segment);
      segments.push(segment);
    }
    segment.add(taperedLimb(0.055 - i * 0.006, 0.05 - i * 0.006, 0.23, fur));
    parent = segment;
  }
  body.add(tail);

  return { root, body, head, tail, tailSegments: segments, ears, legs, eyes, height: 1.4, footprint: 0.45 };
}

export function buildBear(): CompanionRig {
  const fur = toon(0x8f5c3b);
  const shade = toon(0x744528);
  const tan = toon(0xe0bc94);
  const dark = toon(0x2b1d16);
  const scarf = toon(0x3f8f6b);
  const scarfStripe = toon(0xf2e6c9);

  const root = new THREE.Group();
  const body = bodyAt(0.78);
  root.add(body);
  body.add(ellipsoid(0.5, 0.47, 0.66, fur));
  body.add(at(ellipsoid(0.44, 0.4, 0.3, shade), 0, 0.12, -0.36)); // rump
  body.add(at(ellipsoid(0.34, 0.32, 0.36, tan), 0, -0.1, 0.32)); // belly

  // Knitted scarf: a ring with stripes and a hanging end.
  const neck = pivot(0, 0.3, 0.5);
  neck.add(rotated(torus(0.34, 0.085, scarf), Math.PI / 2 - 0.5));
  neck.add(rotated(torus(0.34, 0.088, scarfStripe, Math.PI * 0.5), Math.PI / 2 - 0.5, 0, Math.PI * 0.25));
  const end = rotated(pivot(0.2, -0.1, 0.24), 0.3, 0, 0.2);
  end.add(at(ellipsoid(0.08, 0.2, 0.04, scarf), 0, -0.18, 0));
  end.add(at(ellipsoid(0.082, 0.03, 0.042, scarfStripe), 0, -0.26, 0));
  neck.add(end);
  body.add(neck);

  const head = pivot(0, 0.46, 0.56);
  head.add(ellipsoid(0.4, 0.36, 0.36, fur));
  head.add(...pair((s) => at(ellipsoid(0.16, 0.14, 0.14, fur), s * 0.24, -0.1, 0.12))); // round cheeks
  head.add(at(ellipsoid(0.19, 0.14, 0.17, tan), 0, -0.1, 0.3));
  head.add(at(nose(0.06), 0, -0.035, 0.46));
  head.add(detail(at(ellipsoid(0.04, 0.012, 0.02, toon(0x4a2c20)), 0, -0.15, 0.44)));
  const eyes = pair((s) => at(eye(0.06, 0x1c120e, { sparkle: 0.9 }), s * 0.15, 0.08, 0.31));
  head.add(...eyes);
  head.add(...pair((s) => at(blush(0.065, 0xff8a8a, 0.4), s * 0.25, -0.06, 0.27)));
  const ears = pair((s) => {
    const ear = pivot(s * 0.28, 0.28, -0.03);
    ear.add(ellipsoid(0.13, 0.13, 0.08, fur, 20));
    ear.add(at(ellipsoid(0.075, 0.075, 0.03, tan, 14), 0, -0.01, 0.07));
    return ear;
  });
  head.add(...ears);
  body.add(head);

  const legs = [
    [-0.28, 0.38],
    [0.28, 0.38],
    [-0.29, -0.4],
    [0.29, -0.4],
  ].map(([x, z]) => {
    const leg = pivot(x, -0.28, z);
    leg.add(taperedLimb(0.17, 0.14, 0.42, fur));
    leg.add(at(paw(0.13, dark, tan), 0, -0.42, 0));
    return leg;
  });
  body.add(...legs);

  const tail = pivot(0, 0.12, -0.66, sphere(0.11, fur, 16));
  body.add(tail);

  return { root, body, head, tail, ears, legs, eyes, height: 1.65, footprint: 0.75 };
}

export function buildBunny(): CompanionRig {
  const fur = toon(0xf6f1ea);
  const fluff = toon(0xffffff);
  const pink = toon(0xf7a9bc);
  const tooth = toon(0xffffff);

  const root = new THREE.Group();
  const body = bodyAt(0.46);
  root.add(body);
  body.add(ellipsoid(0.37, 0.36, 0.42, fur));
  body.add(at(ellipsoid(0.26, 0.25, 0.2, fluff), 0, -0.02, 0.26));
  body.add(...pair((s) => at(ellipsoid(0.16, 0.2, 0.26, fur), s * 0.24, -0.12, -0.12))); // haunches

  const head = pivot(0, 0.38, 0.26);
  head.add(ellipsoid(0.31, 0.28, 0.27, fur));
  head.add(...pair((s) => at(ellipsoid(0.13, 0.11, 0.11, fluff), s * 0.12, -0.11, 0.17)));
  head.add(at(ellipsoid(0.04, 0.03, 0.025, pink), 0, -0.05, 0.27));
  head.add(...pair((s) => detail(at(ellipsoid(0.022, 0.032, 0.012, tooth), s * 0.022, -0.17, 0.24))));
  const eyes = pair((s) => rotated(at(eye(0.072, 0x2a1622, { iris: 0x6b3a4e }), s * 0.14, 0.05, 0.2), 0, s * 0.3));
  head.add(...eyes);
  head.add(...pair((s) => at(blush(0.06), s * 0.2, -0.08, 0.19)));
  const ears = pair((s) => {
    const ear = rotated(pivot(s * 0.11, 0.22, -0.04), -0.12, 0, -s * 0.16);
    ear.add(at(ellipsoid(0.085, 0.32, 0.05, fur), 0, 0.3, 0));
    ear.add(at(ellipsoid(0.05, 0.25, 0.02, pink), 0, 0.31, 0.035));
    return ear;
  });
  head.add(...ears);
  body.add(head);

  const front = [-0.13, 0.13].map((x) => {
    const leg = pivot(x, -0.16, 0.24);
    leg.add(taperedLimb(0.06, 0.05, 0.22, fur));
    leg.add(at(paw(0.055, fur, pink), 0, -0.22, 0));
    return leg;
  });
  const back = [-0.21, 0.21].map((x) => pivot(x, -0.3, -0.1, at(ellipsoid(0.1, 0.075, 0.22, fur), 0, -0.08, 0.08)));
  const legs = [...front, ...back];
  body.add(...legs);

  const tail = pivot(0, 0.04, -0.42, sphere(0.12, fluff, 18));
  body.add(tail);

  return { root, body, head, tail, ears, legs, eyes, height: 1.4, footprint: 0.45 };
}
