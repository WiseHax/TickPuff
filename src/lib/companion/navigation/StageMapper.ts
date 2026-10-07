/**
 * Maps normalized stage coordinates (what themes author) to world space and
 * back by casting rays from the camera onto the ground plane. The ground
 * band is fixed in screen space, so the companion stands on the 2D scenery's
 * ground at any window size or aspect ratio.
 */
import * as THREE from 'three';
import { clamp } from '$lib/core/math';
import type { Vec3 } from './Navigator';

/** Screen-space (0 = top, 1 = bottom) of the stage's front and back edges. */
export const GROUND_FRONT = 0.93;
export const GROUND_BACK = 0.8;

export class StageMapper {
  private readonly raycaster = new THREE.Raycaster();
  private readonly ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private readonly ndc = new THREE.Vector2();
  private readonly hit = new THREE.Vector3();
  private readonly projected = new THREE.Vector3();

  constructor(private readonly camera: THREE.Camera) {}

  /** Normalized (x, depth) → world (x, z) on the ground. */
  toWorld(x: number, depth: number): { x: number; z: number } {
    const screenY = GROUND_FRONT + (GROUND_BACK - GROUND_FRONT) * clamp(depth, 0, 1);
    this.ndc.set(x * 2 - 1, -(screenY * 2 - 1));
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const point = this.raycaster.ray.intersectPlane(this.ground, this.hit);
    return point ? { x: point.x, z: point.z } : { x: 0, z: 0 };
  }

  /** World ground position → normalized (x, depth). */
  toStage(position: { x: number; z: number }): { x: number; depth: number } {
    this.projected.set(position.x, 0, position.z).project(this.camera);
    const screenX = (this.projected.x + 1) / 2;
    const screenY = (1 - this.projected.y) / 2;
    return { x: screenX, depth: (screenY - GROUND_FRONT) / (GROUND_BACK - GROUND_FRONT) };
  }

  /** Clamp a world position into the stage's horizontal and depth bounds. */
  clampToStage(position: Vec3, minX: number, maxX: number): Vec3 {
    const stage = this.toStage(position);
    const x = clamp(stage.x, minX, maxX);
    const depth = clamp(stage.depth, 0, 1);
    if (x === stage.x && depth === stage.depth) return position;
    const world = this.toWorld(x, depth);
    return { x: world.x, y: position.y, z: world.z };
  }
}
