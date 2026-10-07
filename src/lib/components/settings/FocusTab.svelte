<script lang="ts">
  import Switch from '$lib/components/ui/Switch.svelte';
  import { focus, focusConfig } from '$lib/stores/focus';
  import { MAX_PHASE_MINUTES, MIN_PHASE_MINUTES } from '$lib/features/focus/timer';
  import type { FocusConfig } from '$lib/types';

  const fields: { key: keyof FocusConfig; label: string; min: number; max: number }[] = [
    { key: 'focusMinutes', label: 'Focus length (minutes)', min: MIN_PHASE_MINUTES, max: MAX_PHASE_MINUTES },
    { key: 'shortBreakMinutes', label: 'Short break (minutes)', min: MIN_PHASE_MINUTES, max: MAX_PHASE_MINUTES },
    { key: 'longBreakMinutes', label: 'Long break (minutes)', min: MIN_PHASE_MINUTES, max: MAX_PHASE_MINUTES },
    { key: 'longBreakEvery', label: 'Long break after N focus sessions', min: 1, max: 12 },
  ];
</script>

{#each fields as field (field.key)}
  <div class="field">
    <label for="focus-{field.key}">{field.label}</label>
    <input
      id="focus-{field.key}"
      type="number"
      min={field.min}
      max={field.max}
      value={$focusConfig[field.key]}
      onchange={(e) => focus.patchConfig({ [field.key]: Number(e.currentTarget.value) })}
    />
  </div>
{/each}
<Switch
  label="Start the next phase automatically"
  checked={$focusConfig.autoStartNext}
  onchange={(v) => focus.patchConfig({ autoStartNext: v })}
/>
<Switch
  label="Chime when a phase ends"
  checked={$focusConfig.sound}
  onchange={(v) => focus.patchConfig({ sound: v })}
/>
<p class="hint about">
  The timer is based on timestamps, so it stays accurate while TickPuff is minimized and keeps running across restarts.
  A phase that ends while TickPuff is closed is still counted.
</p>
<p><button class="button" onclick={focus.resetCycle}>Start a new cycle</button></p>

<style>
  .about {
    margin: 0.9rem 0;
  }
</style>
