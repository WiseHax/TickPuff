import { describe, expect, it } from 'vitest';
import { Navigator } from '$lib/companion/navigation/Navigator';

const step = (nav: Navigator, seconds: number, dt = 1 / 60) => {
  let arrived = false;
  for (let t = 0; t < seconds && !arrived; t += dt) arrived = nav.update(dt).arrived;
  return arrived;
};

describe('navigator', () => {
  it('turns toward a destination before walking there', () => {
    const nav = new Navigator({ x: 0, y: 0, z: 0 });
    nav.heading = Math.PI; // facing away
    nav.moveTo({ x: 0, y: 0, z: 3 }, 1.5);
    nav.update(1 / 60);
    expect(nav.speed).toBeLessThan(0.01); // still turning in place
    expect(step(nav, 10)).toBe(true);
    expect(nav.position.z).toBeCloseTo(3, 0);
  });

  it('never teleports: movement per frame is bounded by speed', () => {
    const nav = new Navigator({ x: -4, y: 0, z: 0 });
    nav.moveTo({ x: 4, y: 0, z: 1 }, 3);
    let previous = { ...nav.position };
    for (let i = 0; i < 600; i++) {
      nav.update(1 / 60);
      const moved = Math.hypot(nav.position.x - previous.x, nav.position.z - previous.z);
      expect(moved).toBeLessThanOrEqual((3 / 60) * 1.0001);
      previous = { ...nav.position };
    }
  });

  it('slows down on arrival and stops', () => {
    const nav = new Navigator({ x: 0, y: 0, z: 0 });
    nav.moveTo({ x: 2, y: 0, z: 0 }, 2);
    expect(step(nav, 10)).toBe(true);
    expect(nav.destination).toBeNull();
    step(nav, 2);
    expect(nav.speed).toBe(0);
  });

  it('changes altitude gradually for swimmers', () => {
    const nav = new Navigator({ x: 0, y: 0, z: 0 }, { climbRate: 1 });
    nav.moveTo({ x: 0.5, y: 2, z: 0 }, 1);
    nav.update(0.5);
    expect(nav.position.y).toBeCloseTo(0.5, 5);
  });

  it('turns to the rest heading while standing', () => {
    const nav = new Navigator({ x: 0, y: 0, z: 0 });
    nav.heading = 1.5;
    nav.setRestHeading(0);
    step(nav, 5);
    expect(Math.abs(nav.heading)).toBeLessThan(0.01);
  });
});
