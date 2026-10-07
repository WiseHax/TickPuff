<script lang="ts">
  import Switch from '$lib/components/ui/Switch.svelte';
  import { searchLocations, weatherSettings } from '$lib/integrations/weather';
  import type { WeatherLocation } from '$lib/types';

  let query = $state('');
  let results = $state<WeatherLocation[]>([]);
  let searching = $state(false);
  let error = $state<string | null>(null);
  let controller: AbortController | null = null;

  const describe = (location: WeatherLocation) =>
    [location.name, location.region, location.country].filter(Boolean).join(', ');

  async function search(event: SubmitEvent) {
    event.preventDefault();
    controller?.abort();
    controller = new AbortController();
    searching = true;
    error = null;
    try {
      results = await searchLocations(query, controller.signal);
      if (results.length === 0) error = 'No places found.';
    } catch (e) {
      if (!controller.signal.aborted) error = e instanceof Error ? e.message : 'Search failed.';
    } finally {
      searching = false;
    }
  }

  function choose(location: WeatherLocation) {
    weatherSettings.update((settings) => ({ ...settings, location }));
    results = [];
    query = '';
  }
</script>

<h3 class="section-title">Weather</h3>
<p class="hint">
  Real weather comes from Open-Meteo (no account or key). TickPuff only contacts it after you choose a location, and
  only sends that location's coordinates.
</p>
<div class="field">
  <span class="field-label">
    Location
    <span class="hint">{$weatherSettings.location ? describe($weatherSettings.location) : 'Not set'}</span>
  </span>
  {#if $weatherSettings.location}
    <button
      class="button"
      onclick={() => weatherSettings.update((s) => ({ ...s, location: null, syncAtmosphere: false }))}>Clear</button
    >
  {/if}
</div>
<form class="search" onsubmit={search}>
  <input
    type="search"
    bind:value={query}
    placeholder="Search for a city"
    aria-label="Search for a city"
    minlength="2"
  />
  <button class="button primary" type="submit" disabled={searching || query.trim().length < 2}
    >{searching ? 'Searching…' : 'Search'}</button
  >
</form>
{#if error}<p class="hint">{error}</p>{/if}
{#if results.length > 0}
  <ul class="results">
    {#each results as location (`${location.latitude},${location.longitude}`)}
      <li><button onclick={() => choose(location)}>{describe(location)}</button></li>
    {/each}
  </ul>
{/if}
<div class="field">
  <label for="units">Units</label>
  <select
    id="units"
    value={$weatherSettings.units}
    onchange={(e) =>
      weatherSettings.update((s) => ({
        ...s,
        units: e.currentTarget.value === 'fahrenheit' ? 'fahrenheit' : 'celsius',
      }))}
  >
    <option value="celsius">Celsius</option>
    <option value="fahrenheit">Fahrenheit</option>
  </select>
</div>
<Switch
  label="Match the world's atmosphere to real weather"
  description="Outdoor worlds show rain, snow or fog when it's really happening."
  checked={$weatherSettings.syncAtmosphere}
  disabled={!$weatherSettings.location}
  onchange={(v) => weatherSettings.update((s) => ({ ...s, syncAtmosphere: v }))}
/>

<h3 class="section-title">AI workspace</h3>
<p class="hint">
  Detects whether Antigravity (IDE or <code>agy</code> CLI) and Claude Code are running by reading the process list and checking
  their usual install locations. Nothing is launched and no account data is read. Neither tool offers a supported way for
  other apps to read quota, so quota is shown as not available rather than guessed.
</p>

<h3 class="section-title">Now playing & system monitor</h3>
<p class="hint">
  Now playing reads the media session Windows shows in its volume flyout. GPU usage uses the same Windows performance
  counters as Task Manager. Both are Windows-only today; elsewhere they show as unavailable.
</p>

<style>
  .search {
    display: flex;
    gap: 0.5rem;
    margin: 0.6rem 0;
  }
  .search input {
    flex: 1;
  }
  .results {
    list-style: none;
    margin-bottom: 0.6rem;
    border: 1px solid var(--panel-line);
    border-radius: 8px;
    overflow: hidden;
  }
  .results button {
    width: 100%;
    text-align: left;
    padding: 0.45rem 0.7rem;
    font-size: 0.85rem;
  }
  .results button:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  code {
    font-family: var(--font-mono);
    font-size: 0.9em;
  }
</style>
