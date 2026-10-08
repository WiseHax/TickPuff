/**
 * Procedural animation for rigs built from primitives (and a fallback for
 * GLB models without clips). Each frame computes a target pose for the
 * current activity and blends toward it, so activity changes never snap.
 */
import * as THREE from 'three';
import { clamp, damp } from '$lib/core/math';
import type { CompanionActivity, Locomotion } from '$lib/types';
import type { CompanionRig } from '../models/rig';

export interface AnimationInput {
  activity: CompanionActivity;
  /** Seconds since the activity started (for one-shot motions). */
  activityTime: number;
  /** Current movement speed and the companion's run speed (same units). */
  speed: number;
  runSpeed: number;
  /** Desired head orientation relative to the body, radians. */
  lookYaw: number;
  lookPitch: number;
  /** 0 = ignore the look target, 1 = follow it fully. */
  lookWeight: number;
}

export interface Animator {
  update(dt: number, time: number, input: AnimationInput): void;
}

interface Pose {
  bodyY: number;
  bodyPitch: number;
  bodyRoll: number;
  squash: number;
  headYaw: number;
  headPitch: number;
  headRoll: number;
  tailYaw: number;
  tailPitch: number;
  tailCurl: number;
  ear: number;
  legs: [number, number, number, number];
  armFlap: number;
  armSwing: number;
  eyeOpen: number;
  glow: number;
  spinRate: number;
  bell: number;
}

const neutralPose = (): Pose => ({
  bodyY: 0,
  bodyPitch: 0,
  bodyRoll: 0,
  squash: 1,
  headYaw: 0,
  headPitch: 0,
  headRoll: 0,
  tailYaw: 0,
  tailPitch: 0,
  tailCurl: 0,
  ear: 0,
  legs: [0, 0, 0, 0],
  armFlap: 0,
  armSwing: 0,
  eyeOpen: 1,
  glow: 1,
  spinRate: 0,
  bell: 0,
});

const SLEEPY: CompanionActivity[] = ['sleep'];
const SEATED: CompanionActivity[] = ['sit', 'focus'];
const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
const hop = (time: number, duration: number, height: number) =>
  time < duration ? Math.sin((time / duration) * Math.PI) * height : 0;

export class ProceduralAnimator implements Animator {
  private pose = neutralPose();
  private phase = 0;
  private blinkTimer = 2;
  private blinking = 0;
  private twitch = 0;
  private twitchTimer = 4;
  private readonly base = new Map<THREE.Object3D, { rotation: THREE.Euler; scale: THREE.Vector3 }>();
  private readonly glowColors: THREE.Color[];
  private readonly upright: boolean;

  constructor(
    private readonly rig: CompanionRig,
    private readonly locomotion: Locomotion,
    private readonly random: () => number = Math.random,
  ) {
    const parts = [
      rig.body,
      rig.head,
      rig.tail,
      ...(rig.tailSegments ?? []),
      ...(rig.ears ?? []),
      ...(rig.legs ?? []),
      ...(rig.arms ?? []),
      ...(rig.eyes ?? []),
      ...(rig.tentacles ?? []),
    ].filter((part): part is THREE.Object3D => !!part);
    for (const part of parts) this.base.set(part, { rotation: part.rotation.clone(), scale: part.scale.clone() });
    for (const tentacle of rig.tentacles ?? []) {
      for (const child of tentacle.children) {
        if (child.userData.segment)
          this.base.set(child, { rotation: child.rotation.clone(), scale: child.scale.clone() });
      }
    }
    this.glowColors = (rig.glows ?? []).map((material) => material.color.clone());
    // Tall swimmers (the penguin) lean forward to swim; fish are already horizontal.
    this.upright = locomotion === 'swim' && rig.height > 1.2;
  }

  update(dt: number, time: number, input: AnimationInput): void {
    const target = this.targetPose(dt, time, input);
    this.blend(target, dt);
    this.apply(dt, time, input);
  }

  private targetPose(dt: number, t: number, input: AnimationInput): Pose {
    const p = neutralPose();
    const { activity, activityTime: at } = input;
    const moving = input.speed > 0.05;
    const speed01 = clamp(input.speed / Math.max(0.1, input.runSpeed), 0, 1);

    // Gait phase advances with actual movement speed (no foot sliding).
    const stride = this.locomotion === 'hop' ? 5 : this.locomotion === 'pulse' ? 2.2 : 7;
    const idleRate = this.locomotion === 'swim' ? 2.5 : this.locomotion === 'pulse' ? 1.6 : 0;
    this.phase += dt * (moving ? stride * (0.6 + speed01 * 1.4) : idleRate);
    const ph = this.phase;

    // Blinking and ear twitches.
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.blinking = 0.14;
      this.blinkTimer = 2.5 + this.random() * 4;
    }
    this.blinking = Math.max(0, this.blinking - dt);
    this.twitchTimer -= dt;
    if (this.twitchTimer <= 0) {
      this.twitch = 1;
      this.twitchTimer = 3 + this.random() * 5;
    }
    this.twitch = Math.max(0, this.twitch - dt * 5);
    if (this.blinking > 0) p.eyeOpen = 0.1;

