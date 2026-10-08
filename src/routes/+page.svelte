<script lang="ts">
  import { onMount } from 'svelte';
  import World from '$lib/components/world/World.svelte';
  import CompanionLayer from '$lib/components/companion/CompanionLayer.svelte';
  import Clock from '$lib/components/clock/Clock.svelte';
  import Glance from '$lib/components/clock/Glance.svelte';
  import WidgetDock from '$lib/components/widgets/WidgetDock.svelte';
  import Controls from '$lib/components/ui/Controls.svelte';
  import SettingsPanel from '$lib/components/settings/SettingsPanel.svelte';
  import { ui } from '$lib/stores/settings';
  import { dockedWidgets } from '$lib/stores/widgets';
  import { focusActive } from '$lib/stores/focus';
  import { closeSettings, settingsPanel } from '$lib/stores/panel';
  import { initWindowModes, miniMode } from '$lib/stores/windowMode';
  import UpdateNotice from '$lib/components/ui/UpdateNotice.svelte';
  import { scheduleStartupCheck } from '$lib/integrations/updater';
  import { autoUpdateCheck } from '$lib/stores/settings';
  import { get } from 'svelte/store';
  import { isFullscreen, setFullscreen, toggleFullscreen } from '$lib/core/platform/window';

  /** Hide the controls after a few seconds without pointer or keyboard activity. */
  const IDLE_MS = 5000;
  let idle = $state(false);
  let fullscreen = $state(false);
  let idleTimer: ReturnType<typeof setTimeout> | undefined;

  function wake() {
    idle = false;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => (idle = true), IDLE_MS);
  }

  async function flipFullscreen() {
    try {
      fullscreen = await toggleFullscreen();
    } catch (error) {
      console.warn('[tickpuff] fullscreen toggle failed', error);
    }
  }

  /** True when a key press belongs to a text field (so shortcuts don't steal letters). */
  function typing(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement | null;
    return !!target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
  }

  /** A click on the world itself (not a widget or control) closes the drawers. */
  function onWorldPointerDown(event: PointerEvent) {
    if ($ui.widgetsVisible && event.target === event.currentTarget) ui.set('widgetsVisible', false);
  }

  async function onKeydown(event: KeyboardEvent) {
    wake();
    if ((event.key === 'w' || event.key === 'W') && !typing(event) && !$settingsPanel.open && !$miniMode) {
      ui.toggle('widgetsVisible');
    } else if (event.key === 'F11') {
      event.preventDefault();
      await flipFullscreen();
    } else if (event.key === 'Escape') {
      if ($settingsPanel.open) closeSettings();
      else if ($ui.widgetsVisible) ui.set('widgetsVisible', false);
      else if (fullscreen) {
        await setFullscreen(false);
        fullscreen = false;
      }
    }
  }

  onMount(() => {
    wake();
    void initWindowModes();
    if (!__STORE_BUILD__ && get(autoUpdateCheck)) scheduleStartupCheck();
    void isFullscreen().then((value) => (fullscreen = value));
    const onFullscreenChange = () => (fullscreen = document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      clearTimeout(idleTimer);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  });

  const showUI = $derived(!$ui.ambientMode);
  // Mini mode is just the clock and the companion.
  const showWidgets = $derived(showUI && $ui.widgetsVisible && !$miniMode);
</script>

<svelte:window onkeydown={onKeydown} onpointermove={wake} onpointerdown={wake} />

<main
  class="app"
  class:asleep={$ui.sleepMode}
  class:mini={$miniMode}
  data-tauri-drag-region
  onpointerdown={onWorldPointerDown}
>
  <h1 class="visually-hidden">TickPuff</h1>
  <World />
  <CompanionLayer />

  {#if showUI}
    <div class="hero">
      <Clock />
      <Glance />
    </div>
  {/if}

  {#if showWidgets}
    <WidgetDock dock="left" widgets={$dockedWidgets.left} dimmed={$focusActive || idle} />
    <WidgetDock dock="right" widgets={$dockedWidgets.right} dimmed={$focusActive || idle} />
  {/if}

  <Controls hidden={idle && !$settingsPanel.open} {fullscreen} onToggleFullscreen={flipFullscreen} />

  {#if $settingsPanel.open}
    <SettingsPanel />
  {/if}

  {#if !$miniMode && !__STORE_BUILD__}
    <UpdateNotice />
  {/if}
</main>

<style>
  .app {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }
  .hero {
    position: absolute;
    top: 40%;
    left: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translate(-50%, -50%);
    z-index: 10;
    pointer-events: none;
    transition: opacity 1s ease;
  }
  .app.mini .hero {
    top: 30%;
    transform: translate(-50%, -50%) scale(0.42);
  }
  .app.asleep .hero {
    opacity: 0.55;
  }
</style>
