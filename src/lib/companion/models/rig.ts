/**
 * The contract between a companion model and the animator.
 *
 * Models are authored facing +Z with their feet at y = 0 and are roughly
 * 1.6 units tall. Every part is optional except root / body / head, so the
 * animator works with any creature shape. GLB models can map their own
 * nodes onto these slots (see CompanionLoader).
 */
import type * as THREE from 'three';

export interface CompanionRig {
  /** Positioned and turned by the navigator. */
  root: THREE.Group;
  /** Posture pivot: bob, pitch, roll, squash. */
  body: THREE.Object3D;
  /** Looks at things. */
  head: THREE.Object3D;
  tail?: THREE.Object3D;
  /** Extra tail segments (child chain) for curling tails. */
  tailSegments?: THREE.Object3D[];
  /** [left, right] */
  ears?: THREE.Object3D[];
  /** Quadrupeds: [front-left, front-right, back-left, back-right]; bipeds: [left, right]. */
  legs?: THREE.Object3D[];
  /** Wings, flippers, fins or arms: [left, right]. */
  arms?: THREE.Object3D[];
  /** Scaled on Y to blink. */
  eyes?: THREE.Object3D[];
  /** Propellers and other parts that spin. */
  spinners?: THREE.Object3D[];
  /** Hanging parts that wave (jellyfish tentacles). */
  tentacles?: THREE.Object3D[];
  /** Emissive materials dimmed while sleeping (robot eyes, lights). */
  glows?: THREE.MeshBasicMaterial[];
  /** Model-space height, used for hit testing and the shadow size. */
  height: number;
  /** Model-space radius of the footprint, for the blob shadow. */
  footprint: number;
}
