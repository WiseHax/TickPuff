<script lang="ts">
  import Switch from '$lib/components/ui/Switch.svelte';
  import { clockSettings } from '$lib/stores/settings';
  import { widgetLayout } from '$lib/stores/widgets';
  import { activeColors, activeTheme } from '$lib/stores/world';
  import { CLOCK_FONTS, type ClockFont } from '$lib/types';

  const WEIGHTS = [
    [300, 'Light'],
    [400, 'Regular'],
    [500, 'Medium'],
    [600, 'Semi-bold'],
    [700, 'Bold'],
  ] as const;
</script>

<Switch label="Show clock" checked={$widgetLayout.hero.clock} onchange={(v) => widgetLayout.setHero('clock', v)} />
<Switch label="Show date" checked={$widgetLayout.hero.date} onchange={(v) => widgetLayout.setHero('date', v)} />

<h3 class="section-title">Appearance</h3>
<div class="field">
  <label for="clock-font">Font</label>
  <select
    id="clock-font"
    value={$clockSettings.font}
    onchange={(e) => clockSettings.patch({ font: e.currentTarget.value as ClockFont })}
  >
    {#each CLOCK_FONTS as font (font)}
      <option value={font}>{font === 'Theme' ? `Theme (${$activeTheme.clock.font})` : font}</option>
    {/each}
  </select>
</div>
<div class="field">
  <label for="clock-size">Size</label>
  <span class="range">
    <input
      id="clock-size"
      type="range"
      min="3"
      max="16"
      step="0.5"
      value={$clockSettings.size}
      oninput={(e) => clockSettings.patch({ size: Number(e.currentTarget.value) })}
    />
    <output for="clock-size">{$clockSettings.size}rem</output>
  </span>
</div>
<div class="field">
  <label for="clock-weight">Weight</label>
  <select
    id="clock-weight"
    value={$clockSettings.weight}
    onchange={(e) => clockSettings.patch({ weight: Number(e.currentTarget.value) })}
  >
    {#each WEIGHTS as [value, name] (value)}<option {value}>{name}</option>{/each}
  </select>
</div>
<div class="field">
  <label for="clock-spacing">Letter spacing</label>
  <span class="range">
    <input
      id="clock-spacing"
      type="range"
      min="-10"
      max="20"
      step="1"
      value={$clockSettings.letterSpacing}
      oninput={(e) => clockSettings.patch({ letterSpacing: Number(e.currentTarget.value) })}
    />
    <output for="clock-spacing">{$clockSettings.letterSpacing}px</output>
  </span>
</div>
<div class="field">
  <span class="field-label">Colour</span>
  <span class="color">
    <button
      class="button"
      class:primary={$clockSettings.color === null}
      onclick={() => clockSettings.patch({ color: null })}>Theme</button
    >
    <input
      type="color"
      aria-label="Custom clock colour"
      value={$clockSettings.color ?? (/^#[0-9a-f]{6}$/i.test($activeColors.text) ? $activeColors.text : '#ffffff')}
      oninput={(e) => clockSettings.patch({ color: e.currentTarget.value })}
    />
  </span>
</div>
<Switch
  label="Show seconds"
  checked={$clockSettings.showSeconds}
  onchange={(v) => clockSettings.patch({ showSeconds: v })}
/>
<Switch
  label="24-hour time"
  checked={$clockSettings.use24Hour}
  onchange={(v) => clockSettings.patch({ use24Hour: v })}
/>
<p><button class="button reset" onclick={clockSettings.reset}>Reset clock settings</button></p>

<style>
  .range {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  output {
    width: 3.2rem;
    text-align: right;
    font-size: 0.8rem;
    color: var(--panel-muted);
  }
  .color {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  input[type='color'] {
    width: 34px;
    height: 26px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    background: none;
    cursor: pointer;
  }
  .reset {
    margin-top: 1rem;
  }
</style>
