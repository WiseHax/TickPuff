/**
 * Animation for GLB/GLTF companions: cross-fades between the asset's clips.
 * Activities without a mapped clip fall back to the walk or idle clip.
 */
import * as THREE from 'three';
import type { CompanionActivity } from '$lib/types';
import type { AnimationInput, Animator } from './ProceduralAnimator';

const MOVING: CompanionActivity[] = ['walk', 'explore', 'run'];

export class ClipAnimator implements Animator {
  private readonly actions = new Map<string, THREE.AnimationAction>();
  private current: THREE.AnimationAction | null = null;

  constructor(
    private readonly mixer: THREE.AnimationMixer,
    clips: THREE.AnimationClip[],
    private readonly mapping: Partial<Record<CompanionActivity, string>>,
  ) {
    for (const clip of clips) this.actions.set(clip.name, mixer.clipAction(clip));
  }

  /** The clip for an activity, following the documented fallback chain. */
  clipFor(activity: CompanionActivity, moving: boolean): string | undefined {
    const mapped = this.mapping[activity];
    if (mapped && this.actions.has(mapped)) return mapped;
    if (moving || MOVING.includes(activity)) {
      const walk = this.mapping.walk;
      if (walk && this.actions.has(walk)) return walk;
    }
    const idle = this.mapping.idle;
    return idle && this.actions.has(idle) ? idle : undefined;
  }

  update(dt: number, _time: number, input: AnimationInput): void {
    const name = this.clipFor(input.activity, input.speed > 0.05);
    const next = name ? (this.actions.get(name) ?? null) : null;
    if (next && next !== this.current) {
      next.reset().setEffectiveWeight(1).fadeIn(0.35).play();
      this.current?.fadeOut(0.35);
      this.current = next;
    }
    if (this.current && MOVING.includes(input.activity) && input.runSpeed > 0) {
      // Match the walk cycle to the actual ground speed.
      this.current.timeScale = Math.max(0.6, input.speed / (input.runSpeed * 0.5));
    } else if (this.current) {
      this.current.timeScale = 1;
    }
    this.mixer.update(dt);
  }
}
