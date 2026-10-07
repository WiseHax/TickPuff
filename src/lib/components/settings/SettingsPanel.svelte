<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import Icon from '$lib/components/ui/Icon.svelte';
  import { closeSettings, settingsPanel, type SettingsTab } from '$lib/stores/panel';
  import WorldTab from './WorldTab.svelte';
  import CompanionTab from './CompanionTab.svelte';
  import ClockTab from './ClockTab.svelte';
  import WidgetsTab from './WidgetsTab.svelte';
  import FocusTab from './FocusTab.svelte';
  import IntegrationsTab from './IntegrationsTab.svelte';
  import PerformanceTab from './PerformanceTab.svelte';
  import AboutTab from './AboutTab.svelte';

  const TABS: { id: SettingsTab; label: string; title: string }[] = [
    { id: 'world', label: 'World', title: 'Choose a world' },
    { id: 'companion', label: 'Companion', title: 'Companion & atmosphere' },
    { id: 'clock', label: 'Clock', title: 'Clock' },
    { id: 'widgets', label: 'Widgets', title: 'Widgets & presets' },
    { id: 'focus', label: 'Focus', title: 'Focus timer' },
    { id: 'integrations', label: 'Integrations', title: 'Integrations' },
    { id: 'performance', label: 'Performance', title: 'Performance' },
    { id: 'about', label: 'About', title: 'About TickPuff' },
  ];

  let dialog: HTMLDivElement;
  const active = $derived(TABS.find((tab) => tab.id === $settingsPanel.tab) ?? TABS[0]);

  onMount(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.focus();
    return () => previous?.focus?.();
  });
</script>

<div class="backdrop" transition:fade={{ duration: 200 }} onclick={closeSettings} aria-hidden="true"></div>
<div
  class="panel"
  role="dialog"
  aria-modal="true"
  aria-labelledby="settings-title"
  tabindex="-1"
  bind:this={dialog}
  transition:scale={{ duration: 200, start: 0.97 }}
>
  <nav aria-label="Settings sections">
    <div class="brand">TickPuff</div>
    {#each TABS as tab (tab.id)}
      <button
        class:active={tab.id === active.id}
        aria-current={tab.id === active.id ? 'page' : undefined}
        onclick={() => settingsPanel.set({ open: true, tab: tab.id })}
      >
        {tab.label}
      </button>
    {/each}
  </nav>
  <div class="content">
    <header>
      <h2 id="settings-title">{active.title}</h2>
      <button class="close" onclick={closeSettings} aria-label="Close settings"><Icon name="x" size={20} /></button>
    </header>
    <div class="scroll">
      {#if active.id === 'world'}<WorldTab />
      {:else if active.id === 'companion'}<CompanionTab />
      {:else if active.id === 'clock'}<ClockTab />
      {:else if active.id === 'widgets'}<WidgetsTab />
      {:else if active.id === 'focus'}<FocusTab />
      {:else if active.id === 'integrations'}<IntegrationsTab />
      {:else if active.id === 'performance'}<PerformanceTab />
      {:else}<AboutTab />{/if}
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(6px);
    z-index: 40;
  }
  .panel {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    width: min(720px, calc(100vw - 2rem));
    height: min(500px, calc(100vh - 2rem));
    z-index: 50;
    display: flex;
    overflow: hidden;
    border-radius: 14px;
    background: var(--panel-bg);
    color: var(--panel-text);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    user-select: none;
  }
  .panel:focus {
    outline: none;
  }
  nav {
    width: 168px;
    flex: none;
    background: rgba(0, 0, 0, 0.3);
    border-right: 1px solid var(--panel-line);
    padding: 1.3rem 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow-y: auto;
  }
  .brand {
    padding: 0 1.3rem 1.2rem;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  nav button {
    text-align: left;
    padding: 0.6rem 1.3rem;
    font-size: 0.88rem;
    color: var(--panel-muted);
    border-left: 2px solid transparent;
  }
  nav button:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.05);
  }
  nav button.active {
    color: #fff;
    border-left-color: var(--accent-color);
    background: rgba(255, 255, 255, 0.08);
  }
  .content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    padding: 1.3rem 1.6rem 0;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  h2 {
    font-size: 1.15rem;
    font-weight: 500;
  }
  .close {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--panel-muted);
  }
  .close:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }
  .scroll {
    flex: 1;
    overflow-y: auto;
    padding: 0 0.6rem 1.4rem 0;
  }
  /* Shared form styles for the tabs. */
  .panel :global(.field) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.55rem 0;
    border-bottom: 1px solid var(--panel-line);
    font-size: 0.9rem;
  }
  .panel :global(.field-label) {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .panel :global(.hint) {
    font-size: 0.74rem;
    color: var(--panel-muted);
    line-height: 1.45;
  }
  .panel :global(.section-title) {
    margin: 1.2rem 0 0.4rem;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--panel-muted);
  }
  .panel :global(select),
  .panel :global(input[type='text']),
  .panel :global(input[type='search']),
  .panel :global(input[type='number']) {
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 6px;
    padding: 0.35rem 0.6rem;
    min-width: 120px;
    color-scheme: dark;
  }
  .panel :global(input[type='number']) {
    width: 76px;
    min-width: 0;
  }
  .panel :global(input[type='range']) {
    accent-color: var(--accent-color);
    width: 140px;
  }
  .panel :global(.button) {
    padding: 0.4rem 0.9rem;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.1);
    font-size: 0.82rem;
  }
  .panel :global(.button:hover) {
    background: rgba(255, 255, 255, 0.18);
  }
  .panel :global(.button.primary) {
    background: var(--accent-color);
    color: #fff;
  }
  @media (max-width: 560px) {
    nav {
      width: 120px;
    }
    .content {
      padding: 1rem 0.9rem 0;
    }
  }
</style>
