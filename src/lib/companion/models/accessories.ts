/**
 * Small accessories earned through friendship (see stores/bond.ts), placed on
 * top of any companion's head — procedural or GLB — from its bounding box.
 */
import * as THREE from 'three';
import type { Accessory } from '$lib/stores/bond';
import type { CompanionRig } from './rig';
import { addOutlines, at, detail, ellipsoid, rotated, softCone, sphere, toon, torus } from './parts';

function flower(): THREE.Group {
  const group = new THREE.Group();
  const petal = toon(0xff9ec4);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    group.add(at(ellipsoid(0.055, 0.02, 0.035, petal, 14), Math.cos(a) * 0.05, 0, Math.sin(a) * 0.05));
  }
  group.add(detail(at(sphere(0.03, toon(0xffd54a), 12), 0, 0.012, 0)));
  group.add(rotated(at(ellipsoid(0.03, 0.008, 0.06, toon(0x6fb35a), 10), 0.06, -0.01, 0.05), 0, 0.6));
  return group;
}

function crown(): THREE.Group {
  const group = new THREE.Group();
  const gold = toon(0xf4c542, { emissive: 0x4a3000, emissiveIntensity: 0.35 });
  group.add(rotated(torus(0.085, 0.018, gold), Math.PI / 2));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    group.add(at(softCone(0.026, 0.07, gold, 0.1), Math.cos(a) * 0.08, 0, Math.sin(a) * 0.08));
  }
  group.add(detail(at(sphere(0.02, toon(0xff5a7a), 10), 0, 0.03, 0.085)));
  return group;
}

const BUILDERS: Record<Accessory, () => THREE.Group> = { flower, crown };

/** Top of the head (excluding ears) in head-local coordinates, and the head's width. */
function headTop(rig: CompanionRig): { top: THREE.Vector3; width: number } {
  rig.root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const skip = new Set<THREE.Object3D>(rig.ears ?? []);
  const visit = (object: THREE.Object3D) => {
    if (skip.has(object) || object.userData.outline || object.userData.accessory) return;
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh) box.expandByObject(mesh, true);
    object.children.forEach(visit);
  };
  visit(rig.head);
  if (box.isEmpty()) return { top: new THREE.Vector3(0, 0.3, 0), width: 0.5 };
  const top = new THREE.Vector3((box.min.x + box.max.x) / 2, box.max.y, (box.min.z + box.max.z) / 2);
  rig.head.worldToLocal(top);
  const scale = new THREE.Vector3();
  rig.head.getWorldScale(scale);
  return { top, width: (box.max.x - box.min.x) / Math.max(1e-6, scale.x) };
}

/** Put the given accessories on the companion's head; returns the group to remove later. */
export function attachAccessories(rig: CompanionRig, accessories: Accessory[]): THREE.Group | null {
  if (accessories.length === 0) return null;
  const { top, width } = headTop(rig);
  const group = new THREE.Group();
  group.userData.accessory = true;
  const size = THREE.MathUtils.clamp(width / 0.6, 0.6, 1.6);
  if (accessories.includes('crown')) {
    const piece = BUILDERS.crown();
    piece.position.set(top.x, top.y - 0.02 * size, top.z);
    piece.scale.setScalar(size);
    group.add(piece);
  }
  if (accessories.includes('flower')) {
    const piece = BUILDERS.flower();
    // Tucked to one side of the head, like a flower behind the ear.
    piece.position.set(top.x + width * 0.28, top.y - 0.04 * size, top.z + width * 0.08);
    piece.rotation.set(0.3, 0, -0.45);
    piece.scale.setScalar(size);
    group.add(piece);
  }
  addOutlines(group, 0x3a2a20);
  rig.head.add(group);
  return group;
}
