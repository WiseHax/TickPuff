<script lang="ts">
  import { onMount } from 'svelte';
  import WidgetFrame from './WidgetFrame.svelte';
  import { formatBytes, systemMonitor, systemService } from '$lib/integrations/system';

  onMount(() => systemService.acquire());

  const stats = $derived($systemMonitor.stats);
  const memoryPercent = $derived(
    stats && stats.memoryTotalBytes > 0 ? (stats.memoryUsedBytes / stats.memoryTotalBytes) * 100 : 0,
  );
</script>

{#snippet meter(label: string, value: number | null, detail: string)}
  <div class="meter">
    <div class="row">
      <span>{label}</span>
      <span class="value">{value === null ? 'Unavailable' : detail}</span>
    </div>
    <div class="bar" aria-hidden="true"><div class="fill" style="transform: scaleX({(value ?? 0) / 100})"></div></div>
  </div>
{/snippet}

<WidgetFrame title="System">
  {#if stats}
    {@render meter('CPU', stats.cpuPercent, `${Math.round(stats.cpuPercent)}%`)}
    {@render meter(
      'Memory',
      memoryPercent,
      `${formatBytes(stats.memoryUsedBytes)} / ${formatBytes(stats.memoryTotalBytes)}`,
    )}
    {@render meter('GPU', stats.gpuPercent, `${Math.round(stats.gpuPercent ?? 0)}%`)}
  {:else if $systemMonitor.status === 'loading' || $systemMonitor.status === 'idle'}
    <p class="muted">Reading system stats…</p>
  {:else}
    <p class="muted">{$systemMonitor.message ?? 'Unavailable'}</p>
  {/if}
</WidgetFrame>

<style>
  .meter {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .value {
    font-family: var(--font-mono);
    font-size: 0.78rem;
  }
  .bar {
    height: 3px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.1);
    overflow: hidden;
  }
  .fill {
    height: 100%;
    background: var(--accent-color);
    transform-origin: left;
    transition: transform 0.6s ease;
  }
</style>
