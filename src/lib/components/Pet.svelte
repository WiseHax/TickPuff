<script lang="ts">
  import { engineStore } from '$lib/stores/theme';
  import { featuresStore } from '$lib/stores/features';
  import { mouseX, mouseY } from '$lib/stores/parallax';
  import { performanceStore } from '$lib/stores/performance';
  import { activeColors } from '$lib/stores/theme';
  import { onMount, onDestroy } from 'svelte';
  import type { PetState } from '$lib/engine/types';
  import { CompanionEngine } from '$lib/engine/companion/CompanionEngine';
  import { companionRegistry } from '$lib/engine/companion/CompanionRegistry';

  export let isSleepMode = false;

  let state: PetState = 'IDLE';
  let isHovered = false;
  
  let container: HTMLElement;
  let engine: CompanionEngine | null = null;
  let use3D = false;

  $: use3D = $performanceStore !== 'ECO'; // ECO mode disables 3D entirely to save battery

  $: {
    if (use3D && container && !engine) {
      engine = new CompanionEngine(container, $performanceStore);
      engine.loadPet($engineStore.petId);
      engine.updateLightingColors($activeColors.accent, $activeColors.bgTop);
    } else if (!use3D && engine) {
      engine.dispose();
      engine = null;
    } else if (engine) {
      // Dynamic updates if already mounted
      engine.loadPet($engineStore.petId);
      engine.updateLightingColors($activeColors.accent, $activeColors.bgTop);
    }
  }

  // Reactive updates to 3D engine
  $: if (isSleepMode) state = 'SLEEP';
  $: if (engine) engine.setState(state);
  $: if (engine) engine.updateMouse($mouseX, $mouseY);
  $: if (engine) engine.setWeather($engineStore.weather);

  onMount(() => {
    // Advanced pet state machine
    const interval = setInterval(() => {
      if (isSleepMode) {
        state = 'SLEEP';
        return;
      }
      if (isHovered) return;
      
      // Behavior changes based on environment and focus mode
      if ($featuresStore.focus) {
        state = 'IDLE'; // Pet sits quietly during focus mode
        return;
      }

      if ($engineStore.weather === 'rain' || $engineStore.weather === 'heavy-rain') {
        // Seeks shelter / calm in rain
        const rand = Math.random();
        if (rand < 0.6) state = 'SLEEP';
        else state = 'IDLE';
        return;
      }

      const rand = Math.random();
      if (rand < 0.05) state = 'REACT';
      else if (rand < 0.15) state = 'LOOK';
      else if (rand < 0.3) state = 'SLEEP';
      else if (rand < 0.4) state = 'WALK';
      else if (rand < 0.45) state = 'HIDE';
      else state = 'IDLE';
    }, 8000);
    
    return () => {
      clearInterval(interval);
      if (engine) {
        engine.dispose();
        engine = null;
      }
    };
  });

  let interactionTimeout: ReturnType<typeof setTimeout>;

  function handleInteraction() {
    if (isSleepMode) return;
    state = 'REACT';
    if (interactionTimeout) clearTimeout(interactionTimeout);
    interactionTimeout = setTimeout(() => { if (state === 'REACT') state = 'IDLE'; }, 2000);
  }

</script>

<div 
  class="pet-container" 
  class:walk={state === 'WALK' && !use3D} 
  class:hide={state === 'HIDE' && !use3D}
  on:mouseenter={() => { isHovered = true; state = 'LOOK'; }}
  on:mouseleave={() => { isHovered = false; state = 'IDLE'; }}
  on:click={handleInteraction}
  role="button"
  tabindex="0"
