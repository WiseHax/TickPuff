<script lang="ts">
  import { fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { WIDGET_COMPONENTS } from './registry';
  import type { WidgetDock, WidgetId } from '$lib/types';

  let { dock, widgets, dimmed = false }: { dock: WidgetDock; widgets: WidgetId[]; dimmed?: boolean } = $props();
</script>

{#if widgets.length > 0}
  <aside class="dock {dock}" class:dimmed aria-label="{dock === 'left' ? 'Left' : 'Right'} widgets">
    {#each widgets as id (id)}
      {@const Widget = WIDGET_COMPONENTS[id]}
      <div animate:flip={{ duration: 250 }} in:fade={{ duration: 200 }}>
        <Widget />
      </div>
    {/each}
  </aside>
{/if}

<style>
  .dock {
    position: absolute;
    width: 280px;
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    z-index: 20;
    overflow-y: auto;
    padding: 2px 8px 2px 2px;
    transition:
      opacity 0.6s ease,
      transform 0.5s ease;
  }
  .dock.left {
    left: 2rem;
    bottom: 2rem;
    max-height: calc(100vh - 4rem);
  }
  .dock > :global(*) {
    flex: none;
  }
  .dock.right {
    right: 5.5rem;
    top: 2rem;
    max-height: calc(100vh - 12rem);
  }
  .dock.dimmed {
    opacity: 0.3;
  }
  .dock.dimmed:hover,
  .dock.dimmed:focus-within {
    opacity: 1;
  }
  /* Narrow windows: both docks share the left edge (top and bottom). */
  @media (max-width: 720px) {
    .dock.right {
      left: 2rem;
      right: auto;
      max-height: 40vh;
    }
    .dock.left {
      max-height: 45vh;
    }
  }
</style>
