<script lang="ts">
  import { slide } from 'svelte/transition';
  import WidgetFrame from './WidgetFrame.svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import { tasks } from '$lib/stores/productivity';

  let draft = $state('');
  const done = $derived($tasks.filter((t) => t.completed).length);

  function add(event: SubmitEvent) {
    event.preventDefault();
    tasks.add(draft);
    draft = '';
  }
</script>

<WidgetFrame title="Tasks">
  {#snippet aside()}
    <span>{done}/{$tasks.length}</span>
    {#if done > 0}
      <button class="wicon" onclick={tasks.clearCompleted} title="Clear completed" aria-label="Clear completed tasks"
        ><Icon name="trash" size={13} /></button
      >
    {/if}
  {/snippet}

  {#if $tasks.length > 0}
    <ul>
      {#each $tasks as task (task.id)}
        <li class:completed={task.completed} transition:slide|local={{ duration: 150 }}>
          <label>
            <input type="checkbox" checked={task.completed} onchange={() => tasks.toggle(task.id)} />
            <span>{task.text}</span>
          </label>
          <button class="remove" onclick={() => tasks.remove(task.id)} aria-label="Delete “{task.text}”">×</button>
        </li>
      {/each}
    </ul>
  {/if}
  <form onsubmit={add}>
    <input type="text" bind:value={draft} placeholder="Add a task…" maxlength="500" aria-label="New task" />
  </form>
</WidgetFrame>

<style>
  ul {
    list-style: none;
    max-height: 160px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }
  li {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    font-size: 0.85rem;
    padding: 0.2rem 0;
  }
  label {
    display: flex;
    gap: 0.6rem;
    align-items: flex-start;
    flex: 1;
    cursor: pointer;
    line-height: 1.4;
  }
  input[type='checkbox'] {
    appearance: none;
    flex: none;
    width: 14px;
    height: 14px;
    margin-top: 3px;
    border: 1px solid var(--text-muted);
    border-radius: 4px;
    cursor: pointer;
  }
  input[type='checkbox']:checked {
    background: var(--text-color);
    border-color: var(--text-color);
  }
  .completed span {
    text-decoration: line-through;
    opacity: 0.45;
  }
  .remove {
    opacity: 0;
    color: var(--text-muted);
    font-size: 1.1rem;
    line-height: 1;
    padding: 0 0.3rem;
  }
  li:hover .remove,
  .remove:focus-visible {
    opacity: 1;
  }
  input[type='text'] {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    font-size: 0.85rem;
    color: var(--text-color);
  }
  input[type='text']::placeholder {
    color: var(--text-muted);
    opacity: 0.55;
  }
</style>
