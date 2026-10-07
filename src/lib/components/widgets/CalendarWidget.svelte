<script lang="ts">
  import WidgetFrame from './WidgetFrame.svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import { now } from '$lib/core/time/clock';

  /** Months away from the current month (0 = this month). */
  let offset = $state(0);

  const view = $derived.by(() => {
    const today = $now;
    const first = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const lead = first.getDay();
    const cells = Array.from({ length: Math.ceil((lead + daysInMonth) / 7) * 7 }, (_, i) => {
      const day = i - lead + 1;
      return day > 0 && day <= daysInMonth ? day : null;
    });
    const isCurrentMonth = offset === 0;
    return {
      title: first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      cells,
      today: isCurrentMonth ? today.getDate() : null,
    };
  });

  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, 7 + i).toLocaleDateString(undefined, { weekday: 'narrow' }),
  );
</script>

<WidgetFrame title={view.title}>
  {#snippet aside()}
    <button class="wicon" onclick={() => (offset -= 1)} aria-label="Previous month"
      ><Icon name="chevron-left" size={14} /></button
    >
    {#if offset !== 0}
      <button class="wicon today-btn" onclick={() => (offset = 0)} aria-label="Back to this month">•</button>
    {/if}
    <button class="wicon" onclick={() => (offset += 1)} aria-label="Next month"
      ><Icon name="chevron-right" size={14} /></button
    >
  {/snippet}

  <div class="grid">
    {#each weekdays as name, i (i)}<div class="name" aria-hidden="true">{name}</div>{/each}
    {#each view.cells as day, i (i)}
      <div
        class="day"
        class:empty={day === null}
        class:today={day === view.today}
        aria-current={day === view.today ? 'date' : undefined}
      >
        {day ?? ''}
      </div>
    {/each}
  </div>
</WidgetFrame>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 3px;
    text-align: center;
    font-size: 0.78rem;
  }
  .name {
    color: var(--text-muted);
    font-size: 0.66rem;
    padding-bottom: 2px;
  }
  .day {
    padding: 3px 0;
    border-radius: 4px;
  }
  .day.today {
    background: var(--accent-color);
    color: #fff;
    font-weight: 700;
  }
  .today-btn {
    font-size: 1rem;
  }
</style>
