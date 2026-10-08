import { describe, expect, it } from 'vitest';
import { seededRandom } from '$lib/core/math';
import {
  BehaviorController,
  type BehaviorContext,
  type BehaviorOutput,
} from '$lib/companion/behavior/BehaviorController';
import { getTheme } from '$lib/themes/registry';

const forest = getTheme('forest');

function context(patch: Partial<BehaviorContext> = {}): BehaviorContext {
  return {
    stage: forest.stage,
    timeOfDay: 'day',
    weather: 'clear',
    sleepMode: false,
    focusActive: false,
    hovered: false,
    arrived: false,
    position: { x: 0.6, depth: 0.5 },
    ...patch,
  };
}

/** Run the controller for `seconds`, arriving instantly whenever it travels. */
function run(controller: BehaviorController, seconds: number, patch: Partial<BehaviorContext> = {}, dt = 0.1) {
  const seen: BehaviorOutput[] = [];
  let arrived = false;
  for (let t = 0; t < seconds; t += dt) {
    const out = controller.update(dt, context({ ...patch, arrived }));
    arrived = out.destination !== null; // the navigator "arrives" on the next frame
    seen.push(out);
  }
  return seen;
}

describe('companion behavior', () => {
  it('is deterministic for a given seed', () => {
    const a = run(new BehaviorController('curious', seededRandom(7)), 120).map((o) => o.activity);
    const b = run(new BehaviorController('curious', seededRandom(7)), 120).map((o) => o.activity);
    expect(a).toEqual(b);
  });

  it('roams instead of standing still', () => {
    const outputs = run(new BehaviorController('curious', seededRandom(1)), 300);
    const destinations = new Set(outputs.filter((o) => o.destination).map((o) => o.plan));
    expect(destinations.size).toBeGreaterThan(3);
    for (const out of outputs) {
      if (!out.destination) continue;
      expect(out.destination.x).toBeGreaterThanOrEqual(forest.stage.minX);
      expect(out.destination.x).toBeLessThanOrEqual(forest.stage.maxX);
    }
  });

  it('visits interaction zones and does the zone activity there', () => {
    const outputs = run(new BehaviorController('curious', seededRandom(3)), 600);
    const zoneVisits = outputs.filter((o) => o.zoneId && !o.destination);
    expect(zoneVisits.length).toBeGreaterThan(0);
    for (const visit of zoneVisits) {
      const zone = forest.stage.zones.find((z) => z.id === visit.zoneId)!;
      expect(visit.activity).toBe(zone.activity);
    }
  });

  it('sleeps in sleep mode, then wakes up when it ends', () => {
    const controller = new BehaviorController('energetic', seededRandom(2));
    run(controller, 5);
    const asleep = controller.update(0.1, context({ sleepMode: true }));
    expect(asleep.activity).toBe('sleep');
    expect(asleep.destination).toBeNull();
    expect(controller.update(5, context({ sleepMode: true })).activity).toBe('sleep');
    expect(controller.update(0.1, context()).activity).toBe('wake');
  });

  it('reacts when poked and celebrates finished focus sessions', () => {
    const controller = new BehaviorController('calm', seededRandom(4));
    controller.poke();
    expect(controller.update(0.1, context()).activity).toBe('react');
    controller.celebrate();
    const out = controller.update(0.1, context());
    expect(out.activity).toBe('celebrate');
    expect(controller.update(1, context()).activity).toBe('celebrate');
  });

  it('keeps the user company during focus, then stretches', () => {
    const controller = new BehaviorController('playful', seededRandom(5));
    run(controller, 10);
    expect(controller.update(0.1, context({ focusActive: true })).activity).toBe('focus');
    expect(run(controller, 60, { focusActive: true }).every((o) => o.activity === 'focus' && !o.destination)).toBe(
      true,
    );
    expect(controller.update(0.1, context()).activity).toBe('stretch');
  });

  it('stops and watches the pointer while hovered', () => {
    const controller = new BehaviorController('curious', seededRandom(6));
    run(controller, 20);
    const out = controller.update(0.1, context({ hovered: true }));
    expect(out).toMatchObject({ activity: 'look', destination: null, watchPointer: true });
    expect(controller.update(0.1, context()).activity).toBe('idle');
  });

  it('seeks shelter in heavy rain', () => {
    const outputs = run(new BehaviorController('curious', seededRandom(8)), 900, { weather: 'heavy-rain' });
    const zones = new Set(outputs.map((o) => o.zoneId).filter(Boolean));
    expect(zones).toContain('pine');
    expect(zones.has('mushrooms') || zones.has('clearing')).toBe(false);
  });

  it('only uses zones that make sense at this time of day', () => {
    const library = getTheme('library');
    const outputs = run(new BehaviorController('curious', seededRandom(9)), 900, {
      stage: library.stage,
      timeOfDay: 'day',
    });
    expect(outputs.some((o) => o.zoneId === 'candle')).toBe(false);
  });

  it('sleeps more late at night', () => {
    const count = (time: BehaviorContext['timeOfDay']) =>
      run(new BehaviorController('calm', seededRandom(11)), 1200, { timeOfDay: time }).filter(
        (o) => o.activity === 'sleep',
      ).length;
    expect(count('late-night')).toBeGreaterThan(count('day'));
  });
});

describe('companion reactions', () => {
  it('runs to the front of the stage and greets a returning user', () => {
    const controller = new BehaviorController('calm', seededRandom(3));
    run(controller, 5);
    controller.greet();
    const first = controller.update(0.1, context());
    expect(first.activity).toBe('run');
    expect(first.destination?.depth).toBeCloseTo(0.05);
    const arrivedOut = controller.update(0.1, context({ arrived: true }));
    expect(arrivedOut.activity).toBe('greet');
    expect(arrivedOut.watchPointer).toBe(true);
  });

  it('does not interrupt focus to greet', () => {
    const controller = new BehaviorController('calm', seededRandom(3));
    run(controller, 2, { focusActive: true });
    controller.greet();
    expect(controller.update(0.1, context({ focusActive: true })).activity).toBe('focus');
  });

  it('dances while music plays and stops when it ends', () => {
    const controller = new BehaviorController('playful', seededRandom(11));
    const withMusic = run(controller, 240, { music: true }).map((o) => o.activity);
    const withoutMusic = run(new BehaviorController('playful', seededRandom(11)), 240).map((o) => o.activity);
    expect(withMusic).toContain('dance');
    expect(withoutMusic).not.toContain('dance');

    // Find a moment it is dancing, then silence the music.
    const dancer = new BehaviorController('playful', seededRandom(11));
    let out = dancer.update(0.1, context({ music: true }));
    for (let i = 0; i < 5000 && out.activity !== 'dance'; i++) {
      out = dancer.update(0.1, context({ music: true, arrived: out.destination !== null }));
    }
    expect(out.activity).toBe('dance');
    expect(dancer.update(0.1, context({ music: false })).activity).toBe('idle');
  });
});
