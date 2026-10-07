/**
 * Smooth movement toward a destination: the companion turns first, then
 * accelerates, walks along its heading (so paths curve naturally) and
 * slows down as it arrives. Positions only ever change by movement —
 * there is no teleporting.
 *
 * World space: x = left/right, z = toward the camera, y = altitude.
 * Heading 0 faces the camera (+z).
 */
import { clamp, wrapAngle } from '$lib/core/math';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface NavigatorOptions {
  /** Radians per second. */
  turnRate?: number;
  /** Units per second squared. */
  acceleration?: number;
  /** Altitude change speed, units per second. */
  climbRate?: number;
}

const ARRIVE_RADIUS = 0.06;
/** Close enough when the target is near but awkwardly behind us. */
const NEAR_RADIUS = 0.25;
const BRAKE_DISTANCE = 0.6;

export class Navigator {
  readonly position: Vec3;
  heading = 0;
  speed = 0;
  private target: Vec3 | null = null;
  private cruise = 0;
  private restHeading: number | null = 0;
  private readonly turnRate: number;
  private readonly acceleration: number;
  private readonly climbRate: number;

  constructor(start: Vec3, options: NavigatorOptions = {}) {
    this.position = { ...start };
    this.turnRate = options.turnRate ?? 4;
    this.acceleration = options.acceleration ?? 3;
    this.climbRate = options.climbRate ?? 0.8;
  }

  get destination(): Vec3 | null {
    return this.target;
  }

  moveTo(target: Vec3, speed: number) {
    this.target = { ...target };
    this.cruise = Math.max(0, speed);
  }

  stop() {
    this.target = null;
  }

  /** Heading to turn toward while standing still (null = keep current). */
  setRestHeading(heading: number | null) {
    this.restHeading = heading;
  }

  update(dt: number): { arrived: boolean; moving: boolean } {
    let arrived = false;
    let targetSpeed = 0;

    if (this.target) {
      const dx = this.target.x - this.position.x;
      const dz = this.target.z - this.position.z;
      const distance = Math.hypot(dx, dz);
      const diff = wrapAngle(Math.atan2(dx, dz) - this.heading);
      if (distance < ARRIVE_RADIUS || (distance < NEAR_RADIUS && Math.abs(diff) > 1.2)) {
        arrived = true;
        this.target = null;
      } else {
        this.heading = wrapAngle(this.heading + clamp(diff, -this.turnRate * dt, this.turnRate * dt));
        // Turn mostly in place before walking, and brake near the end.
        const alignment = Math.max(0, Math.cos(diff));
        const brake = Math.max(0.25, Math.min(1, distance / BRAKE_DISTANCE));
        targetSpeed = this.cruise * alignment * brake;
      }
    } else if (this.restHeading !== null && this.speed < 0.05) {
      const diff = wrapAngle(this.restHeading - this.heading);
      const step = this.turnRate * 0.35 * dt;
      this.heading = wrapAngle(this.heading + clamp(diff, -step, step));
    }

    const delta = targetSpeed - this.speed;
    this.speed += clamp(delta, -this.acceleration * 2 * dt, this.acceleration * dt);
    this.speed = Math.max(0, this.speed);

    this.position.x += Math.sin(this.heading) * this.speed * dt;
    this.position.z += Math.cos(this.heading) * this.speed * dt;
    if (this.target) {
      const dy = this.target.y - this.position.y;
      this.position.y += clamp(dy, -this.climbRate * dt, this.climbRate * dt);
    }

    return { arrived, moving: this.speed > 0.05 };
  }

  /** Keep the companion inside the stage (applied after movement). */
  constrain(fn: (position: Vec3) => Vec3) {
    const next = fn(this.position);
    this.position.x = next.x;
    this.position.y = next.y;
    this.position.z = next.z;
  }
}
