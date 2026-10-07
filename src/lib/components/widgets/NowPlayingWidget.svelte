<script lang="ts">
  import { onMount } from 'svelte';
  import WidgetFrame from './WidgetFrame.svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import { controlMedia, mediaService, nowPlaying, sourceAppName } from '$lib/integrations/media';

  onMount(() => mediaService.acquire());

  const media = $derived($nowPlaying.media);
  const source = $derived(sourceAppName(media?.sourceApp ?? null));
</script>

<WidgetFrame title="Now playing">
  {#snippet aside()}<Icon name="music" size={13} />{/snippet}

  {#if media}
    <div class="track">
      <div class="title">{media.title || 'Untitled'}</div>
      {#if media.artist}<div class="muted">{media.artist}</div>{/if}
      {#if source}<div class="muted source">via {source}</div>{/if}
    </div>
    <div class="controls">
      <button
        class="wicon"
        disabled={!media.canPrevious}
        onclick={() => controlMedia('previous')}
        aria-label="Previous track"><Icon name="skip-back" size={15} /></button
      >
      <button
        class="wicon play"
        disabled={!media.canPlayPause}
        onclick={() => controlMedia('play-pause')}
        aria-label={media.status === 'playing' ? 'Pause' : 'Play'}
      >
        <Icon name={media.status === 'playing' ? 'pause' : 'play'} size={17} />
      </button>
      <button class="wicon" disabled={!media.canNext} onclick={() => controlMedia('next')} aria-label="Next track"
        ><Icon name="skip-forward" size={15} /></button
      >
    </div>
  {:else if $nowPlaying.status === 'ready'}
    <p class="muted">Nothing is playing.</p>
  {:else if $nowPlaying.status === 'idle'}
    <p class="muted">Looking for media…</p>
  {:else}
    <p class="muted">{$nowPlaying.message}</p>
  {/if}
</WidgetFrame>

<style>
  .title {
    font-size: 0.9rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .source {
    font-size: 0.66rem;
    margin-top: 2px;
  }
  .controls {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }
  .play {
    width: 32px;
    height: 32px;
    color: var(--text-color);
  }
</style>
