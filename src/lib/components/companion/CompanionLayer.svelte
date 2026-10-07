<script lang="ts">
  import { onMount } from 'svelte';
  import { CompanionRenderer } from '$lib/companion/engine/CompanionRenderer';
  import { COMPANIONS } from '$lib/companion/registry/companions';
  import { companionState, rendererStatus } from '$lib/companion/status';
  import { on } from '$lib/core/events/bus';
  import { timeOfDay } from '$lib/core/time/clock';
  import { activeColors, activeTheme, activeThemeState } from '$lib/stores/world';
  import { ambientEffects, effectiveWeather } from '$lib/stores/atmosphere';
  import { focusActive } from '$lib/stores/focus';
  import { performanceProfile, ui } from '$lib/stores/settings';
  import type { CompanionActivity } from '$lib/types';

  let host: HTMLDivElement;
  let hitbox: HTMLButtonElement;
  let renderer = $state<CompanionRenderer | null>(null);

  const ACTIVITY_LABELS: Record<CompanionActivity, string> = {
    idle: 'relaxing',
    walk: 'walking',
    run: 'running',
    sit: 'sitting',
    sleep: 'sleeping',
    wake: 'waking up',
    stretch: 'stretching',
    look: 'looking at you',
    react: 'surprised',
    play: 'playing',
    celebrate: 'celebrating',
    focus: 'keeping you company',
    'weather-react': 'watching the weather',
    explore: 'exploring',
  };

  const definition = $derived(COMPANIONS[$activeThemeState.companion]);
  const label = $derived(
    `${definition.name}${$companionState ? `, ${ACTIVITY_LABELS[$companionState.activity]}` : ''}. Press to pet.`,
  );

  function create(initial?: ReturnType<CompanionRenderer['snapshot']>) {
    try {
      renderer = new CompanionRenderer({
        host,
        hitbox,
        profile: $performanceProfile,
        initial,
        onStateChange: (state) => companionState.set(state),
      });
      rendererStatus.set('running');
      // Dev builds only: inspect the 3D layer from the console (`__tickpuff`).
      if (import.meta.env.DEV) (window as unknown as { __tickpuff: unknown }).__tickpuff = renderer;
    } catch (error) {
      console.warn('[tickpuff] WebGL unavailable; the 3D companion is disabled.', error);
      renderer = null;
      rendererStatus.set('unavailable');
    }
  }

  onMount(() => {
    create();
    const offFocus = on('focus:completed', (completion) => {
      if (completion.phase === 'focus') renderer?.celebrate();
    });
    return () => {
      offFocus();
      renderer?.dispose();
      renderer = null;
    };
  });

  // Performance changes: antialiasing needs a new WebGL context.
  $effect(() => {
    const profile = $performanceProfile;
    const current = renderer;
    if (!current) return;
    if (current.needsRecreate(profile)) {
      const snapshot = current.snapshot();
      current.dispose();
      create(snapshot);
    } else {
      current.setProfile(profile);
    }
  });

  $effect(() => {
    renderer?.setCompanion(definition);
  });

  $effect(() => {
    renderer?.setWorld({
      theme: $activeTheme,
      colors: $activeColors,
      timeOfDay: $timeOfDay,
      weather: $effectiveWeather,
      ambient: $ambientEffects,
      sleepMode: $ui.sleepMode,
      focusActive: $focusActive,
      companionVisible: $ui.companionVisible,
    });
  });
</script>

<div class="companion-host" bind:this={host}></div>
<button class="companion-hitbox" bind:this={hitbox} aria-label={label} title={definition.name}></button>

<style>
  .companion-host {
    position: absolute;
    inset: 0;
    z-index: 5;
    pointer-events: none;
  }
  .companion-host :global(.companion-canvas) {
    width: 100%;
    height: 100%;
    display: block;
  }
  .companion-hitbox {
    position: absolute;
    top: 0;
    left: 0;
    display: none;
    z-index: 15;
    border-radius: 40%;
    background: transparent;
    cursor: pointer;
  }
  .companion-hitbox:focus-visible {
    outline: 2px dashed var(--accent-color);
  }
</style>
