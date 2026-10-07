<script lang="ts">
  import WidgetFrame from './WidgetFrame.svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import { now } from '$lib/core/time/clock';
  import { countdown, countdownParts } from '$lib/stores/productivity';

  let editing = $state(false);
  let label = $state('');
  let when = $state('');

  const parts = $derived($countdown.target !== null ? countdownParts($countdown.target, $now.getTime()) : null);

  function toLocalInput(epoch: number): string {
    const d = new Date(epoch);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function edit() {
    label = $countdown.label;
    when = $countdown.target !== null ? toLocalInput($countdown.target) : toLocalInput(Date.now() + 86_400_000);
    editing = true;
  }

  function save(event: SubmitEvent) {
    event.preventDefault();
    const target = new Date(when).getTime();
    if (Number.isNaN(target)) return;
    countdown.set({ label: label.trim().slice(0, 60), target });
    editing = false;
  }
</script>

<WidgetFrame title={$countdown.label || 'Countdown'}>
  {#snippet aside()}
    {#if !editing}
      <button class="wicon" onclick={edit} aria-label="Edit countdown"><Icon name="edit" size={13} /></button>
    {/if}
  {/snippet}

  {#if editing}
    <form onsubmit={save}>
      <input type="text" bind:value={label} placeholder="What for?" maxlength="60" aria-label="Countdown label" />
      <input type="datetime-local" bind:value={when} required aria-label="Countdown date and time" />
      <div class="actions">
        <button class="wbtn primary" type="submit">Save</button>
        <button class="wbtn ghost" type="button" onclick={() => (editing = false)}>Cancel</button>
      </div>
    </form>
  {:else if parts === null}
    <p class="muted">Set a date to count down to.</p>
    <button class="wbtn primary" onclick={edit}>Set countdown</button>
  {:else if parts.done}
    <p class="done">It's time! 🎉</p>
  {:else}
    <div class="units">
      {#if parts.days > 0}<div><strong>{parts.days}</strong><span>days</span></div>{/if}
      <div><strong>{parts.hours}</strong><span>hrs</span></div>
      <div><strong>{String(parts.minutes).padStart(2, '0')}</strong><span>min</span></div>
      {#if parts.days === 0}<div><strong>{String(parts.seconds).padStart(2, '0')}</strong><span>sec</span></div>{/if}
    </div>
  {/if}
</WidgetFrame>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  input {
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 0.35rem 0.5rem;
    font-size: 0.82rem;
    color-scheme: dark;
  }
  .actions {
    display: flex;
    gap: 0.4rem;
  }
  .units {
    display: flex;
    gap: 1rem;
  }
  .units div {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  strong {
    font-family: var(--font-mono);
    font-size: 1.6rem;
    font-weight: 400;
    font-variant-numeric: tabular-nums;
  }
  .units span {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-muted);
  }
  .done {
    font-size: 1.1rem;
  }
</style>
