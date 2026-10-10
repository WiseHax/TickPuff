<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { CompanionRenderer } from '$lib/companion/engine/CompanionRenderer';
  import { COMPANIONS } from '$lib/companion/registry/companions';
  import { companionState, rendererStatus } from '$lib/companion/status';
  import { on } from '$lib/core/events/bus';
  import { timeOfDay } from '$lib/core/time/clock';
  import { activeColors, activeTheme, activeThemeState } from '$lib/stores/world';
  import { ambientEffects, effectiveWeather } from '$lib/stores/atmosphere';
  import { focusActive } from '$lib/stores/focus';
  import { COMPANION_SIZE_SCALE, companionSize, performanceProfile, ui } from '$lib/stores/settings';
  import { mediaService, nowPlaying } from '$lib/integrations/media';
  import { isTauri } from '$lib/core/platform/tauri';
  import { bonds, nameFor, unlockedAccessories } from '$lib/stores/bond';
  import { lastGreeting } from '$lib/stores/greeting';
  import { localDateKey } from '$lib/core/time/clock';
  import type { CompanionActivity } from '$lib/types';

  /** Away for at least this long (no input, or window hidden) → the companion greets you on return. */
  const AWAY_MS = 3 * 60_000;

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
    greet: 'happy to see you',
    dance: 'dancing to your music',
  };

  // A boolean, so the 3-second media poll only touches the renderer when playback starts or stops.
  const musicPlaying = $derived($nowPlaying.media?.status === 'playing');
  const definition = $derived(COMPANIONS[$activeThemeState.companion]);
  const displayName = $derived(nameFor($bonds, definition.id, definition.name));
  const accessories = $derived(unlockedAccessories($bonds[definition.id]?.points ?? 0));
  const label = $derived(
    `${displayName}${$companionState ? `, ${ACTIVITY_LABELS[$companionState.activity]}` : ''}. Press to pet.`,
  );

  function create(initial?: ReturnType<CompanionRenderer['snapshot']>) {
    try {
      renderer = new CompanionRenderer({
        host,
        hitbox,
        profile: $performanceProfile,
        size: COMPANION_SIZE_SCALE[$companionSize],
        initial,
        onStateChange: (state) => companionState.set(state),
        onPet: () => bonds.pet(definition.id),
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
      if (completion.phase === 'focus') {
        renderer?.celebrate();
        bonds.focusCompleted(definition.id);
      }
    });

    // First launch of the day: the companion comes over to say good morning.
    const todayKey = localDateKey(new Date());
    let greetTimer: ReturnType<typeof setTimeout> | undefined;
    if (get(lastGreeting) !== todayKey) {
      lastGreeting.set(todayKey);
      greetTimer = setTimeout(() => renderer?.greet(), 2500);
    }

    // Presence: notice when the user comes back after a while.
    let lastSeen = Date.now();
    let hiddenSince: number | null = null;
    const seen = () => {
      const now = Date.now();
      if (now - lastSeen >= AWAY_MS) renderer?.greet();
      lastSeen = now;
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') hiddenSince = Date.now();
      else if (hiddenSince !== null) {
        if (Date.now() - hiddenSince >= AWAY_MS) lastSeen = 0; // greet on the next input
        hiddenSince = null;
      }
    };
    window.addEventListener('pointermove', seen, { passive: true });
    window.addEventListener('keydown', seen);
    document.addEventListener('visibilitychange', onVisibility);

    // Music: the companion may dance while something plays (Windows media session).
    const releaseMedia = isTauri() ? mediaService.acquire() : () => undefined;

    return () => {
      window.removeEventListener('pointermove', seen);
      window.removeEventListener('keydown', seen);
      document.removeEventListener('visibilitychange', onVisibility);
      releaseMedia();
      clearTimeout(greetTimer);
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
    renderer?.setSize(COMPANION_SIZE_SCALE[$companionSize]);
  });

  $effect(() => {
    renderer?.setAccessories(accessories);
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
      musicPlaying,
    });
  });
</script>

<div class="companion-host" bind:this={host}></div>
<button class="companion-hitbox" bind:this={hitbox} aria-label={label} title={displayName}></button>

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
