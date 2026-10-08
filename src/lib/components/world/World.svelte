<script lang="ts">
  import { onMount } from 'svelte';
  import { SCENES } from '$lib/themes/scenes';
  import { activeTheme } from '$lib/stores/world';
  import { ambientEffects, effectiveWeather } from '$lib/stores/atmosphere';
  import { performanceProfile, ui } from '$lib/stores/settings';
  import { timeOfDay } from '$lib/core/time/clock';
  import { rendererStatus } from '$lib/companion/status';
  import WeatherFallback from './WeatherFallback.svelte';

  let root: HTMLDivElement;

  const Scene = $derived(SCENES[$activeTheme.id] ?? SCENES.forest);
  const dark = $derived($timeOfDay === 'night' || $timeOfDay === 'late-night');
  /** CSS weather is used when GPU particles are off or WebGL failed. */
  const cssWeather = $derived($performanceProfile.particleDensity === 0 || $rendererStatus === 'unavailable');

  onMount(() => {
    // Parallax: write CSS variables at most once per frame; no re-render per mouse move.
    let frame = 0;
    let x = 0;
    let y = 0;
    const onMove = (event: PointerEvent) => {
      x = (event.clientX / window.innerWidth) * 2 - 1;
      y = (event.clientY / window.innerHeight) * 2 - 1;
      if (frame || !$performanceProfile.parallax) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        root.style.setProperty('--px', x.toFixed(3));
        root.style.setProperty('--py', y.toFixed(3));
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  });

  $effect(() => {
    if (!$performanceProfile.parallax && root) {
      root.style.setProperty('--px', '0');
      root.style.setProperty('--py', '0');
    }
  });
</script>

<div
  class="world"
  class:night={dark}
  class:asleep={$ui.sleepMode}
  class:still={!$performanceProfile.parallax}
  bind:this={root}
  aria-hidden="true"
>
  {#key $activeTheme.id}
    <div class="scene">
      <Scene time={$timeOfDay} />
    </div>
  {/key}
  <WeatherFallback weather={$effectiveWeather} ambient={$ambientEffects} fogOnly={!cssWeather} />
</div>

<style>
  .world {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 1;
    transition: filter 1.5s ease;
  }
  .world.night {
    filter: brightness(0.85) contrast(1.08);
  }
  .world.asleep {
    filter: brightness(0.55) saturate(0.8);
  }
  /* ECO: no parallax, so the layers don't need their own GPU surfaces, and the scenery holds still. */
  .world.still :global(.world-layer) {
    transform: none;
    transition: none;
    will-change: auto;
  }
  .world.still :global(.scene *) {
    animation-play-state: paused;
  }
  @media (prefers-reduced-motion: reduce) {
    .world :global(.scene *) {
      animation-play-state: paused;
    }
  }
  .scene {
    position: absolute;
    inset: 0;
    animation: fade-in 0.8s ease;
  }
  @keyframes fade-in {
    from {
      opacity: 0;
    }
  }
</style>
