import * as THREE from 'three';
import type { CompanionRig } from '../rig';
import { at, cylinder, ellipsoid, glow, limb, pair, pivot, rotated, sphere, toon, torus } from '../parts';

function bodyAt(y: number): THREE.Group {
  const body = pivot(0, y, 0);
  body.userData.restY = y;
  return body;
}

export function buildRobot(): CompanionRig {
  const shellMat = toon(0xe9eef3);
  const trim = toon(0xc5ccd6);
  const visor = toon(0x10151c);
  const cyan = glow(0x41f2ff);
  const magenta = glow(0xff4fd8);
  const thruster = glow(0x7ff9ff, 0.8);

  const root = new THREE.Group();
  const body = bodyAt(0.58);
  root.add(body);
  body.add(ellipsoid(0.36, 0.34, 0.32, shellMat));
  body.add(rotated(torus(0.35, 0.03, cyan), Math.PI / 2));
  body.add(at(sphere(0.05, cyan, 12), 0, 0.06, 0.31));
  body.add(at(cylinder(0.18, 0.08, 0.18, trim), 0, -0.38, 0));
  body.add(at(sphere(0.085, thruster, 12), 0, -0.5, 0));

  const head = pivot(0, 0.44, 0);
  head.add(ellipsoid(0.36, 0.29, 0.3, shellMat));
  head.add(at(ellipsoid(0.29, 0.2, 0.12, visor), 0, 0, 0.21));
  const eyes = pair((s) => at(ellipsoid(0.05, 0.075, 0.02, cyan, 12), s * 0.1, 0.02, 0.325));
  head.add(...eyes);
  const ears = pair((s) => rotated(at(cylinder(0.08, 0.08, 0.06, trim), s * 0.36, 0, 0), 0, 0, Math.PI / 2));
  head.add(...ears);
  const tail = pivot(0, 0.27, 0);
  tail.add(at(cylinder(0.012, 0.012, 0.18, trim, 6), 0, 0.09, 0));
  tail.add(at(sphere(0.04, magenta, 10), 0, 0.2, 0));
  head.add(tail);
  body.add(head);

  const arms = pair((s) => {
    const arm = rotated(pivot(s * 0.37, 0.06, 0), 0, 0, s * 0.15);
    arm.add(limb(0.055, 0.3, shellMat));
    arm.add(at(sphere(0.07, trim, 12), 0, -0.32, 0));
    return arm;
  });
  body.add(...arms);

  return { root, body, head, tail, ears, arms, eyes, glows: [cyan, magenta, thruster], height: 1.5, footprint: 0.4 };
}

export function buildDrone(): CompanionRig {
  const hull = toon(0x3b4252);
  const dome = toon(0x5e81ac);
  const metal = toon(0x8f9bb3);
  const lens = glow(0x88f0ff);
  const red = glow(0xff5a5a);
  const green = glow(0x5aff8f);
  const rotorMat = toon(0xd8dee9, { transparent: true, opacity: 0.45 });

  const root = new THREE.Group();
  const body = bodyAt(0.45);
  root.add(body);
  body.add(ellipsoid(0.34, 0.15, 0.34, hull));
  body.add(at(ellipsoid(0.2, 0.12, 0.2, dome), 0, 0.1, 0));

  const head = pivot(0, -0.04, 0.3);
  head.add(sphere(0.1, hull, 16));
  head.add(at(sphere(0.05, lens, 12), 0, 0, 0.08));
  body.add(head);

  const spinners: THREE.Object3D[] = [];
  [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ].forEach(([sx, sz], index) => {
    const armPivot = rotated(pivot(sx * 0.16, 0.02, sz * 0.16), 0, Math.atan2(sx, sz));
    armPivot.add(rotated(at(cylinder(0.025, 0.025, 0.3, metal, 8), 0, 0, 0.15), Math.PI / 2));
    body.add(armPivot);
    const hub = at(cylinder(0.04, 0.04, 0.07, hull, 10), sx * 0.32, 0.05, sz * 0.32);
    body.add(hub);
    const rotor = pivot(sx * 0.32, 0.1, sz * 0.32);
    rotor.add(cylinder(0.2, 0.2, 0.006, rotorMat, 24));
    rotor.add(at(ellipsoid(0.19, 0.008, 0.025, metal, 8), 0, 0.006, 0));
    body.add(rotor);
    spinners.push(rotor);
    body.add(at(sphere(0.022, index < 2 ? green : red, 8), sx * 0.32, 0.0, sz * 0.32 + sz * 0.05));
  });

  const legs = pair((s) => pivot(s * 0.16, -0.12, 0, limb(0.015, 0.16, metal)));
  body.add(...legs);

  return { root, body, head, legs, spinners, glows: [lens, red, green], height: 0.65, footprint: 0.45 };
}
