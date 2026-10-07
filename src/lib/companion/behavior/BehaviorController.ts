/**
 * Companion behavior: a deterministic state machine with controlled
 * randomness. It decides *what* the companion does and *where* it wants to
 * go; it knows nothing about three.js, so it is unit-tested directly.
 *
 * Priority, highest first:
 *   sleep mode → celebrate / react events → focus → hover → travel → free choice
 */
import { randomBetween, weightedPick, type Random } from '$lib/core/math';
import type { CompanionActivity, Personality, StageDefinition, StageZone, TimeOfDay, WeatherType } from '$lib/types';
import { PERSONALITY_WEIGHTS, type Choice } from './personalities';

/** A point on the stage in normalized coordinates (see StageZone). */
export interface StagePoint {
  x: number;
  depth: number;
  /** 0–1 within the companion's altitude range (ignored by ground companions). */
  altitude: number;
}

export interface BehaviorContext {
  stage: StageDefinition;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  sleepMode: boolean;
  focusActive: boolean;
  hovered: boolean;
  /** Reported by the navigator this frame. */
  arrived: boolean;
  position: { x: number; depth: number };
}

export interface BehaviorOutput {
  activity: CompanionActivity;
  /** Seconds since the activity started. */
  activityTime: number;
  destination: StagePoint | null;
  pace: 'walk' | 'run';
  /** Incremented whenever the destination changes (including to null). */
  plan: number;
  /** Whether the head should follow the pointer. */
  watchPointer: boolean;
  /** Zone being visited, if any (for debugging and tests). */
  zoneId: string | null;
}

const PRECIPITATION: WeatherType[] = ['rain', 'heavy-rain', 'snow'];
const INDEFINITE = Number.POSITIVE_INFINITY;
/** Give up on a destination that takes longer than this. */
const TRAVEL_TIMEOUT = 30;

export class BehaviorController {
  private activity: CompanionActivity = 'idle';
  private activityTime = 0;
  private remaining = 2;
  private destination: StagePoint | null = null;
  private pace: 'walk' | 'run' = 'walk';
  private plan = 0;
  private zoneId: string | null = null;
  private afterArrival: { activity: CompanionActivity; duration: number } | null = null;
  private pending: 'poke' | 'celebrate' | null = null;

  constructor(
    private personality: Personality,
    private readonly random: Random = Math.random,
  ) {}

  setPersonality(personality: Personality) {
    this.personality = personality;
  }

  /** The user clicked the companion. */
  poke() {
    if (this.pending !== 'celebrate') this.pending = 'poke';
  }

  /** A focus session completed. */
  celebrate() {
    this.pending = 'celebrate';
  }

  get current(): CompanionActivity {
    return this.activity;
  }

  update(dt: number, ctx: BehaviorContext): BehaviorOutput {
    this.activityTime += dt;
    if (this.remaining !== INDEFINITE) this.remaining -= dt;

    this.decide(ctx);

    return {
      activity: this.activity,
      activityTime: this.activityTime,
      destination: this.destination,
      pace: this.pace,
      plan: this.plan,
      watchPointer: (ctx.hovered && this.activity === 'look') || this.activity === 'react',
      zoneId: this.zoneId,
    };
  }

  private decide(ctx: BehaviorContext) {
    // 1. Sleep mode overrides everything.
    if (ctx.sleepMode) {
      if (this.activity !== 'sleep' || this.remaining !== INDEFINITE) this.start('sleep', INDEFINITE, true);
      this.pending = null;
      return;
    }
    if (this.activity === 'sleep' && this.remaining === INDEFINITE) {
      this.start('wake', 1.6, true);
      return;
    }

    // 2. One-off events.
    if (this.pending === 'celebrate') {
      this.pending = null;
      this.start('celebrate', 2.6, true);
      return;
    }
    if (this.pending === 'poke') {
      this.pending = null;
      if (this.activity === 'sleep') this.start('wake', 1.6, true);
      else this.start('react', 1.1, true);
      return;
    }
    if (this.activity === 'react' && this.remaining <= 0) {
      const playful = this.personality === 'playful' || this.personality === 'energetic';
      if (playful && this.random() < 0.6) this.start('play', randomBetween(this.random, 2.5, 4.5));
      else this.start('idle', 2);
      return;
    }
    if (this.activity === 'celebrate' && this.remaining > 0) return;

    // 3. Focus: settle down and keep the user company.
    if (ctx.focusActive) {
      if (this.activity !== 'focus') this.start('focus', INDEFINITE, true);
      return;
    }
    if (this.activity === 'focus') {
      this.start('stretch', 2.5); // stretch after a long focus
      return;
    }

    // 4. Hover: stop and look at the pointer.
    if (ctx.hovered && !['wake', 'react', 'celebrate'].includes(this.activity)) {
      if (this.activity !== 'look' || this.remaining !== INDEFINITE) this.start('look', INDEFINITE, true);
      return;
    }
    if (!ctx.hovered && this.activity === 'look' && this.remaining === INDEFINITE) {
      this.start('idle', 1.5);
      return;
    }

    // 5. Travel.
    if (this.destination) {
      if (ctx.arrived) {
        const next = this.afterArrival ?? { activity: 'idle' as const, duration: 3 };
        this.afterArrival = null;
        this.clearDestination();
        this.start(next.activity, next.duration);
      } else if (this.activityTime > TRAVEL_TIMEOUT) {
        this.afterArrival = null;
        this.zoneId = null;
        this.clearDestination();
        this.start('idle', 2);
      }
      return;
    }

    // 6. Free choice when the current activity runs out.
    if (this.remaining <= 0) this.chooseNext(ctx);
  }

