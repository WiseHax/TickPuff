<script lang="ts">
  import WidgetFrame from './WidgetFrame.svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import { focus, focusConfig, focusStreak, focusView, todayFocus } from '$lib/stores/focus';
  import { formatClock, PHASE_LABELS } from '$lib/features/focus/timer';

  const running = $derived($focusView.status === 'running');
  const fresh = $derived($focusView.status === 'idle');
  const display = $derived(formatClock($focusView.remainingMs));
  const nextLong = $derived($focusConfig.longBreakEvery - ($focusView.cycleCount % $focusConfig.longBreakEvery));
</script>

<WidgetFrame title={PHASE_LABELS[$focusView.phase]}>
  {#snippet aside()}
    {#if $focusStreak > 0}<span class="streak" title="Days in a row with a finished focus session"
        >🔥 {$focusStreak}</span
      >{/if}
  {/snippet}

  <div class="timer" class:running class:on-break={$focusView.phase !== 'focus'}>
    <time aria-live="off">{display}</time>
    {#if fresh}
      <div class="adjust">
        <button
          class="wicon"
          onclick={() => focus.setDurationMinutes($focusView.durationMinutes - 5)}
          aria-label="Five minutes shorter"
          disabled={$focusView.durationMinutes <= 5}
        >
          <Icon name="minus" size={14} />
        </button>
        <button
          class="wicon"
          onclick={() => focus.setDurationMinutes($focusView.durationMinutes + 5)}
          aria-label="Five minutes longer"
        >
          <Icon name="plus" size={14} />
        </button>
      </div>
    {/if}
  </div>
  <div
    class="bar"
    role="progressbar"
    aria-label="Phase progress"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow={Math.round($focusView.progress * 100)}
  >
    <div class="fill" style="transform: scaleX({$focusView.progress})"></div>
  </div>

  <div class="controls">
    <button class="wbtn primary" onclick={focus.toggle}>{running ? 'Pause' : fresh ? 'Start' : 'Resume'}</button>
    {#if !fresh}
      <button class="wbtn ghost" onclick={focus.reset}>Reset</button>
    {/if}
    <button class="wbtn ghost" onclick={focus.skip} title="Skip to the next phase without counting this one"
      >Skip</button
    >
  </div>

  <div class="muted meta">
    {#if $todayFocus.sessions > 0}
      <span>{$todayFocus.sessions} today · {$todayFocus.minutes} min</span>
    {:else}
      <span>No sessions yet today</span>
    {/if}
    {#if $focusView.phase === 'focus'}<span>Long break in {nextLong}</span>{/if}
  </div>
</WidgetFrame>

<style>
  .timer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  time {
    font-family: var(--font-mono);
    font-size: 2.5rem;
    letter-spacing: -2px;
    font-variant-numeric: tabular-nums;
    color: var(--text-color);
    transition: color 0.3s;
  }
  .running time {
    color: var(--accent-color);
  }
  .on-break time {
    opacity: 0.85;
  }
  .adjust {
    display: flex;
    gap: 0.2rem;
  }
  .bar {
    height: 3px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.1);
    overflow: hidden;
  }
  .fill {
    height: 100%;
    background: var(--accent-color);
    transform-origin: left;
    transition: transform 0.3s linear;
  }
  .controls {
    display: flex;
    gap: 0.4rem;
  }
  .streak {
    color: #ff9800;
    font-weight: 700;
    letter-spacing: normal;
  }
  .meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
  }
</style>
