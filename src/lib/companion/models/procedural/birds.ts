import * as THREE from 'three';
import type { CompanionRig } from '../rig';
import {
  at,
  blush,
  bodyAt,
  detail,
  ellipsoid,
  eye,
  limb,
  pair,
  pivot,
  rotated,
  softCone,
  sphere,
  toon,
  torus,
} from '../parts';

/** Rows of overlapping scallops: feathers on a chest or wing. */
function feathers(
  rows: { y: number; count: number; width: number }[],
  size: number,
  material: THREE.Material,
  z: number,
): THREE.Group {
  const group = new THREE.Group();
  for (const row of rows) {
    for (let i = 0; i < row.count; i++) {
      const x = row.count === 1 ? 0 : (i / (row.count - 1) - 0.5) * row.width;
      const curve = Math.cos((x / Math.max(0.01, row.width)) * Math.PI) * 0.02;
      group.add(at(ellipsoid(size, size * 0.7, size * 0.35, material, 12), x, row.y, z + curve));
    }
  }
  return detail(group);
}

export function buildOwl(): CompanionRig {
  const tawny = toon(0xc49261);
  const wing = toon(0x9a6c45);
  const wingTip = toon(0x6e4a2e);
  const cream = toon(0xf8ecd8);
  const face = toon(0xfff9ef);
  const rim = toon(0xa87850);
  const beakColor = toon(0xe7b46a);
  const speckle = toon(0xd9b98e);

  const root = new THREE.Group();
  const body = bodyAt(0.62);
  root.add(body);
  body.add(ellipsoid(0.42, 0.5, 0.4, tawny));
  body.add(at(ellipsoid(0.32, 0.4, 0.26, cream), 0, -0.06, 0.16));
  body.add(
    feathers(
      [
        { y: 0.12, count: 3, width: 0.24 },
        { y: 0.0, count: 4, width: 0.34 },
        { y: -0.12, count: 4, width: 0.36 },
        { y: -0.24, count: 3, width: 0.28 },
      ],
      0.045,
      speckle,
      0.4,
    ),
  );

  const head = pivot(0, 0.56, 0);
  head.add(ellipsoid(0.42, 0.37, 0.38, tawny));
  // Heart-shaped facial disc with a darker rim.
  head.add(...pair((s) => at(ellipsoid(0.2, 0.26, 0.1, rim), s * 0.11, -0.02, 0.27)));
  head.add(...pair((s) => at(ellipsoid(0.18, 0.24, 0.1, face), s * 0.105, -0.025, 0.29)));
  const eyes = pair((s) => at(eye(0.09, 0x1a120c, { iris: 0xf2a83b, aspect: 1 }), s * 0.13, 0.02, 0.37));
  head.add(...eyes);
  head.add(...pair((s) => at(blush(0.05, 0xff9a8a, 0.35), s * 0.24, -0.12, 0.3)));
  head.add(rotated(at(softCone(0.045, 0.13, beakColor, 0.2), 0, -0.05, 0.38), 2.5));
  // Ear tufts.
  const ears = pair((s) => {
    const tuft = rotated(pivot(s * 0.24, 0.26, 0), -0.1, 0, -s * 0.45);
    tuft.add(softCone(0.08, 0.2, wing, 0.3));
    return tuft;
  });
  head.add(...ears);
  body.add(head);

  const arms = pair((s) => {
    const w = rotated(pivot(s * 0.38, 0.27, -0.02), 0, 0, s * 0.08);
    w.add(at(ellipsoid(0.09, 0.36, 0.26, wing), 0, -0.25, -0.04));
    w.add(at(ellipsoid(0.08, 0.16, 0.2, wingTip), 0, -0.5, -0.08));
    w.add(...[-0.12, 0, 0.12].map((y) => detail(at(ellipsoid(0.02, 0.05, 0.12, speckle, 8), s * 0.08, y - 0.2, 0))));
    return w;
  });
  body.add(...arms);

  const legs = pair((s) => {
    const leg = pivot(s * 0.13, -0.45, 0.06);
    leg.add(at(ellipsoid(0.08, 0.06, 0.08, cream), 0, 0, 0)); // feathered "trousers"
    leg.add(limb(0.04, 0.17, beakColor));
    for (const spread of [-0.45, 0, 0.45]) {
      leg.add(
        rotated(at(ellipsoid(0.028, 0.022, 0.07, beakColor, 10), Math.sin(spread) * 0.06, -0.16, 0.05), 0, spread),
      );
    }
    return leg;
  });
  body.add(...legs);

  const tail = pivot(0, -0.38, -0.32, rotated(at(ellipsoid(0.16, 0.04, 0.14, wingTip), 0, 0, -0.08), -0.5));
  body.add(tail);

  return { root, body, head, tail, arms, legs, eyes, height: 1.6, footprint: 0.45 };
}

