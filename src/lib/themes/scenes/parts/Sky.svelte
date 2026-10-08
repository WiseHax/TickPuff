<!--
  Shared sky for outdoor worlds: horizon glow, sun or moon placed by the time
  of day, twinkling stars at night and slow drifting clouds by day.
-->
<script lang="ts">
  import type { TimeOfDay } from '$lib/types';
  import { H, W, clouds as makeClouds, starField } from '../art';

  let {
    time,
    seed = 1,
    sunX = 0.7,
    cloudCount = 6,
    cloudTint = 'color-mix(in oklab, white 78%, var(--bg-top))',
  }: {
    time: TimeOfDay;
    seed?: number;
    /** Horizontal position (0–1) of the sun / moon arc's highest point. */
    sunX?: number;
    cloudCount?: number;
    cloudTint?: string;
  } = $props();

  const dark = $derived(time === 'night' || time === 'late-night');
  const starGroups = $derived.by(() => {
    const stars = starField(seed * 31 + 7, 140);
    return [0, 1, 2].map((g) => stars.filter((_, i) => i % 3 === g));
  });
  const cloudList = $derived(makeClouds(seed * 17 + 3, cloudCount, 70, 300));

  /** Sun / moon position (fractions of the scene) per time of day. */
  const ORBIT: Record<TimeOfDay, { x: number; y: number }> = {
    morning: { x: -0.32, y: 0.3 },
    day: { x: 0, y: 0.15 },
    sunset: { x: 0.16, y: 0.33 },
    night: { x: 0.05, y: 0.18 },
    'late-night': { x: -0.2, y: 0.24 },
  };
  const orbit = $derived(ORBIT[time]);
  const cloudOpacity = $derived(
    time === 'day' ? 0.7 : time === 'morning' ? 0.6 : time === 'sunset' ? 0.55 : time === 'night' ? 0.14 : 0.08,
  );
</script>

<div class="world-layer" style="--depth: 3">
  <div class="horizon {time}"></div>
  <!--
    Stars twinkle in three groups and clouds drift as separate elements, so
    every animation runs on the compositor (opacity / transform of whole
    layers) instead of repainting the SVG each frame.
  -->
  {#if dark}
    {#each starGroups as group, g (g)}
      <svg
        class="fill stars"
        style="animation-duration: {4 + g * 1.7}s; animation-delay: {-g * 1.3}s"
        viewBox="0 0 {W} {H}"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
      >
        {#each group as star, i (i)}
          <circle cx={star.x} cy={star.y} r={star.r} />
        {/each}
      </svg>
    {/each}
  {/if}
  <div class="clouds" style="opacity: {cloudOpacity}">
    {#each cloudList as cloud, i (i)}
      <svg
        class="cloud"
        style="top: {(cloud.y / H) * 100}%; width: {cloud.scale *
          26}%; animation-duration: {cloud.duration}s; animation-delay: {cloud.delay}s"
        viewBox="-60 -150 520 200"
        aria-hidden="true"
      >
        <path d={cloud.d} style="fill: {cloudTint}" opacity={cloud.opacity} />
      </svg>
    {/each}
  </div>
  <div
    class="orb"
    class:moon={dark}
    class:sunset={time === 'sunset'}
    style="left: {(sunX + orbit.x) * 100}%; top: {orbit.y * 100}%"
  >
    {#if dark}
      <span class="crater a"></span><span class="crater b"></span><span class="crater c"></span>
    {/if}
  </div>
</div>

<style>
  .fill {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .horizon {
    position: absolute;
    left: 0;
    right: 0;
    top: 30%;
    height: 45%;
    background: radial-gradient(ellipse 70% 60% at 60% 80%, var(--glow, transparent), transparent 70%);
    transition: background 3s ease;
  }
  .horizon.morning {
    --glow: rgba(255, 214, 170, 0.45);
  }
  .horizon.day {
    --glow: rgba(255, 255, 240, 0.25);
  }
  .horizon.sunset {
    --glow: rgba(255, 150, 90, 0.55);
  }
  .horizon.night {
    --glow: rgba(140, 160, 255, 0.14);
  }
  .horizon.late-night {
    --glow: rgba(110, 120, 220, 0.08);
  }
  .stars {
    fill: #fff;
    animation: twinkle 4s ease-in-out infinite alternate;
  }
  .clouds {
    position: absolute;
    inset: 0;
    transition: opacity 3s ease;
  }
  .cloud {
    position: absolute;
    left: 0;
    overflow: visible;
    animation: cloud-drift 200s linear infinite;
  }
  .orb {
    position: absolute;
    width: clamp(56px, 7vw, 110px);
    aspect-ratio: 1;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle at 40% 40%, #fffdf0, #ffe9a8 70%);
    box-shadow:
      0 0 40px 12px rgba(255, 240, 190, 0.55),
      0 0 140px 60px rgba(255, 230, 170, 0.22);
    transition:
      left 4s ease,
      top 4s ease,
      background 3s ease,
      box-shadow 3s ease;
  }
  .orb.sunset {
    background: radial-gradient(circle at 40% 40%, #fff1d0, #ff9a5a 75%);
    box-shadow:
      0 0 50px 18px rgba(255, 150, 90, 0.55),
      0 0 180px 90px rgba(255, 120, 70, 0.25);
  }
  .orb.moon {
    width: clamp(46px, 5.5vw, 86px);
    background: radial-gradient(circle at 35% 35%, #fffef6, #e9e6d4 70%);
    box-shadow:
      0 0 30px 8px rgba(230, 236, 255, 0.35),
      0 0 120px 50px rgba(170, 190, 255, 0.15);
  }
  .crater {
    position: absolute;
    border-radius: 50%;
    background: rgba(160, 160, 140, 0.25);
  }
  .crater.a {
    width: 22%;
    height: 22%;
    left: 55%;
    top: 25%;
  }
  .crater.b {
    width: 14%;
    height: 14%;
    left: 30%;
    top: 58%;
  }
  .crater.c {
    width: 10%;
    height: 10%;
    left: 62%;
    top: 62%;
  }
  @keyframes twinkle {
    from {
      opacity: 0.35;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes cloud-drift {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(calc(110vw + 100%));
    }
  }
</style>
