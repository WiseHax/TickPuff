<!--
  Quiet status under the clock for things that are happening right now (a
  running focus phase), so the widgets can stay tucked away in their drawers.
-->
<script lang="ts">
  import { fade } from 'svelte/transition';
  import Icon from '$lib/components/ui/Icon.svelte';
  import { focus, focusView } from '$lib/stores/focus';
  import { formatClock, PHASE_LABELS } from '$lib/features/focus/timer';

  const active = $derived($focusView.status !== 'idle');
  const running = $derived($focusView.status === 'running');
</script>

{#if active}
  <button
    class="glance"
    class:paused={!running}
    onclick={() => focus.toggle()}
    transition:fade={{ duration: 300 }}
    aria-label="{PHASE_LABELS[$focusView.phase]} {formatClock($focusView.remainingMs)} left. {running
      ? 'Pause'
      : 'Resume'}"
    title={running ? 'Pause' : 'Resume'}
  >
    <span class="dot" class:break={$focusView.phase !== 'focus'}></span>
    <span class="label">{PHASE_LABELS[$focusView.phase]}</span>
    <time>{formatClock($focusView.remainingMs)}</time>
    <Icon name={running ? 'pause' : 'play'} size={12} />
  </button>
{/if}

<style>
  .glance {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1.1rem;
    padding: 0.35rem 0.85rem;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.22);
    color: var(--text-color);
    font-size: 0.82rem;
    letter-spacing: 0.04em;
    pointer-events: auto;
    backdrop-filter: blur(6px);
    transition: background 0.3s ease;
  }
  .glance:hover {
    background: rgba(0, 0, 0, 0.35);
  }
  .glance.paused {
    opacity: 0.75;
  }
  .label {
    color: var(--text-muted);
  }
  time {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }
  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent-color);
    animation: breathe 2.4s ease-in-out infinite;
  }
  .dot.break {
    background: #8fd6a0;
  }
  .paused .dot {
    animation: none;
  }
  @keyframes breathe {
    50% {
      opacity: 0.35;
    }
  }
</style>
