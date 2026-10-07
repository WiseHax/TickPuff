<script lang="ts">
  import Icon from '$lib/components/ui/Icon.svelte';
  import { openExternal } from '$lib/core/platform/tauri';

  const REPOSITORY = 'https://github.com/WiseHax/TickPuff';
</script>

<p class="lead">A lightweight ambient desktop clock with a living companion.</p>
<div class="field"><span>Version</span><span>{__APP_VERSION__}</span></div>
<div class="field"><span>License</span><span>MIT</span></div>
<div class="field">
  <span>Source code</span>
  <button class="button link" onclick={() => openExternal(REPOSITORY)}>GitHub <Icon name="external" size={13} /></button
  >
</div>

<h3 class="section-title">Privacy</h3>
<p class="hint">
  Settings, tasks and notes are stored only on this computer. TickPuff makes no network requests unless you set a
  weather location (Open-Meteo) or open a link.
</p>

<h3 class="section-title">Keyboard</h3>
<ul class="hint keys">
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
