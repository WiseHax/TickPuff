<!-- A small, dismissible notice when a new version is ready. Never installs on its own. -->
<script lang="ts">
  import { fade } from 'svelte/transition';
  import { dismissUpdate, installUpdate, updateState } from '$lib/integrations/updater';

  const visible = $derived(
    !$updateState.dismissed && ($updateState.status === 'available' || $updateState.status === 'installing'),
  );
</script>

{#if visible}
  <div class="notice" role="status" transition:fade={{ duration: 250 }}>
    {#if $updateState.status === 'installing'}
      <span
        >Updating to {$updateState.version}{$updateState.progress !== null
          ? ` · ${Math.round($updateState.progress * 100)}%`
          : '…'}</span
      >
    {:else}
      <span>TickPuff {$updateState.version} is ready</span>
      <button class="primary" onclick={() => installUpdate()}>Update</button>
      <button class="ghost" onclick={() => dismissUpdate()} aria-label="Not now">Later</button>
    {/if}
  </div>
{/if}

<style>
  .notice {
    position: absolute;
    left: 50%;
    bottom: 1.5rem;
    transform: translateX(-50%);
    z-index: 40;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.45rem 0.55rem 0.45rem 1rem;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(8px);
    color: var(--text-color);
    font-size: 0.82rem;
  }
  button {
    padding: 0.3rem 0.8rem;
    border-radius: 999px;
    font-size: 0.8rem;
  }
  .primary {
    background: var(--accent-color);
    color: #fff;
  }
  .ghost {
    color: var(--text-muted);
  }
  .ghost:hover {
    color: var(--text-color);
  }
</style>
