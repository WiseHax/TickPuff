<script lang="ts">
  import Switch from '$lib/components/ui/Switch.svelte';
  import { COMPANIONS } from '$lib/companion/registry/companions';
  import { rendererStatus } from '$lib/companion/status';
  import { activeTheme, activeThemeState, world } from '$lib/stores/world';
  import { effectiveWeather } from '$lib/stores/atmosphere';
  import { companionSize, ui } from '$lib/stores/settings';
  import { ACCESSORY_LEVELS, LEVEL_NAMES, NAME_MAX_LENGTH, bonds, levelFor, levelProgress } from '$lib/stores/bond';
  import { weatherSettings } from '$lib/integrations/weather';
  import { COMPANION_SIZES, WEATHER_LABELS, type WeatherType } from '$lib/types';

  const active = $derived($activeThemeState.companion);
  const bond = $derived($bonds[active]);
  const level = $derived(levelFor(bond?.points ?? 0));
  const nextUnlock = $derived((Object.entries(ACCESSORY_LEVELS) as [string, number][]).find(([, at]) => at > level));

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
<div class="field">
  <label class="field-label" for="companion-name">Name</label>
  <input
    id="companion-name"
    type="text"
    maxlength={NAME_MAX_LENGTH}
    placeholder={COMPANIONS[active].name}
    value={bond?.name ?? ''}
    onchange={(e) => bonds.rename(active, e.currentTarget.value)}
  />
</div>
<div class="field friendship">
  <span class="field-label">
    Friendship
    <span class="hint">
      {LEVEL_NAMES[level]}{nextUnlock ? ` · reach level ${nextUnlock[1]} for a ${nextUnlock[0]}` : ''}
    </span>
  </span>
  <div
    class="meter"
    role="meter"
    aria-label="Friendship"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow={Math.round(levelProgress(bond?.points ?? 0) * 100)}
  >
    <span style="width: {levelProgress(bond?.points ?? 0) * 100}%"></span>
  </div>
</div>
<p class="hint">Grows when you pet {bond?.name ?? 'your companion'} and finish focus sessions. It never goes down.</p>
<Switch label="Show companion" checked={$ui.companionVisible} onchange={(value) => ui.set('companionVisible', value)} />
<div class="field">
  <span class="field-label" id="size-label">Size</span>
  <div class="segmented" role="radiogroup" aria-labelledby="size-label">
    {#each COMPANION_SIZES as size (size)}
      <button role="radio" aria-checked={$companionSize === size} onclick={() => companionSize.set(size)}>
        {size}
      </button>
    {/each}
  </div>
</div>
{#if $rendererStatus === 'unavailable'}
  <p class="hint warn">3D rendering (WebGL) isn't available on this system, so the companion can't be shown.</p>
{/if}
<p class="hint note">
  Companions are hand-built procedural models. Each one can be replaced with a GLB model (see docs/companions.md).
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
  .friendship {
    gap: 1rem;
  }
  .meter {
    flex: 0 0 160px;
    height: 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
    overflow: hidden;
  }
  .meter span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--accent-color);
    transition: width 0.6s ease;
  }
  .note {
    margin-top: 0.7rem;
  }
  .warn {
    color: #ffb74d;
    margin-top: 0.5rem;
  }
</style>
