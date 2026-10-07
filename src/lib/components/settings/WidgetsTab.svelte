<script lang="ts">
  import Icon from '$lib/components/ui/Icon.svelte';
  import { PRESETS, WIDGETS, widgetLayout } from '$lib/stores/widgets';
  import type { WidgetDock, WidgetId } from '$lib/types';

  const descriptor = (id: WidgetId) => WIDGETS.find((w) => w.id === id);
  const ordered = $derived(
    [...$widgetLayout.widgets].sort((a, b) => (a.dock === b.dock ? a.order - b.order : a.dock === 'left' ? -1 : 1)),
  );
</script>

<h3 class="section-title">Presets</h3>
<div class="presets">
  {#each PRESETS as preset (preset.id)}
    <button class="preset" onclick={() => widgetLayout.applyPreset(preset)}>
      <strong>{preset.name}</strong>
      <span class="hint">{preset.description}</span>
    </button>
  {/each}
</div>

<h3 class="section-title">Widgets</h3>
<p class="hint">Widgets work in every world. Left widgets sit bottom-left; right widgets sit top-right.</p>
<ul>
  {#each ordered as widget (widget.id)}
    {@const info = descriptor(widget.id)}
    {@const mates = ordered.filter((w) => w.dock === widget.dock)}
    {@const index = mates.findIndex((w) => w.id === widget.id)}
    <li class:off={!widget.enabled}>
      <label class="toggle">
        <input type="checkbox" role="switch" checked={widget.enabled} onchange={() => widgetLayout.toggle(widget.id)} />
        <span class="field-label">
          <span>{info?.name}</span>
          <span class="hint">{info?.description}{info?.platformNote ? ` · ${info.platformNote}` : ''}</span>
        </span>
      </label>
      <div class="actions">
        <select
          aria-label="{info?.name} position"
          value={widget.dock}
          onchange={(e) => widgetLayout.setDock(widget.id, e.currentTarget.value as WidgetDock)}
        >
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
        <button
          class="move"
          disabled={index === 0}
          onclick={() => widgetLayout.move(widget.id, -1)}
          aria-label="Move {info?.name} up"><Icon name="chevron-up" size={14} /></button
        >
        <button
          class="move"
          disabled={index === mates.length - 1}
          onclick={() => widgetLayout.move(widget.id, 1)}
          aria-label="Move {info?.name} down"><Icon name="chevron-down" size={14} /></button
        >
      </div>
    </li>
  {/each}
</ul>

<style>
  .presets {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.5rem;
  }
  .preset {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    text-align: left;
    padding: 0.6rem 0.75rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.04);
    font-size: 0.85rem;
  }
  .preset:hover {
    border-color: var(--accent-color);
  }
  ul {
    list-style: none;
    margin-top: 0.4rem;
  }
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--panel-line);
  }
  li.off .field-label > span:first-child {
    opacity: 0.6;
  }
  .toggle {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    cursor: pointer;
    font-size: 0.88rem;
  }
  .toggle input {
    accent-color: var(--accent-color);
    width: 16px;
    height: 16px;
    flex: none;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    flex: none;
  }
  .actions select {
    min-width: 0;
    width: 74px;
  }
  .move {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--panel-muted);
  }
  .move:hover:not(:disabled) {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }
  .move:disabled {
    opacity: 0.25;
    cursor: default;
  }
</style>
