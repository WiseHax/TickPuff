<script lang="ts">
  import WidgetFrame from './WidgetFrame.svelte';
  import { focusStreak, todayFocus } from '$lib/stores/focus';
  import { tasks, tasksDoneToday } from '$lib/stores/productivity';

  const open = $derived($tasks.filter((t) => !t.completed).length);
</script>

<WidgetFrame title="Today">
  <div class="grid">
    <div><strong>{$todayFocus.minutes}</strong><span>focus min</span></div>
    <div><strong>{$todayFocus.sessions}</strong><span>sessions</span></div>
    <div><strong>{$tasksDoneToday}</strong><span>tasks done</span></div>
    <div><strong>{$focusStreak}</strong><span>day streak</span></div>
  </div>
  {#if open > 0}<p class="muted">{open} task{open === 1 ? '' : 's'} still open</p>{/if}
</WidgetFrame>

<style>
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  .grid div {
    display: flex;
    flex-direction: column;
  }
  strong {
    font-family: var(--font-mono);
    font-size: 1.4rem;
    font-weight: 400;
  }
  span {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-muted);
  }
</style>
