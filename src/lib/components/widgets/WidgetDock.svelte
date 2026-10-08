<!--
  A widget drawer: slides in from its edge of the window when the widgets are
  opened, and is not rendered at all while closed (so idle widgets don't poll).
-->
<script lang="ts">
  import { fly } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { WIDGET_COMPONENTS } from './registry';
  import type { WidgetDock, WidgetId } from '$lib/types';

  let { dock, widgets, dimmed = false }: { dock: WidgetDock; widgets: WidgetId[]; dimmed?: boolean } = $props();
</script>

{#if widgets.length > 0}
  <aside
    class="drawer {dock}"
    class:dimmed
    aria-label="{dock === 'left' ? 'Left' : 'Right'} widgets"
    transition:fly={{ x: dock === 'left' ? -340 : 340, duration: 380, opacity: 0 }}
  >
    <div class="scroll">
      {#each widgets as id (id)}
        {@const Widget = WIDGET_COMPONENTS[id]}
        <div animate:flip={{ duration: 250 }}>
          <Widget />
        </div>
      {/each}
    </div>
  </aside>
{/if}

<style>
  .drawer {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 320px;
    max-width: 86vw;
    z-index: 20;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition: opacity 0.6s ease;
  }
  .drawer.left {
    left: 0;
    padding: 1.5rem 1.2rem 1.5rem 1.5rem;
    background: linear-gradient(to right, rgba(0, 0, 0, 0.42), rgba(0, 0, 0, 0.18) 70%, transparent);
  }
  .drawer.right {
    right: 0;
    /* Leave room for the control column on the right edge. */
    padding: 1.5rem 5rem 1.5rem 1.2rem;
    background: linear-gradient(to left, rgba(0, 0, 0, 0.42), rgba(0, 0, 0, 0.18) 70%, transparent);
  }
  .scroll {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    max-height: 100%;
    overflow-y: auto;
    padding: 2px;
  }
  .scroll > :global(*) {
    flex: none;
  }
  .drawer.dimmed {
    opacity: 0.35;
  }
  .drawer.dimmed:hover,
  .drawer.dimmed:focus-within {
    opacity: 1;
  }
</style>
