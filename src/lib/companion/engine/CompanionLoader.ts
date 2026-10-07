/**
 * Turns a CompanionDefinition into a rig plus an animator.
 *
 * Procedural models build synchronously. GLB/GLTF models load
 * asynchronously; until they arrive (or if they fail) the definition's
 * procedural fallback is shown, so a companion is never missing.
 */
import * as THREE from 'three';
import type { CompanionDefinition } from '$lib/types';
import { ClipAnimator } from '../animation/ClipAnimator';
import { ProceduralAnimator, type Animator } from '../animation/ProceduralAnimator';
import { disposeObject } from '../models/parts';
import { buildProcedural } from '../models/procedural';
import type { CompanionRig } from '../models/rig';

export interface LoadedCompanion {
  definition: CompanionDefinition;
  rig: CompanionRig;
  animator: Animator;
  source: 'procedural' | 'gltf';
  dispose(): void;
}

/** Target height for imported models, matching the procedural ones. */
const AUTHORED_HEIGHT = 1.6;

export function loadProceduralCompanion(definition: CompanionDefinition): LoadedCompanion {
  const id = definition.model.kind === 'procedural' ? definition.model.id : definition.model.fallback;
  const rig = buildProcedural(id);
  return {
    definition,
    rig,
    animator: new ProceduralAnimator(rig, definition.locomotion),
    source: 'procedural',
    dispose: () => disposeObject(rig.root),
  };
}

/**
 * Build a rig around an imported scene. The model is normalized to the
 * authored height with its feet on the ground; nodes named `head` / `tail`
 * (case-insensitive) are used for procedural head tracking when present.
 */
export function rigFromScene(scene: THREE.Object3D): CompanionRig {
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  const scale = size.y > 0 ? AUTHORED_HEIGHT / size.y : 1;
  scene.scale.multiplyScalar(scale);
  const center = box.getCenter(new THREE.Vector3()).multiplyScalar(scale);
  scene.position.set(-center.x, -box.min.y * scale, -center.z);

  const root = new THREE.Group();
  const body = new THREE.Group();
  body.userData.restY = 0;
  body.add(scene);
  root.add(body);
  const find = (name: string) => {
    let found: THREE.Object3D | undefined;
    scene.traverse((object) => {
      if (!found && object.name.toLowerCase() === name) found = object;
    });
    return found;
  };
  return {
    root,
    body,
    head: find('head') ?? new THREE.Group(),
    tail: find('tail'),
    height: AUTHORED_HEIGHT,
    footprint: Math.max(size.x, size.z) * scale * 0.5,
  };
}

export async function loadGltfCompanion(definition: CompanionDefinition): Promise<LoadedCompanion> {
  if (definition.model.kind !== 'gltf') return loadProceduralCompanion(definition);
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const gltf = await new GLTFLoader().loadAsync(definition.model.url);
  const rig = rigFromScene(gltf.scene);
  const mixer = new THREE.AnimationMixer(gltf.scene);
  const animator =
    gltf.animations.length > 0
      ? new ClipAnimator(mixer, gltf.animations, definition.model.clips)
      : new ProceduralAnimator(rig, definition.locomotion);
  return {
    definition,
    rig,
    animator,
    source: 'gltf',
    dispose: () => {
      mixer.stopAllAction();
      disposeObject(rig.root);
    },
  };
}