export function buildPenguin(): CompanionRig {
  const navy = toon(0x24344f);
  const white = toon(0xf8f8f4);
  const orange = toon(0xf7a62b);
  const scarfRed = toon(0xe0524a);
  const scarfLight = toon(0xffe2c8);

  const root = new THREE.Group();
  const body = bodyAt(0.62);
  root.add(body);
  body.add(ellipsoid(0.4, 0.55, 0.38, navy));
  body.add(at(ellipsoid(0.32, 0.46, 0.27, white), 0, -0.05, 0.14));

  // Cosy scarf with a tail end fluttering behind.
  const scarf = pivot(0, 0.31, 0.01);
  scarf.add(rotated(torus(0.29, 0.07, scarfRed), Math.PI / 2 + 0.08));
  scarf.add(rotated(torus(0.29, 0.073, scarfLight, Math.PI * 0.35), Math.PI / 2 + 0.08, 0, 0.4));
  const end = rotated(pivot(0.12, -0.02, -0.26), -0.5, 0.3, 0.2);
  end.add(at(ellipsoid(0.07, 0.04, 0.2, scarfRed), 0, 0, -0.16));
  scarf.add(end);
  body.add(scarf);

  const head = pivot(0, 0.58, 0.02);
  head.add(sphere(0.32, navy, 32));
  // White face patches that meet above the beak.
  head.add(...pair((s) => at(ellipsoid(0.13, 0.15, 0.12, white), s * 0.09, -0.02, 0.2)));
  const eyes = pair((s) => at(eye(0.06, 0x101420, { sparkle: 1 }), s * 0.1, 0.03, 0.29));
  head.add(...eyes);
  head.add(...pair((s) => at(blush(0.05, 0xff8fa6, 0.55), s * 0.17, -0.07, 0.27)));
  head.add(rotated(at(softCone(0.065, 0.16, orange, 0.25), 0, -0.06, 0.28), Math.PI / 2));
  body.add(head);

  const arms = pair((s) => {
    const flipper = rotated(pivot(s * 0.38, 0.2, 0), 0, 0, s * 0.15);
    flipper.add(at(ellipsoid(0.065, 0.32, 0.15, navy), 0, -0.27, 0));
    return flipper;
  });
  body.add(...arms);

  const legs = pair((s) => {
    const foot = pivot(s * 0.14, -0.55, 0.06);
    foot.add(at(ellipsoid(0.11, 0.045, 0.16, orange), 0, -0.03, 0.07));
    foot.add(...[-0.05, 0, 0.05].map((x) => at(sphere(0.035, orange, 10), x, -0.03, 0.2)));
    return foot;
  });
  body.add(...legs);

  const tail = pivot(0, -0.48, -0.32, rotated(softCone(0.09, 0.16, navy), -2.2));
  body.add(tail);

  return { root, body, head, tail, arms, legs, eyes, height: 1.5, footprint: 0.4 };
}