    // Idle breathing and looking around everywhere.
    p.squash = 1 + Math.sin(t * 2.2) * 0.012;
    p.headYaw = Math.sin(t * 0.37) * 0.25 * (1 - input.lookWeight);
    p.headPitch = Math.sin(t * 0.23) * 0.06 * (1 - input.lookWeight);
    p.tailYaw = Math.sin(t * 1.3) * 0.3;
    p.ear = this.twitch * 0.4;
    p.spinRate = 18;

    switch (this.locomotion) {
      case 'quadruped':
        this.quadruped(p, activity, at, t, ph, moving, speed01);
        break;
      case 'biped':
        this.biped(p, activity, at, t, ph, moving, speed01);
        break;
      case 'hop':
        this.hopper(p, activity, at, t, ph, moving, speed01);
        break;
      case 'hover':
        this.hover(p, activity, at, t, moving, speed01);
        break;
      case 'swim':
        this.swim(p, activity, at, t, ph, moving, speed01);
        break;
      case 'pulse':
        this.pulse(p, activity, t, ph, moving);
        break;
    }

    // Shared reactions layered on top of locomotion-specific poses.
    if (activity === 'react') {
      p.bodyY += hop(at, 0.45, 0.2);
      p.ear = 0.6;
      p.eyeOpen = 1.15;
      p.tailYaw = Math.sin(t * 16) * 0.5;
    }
    if (activity === 'weather-react') {
      const shake = at < 1.1 ? Math.sin(at * 28) * 0.22 * (1 - at / 1.1) : 0;
      p.bodyRoll += shake;
      p.headRoll += shake * 1.5;
      if (at >= 1.1) p.headPitch = -0.45;
      p.ear = -0.25;
    }
    if (SLEEPY.includes(activity)) {
      p.eyeOpen = 0.08;
      p.glow = 0.25;
      p.ear = -0.4;
    }
    if (activity === 'focus') {
      p.headPitch = -0.22;
      p.eyeOpen = this.blinking > 0 ? 0.1 : 0.8;
    }
    if (activity === 'wake' && at < 1.4) {
      p.headPitch = -0.35; // a big yawn toward the sky
      p.eyeOpen = 0.3 + at / 2;
    }