>
  {#if use3D}
    <!-- 3D WebGL Companion Container -->
    <div class="webgl-container" bind:this={container}>
      {#if state === 'SLEEP'}
        <div class="z-particle">Z</div>
      {/if}
      {#if state === 'REACT'}
        <div class="exclaim-particle">!</div>
      {/if}
    </div>
  {:else}
    <!-- 2D CSS Fallback Companion (ECO Mode) -->
    <div class="pet-wrapper" class:sleep={state === 'SLEEP'} class:look={state === 'LOOK'} class:react={state === 'REACT'} class:walking={state === 'WALK'}>
      
      {#if $engineStore.petId === 'fox'}
        <!-- Advanced Fox Rig -->
        <div class="fox-rig">
          <div class="fox-tail">
            <svg viewBox="0 0 50 100"><path d="M25,100 Q50,70 25,20 Q10,50 25,100" fill="#c0392b"/><path d="M25,40 Q45,30 25,10 Q15,25 25,40" fill="#ecf0f1"/></svg>
          </div>
          <div class="fox-body">
            <svg viewBox="0 0 100 80"><path d="M20,60 Q50,30 80,60 L75,80 L25,80 Z" fill="#e74c3c"/><path d="M30,80 Q50,50 70,80 Z" fill="#ecf0f1"/></svg>
          </div>
          <div class="fox-head-group">
            <div class="fox-ear left"><svg viewBox="0 0 30 40"><path d="M15,0 L30,40 L0,40 Z" fill="#c0392b"/><path d="M15,10 L25,40 L5,40 Z" fill="#34495e"/></svg></div>
            <div class="fox-ear right"><svg viewBox="0 0 30 40"><path d="M15,0 L30,40 L0,40 Z" fill="#c0392b"/><path d="M15,10 L25,40 L5,40 Z" fill="#34495e"/></svg></div>
            <div class="fox-head">
              <svg viewBox="0 0 100 80">
                <path d="M10,40 Q50,0 90,40 L50,80 Z" fill="#e74c3c"/>
                <path d="M10,40 Q50,30 90,40 L50,80 Z" fill="#ecf0f1"/>
              </svg>
              <div class="fox-eyes">
                <div class="fox-eye"></div>
                <div class="fox-eye"></div>
              </div>
              <div class="fox-nose"></div>
            </div>
          </div>
        </div>
      {:else}
        <!-- Generic Blob fallback -->
        <div class="fox-rig" style="filter: hue-rotate(180deg);">
          <div class="fox-body">
            <svg viewBox="0 0 100 80"><path d="M20,60 Q50,30 80,60 L75,80 L25,80 Z" fill="currentColor"/></svg>
          </div>
        </div>
      {/if}

      {#if state === 'SLEEP'}
        <div class="z-particle">Z</div>
      {/if}
      {#if state === 'REACT'}
        <div class="exclaim-particle">!</div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .pet-container {
    position: absolute;
    bottom: 8%;
    right: 25%;
    z-index: 25;
    transition: transform 6s cubic-bezier(0.25, 1, 0.5, 1), opacity 1s;
    color: var(--text-color);
  }

  .webgl-container {
    width: 250px;
    height: 250px;
    position: relative;
    cursor: pointer;
    transform: translateY(30px);
  }

  .pet-container.walk { transform: translateX(-200px); }
  .pet-container.hide { opacity: 0.1; transform: translateX(100px) scale(0.9); }

  .pet-wrapper {
    width: 140px;
    height: 140px;
    position: relative;
    cursor: pointer;
    transform-origin: bottom center;
    transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .pet-wrapper:hover { transform: scale(1.05); }
  .pet-wrapper.sleep { transform: scaleY(0.9) scaleX(1.05); }
  .pet-wrapper.look { transform: scaleX(-1); }
  .pet-wrapper.react { transform: scale(1.1) translateY(-10px); }

  /* CSS Fallback animations omitted for brevity, reusing the existing rig styles */
  .fox-rig {
    position: absolute; width: 100%; height: 100%;
    filter: drop-shadow(0 10px 15px rgba(0,0,0,0.4));
  }
  .fox-body {
    position: absolute; bottom: 0; left: 20%; width: 60%; height: 60%;
    transform-origin: bottom center;
    animation: fox-breathe 4s ease-in-out infinite alternate;
  }
  .fox-tail {
    position: absolute; bottom: 0; right: 0; width: 50%; height: 80%;
    transform-origin: bottom left;
    animation: tail-sway 4s ease-in-out infinite alternate;
  }
  .fox-head-group {
    position: absolute; top: 15%; left: 10%; width: 55%; height: 55%;
    transform-origin: bottom center;
    animation: head-bob 4s ease-in-out infinite alternate;
  }
  .fox-head { position: absolute; width: 100%; height: 100%; z-index: 2; }
  .fox-ear { position: absolute; width: 35%; height: 45%; top: -15%; z-index: 1; }
  .fox-ear.left { left: 5%; transform: rotate(-15deg); animation: ear-twitch-left 6s infinite; }
  .fox-ear.right { right: 5%; transform: rotate(15deg); animation: ear-twitch-right 7s infinite; }
  
  .fox-eyes {
    position: absolute; top: 40%; left: 20%; width: 60%;
    display: flex; justify-content: space-between;
  }
  .fox-eye {
    width: 8px; height: 8px; background: #2c3e50; border-radius: 50%;
    animation: blink 5s infinite;
  }
  .pet-wrapper.sleep .fox-eye { height: 2px; border-radius: 0; transform: translateY(4px); animation: none; }
  .fox-nose {
    position: absolute; bottom: 10%; left: 45%; width: 10%; height: 10%;
    background: #2c3e50; border-radius: 50%;
  }

  @keyframes fox-breathe { 0% { transform: scaleY(1); } 100% { transform: scaleY(0.95); } }
  @keyframes tail-sway { 0% { transform: rotate(5deg); } 100% { transform: rotate(25deg); } }
  @keyframes head-bob { 0% { transform: translateY(0) rotate(0deg); } 100% { transform: translateY(2px) rotate(2deg); } }
  @keyframes ear-twitch-left { 0%, 95%, 100% { transform: rotate(-15deg); } 97% { transform: rotate(-25deg); } }
  @keyframes ear-twitch-right { 0%, 90%, 100% { transform: rotate(15deg); } 92% { transform: rotate(25deg); } }
  @keyframes blink { 0%, 96%, 100% { transform: scaleY(1); } 98% { transform: scaleY(0.1); } }

  .z-particle, .exclaim-particle {
    position: absolute;
    top: -20px; right: 20px;
    font-size: 1.5rem;
    color: white;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    text-shadow: 0 2px 5px rgba(0,0,0,0.5);
  }
  .z-particle {
    animation: float-z 2s infinite ease-in;
    opacity: 0;
  }
  .exclaim-particle {
    animation: pop 1s ease-out forwards;
    color: var(--accent-color);
  }

  @keyframes float-z {
    0% { transform: translateY(0) scale(0.5); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: translateY(-40px) scale(1.5); opacity: 0; }
  }
  @keyframes pop {
    0% { transform: translateY(10px) scale(0.5); opacity: 0; }
    20% { transform: translateY(-20px) scale(1.2); opacity: 1; }
    100% { transform: translateY(-25px) scale(1); opacity: 0; }
  }
</style>
