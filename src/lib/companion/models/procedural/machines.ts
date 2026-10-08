import * as THREE from 'three';
import type { CompanionRig } from '../rig';
import {
  at,
  bodyAt,
  cylinder,
  detail,
  ellipsoid,
  glow,
  limb,
  pair,
  pivot,
  rotated,
  roundedBox,
  sphere,
  toon,
  torus,
} from '../parts';

export function buildRobot(): CompanionRig {
  const shellMat = toon(0xf1f4f8);
  const trim = toon(0xb9c3d1);
  const accent = toon(0xffb347);
  const screen = toon(0x0d1219);
  const cyan = glow(0x52f4ff);
  const magenta = glow(0xff5bd9);
  const thruster = glow(0x8ffaff, 0.85);
  const cheek = glow(0xff7eb6, 0.8);

  const root = new THREE.Group();
  const body = bodyAt(0.58);
  root.add(body);
  body.add(roundedBox(0.62, 0.5, 0.52, 0.2, shellMat));
  body.add(at(roundedBox(0.36, 0.2, 0.06, 0.05, trim), 0, 0.02, 0.25)); // chest panel
  body.add(detail(at(sphere(0.045, cyan, 12), -0.08, 0.04, 0.29)));
  body.add(detail(at(sphere(0.03, accent, 10), 0.06, 0.04, 0.285)));
  body.add(detail(at(sphere(0.03, magenta, 10), 0.13, 0.04, 0.28)));
  body.add(rotated(torus(0.34, 0.025, cyan), Math.PI / 2));
  body.add(at(cylinder(0.18, 0.1, 0.16, trim), 0, -0.32, 0));
  body.add(at(rotated(torus(0.12, 0.025, accent), Math.PI / 2), 0, -0.4, 0));
  body.add(detail(at(sphere(0.09, thruster, 14), 0, -0.45, 0)));

  const head = pivot(0, 0.46, 0);
  head.add(roundedBox(0.74, 0.54, 0.56, 0.22, shellMat));
  head.add(at(roundedBox(0.6, 0.38, 0.08, 0.14, screen), 0, -0.01, 0.25)); // face screen
  // Glowing "anime" eyes on the screen: tall pills that squash to blink.
  const eyes = pair((s) => {
    const e = pivot(s * 0.13, 0.02, 0.3);
    e.add(ellipsoid(0.055, 0.085, 0.015, cyan, 16));
    e.add(at(sphere(0.018, glow(0xffffff), 8), s * 0.015 + 0.015, 0.035, 0.012));
    return detail(e);
  });
  head.add(...eyes);
  head.add(...pair((s) => detail(at(ellipsoid(0.045, 0.022, 0.01, cheek, 10), s * 0.22, -0.08, 0.3))));
  head.add(detail(at(rotated(torus(0.03, 0.01, cyan, Math.PI), Math.PI), 0, -0.09, 0.3)));
  const ears = pair((s) => {
    const ear = rotated(pivot(s * 0.38, 0, 0), 0, 0, Math.PI / 2);
    ear.add(cylinder(0.1, 0.1, 0.07, trim));
    ear.add(at(cylinder(0.055, 0.055, 0.08, accent), 0, 0.01 * s, 0));
    return ear;
  });
  head.add(...ears);
  const tail = pivot(0, 0.27, 0);
  tail.add(at(cylinder(0.014, 0.014, 0.2, trim, 8), 0, 0.1, 0));
  tail.add(at(sphere(0.05, magenta, 14), 0, 0.23, 0));
  head.add(tail);
  body.add(head);

  const arms = pair((s) => {
    const arm = rotated(pivot(s * 0.34, 0.08, 0), 0, 0, s * 0.15);
    arm.add(sphere(0.07, trim, 14));
    arm.add(limb(0.055, 0.28, shellMat));
    arm.add(at(sphere(0.085, accent, 16), 0, -0.3, 0)); // mitten
    return arm;
  });
  body.add(...arms);

  return { root, body, head, tail, ears, arms, eyes, glows: [cyan, magenta, thruster], height: 1.5, footprint: 0.4 };
}

export function buildDrone(): CompanionRig {
  const hull = toon(0x3d4658);
  const panel = toon(0x56627a);
  const dome = toon(0x6f9bd1);
  const metal = toon(0x99a5bd);
  const stripe = toon(0xffc04a);
  const lens = glow(0x8af2ff);
  const red = glow(0xff5a5a);
  const green = glow(0x5aff8f);
  const rotorMat = toon(0xdfe5f0, { transparent: true, opacity: 0.35 });

  const root = new THREE.Group();
  const body = bodyAt(0.45);
  root.add(body);
  body.add(ellipsoid(0.36, 0.16, 0.36, hull));
  body.add(at(ellipsoid(0.3, 0.06, 0.3, panel), 0, 0.09, 0));
  body.add(at(rotated(torus(0.35, 0.022, stripe), Math.PI / 2), 0, 0, 0));
  body.add(at(ellipsoid(0.2, 0.13, 0.2, dome), 0, 0.12, 0));
  body.add(detail(at(ellipsoid(0.08, 0.04, 0.06, glow(0xffffff, 0.45), 10), -0.06, 0.21, 0.06)));

  // Camera "face" with a big round lens.
  const head = pivot(0, -0.04, 0.3);
  head.add(sphere(0.12, hull, 20));
  head.add(at(rotated(cylinder(0.08, 0.09, 0.05, metal), Math.PI / 2), 0, 0, 0.09));
  head.add(detail(at(sphere(0.062, lens, 16), 0, 0, 0.12)));
  head.add(detail(at(sphere(0.02, glow(0xffffff), 8), 0.025, 0.025, 0.17)));
  body.add(head);

  const spinners: THREE.Object3D[] = [];
  [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ].forEach(([sx, sz], index) => {
    const armPivot = rotated(pivot(sx * 0.16, 0.02, sz * 0.16), 0, Math.atan2(sx, sz));
    armPivot.add(rotated(at(cylinder(0.03, 0.03, 0.3, metal, 10), 0, 0, 0.15), Math.PI / 2));
    body.add(armPivot);
    body.add(at(cylinder(0.05, 0.05, 0.08, hull, 14), sx * 0.32, 0.05, sz * 0.32));
    body.add(at(rotated(torus(0.21, 0.012, metal), Math.PI / 2), sx * 0.32, 0.1, sz * 0.32)); // rotor guard
    const rotor = pivot(sx * 0.32, 0.1, sz * 0.32);
    rotor.add(detail(cylinder(0.2, 0.2, 0.006, rotorMat, 28)));
    rotor.add(at(ellipsoid(0.19, 0.008, 0.025, metal, 10), 0, 0.006, 0));
    body.add(rotor);
    spinners.push(rotor);
    body.add(detail(at(sphere(0.024, index < 2 ? green : red, 8), sx * 0.32, 0, sz * 0.32 + sz * 0.06)));
  });

  const legs = pair((s) => {
    const leg = pivot(s * 0.17, -0.12, 0);
    leg.add(limb(0.018, 0.16, metal));
    leg.add(at(rotated(cylinder(0.02, 0.02, 0.26, metal, 8), Math.PI / 2), 0, -0.16, 0));
    return leg;
  });
  body.add(...legs);

  return { root, body, head, legs, spinners, glows: [lens, red, green], height: 0.65, footprint: 0.45 };
}
