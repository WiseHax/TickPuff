<script lang="ts">
  import WidgetFrame from './WidgetFrame.svelte';
  import { note } from '$lib/stores/productivity';
</script>

<WidgetFrame title="Notes">
  <textarea
    value={$note}
    oninput={(e) => note.set(e.currentTarget.value)}
    onblur={note.flush}
    placeholder="Jot down a thought…"
    rows="3"
    aria-label="Notes"></textarea>
</WidgetFrame>

<style>
  textarea {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    resize: vertical;
    min-height: 3.5rem;
    max-height: 14rem;
    font-size: 0.85rem;
    line-height: 1.45;
    color: var(--text-color);
  }
  textarea::placeholder {
    color: var(--text-muted);
    opacity: 0.55;
  }
</style>
