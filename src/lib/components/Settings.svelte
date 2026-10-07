<script lang="ts">
  import { engineStore, activeTheme } from '$lib/stores/theme';
  import { themeRegistry } from '$lib/engine/themeRegistry';
  import { clockSettings, type ClockFont } from '$lib/stores/clockSettings';
  import { featuresStore } from '$lib/stores/features';
  import { performanceStore, type PerformanceLevel } from '$lib/stores/performance';
  import { fade, slide } from 'svelte/transition';
  
  export let onClose: () => void;

  const availableFonts: ClockFont[] = ['Pixelify Sans', 'VT323', 'Space Mono', 'Outfit', 'Inter', 'System'];

  let activeTab: 'theme' | 'world' | 'clock' | 'features' = 'theme';

  function updateClockSetting(key: keyof typeof $clockSettings, value: any) {
    clockSettings.updateSettings({ [key]: value });
  }
</script>

<div class="settings-overlay glass" transition:fade={{ duration: 200 }}>
  <div class="settings-sidebar">
    <div class="sidebar-header">TickPuff</div>
    <nav>
      <button class:active={activeTab === 'theme'} on:click={() => activeTab = 'theme'}>World</button>
      <button class:active={activeTab === 'world'} on:click={() => activeTab = 'world'}>Atmosphere</button>
      <button class:active={activeTab === 'clock'} on:click={() => activeTab = 'clock'}>Clock</button>
      <button class:active={activeTab === 'features'} on:click={() => activeTab = 'features'}>Features</button>
    </nav>
  </div>

  <div class="settings-content">
    <div class="content-header">
      <h2>
        {#if activeTab === 'theme'} Choose World
        {:else if activeTab === 'world'} Atmosphere & Companion
        {:else if activeTab === 'clock'} Clock Configuration 
        {:else} Global Widgets {/if}
      </h2>
      <button class="close-btn" on:click={onClose}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <div class="scroll-area">
      {#if activeTab === 'theme'}
        <div class="setting-group" transition:slide={{ duration: 200 }}>
          <div class="theme-grid">
            {#each Object.values(themeRegistry) as theme}
              <button 
                class="theme-card" 
                class:active={$engineStore.themeId === theme.id}
                on:click={() => engineStore.setTheme(theme.id)}
                style="background: linear-gradient(to bottom right, {theme.colors.day.bgTop}, {theme.colors.day.bgBottom})"
              >
                <div class="theme-info">
                  <span class="theme-name">{theme.name}</span>
                  <span class="theme-desc">{theme.description}</span>
                </div>
                {#if $engineStore.themeId === theme.id}
                  <div class="active-indicator"></div>
                {/if}
              </button>
            {/each}
          </div>
        </div>
      {:else if activeTab === 'world'}
        <div class="setting-group" transition:slide={{ duration: 200 }}>
          <div class="control-row">
            <label>Companion</label>
            <select value={$engineStore.petId} on:change={(e) => engineStore.setPet(e.currentTarget.value)}>
              {#each $activeTheme.availablePets as pet}
                <option value={pet}>{pet}</option>
              {/each}
            </select>
          </div>
          
          <div class="control-row">
            <label>Weather / Effects</label>
            <select value={$engineStore.weather} on:change={(e) => engineStore.setWeather(e.currentTarget.value)}>
              {#each $activeTheme.allowedWeather as w}
                <option value={w}>{w}</option>
              {/each}
            </select>
          </div>

          <div class="control-row">
            <label>Performance</label>
            <select value={$performanceStore} on:change={(e) => performanceStore.setLevel(e.currentTarget.value as PerformanceLevel)}>
              <option value="ECO">ECO (2D Only)</option>
              <option value="BALANCED">BALANCED (3D Fast)</option>
              <option value="BEAUTIFUL">BEAUTIFUL (3D Ultra)</option>
            </select>
          </div>
        </div>
      {:else if activeTab === 'clock'}
        <div class="setting-group" transition:slide={{ duration: 200 }}>
          
          <div class="control-row">
            <label>Clock Font</label>
            <select value={$clockSettings.font} on:change={(e) => updateClockSetting('font', e.currentTarget.value)}>
              {#each availableFonts as font}
                <option value={font}>{font}</option>
              {/each}
            </select>
          </div>

          <div class="control-row">
            <label>Size</label>
            <div class="slider-container">
              <input type="range" min="4" max="16" step="0.5" value={$clockSettings.size} on:input={(e) => updateClockSetting('size', parseFloat(e.currentTarget.value))} />
              <span>{$clockSettings.size}rem</span>
            </div>
          </div>

          <div class="control-row">
            <label>Font Weight</label>
            <select value={$clockSettings.weight} on:change={(e) => updateClockSetting('weight', parseInt(e.currentTarget.value))}>
              <option value="300">Light</option>
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semi-Bold</option>
              <option value="700">Bold</option>
            </select>
          </div>

          <div class="control-row">
            <label>Letter Spacing</label>
            <div class="slider-container">
              <input type="range" min="-10" max="20" step="1" value={$clockSettings.letterSpacing} on:input={(e) => updateClockSetting('letterSpacing', parseInt(e.currentTarget.value))} />
              <span>{$clockSettings.letterSpacing}px</span>
            </div>
          </div>

          <div class="control-row switch-row">
            <label>Show Seconds</label>
            <label class="switch">
              <input type="checkbox" checked={$clockSettings.showSeconds} on:change={(e) => updateClockSetting('showSeconds', e.currentTarget.checked)} />
              <span class="slider round"></span>
            </label>
          </div>

          <div class="control-row switch-row">
            <label>24-Hour Format</label>
            <label class="switch">
              <input type="checkbox" checked={$clockSettings.use24Hour} on:change={(e) => updateClockSetting('use24Hour', e.currentTarget.checked)} />
              <span class="slider round"></span>
            </label>
          </div>

        </div>
      {:else if activeTab === 'features'}
        <div class="setting-group" transition:slide={{ duration: 200 }}>
          <div class="control-row switch-row">
            <label>Clock</label>
            <label class="switch">
              <input type="checkbox" checked={$featuresStore.clock} on:change={() => featuresStore.toggle('clock')} />
              <span class="slider round"></span>
            </label>
          </div>

          <div class="control-row switch-row">
            <label>Focus (Pomodoro)</label>
            <label class="switch">
              <input type="checkbox" checked={$featuresStore.focus} on:change={() => featuresStore.toggle('focus')} />
              <span class="slider round"></span>
            </label>
          </div>

          <div class="control-row switch-row">
            <label>Tasks</label>
            <label class="switch">
              <input type="checkbox" checked={$featuresStore.tasks} on:change={() => featuresStore.toggle('tasks')} />
              <span class="slider round"></span>
            </label>
          </div>

          <div class="control-row switch-row">
            <label>Quick Notes</label>
            <label class="switch">
              <input type="checkbox" checked={$featuresStore.notes} on:change={() => featuresStore.toggle('notes')} />
              <span class="slider round"></span>
            </label>
          </div>

          <div class="control-row switch-row">
            <label>AI Usage</label>
            <label class="switch">
              <input type="checkbox" checked={$featuresStore.aiUsage} on:change={() => featuresStore.toggle('aiUsage')} />
              <span class="slider round"></span>
            </label>
          </div>

          <div class="control-row switch-row">
            <label>System Monitor</label>
            <label class="switch">
              <input type="checkbox" checked={$featuresStore.systemMonitor} on:change={() => featuresStore.toggle('systemMonitor')} />
              <span class="slider round"></span>
            </label>
          </div>
          <!-- AI Usage widget is removed below because it's replaced by these toggles, wait, no let's just append them. -->
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-name">Calendar Widget</span>
              <span class="setting-desc">Mini month view calendar</span>
            </div>
            <label class="switch">
              <input type="checkbox" checked={$featuresStore.calendar} on:change={() => featuresStore.toggle('calendar')} />
              <span class="slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-name">Now Playing</span>
              <span class="setting-desc">Music/Media visualizer</span>
            </div>
            <label class="switch">
              <input type="checkbox" checked={$featuresStore.nowPlaying} on:change={() => featuresStore.toggle('nowPlaying')} />
              <span class="slider"></span>
            </label>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .settings-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 650px;
    height: 450px;
    max-width: 90vw;
    z-index: 50;
    display: flex;
    overflow: hidden;
    background: rgba(15, 15, 15, 0.7);
    border-color: rgba(255, 255, 255, 0.08);
  }

  .settings-sidebar {
    width: 180px;
    background: rgba(0, 0, 0, 0.3);
    border-right: 1px solid rgba(255, 255, 255, 0.05);
    padding: 1.5rem 0;
    display: flex;
    flex-direction: column;
  }

  .sidebar-header {
    padding: 0 1.5rem;
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 2rem;
    color: rgba(255,255,255,0.9);
  }

  nav {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  nav button {
    text-align: left;
    padding: 0.8rem 1.5rem;
    font-size: 0.9rem;
    color: var(--text-muted);
    transition: all 0.2s;
    border-left: 2px solid transparent;
  }

  nav button:hover {
    color: white;
    background: rgba(255, 255, 255, 0.05);
  }

  nav button.active {
    color: white;
    border-left-color: var(--text-color);
    background: rgba(255, 255, 255, 0.1);
  }

  .settings-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 1.5rem 2rem;
  }

  .content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  h2 {
    font-size: 1.2rem;
    font-weight: 500;
  }

  .close-btn {
    color: var(--text-muted);
    transition: color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }

  .close-btn:hover {
    color: white;
    background: rgba(255,255,255,0.1);
  }

  .scroll-area {
    flex: 1;
    overflow-y: auto;
    padding-right: 1rem;
  }

  .setting-group {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
  }

  .setting-group > label {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-muted);
  }

  /* Themes */
  .theme-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .theme-card {
    height: 90px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    position: relative;
    display: flex;
    align-items: flex-end;
    padding: 0.8rem;
    overflow: hidden;
    transition: transform 0.2s, border-color 0.2s;
  }

  .theme-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.2));
  }

  .theme-card:hover {
    transform: translateY(-2px);
    border-color: rgba(255,255,255,0.3);
  }

  .theme-card.active {
    border-color: var(--text-color);
  }

  .theme-info {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .theme-name {
    font-size: 0.95rem;
    font-weight: 500;
    color: white;
  }

  .theme-desc {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.6);
    margin-top: 2px;
    text-align: left;
  }

  .active-indicator {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: white;
    z-index: 2;
    box-shadow: 0 0 10px white;
  }

  /* Controls */
  .control-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }

  .control-row > label {
    font-size: 0.9rem;
  }

  select {
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.1);
    color: white;
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    font-family: inherit;
    outline: none;
    min-width: 120px;
  }

  .slider-container {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .slider-container span {
    font-size: 0.85rem;
    color: var(--text-muted);
    width: 3rem;
    text-align: right;
  }

  input[type="range"] {
    -webkit-appearance: none;
    background: rgba(255,255,255,0.1);
    height: 4px;
    border-radius: 2px;
    outline: none;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
  }

  /* Switch */
  .switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 22px;
  }

  .switch input { 
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider.round {
    position: absolute;
    cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(255,255,255,0.1);
    transition: .4s;
    border-radius: 34px;
  }

  .slider.round:before {
    position: absolute;
    content: "";
    height: 14px;
    width: 14px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }

  input:checked + .slider.round {
    background-color: var(--text-color);
  }
  
  input:checked + .slider.round:before {
    transform: translateX(18px);
    background-color: var(--bg-bottom);
  }
</style>
