<script lang="ts">
  import { PERFORMANCE_DESCRIPTIONS, performanceMode } from '$lib/stores/settings';
  import { rendererStatus } from '$lib/companion/status';
  import { PERFORMANCE_MODES } from '$lib/types';

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
  Background checks (AI tools, system stats, media) only run while their widget is visible.
</p>
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
