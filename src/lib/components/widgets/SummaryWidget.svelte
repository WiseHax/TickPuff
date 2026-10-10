<script lang="ts">
  import WidgetFrame from './WidgetFrame.svelte';
  import { focusStreak, focusWeek, todayFocus } from '$lib/stores/focus';
  import { tasks, tasksDoneToday } from '$lib/stores/productivity';

  const open = $derived($tasks.filter((t) => !t.completed).length);
  const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  // Scale to the busiest day, but never below one 25-minute session so a light week still looks light.
  const peak = $derived(Math.max(25, ...$focusWeek.map((d) => d.minutes)));
  const weekTotal = $derived($focusWeek.reduce((sum, d) => sum + d.minutes, 0));
</script>

<WidgetFrame title="Today">
  <div class="grid">
    <div><strong>{$todayFocus.minutes}</strong><span>focus min</span></div>
    <div><strong>{$todayFocus.sessions}</strong><span>sessions</span></div>
    <div><strong>{$tasksDoneToday}</strong><span>tasks done</span></div>
    <div><strong>{$focusStreak}</strong><span>day streak</span></div>
  </div>
  <div class="week" role="img" aria-label="Focus this week: {weekTotal} minutes in the last 7 days">
    {#each $focusWeek as day, i (day.key)}
      <div class="day" class:today={i === $focusWeek.length - 1} title="{day.minutes} min">
        <div
          class="bar"
          style="height: {Math.max(4, (day.minutes / peak) * 100)}%"
          class:empty={day.minutes === 0}
        ></div>
        <span>{DAY_LETTERS[day.weekday]}</span>
      </div>
    {/each}
  </div>
  <p class="muted">{weekTotal} min of focus this week</p>
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
  .week {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
    height: 70px;
    margin-top: 0.4rem;
  }
  .day {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
  }
  .bar {
    width: 100%;
    max-width: 22px;
    border-radius: 4px 4px 2px 2px;
    background: color-mix(in oklab, var(--accent-color) 70%, transparent);
    transition: height 0.5s ease;
  }
  .bar.empty {
    background: rgba(255, 255, 255, 0.1);
  }
  .day.today .bar:not(.empty) {
    background: var(--accent-color);
  }
  .day.today span {
    color: var(--text-color);
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