    // Look target (pointer / camera) blended over the activity's head pose.
    const yawLimit = this.locomotion === 'biped' ? 1.5 : 0.9;
    p.headYaw = clamp(p.headYaw * (1 - input.lookWeight) + input.lookYaw * input.lookWeight, -yawLimit, yawLimit);
    p.headPitch = clamp(p.headPitch + input.lookPitch * input.lookWeight, -0.6, 0.5);
    return p;
  }

  private quadruped(
    p: Pose,
    activity: CompanionActivity,
    at: number,
    t: number,
    ph: number,
    moving: boolean,
    speed01: number,
  ) {
    if (moving) {
      const amp = 0.45 + speed01 * 0.45;
      const s = Math.sin(ph);
      p.legs = [s * amp, -s * amp, -s * amp, s * amp];
      p.bodyY = Math.abs(s) * (0.03 + speed01 * 0.06);
      p.bodyRoll = s * 0.03;
      p.bodyPitch = Math.sin(ph * 2) * 0.05 * speed01;
      p.headPitch += Math.sin(ph * 2) * 0.03;
      p.tailYaw = s * 0.25;
      p.tailPitch = -0.1 - speed01 * 0.25;
      p.ear = -0.3 * speed01;
      return;
    }
    if (SEATED.includes(activity)) {
      p.bodyPitch = -0.35;
      p.bodyY = -0.12;
      p.legs = [0.35, 0.35, -1.0, -1.0];
      p.headPitch += 0.2;
      p.tailYaw = 0.9 + Math.sin(t * 0.8) * 0.1;
      p.tailPitch = 0.35;
      p.tailCurl = 0.6;
    } else if (activity === 'sleep') {
      p.bodyY = -(this.rig.body.userData.restY ?? 0.6) * 0.55;
      p.legs = [1.25, 1.25, -1.25, -1.25];
      // Head resting low and tilted toward the viewer, so the sleeping face stays visible.
      p.headPitch = 0.2;
      p.headYaw = 0.5;
      p.headRoll = 0.3;
      p.squash = 1 + Math.sin(t * 1.1) * 0.03;
      p.tailYaw = 1.25;
      p.tailPitch = 0.5;
      p.tailCurl = 1;
    } else if (activity === 'stretch') {
      const bow = ease(clamp(at / 0.8, 0, 1));
      p.bodyPitch = 0.3 * bow;
      p.bodyY = -0.06 * bow;
      p.legs = [-0.9 * bow, -0.9 * bow, 0.25 * bow, 0.25 * bow];
      p.tailPitch = -0.6 * bow;
      p.headPitch = -0.3 * bow;
    } else if (activity === 'play') {
      p.bodyY = Math.abs(Math.sin(t * 6)) * 0.14;
      p.bodyPitch = Math.sin(t * 6) * 0.12;
      p.legs = [-0.6 + Math.sin(t * 12) * 0.4, 0, 0, 0];
      p.tailYaw = Math.sin(t * 14) * 0.6;
      p.headRoll = Math.sin(t * 3) * 0.2;
      p.ear = 0.4;
    } else if (activity === 'celebrate') {
      p.bodyY = hop(at % 0.9, 0.9, 0.35);
      p.legs = [-0.5, -0.5, 0.5, 0.5].map((v) => v * Math.min(1, p.bodyY * 5)) as Pose['legs'];
      p.tailYaw = Math.sin(t * 16) * 0.6;
      p.ear = 0.6;
    } else if (activity === 'look') {
      p.ear = 0.3;
      p.tailYaw = Math.sin(t * 0.9) * 0.15;
    }
  }

  private biped(
    p: Pose,
    activity: CompanionActivity,
    at: number,
    t: number,
    ph: number,
    moving: boolean,
    speed01: number,
  ) {
    if (moving) {
      const s = Math.sin(ph);
      p.bodyRoll = s * 0.12;
      p.legs = [s * 0.4, -s * 0.4, 0, 0];
      p.bodyY = Math.abs(s) * 0.03;
      p.armFlap = 0.1 + speed01 * (0.5 + Math.sin(t * 22) * 0.4);
      return;
    }
    if (SEATED.includes(activity)) {
      p.bodyY = -0.1;
      p.squash *= 0.96;
      p.legs = [0.5, 0.5, 0, 0];
    } else if (activity === 'sleep') {
      p.bodyY = -0.14;
      p.headPitch = 0.3;
      p.headRoll = 0.3;
      p.squash = 1.03 + Math.sin(t * 1.1) * 0.02;
      p.legs = [0.6, 0.6, 0, 0];
    } else if (activity === 'stretch') {
      const open = ease(clamp(at / 0.6, 0, 1));
      p.armFlap = 1.25 * open;
      p.headPitch = -0.3 * open;
    } else if (activity === 'play' || activity === 'celebrate' || activity === 'react') {
      p.bodyY += Math.abs(Math.sin(t * 7)) * 0.12;
      p.armFlap = 0.8 + Math.sin(t * 20) * 0.5;
    } else if (activity === 'weather-react') {
      p.squash = 1.08; // feathers fluffed
    }
  }

  private hopper(
    p: Pose,
    activity: CompanionActivity,
    at: number,
    t: number,
    ph: number,
    moving: boolean,
    speed01: number,
  ) {
    if (moving) {
      const air = Math.max(0, Math.sin(ph));
      p.bodyY = air * (0.18 + speed01 * 0.14);
      p.bodyPitch = Math.cos(ph) * 0.15 * (air > 0 ? 1 : 0);
      p.squash = 1 - (1 - air) * 0.05;
      p.legs = [-air * 0.5, -air * 0.5, air * 0.8, air * 0.8];
      p.ear = -air * 0.6;
      return;
    }
    // Nose wiggle.
    p.headPitch += Math.sin(t * 18) * 0.01;
    if (SEATED.includes(activity)) {
      p.squash = 0.93;
      p.bodyY = -0.04;
    } else if (activity === 'sleep') {
      p.bodyY = -0.12;
      p.squash = 0.9 + Math.sin(t * 1.1) * 0.02;
      p.ear = -0.9;
      p.headPitch = 0.2;
    } else if (activity === 'stretch') {
      const s = ease(clamp(at / 0.7, 0, 1));
      p.squash = 1 + 0.12 * s;
      p.bodyPitch = 0.2 * s;
      p.legs = [-0.7 * s, -0.7 * s, 0.4 * s, 0.4 * s];
    } else if (activity === 'play' || activity === 'celebrate') {
      p.bodyY = Math.abs(Math.sin(t * 6)) * 0.22;
      p.ear = -Math.abs(Math.sin(t * 6)) * 0.5;
    }
  }

  private hover(p: Pose, activity: CompanionActivity, at: number, t: number, moving: boolean, speed01: number) {
    p.bodyY = Math.sin(t * 2.2) * 0.05;
    p.spinRate = moving ? 32 : 20;
    p.tailYaw = Math.sin(t * 1.7) * 0.2; // antenna sway
    if (moving) {
      p.bodyPitch = 0.15 + speed01 * 0.15;
      p.armSwing = 0.4 * speed01;
      return;
    }
    if (SEATED.includes(activity)) {
      p.bodyY -= 0.08;
      p.armFlap = -0.1;
    } else if (activity === 'sleep') {
      p.bodyY = -0.12 + Math.sin(t * 0.8) * 0.015;
      p.spinRate = 4;
      p.tailPitch = 0.6;
      p.headPitch = 0.25;
      p.armFlap = -0.15;
    } else if (activity === 'stretch') {
      p.armFlap = 1.3 * ease(clamp(at / 0.6, 0, 1));
    } else if (activity === 'play') {
      p.armFlap = 0.6 + Math.sin(t * 10) * 0.5;
      p.bodyRoll = Math.sin(t * 4) * 0.2;
    } else if (activity === 'celebrate') {
      p.armFlap = 1.4;
      p.bodyY += hop(at % 0.8, 0.8, 0.25);
    } else if (activity === 'react') {
      p.glow = 1.6;
    }
  }

  private swim(
    p: Pose,
    activity: CompanionActivity,
    at: number,
    t: number,
    ph: number,
    moving: boolean,
    speed01: number,
  ) {
    const lean = this.upright ? (moving ? 1.3 : 0.35) : 0;
    p.bodyPitch = lean;
    p.bodyY = Math.sin(t * 1.2) * 0.05;
    const stroke = Math.sin(ph);
    p.tailYaw = stroke * (moving ? 0.45 : 0.15);
    p.armFlap = this.upright ? stroke * (moving ? 0.7 : 0.2) : 0;
    p.armSwing = this.upright ? 0 : stroke * (moving ? 0.6 : 0.25);
    p.bodyRoll = moving ? stroke * 0.06 : 0;
    p.legs = [0, 0, stroke * 0.4, -stroke * 0.4];
    if (moving) p.headYaw += -stroke * 0.08 * (1 - speed01 * 0.5);
    if (activity === 'sleep') {
      p.bodyY = -0.12 + Math.sin(t * 0.6) * 0.03;
      p.armSwing *= 0.3;
    } else if (activity === 'play') {
      p.bodyRoll = Math.sin(t * 3) * 0.5;
      p.bodyY += Math.sin(t * 3) * 0.1;
    }
  }

  private pulse(p: Pose, activity: CompanionActivity, t: number, ph: number, moving: boolean) {
    const contraction = Math.max(0, Math.sin(ph)) ** 2;
    p.bell = activity === 'sleep' ? contraction * 0.4 : contraction;
    p.bodyY = contraction * 0.08 + Math.sin(t * 0.7) * 0.05;
    p.tailYaw = 0;
    if (activity === 'celebrate' || activity === 'play') p.headRoll = Math.sin(t * 5) * 0.25;
    if (moving) p.bodyPitch = 0.15;
  }

  private blend(target: Pose, dt: number) {
    const p = this.pose;
    const k = 9;
    p.bodyY = damp(p.bodyY, target.bodyY, k, dt);
    p.bodyPitch = damp(p.bodyPitch, target.bodyPitch, k, dt);
    p.bodyRoll = damp(p.bodyRoll, target.bodyRoll, k, dt);
    p.squash = damp(p.squash, target.squash, k, dt);
    p.headYaw = damp(p.headYaw, target.headYaw, 6, dt);
    p.headPitch = damp(p.headPitch, target.headPitch, 6, dt);
    p.headRoll = damp(p.headRoll, target.headRoll, 6, dt);
    p.tailYaw = damp(p.tailYaw, target.tailYaw, 8, dt);
    p.tailPitch = damp(p.tailPitch, target.tailPitch, 6, dt);
    p.tailCurl = damp(p.tailCurl, target.tailCurl, 4, dt);
    p.ear = damp(p.ear, target.ear, 10, dt);
    for (let i = 0; i < 4; i++) p.legs[i] = damp(p.legs[i], target.legs[i], 14, dt);
    p.armFlap = damp(p.armFlap, target.armFlap, 10, dt);
    p.armSwing = damp(p.armSwing, target.armSwing, 10, dt);
    p.eyeOpen = target.eyeOpen < 0.2 && this.blinking > 0 ? target.eyeOpen : damp(p.eyeOpen, target.eyeOpen, 18, dt);
    p.glow = damp(p.glow, target.glow, 3, dt);
    p.spinRate = damp(p.spinRate, target.spinRate, 2, dt);
    p.bell = damp(p.bell, target.bell, 12, dt);
  }

  private apply(dt: number, t: number, input: AnimationInput) {
    const { rig, pose: p } = this;
    const restY = (rig.body.userData.restY as number | undefined) ?? 0;

    rig.body.position.y = restY + p.bodyY;
    rig.body.rotation.set(p.bodyPitch, this.spin(input), p.bodyRoll + this.barrelRoll(input));
    const sideways = 1 / Math.sqrt(Math.max(0.5, p.squash));
    rig.body.scale.set(sideways, p.squash, sideways);

    this.rotate(rig.head, p.headPitch, p.headYaw, p.headRoll);
    if (this.locomotion === 'pulse') {
      rig.head.scale.set(1 - p.bell * 0.12, 1 + p.bell * 0.1, 1 - p.bell * 0.12);
    }

    if (rig.tail) this.rotate(rig.tail, p.tailPitch, p.tailYaw, 0);
    (rig.tailSegments ?? []).forEach((segment, i) =>
      this.rotate(segment, -0.35 * p.tailCurl + Math.sin(t * 2 + i) * 0.12, 0, 0),
    );

    (rig.ears ?? []).forEach((ear, i) => {
      const side = i === 0 ? -1 : 1;
      this.rotate(ear, -p.ear * 0.5, 0, side * -p.ear * 0.2);
    });

    const legs = rig.legs ?? [];
    legs.forEach((leg, i) => this.rotate(leg, p.legs[i] ?? 0, 0, 0));

    (rig.arms ?? []).forEach((arm, i) => {
      const side = i === 0 ? -1 : 1;
      this.rotate(arm, p.armSwing * (i === 0 ? 1 : -1), 0, side * p.armFlap);
    });

    for (const eyeObject of rig.eyes ?? []) {
      const base = this.base.get(eyeObject);
      if (base) eyeObject.scale.y = base.scale.y * clamp(p.eyeOpen, 0.06, 1.2);
    }

    for (const spinner of rig.spinners ?? []) spinner.rotation.y += p.spinRate * dt;

    (rig.tentacles ?? []).forEach((tentacle, i) => {
      const wave = Math.sin(t * 1.8 + i * 0.9) * 0.18;
      const drag = input.speed > 0.05 ? 0.35 : 0;
      this.rotate(tentacle, wave + drag + p.bell * 0.25, 0, Math.cos(t * 1.3 + i) * 0.12);
      for (const child of tentacle.children) {
        if (child.userData.segment) this.rotate(child, Math.sin(t * 2.2 + i) * 0.3 + drag * 0.5, 0, 0);
      }
    });

    (rig.glows ?? []).forEach((material, i) => {
      material.color.copy(this.glowColors[i]).multiplyScalar(clamp(p.glow, 0.15, 1.6));
    });
  }

  /** Whole-body spin used by celebrations (applied directly, never blended). */
  private spin(input: AnimationInput): number {
    if (input.activity === 'celebrate' && this.locomotion !== 'swim') {
      const at = input.activityTime;
      return at < 1.2 ? ease(at / 1.2) * Math.PI * 2 : 0;
    }
    if (input.activity === 'play' && this.locomotion === 'hover') return input.activityTime * 4;
    return 0;
  }

  /** Swimmers celebrate with a barrel roll instead of a spin. */
  private barrelRoll(input: AnimationInput): number {
    if (input.activity !== 'celebrate' || this.locomotion !== 'swim') return 0;
    const at = input.activityTime;
    return at < 1.2 ? ease(at / 1.2) * Math.PI * 2 : 0;
  }

  private rotate(object: THREE.Object3D, x: number, y: number, z: number) {
    const base = this.base.get(object);
    if (!base) {
      object.rotation.set(x, y, z);
      return;
    }
    object.rotation.set(base.rotation.x + x, base.rotation.y + y, base.rotation.z + z);
  }
}
