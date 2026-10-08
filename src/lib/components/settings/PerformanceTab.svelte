<script lang="ts">
  import { PERFORMANCE_DESCRIPTIONS, performanceMode } from '$lib/stores/settings';
  import { rendererStatus } from '$lib/companion/status';
  import { PERFORMANCE_MODES } from '$lib/types';
  import Switch from '$lib/components/ui/Switch.svelte';
  import { autostart, initWindowModes, setAutostart } from '$lib/stores/windowMode';
  import { onMount } from 'svelte';

  onMount(() => void initWindowModes());

  const NAMES = { ECO: 'Eco', BALANCED: 'Balanced', BEAUTIFUL: 'Beautiful' } as const;
</script>

<div class="modes" role="radiogroup" aria-label="Performance mode">
  {#each PERFORMANCE_MODES as mode (mode)}
    <button
      class="mode"
      role="radio"
      aria-checked={$performanceMode === mode}
      onclick={() => performanceMode.set(mode)}
    >
      <strong>{NAMES[mode]}</strong>
      <span class="hint">{PERFORMANCE_DESCRIPTIONS[mode]}</span>
    </button>
  {/each}
</div>
<p class="hint">
  In every mode, rendering pauses while the window is hidden or minimized and slows down while the companion sleeps.
  Background checks for AI tools and system stats only run while their widget is open. The desktop app checks the media
  session every few seconds so the companion can dance to your music.
</p>
{#if __STORE_BUILD__}
  <h3 class="section-title">Startup</h3>
  <p class="hint">To start TickPuff when you sign in, turn it on in Windows Settings → Apps → Startup.</p>
{:else if $autostart !== null}
  <h3 class="section-title">Startup</h3>
  <Switch label="Start TickPuff when you sign in" checked={$autostart} onchange={(value) => setAutostart(value)} />
  <p class="hint">TickPuff also lives in the system tray: show it, switch to mini mode or quit from there.</p>
{/if}
<p class="hint">
  3D renderer: {$rendererStatus === 'running'
    ? 'running'
    : $rendererStatus === 'unavailable'
      ? 'unavailable (WebGL not supported)'
      : 'starting'}
</p>

<style>
  .modes {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .mode {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    text-align: left;
    padding: 0.7rem 0.9rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.04);
  }
  .mode[aria-checked='true'] {
    border-color: var(--accent-color);
    background: rgba(255, 255, 255, 0.1);
  }
  p {
    margin-top: 0.5rem;
  }
</style>
