<script lang="ts">
  import type { Snippet } from 'svelte';

  let { title, aside, children }: { title: string; aside?: Snippet; children: Snippet } = $props();
</script>

<section class="widget glass" aria-label={title}>
  <header>
    <h2>{title}</h2>
    {#if aside}<div class="aside">{@render aside()}</div>{/if}
  </header>
  {@render children()}
</section>

<style>
  .widget {
    background: rgba(255, 255, 255, 0.06);
    border-color: transparent;
    border-radius: 16px;
    padding: 1.1rem 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    transition:
      background 0.3s,
      border-color 0.3s;
  }
  .widget:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }
  h2 {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: var(--text-muted);
    font-weight: 600;
  }
  .aside {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.68rem;
    color: var(--text-muted);
  }
  /* Shared widget controls */
  .widget :global(.wbtn) {
    padding: 0.38rem 0.9rem;
    border-radius: 6px;
    font-size: 0.82rem;
    font-weight: 500;
    transition:
      opacity 0.2s,
      background 0.2s,
      color 0.2s;
  }
  .widget :global(.wbtn.primary) {
    background: var(--text-color);
    color: var(--bg-bottom);
  }
  .widget :global(.wbtn.primary:hover) {
    opacity: 0.9;
  }
  .widget :global(.wbtn.ghost) {
    color: var(--text-muted);
  }
  .widget :global(.wbtn.ghost:hover) {
    color: var(--text-color);
    background: rgba(255, 255, 255, 0.06);
  }
  .widget :global(.wicon) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    color: var(--text-muted);
  }
  .widget :global(.wicon:hover:not(:disabled)) {
    color: var(--text-color);
    background: rgba(255, 255, 255, 0.08);
  }
  .widget :global(.wicon:disabled) {
    opacity: 0.35;
    cursor: default;
  }
  .widget :global(.muted) {
    color: var(--text-muted);
    font-size: 0.78rem;
  }
  .widget :global(.row) {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.75rem;
    font-size: 0.82rem;
  }
</style>
