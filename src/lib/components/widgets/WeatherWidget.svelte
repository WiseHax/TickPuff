<script lang="ts">
  import { onMount } from 'svelte';
  import WidgetFrame from './WidgetFrame.svelte';
  import { CONDITION_LABELS, weather, weatherService, weatherSettings } from '$lib/integrations/weather';
  import { openExternal } from '$lib/core/platform/tauri';
  import { openSettings } from '$lib/stores/panel';

  onMount(() => weatherService.acquire());

  const report = $derived($weather.report);
  const unit = $derived($weatherSettings.units === 'fahrenheit' ? '°F' : '°C');
  const round = (value: number | null) => (value === null ? '—' : Math.round(value));
</script>

<WidgetFrame title={$weatherSettings.location?.name ?? 'Weather'}>
  {#if !$weatherSettings.location}
    <p class="muted">Choose a location to see local weather.</p>
    <button class="wbtn primary" onclick={() => openSettings('integrations')}>Set location</button>
  {:else if report}
    <div class="now">
      <span class="temp">{round(report.temperature)}{unit}</span>
      <div class="desc">
        <span>{CONDITION_LABELS[report.condition]}</span>
        <span class="muted">H {round(report.high)}° · L {round(report.low)}°</span>
      </div>
    </div>
    {#if $weather.message}<p class="muted stale">Showing earlier data: {$weather.message}</p>{/if}
    <button class="attribution" onclick={() => openExternal('https://open-meteo.com/')}
      >Weather data by Open-Meteo.com</button
    >
  {:else if $weather.status === 'error'}
    <p class="muted">{$weather.message ?? 'Weather unavailable'}</p>
  {:else}
    <p class="muted">Loading weather…</p>
  {/if}
</WidgetFrame>

<style>
  .now {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .temp {
    font-family: var(--font-mono);
    font-size: 2rem;
  }
  .desc {
    display: flex;
    flex-direction: column;
    font-size: 0.85rem;
  }
  .stale {
    font-size: 0.68rem;
  }
  .attribution {
    align-self: flex-start;
    font-size: 0.6rem;
    color: var(--text-muted);
    opacity: 0.7;
    text-decoration: underline;
  }
</style>
