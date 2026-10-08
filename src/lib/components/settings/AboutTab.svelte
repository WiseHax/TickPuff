<script lang="ts">
  import Icon from '$lib/components/ui/Icon.svelte';
  import Switch from '$lib/components/ui/Switch.svelte';
  import { isTauri, openExternal } from '$lib/core/platform/tauri';
  import { autoUpdateCheck } from '$lib/stores/settings';
  import { checkForUpdates, installUpdate, updateState } from '$lib/integrations/updater';

  const STATUS: Record<string, string> = {
    idle: '',
    checking: 'Checking…',
    none: "You're on the latest version.",
    available: 'is available.',
    installing: 'Installing…',
    error: '',
  };

  const REPOSITORY = 'https://github.com/WiseHax/TickPuff';
</script>

<p class="lead">A lightweight ambient desktop clock with a living companion.</p>
<div class="field"><span>Version</span><span>{__APP_VERSION__}</span></div>
{#if __STORE_BUILD__}
  <div class="field"><span>Updates</span><span class="hint">Delivered by the Microsoft Store</span></div>
{:else if isTauri()}
  <div class="field">
    <span>Updates</span>
    <span class="update">
      {#if $updateState.status === 'available'}
        <span class="hint">{$updateState.version} {STATUS.available}</span>
        <button class="button" onclick={() => installUpdate()}>Update now</button>
      {:else}
        <span class="hint">{$updateState.status === 'error' ? $updateState.message : STATUS[$updateState.status]}</span>
        <button
          class="button"
          disabled={$updateState.status === 'checking' || $updateState.status === 'installing'}
          onclick={() => checkForUpdates()}>Check for updates</button
        >
      {/if}
    </span>
  </div>
  <Switch
    label="Check for updates when TickPuff starts"
    checked={$autoUpdateCheck}
    onchange={(value) => autoUpdateCheck.set(value)}
  />
{/if}
<div class="field"><span>License</span><span>MIT</span></div>
<div class="field">
  <span>Source code</span>
  <button class="button link" onclick={() => openExternal(REPOSITORY)}>GitHub <Icon name="external" size={13} /></button
  >
</div>

<h3 class="section-title">Privacy</h3>
<p class="hint">
  Settings, tasks and notes are stored only on this computer. TickPuff only goes online to check GitHub for a new
  version (you can turn that off above), to fetch weather if you set a location (Open-Meteo), or when you open a link.
</p>

<h3 class="section-title">Keyboard</h3>
<ul class="hint keys">
  <li><kbd>W</kbd> open / close the widget drawers</li>
  <li><kbd>F11</kbd> full screen</li>
  <li><kbd>Esc</kbd> close settings / leave full screen</li>
  <li><kbd>Tab</kbd> then <kbd>Enter</kbd> on the companion to pet it</li>
</ul>

<h3 class="section-title">Credits</h3>
<p class="hint">
  Fonts: Inter, Outfit, Pixelify Sans, Space Mono and VT323 (SIL Open Font License). Icons: Feather (MIT). 3D: three.js
  (MIT). See THIRD_PARTY_NOTICES.md in the repository.
</p>

<style>
  .update {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .lead {
    margin-bottom: 0.8rem;
    font-size: 0.95rem;
  }
  .link {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
  .keys {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  kbd {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    padding: 1px 6px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.25);
  }
</style>
