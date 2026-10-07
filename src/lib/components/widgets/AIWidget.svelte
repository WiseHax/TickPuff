<script lang="ts">
  import { onMount } from 'svelte';
  import WidgetFrame from './WidgetFrame.svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import { AI_STATUS_LABELS, aiService, aiTools } from '$lib/integrations/ai';

  onMount(() => aiService.acquire());

  const checkedAt = $derived(
    $aiTools.reduce<number | null>(
      (latest, tool) => (tool.checkedAt && (!latest || tool.checkedAt > latest) ? tool.checkedAt : latest),
      null,
    ),
  );
  const checkedText = $derived(
    checkedAt ? new Date(checkedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : null,
  );
</script>

<WidgetFrame title="AI workspace">
  {#snippet aside()}
    <button class="wicon" onclick={aiService.refresh} aria-label="Check now" title="Check now"
      ><Icon name="refresh" size={13} /></button
    >
  {/snippet}

  <ul>
    {#each $aiTools as tool (tool.id)}
      <li>
        <div class="row">
          <span class="name">{tool.name}</span>
          <span class="status" data-status={tool.status}>
            <span class="dot" aria-hidden="true"></span>{AI_STATUS_LABELS[tool.status]}
          </span>
        </div>
        {#if tool.detail && tool.status !== 'not-found'}<div class="muted detail">{tool.detail}</div>{/if}
        {#if tool.status === 'running' || tool.status === 'installed'}
          {#if tool.quota.kind === 'available'}
            {#each tool.quota.windows as window (window.label)}
              <div class="row quota">
                <span>{window.label}</span>
                <span>{window.remainingPercent !== null ? `${window.remainingPercent}% left` : '—'}</span>
              </div>
            {/each}
          {:else}
            <div class="row quota muted" title={tool.quota.reason}>
              <span>Quota</span><span>Not available</span>
            </div>
          {/if}
        {/if}
      </li>
    {/each}
  </ul>
  {#if checkedText}<div class="muted checked">Checked {checkedText}</div>{/if}
</WidgetFrame>

<style>
  ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
  .name {
    font-weight: 500;
  }
  .status {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.72rem;
    color: var(--text-muted);
  }
  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    border: 1px solid currentColor;
  }
  .status[data-status='running'] {
    color: var(--accent-color);
  }
  .status[data-status='running'] .dot {
    background: currentColor;
    box-shadow: 0 0 6px currentColor;
  }
  .detail {
    font-size: 0.7rem;
    margin-top: 2px;
  }
  .quota {
    font-size: 0.7rem;
    margin-top: 4px;
    padding-left: 0.5rem;
    border-left: 1px solid rgba(255, 255, 255, 0.12);
  }
  .checked {
    font-size: 0.62rem;
    text-align: right;
    opacity: 0.7;
  }
</style>