  private start(activity: CompanionActivity, duration: number, interrupt = false) {
    if (interrupt) {
      this.afterArrival = null;
      this.zoneId = null;
      this.clearDestination();
    }
    this.activity = activity;
    this.activityTime = 0;
    this.remaining = duration;
  }

  private clearDestination() {
    if (this.destination) {
      this.destination = null;
      this.plan += 1;
    }
  }

  private travel(
    point: StagePoint,
    pace: 'walk' | 'run',
    then: { activity: CompanionActivity; duration: number },
    zone: StageZone | null,
  ) {
    this.destination = point;
    this.pace = pace;
    this.plan += 1;
    this.afterArrival = then;
    this.zoneId = zone?.id ?? null;
    this.activity = pace === 'run' ? 'run' : zone ? 'walk' : 'explore';
    this.activityTime = 0;
    this.remaining = INDEFINITE;
  }

  private eligibleZones(ctx: BehaviorContext): StageZone[] {
    return ctx.stage.zones.filter((zone) => !zone.when || zone.when.includes(ctx.timeOfDay));
  }

  private weights(ctx: BehaviorContext, zones: StageZone[]): Partial<Record<Choice, number>> {
    const w: Partial<Record<Choice, number>> = { ...PERSONALITY_WEIGHTS[this.personality] };
    const scale = (key: Choice, factor: number) => {
      if (w[key] !== undefined) w[key] = (w[key] as number) * factor;
    };
    if (ctx.timeOfDay === 'night') {
      scale('sleep', 2);
      scale('run', 0.5);
    } else if (ctx.timeOfDay === 'late-night') {
      scale('sleep', 4);
      scale('explore', 0.5);
      scale('run', 0.3);
      scale('play', 0.4);
    } else if (ctx.timeOfDay === 'morning') {
      scale('stretch', 2);
    }
    if (PRECIPITATION.includes(ctx.weather)) {
      w['weather-react'] = 1.2;
      scale('run', 0.3);
      scale('play', 0.5);
      if (zones.some((zone) => zone.kind === 'shelter')) scale('visit', ctx.weather === 'heavy-rain' ? 4 : 2);
    }
    if (zones.length === 0) delete w.visit;
    // Avoid repeating the exact same idle-ish activity back to back.
    if (this.activity === 'stretch') delete w.stretch;
    if (this.activity === 'weather-react') delete w['weather-react'];
    return w;
  }

  private chooseNext(ctx: BehaviorContext) {
    this.zoneId = null;
    const zones = this.eligibleZones(ctx);
    const choice = weightedPick(this.random, this.weights(ctx, zones)) ?? 'idle';
    const r = (min: number, max: number) => randomBetween(this.random, min, max);

    switch (choice) {
      case 'explore':
        this.travel(this.randomPoint(ctx), 'walk', { activity: 'idle', duration: r(2, 4) }, null);
        break;
      case 'run':
        this.travel(this.randomPoint(ctx, 0.25), 'run', { activity: 'idle', duration: r(2, 3) }, null);
        break;
      case 'visit': {
        const zone = this.pickZone(ctx, zones);
        if (!zone) {
          this.start('idle', r(3, 6));
          break;
        }
        const point = { x: zone.x, depth: zone.depth, altitude: zone.altitude ?? this.random() };
        this.travel(point, 'walk', { activity: zone.activity, duration: r(zone.stay[0], zone.stay[1]) }, zone);
        break;
      }
      case 'sleep': {
        const bed = zones.filter((zone) => zone.activity === 'sleep');
        if (bed.length > 0 && this.random() < 0.5) {
          const zone = bed[Math.floor(this.random() * bed.length)];
          const point = { x: zone.x, depth: zone.depth, altitude: zone.altitude ?? 0 };
          this.travel(point, 'walk', { activity: 'sleep', duration: r(15, 40) }, zone);
        } else {
          this.start('sleep', r(15, 40));
        }
        break;
      }
      case 'sit':
        this.start('sit', r(6, 12));
        break;
      case 'stretch':
        this.start('stretch', 2.5);
        break;
      case 'look':
        this.start('look', r(3, 5));
        break;
      case 'play':
        this.start('play', r(3, 5));
        break;
      case 'weather-react':
        this.start('weather-react', 3);
        break;
      default:
        this.start('idle', r(3, 7));
    }
  }

  private pickZone(ctx: BehaviorContext, zones: StageZone[]): StageZone | null {
    const wet = PRECIPITATION.includes(ctx.weather);
    const shelters = zones.filter((zone) => zone.kind === 'shelter');
    const pool = wet && shelters.length > 0 ? shelters : zones;
    // Prefer somewhere other than where we already are.
    const away = pool.filter(
      (zone) => Math.abs(zone.x - ctx.position.x) > 0.05 || Math.abs(zone.depth - ctx.position.depth) > 0.1,
    );
    const candidates = away.length > 0 ? away : pool;
    return candidates.length > 0 ? candidates[Math.floor(this.random() * candidates.length)] : null;
  }

  /** A random point at least `minDistance` (normalized x) away from here. */
  private randomPoint(ctx: BehaviorContext, minDistance = 0.12): StagePoint {
    const { minX, maxX } = ctx.stage;
    let point: StagePoint = { x: minX, depth: 0.5, altitude: 0.5 };
    for (let attempt = 0; attempt < 8; attempt++) {
      point = {
        x: randomBetween(this.random, minX, maxX),
        depth: randomBetween(this.random, 0.1, 0.9),
        altitude: this.random(),
      };
      if (Math.abs(point.x - ctx.position.x) >= Math.min(minDistance, (maxX - minX) / 2)) break;
    }
    return point;
  }
}
