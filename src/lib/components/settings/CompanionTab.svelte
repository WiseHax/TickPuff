<script lang="ts">
  import Switch from '$lib/components/ui/Switch.svelte';
  import { COMPANIONS } from '$lib/companion/registry/companions';
  import { rendererStatus } from '$lib/companion/status';
  import { activeTheme, activeThemeState, world } from '$lib/stores/world';
  import { effectiveWeather } from '$lib/stores/atmosphere';
  import { ui } from '$lib/stores/settings';
  import { weatherSettings } from '$lib/integrations/weather';
  import { WEATHER_LABELS, type WeatherType } from '$lib/types';

  const syncing = $derived($weatherSettings.syncAtmosphere && $weatherSettings.location !== null);
</script>

<h3 class="section-title">Companion in {$activeTheme.name}</h3>
<div class="choices" role="radiogroup" aria-label="Companion">
  {#each $activeTheme.companions as id (id)}
    <button
      class="choice"
      role="radio"
      aria-checked={$activeThemeState.companion === id}
      onclick={() => world.setCompanion(id)}
    >
      {COMPANIONS[id].name}
      <span class="hint">{COMPANIONS[id].personality}</span>
    </button>
  {/each}
</div>
<Switch label="Show companion" checked={$ui.companionVisible} onchange={(value) => ui.set('companionVisible', value)} />
{#if $rendererStatus === 'unavailable'}
  <p class="hint warn">3D rendering (WebGL) isn't available on this system, so the companion can't be shown.</p>
{/if}
<p class="hint note">
  Companions are currently simple procedural models built from basic shapes — placeholders until proper 3D art is added.
  Each one can be replaced with a GLB model (see docs/companions.md).
</p>

<h3 class="section-title">Atmosphere</h3>
<div class="field">
  <label class="field-label" for="weather-select">
    Effect
    {#if syncing}<span class="hint">Following real weather — now {WEATHER_LABELS[$effectiveWeather].toLowerCase()}</span
      >{/if}
  </label>
  <select
    id="weather-select"
    value={$activeThemeState.weather}
    onchange={(e) => world.setWeather(e.currentTarget.value as WeatherType)}
  >
    {#each $activeTheme.allowedWeather as weather (weather)}
      <option value={weather}>{WEATHER_LABELS[weather]}</option>
    {/each}
  </select>
</div>

<style>
  .choices {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.6rem;
  }
  .choice {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 0.55rem 0.9rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.04);
    font-size: 0.88rem;
    min-width: 120px;
  }
  .choice .hint {
    text-transform: capitalize;
  }
  .choice[aria-checked='true'] {
    border-color: var(--accent-color);
    background: rgba(255, 255, 255, 0.1);
  }
  .note {
    margin-top: 0.7rem;
  }
  .warn {
    color: #ffb74d;
    margin-top: 0.5rem;
  }
</style>
