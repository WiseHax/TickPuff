<script lang="ts">
  import Clock from '$lib/components/Clock.svelte';
  import Environment from '$lib/components/Environment.svelte';
  import Pet from '$lib/components/Pet.svelte';
  import Productivity from '$lib/components/Productivity.svelte';
  import Settings from '$lib/components/Settings.svelte';
  import { isFocusMode } from '$lib/stores/productivity';
  import { engineStore } from '$lib/stores/theme';
  import { fade } from 'svelte/transition';
  import { onMount } from 'svelte';

  let showSettings = false;
  let showProductivity = true;
  
  // Idle UI hiding
  let isIdle = false;
  let idleTimer: ReturnType<typeof setTimeout>;

  function resetIdleTimer() {
    isIdle = false;
    clearTimeout(idleTimer);
    if (!showSettings) {
      idleTimer = setTimeout(() => {
        isIdle = true;
      }, 5000); // Hide UI after 5s of no mouse movement
    }
  }

  onMount(() => {
    resetIdleTimer();
    return () => clearTimeout(idleTimer);
  });
  let isSleepMode = false;
  let isAmbientMode = false;

  function toggleSleepMode() {
    isSleepMode = !isSleepMode;
    if (isSleepMode) {
      $engineStore.weather = 'clear'; // Calm weather
      // Assuming pet reacts to this via Pet.svelte observing a store or we just let Pet.svelte handle it.
      // Wait, we can just pass a prop or use a store for sleep mode. Let's add it to featuresStore or just use CSS for dimming.
    }
  }
</script>

<svelte:window 
  on:keydown={(e) => {
    if (e.key === 'Escape') showSettings = false;
    resetIdleTimer();
  }}
  on:mousemove={resetIdleTimer}
/>

<main class="app-container" data-tauri-drag-region class:focus-mode={$isFocusMode} class:sleep-mode={isSleepMode}>
  <Environment />
  
  {#if !isAmbientMode}
  <div class="center-content">
    <Clock />
  </div>
  {/if}

  <Pet {isSleepMode} />

  <div class="productivity-wrapper" class:idle={(isIdle && !showSettings) || isAmbientMode}>
    {#if showProductivity && !isAmbientMode}
      <Productivity />
    {/if}
  </div>

  {#if showSettings}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="backdrop" transition:fade={{ duration: 300 }} on:click={() => showSettings = false}></div>
    <Settings onClose={() => showSettings = false} />
  {/if}

  <div class="controls-overlay" class:idle={isIdle && !showSettings}>
    <!-- Sleep Mode -->
    <button class="icon-btn" class:active={isSleepMode} on:click={() => isSleepMode = !isSleepMode} title="Sleep Mode">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    </button>
    <!-- Ambient Mode -->
    <button class="icon-btn" class:active={isAmbientMode} on:click={() => isAmbientMode = !isAmbientMode} title="Ambient Mode">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>
    </button>
    <!-- Productivity -->
    <button class="icon-btn" class:active={showProductivity} on:click={() => showProductivity = !showProductivity} title="Toggle Widgets">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    </button>
    <!-- Settings -->
    <button class="icon-btn" on:click={() => showSettings = true} title="Settings">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    </button>
  </div>
</main>

<style>
  .app-container {
    width: 100vw;
    height: 100vh;
    position: relative;
    overflow: hidden;
    transition: filter 1s ease;
  }

  .center-content {
    position: absolute;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;
    pointer-events: none;
  }

  .productivity-wrapper {
    transition: opacity 1s ease;
  }

  .productivity-wrapper.idle {
    opacity: 0.1; /* Almost invisible when not interacted with */
  }

  .productivity-wrapper.idle:hover {
    opacity: 1; /* Instantly restore on hover */
    transition: opacity 0.2s ease;
  }

  .controls-overlay {
    position: absolute;
    top: 2rem;
    right: 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    z-index: 20;
    opacity: 0.5;
    transition: opacity 0.5s ease;
  }

  .controls-overlay.idle {
    opacity: 0;
    pointer-events: none;
  }

  .app-container:hover .controls-overlay:not(.idle) {
    opacity: 1;
  }

  .icon-btn {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .icon-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    transform: scale(1.05);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .icon-btn:active {
    transform: scale(0.95);
  }

  .backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.6);
    z-index: 40;
    backdrop-filter: blur(8px);
  }
</style>
