<script lang="ts">
  import { now } from '$lib/core/time/clock';
  import { clockSettings } from '$lib/stores/settings';
  import { activeTheme } from '$lib/stores/world';
  import { widgetLayout } from '$lib/stores/widgets';
  import { fontStack } from '$lib/components/ui/fonts';

  const hours24 = $derived($now.getHours());
  const hours = $derived($clockSettings.use24Hour ? String(hours24).padStart(2, '0') : String(hours24 % 12 || 12));
  const minutes = $derived(String($now.getMinutes()).padStart(2, '0'));
  const seconds = $derived(String($now.getSeconds()).padStart(2, '0'));
  const meridiem = $derived($clockSettings.use24Hour ? '' : hours24 >= 12 ? 'PM' : 'AM');
  const dateText = $derived(
    $now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).replace(',', ' ·'),
  );
  const font = $derived(fontStack($clockSettings.font === 'Theme' ? $activeTheme.clock.font : $clockSettings.font));
  const color = $derived($clockSettings.color ?? 'var(--text-color)');
  const machineTime = $derived(`${String(hours24).padStart(2, '0')}:${minutes}`);
</script>

{#if $widgetLayout.hero.clock || $widgetLayout.hero.date}
  <div class="clock" style="--clock-shadow: {$activeTheme.clock.shadow}">
    {#if $widgetLayout.hero.clock}
      <time
        class="time"
        datetime={machineTime}
        style="font-family: {font}; font-size: {$clockSettings.size}rem; font-weight: {$clockSettings.weight}; letter-spacing: {$clockSettings.letterSpacing}px; color: {color};"
      >
        <span>{hours}</span><span class="colon">:</span><span>{minutes}</span>
        {#if $clockSettings.showSeconds}
          <span class="colon">:</span><span class="seconds">{seconds}</span>
        {/if}
        {#if meridiem}
          <span class="meridiem" style="font-size: {Math.max($clockSettings.size * 0.3, 1.5)}rem">{meridiem}</span>
        {/if}
      </time>
    {/if}
    {#if $widgetLayout.hero.date}
      <div class="date">{dateText}</div>
    {/if}
  </div>
{/if}

<style>
  .clock {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    text-shadow:
      var(--clock-shadow),
      0 1px 3px rgba(0, 0, 0, 0.45);
  }
  .time {
    display: flex;
    align-items: baseline;
    line-height: 1;
    margin-bottom: 0.5rem;
    font-variant-numeric: tabular-nums;
    transition:
      font-size 0.3s ease,
      color 0.8s ease;
  }
  .colon {
    margin: 0 0.05em;
    animation: blink 2s infinite;
  }
  .seconds {
    opacity: 0.9;
  }
  .meridiem {
    margin-left: 0.5em;
    opacity: 0.8;
    letter-spacing: normal;
    font-weight: 400;
  }
  .date {
    font-family: var(--font-display);
    font-size: 1.4rem;
    font-weight: 300;
    opacity: 0.9;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--text-color);
  }
  @keyframes blink {
    0%,
    50%,
    100% {
      opacity: 1;
    }
    25%,
    75% {
      opacity: 0.4;
    }
  }
</style>
