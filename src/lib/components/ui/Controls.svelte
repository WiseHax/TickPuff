<script lang="ts">
  import Icon, { type IconName } from './Icon.svelte';
  import { ui } from '$lib/stores/settings';
  import { openSettings } from '$lib/stores/panel';
  import { closeWindow, hasNativeWindow, minimizeWindow } from '$lib/core/platform/window';
  import { miniMode, setMiniMode } from '$lib/stores/windowMode';

  let {
    hidden,
    fullscreen,
    onToggleFullscreen,
  }: { hidden: boolean; fullscreen: boolean; onToggleFullscreen: () => void } = $props();

  const native = hasNativeWindow();

  const modes: { key: 'sleepMode' | 'ambientMode' | 'widgetsVisible'; icon: IconName; label: string }[] = [
    { key: 'sleepMode', icon: 'moon', label: 'Sleep mode' },
    { key: 'ambientMode', icon: 'image', label: 'Ambient mode (hide clock and widgets)' },
    { key: 'widgetsVisible', icon: 'layout', label: 'Widgets (W)' },
  ];
</script>

<div class="controls" class:hidden class:mini={$miniMode}>
  {#if $miniMode}
    <button
      class="icon-btn small"
      onclick={() => setMiniMode(false)}
      aria-label="Leave mini mode"
      title="Leave mini mode"><Icon name="expand" size={14} /></button
    >
  {:else}
    {#if native}
      <div class="window" role="group" aria-label="Window">
        <button class="icon-btn small" onclick={minimizeWindow} aria-label="Minimize" title="Minimize"
          ><Icon name="minus" size={15} /></button
        >
        <button class="icon-btn small" onclick={closeWindow} aria-label="Close TickPuff" title="Close"
          ><Icon name="x" size={15} /></button
        >
      </div>
    {/if}
    {#each modes as mode (mode.key)}
      <button
        class="icon-btn"
        class:active={$ui[mode.key]}
        onclick={() => ui.toggle(mode.key)}
        aria-label={mode.label}
        aria-pressed={$ui[mode.key]}
        title={mode.label}
      >
        <Icon name={mode.icon} size={19} />
      </button>
    {/each}
    <button
      class="icon-btn"
      onclick={onToggleFullscreen}
      aria-label={fullscreen ? 'Exit full screen (F11)' : 'Full screen (F11)'}
      title="Full screen (F11)"
    >
      <Icon name={fullscreen ? 'minimize' : 'maximize'} size={18} />
    </button>
    {#if native}
      <button
        class="icon-btn"
        onclick={() => setMiniMode(true)}
        aria-label="Mini mode (always on top)"
        title="Mini mode"><Icon name="shrink" size={18} /></button
      >
    {/if}
    <button class="icon-btn" onclick={() => openSettings()} aria-label="Settings" title="Settings"
      ><Icon name="settings" size={19} /></button
    >
  {/if}
</div>

<style>
  .controls {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.7rem;
    z-index: 30;
    opacity: 0.55;
    transition: opacity 0.5s ease;
  }
  .controls.mini {
    top: 0.5rem;
    right: 0.5rem;
  }
  .controls:hover,
  .controls:focus-within {
    opacity: 1;
  }
  .controls.hidden {
    opacity: 0;
    pointer-events: none;
  }
  .controls.hidden:focus-within {
    opacity: 1;
    pointer-events: auto;
  }
  .window {
    display: flex;
    gap: 0.35rem;
  }
  .icon-btn {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.22);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.06);
    transition:
      background 0.2s,
      color 0.2s,
      transform 0.2s,
      border-color 0.2s;
  }
  .icon-btn.small {
    width: 30px;
    height: 30px;
    border-radius: 8px;
  }
  .icon-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
    transform: scale(1.05);
    border-color: rgba(255, 255, 255, 0.2);
  }
  .icon-btn:active {
    transform: scale(0.95);
  }
  .icon-btn.active {
    color: var(--accent-color);
    border-color: var(--accent-color);
  }
</style>
