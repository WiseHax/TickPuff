<script lang="ts">
  import type { TimeOfDay } from '$lib/types';

  let { time }: { time: TimeOfDay } = $props();
  const dark = $derived(time === 'night' || time === 'late-night');
</script>

<div class="world-layer" style="--depth: 10">
  {#if dark}
    <div class="cyber-moon"></div>
  {:else}
    <div class="smog"></div>
  {/if}
  <svg class="skyline far" viewBox="0 0 1000 400" preserveAspectRatio="none">
    <rect x="50" y="150" width="80" height="250" fill="#000" />
    <rect x="180" y="80" width="120" height="320" fill="#000" />
    <rect x="350" y="200" width="90" height="200" fill="#000" />
    <rect x="500" y="100" width="150" height="300" fill="#000" />
    <rect x="750" y="180" width="100" height="220" fill="#000" />
    <rect x="900" y="120" width="80" height="280" fill="#000" />
  </svg>
</div>

<div class="world-layer" style="--depth: 20">
  <svg class="skyline mid" viewBox="0 0 1000 400" preserveAspectRatio="none">
    <rect x="100" y="100" width="150" height="300" fill="#0a0a0a" stroke="#222" stroke-width="2" />
    <rect x="120" y="120" width="20" height="20" fill="#0ff" opacity="0.4" />
    <rect x="150" y="120" width="20" height="20" fill="#f0f" opacity="0.4" />
    <rect x="120" y="150" width="20" height="20" fill="#0ff" opacity="0.4" />
    <rect x="150" y="150" width="20" height="20" fill="#f0f" opacity="0.4" />
    <rect x="350" y="50" width="200" height="350" fill="#0a0a0a" stroke="#222" stroke-width="2" />
    <line x1="380" y1="50" x2="380" y2="400" stroke="#0ff" stroke-width="2" opacity="0.3" />
    <line x1="450" y1="50" x2="450" y2="400" stroke="#0ff" stroke-width="2" opacity="0.3" />
    <line x1="520" y1="50" x2="520" y2="400" stroke="#0ff" stroke-width="2" opacity="0.3" />
    <rect x="700" y="150" width="180" height="250" fill="#0a0a0a" stroke="#222" stroke-width="2" />
    <polygon points="700,150 790,80 880,150" fill="#111" stroke="#222" />
    <circle cx="790" cy="180" r="30" fill="none" stroke="#f0f" stroke-width="4" opacity="0.5" />
  </svg>
</div>

<div class="world-layer" style="--depth: 40">
  <div class="rooftop"></div>
  <svg class="fence" viewBox="0 0 1000 100" preserveAspectRatio="none">
    <defs>
      <pattern id="cyber-mesh" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M0,20 L20,0 M0,0 L20,20" fill="none" stroke="rgba(0,0,0,0.6)" stroke-width="2" />
      </pattern>
    </defs>
    <rect x="0" y="20" width="1000" height="80" fill="url(#cyber-mesh)" />
    <rect x="0" y="10" width="1000" height="15" fill="#111" stroke="#222" stroke-width="2" />
    <rect x="100" y="25" width="15" height="75" fill="#0a0a0a" />
    <rect x="500" y="25" width="15" height="75" fill="#0a0a0a" />
    <rect x="900" y="25" width="15" height="75" fill="#0a0a0a" />
  </svg>
  <div class="neon-sign" class:flicker={dark}>
    <span class="neon-text" lang="ja">ラーメン</span>
  </div>
</div>

<style>
  .cyber-moon {
    position: absolute;
    top: 10%;
    right: 15%;
    width: 140px;
    height: 140px;
    border-radius: 50%;
    box-shadow:
      inset -25px 0 0 0 #0ff,
      0 0 60px rgba(0, 255, 255, 0.2);
  }
  .smog {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(255, 140, 60, 0.12), transparent 60%);
  }
  .skyline {
    position: absolute;
    bottom: 0;
    width: 100%;
  }
  .skyline.far {
    height: 300px;
    opacity: 0.2;
  }
  .skyline.mid {
    height: 350px;
    opacity: 0.6;
  }
  .rooftop {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 120px;
    background: linear-gradient(to top, #000, #0a0a0a);
    border-top: 3px solid #222;
    box-shadow: 0 -10px 20px rgba(0, 0, 0, 0.5);
  }
  .fence {
    position: absolute;
    bottom: 120px;
    width: 100%;
    height: 100px;
  }
  .neon-sign {
    position: absolute;
    bottom: 180px;
    right: 15%;
    padding: 10px 20px;
    background: rgba(0, 0, 0, 0.8);
    border: 2px solid #f0f;
    border-radius: 4px;
    box-shadow: inset 0 0 10px rgba(255, 0, 255, 0.2);
  }
  .neon-text {
    color: #f0f;
    font-size: 1.5rem;
    font-weight: 900;
    letter-spacing: 5px;
    text-shadow:
      0 0 10px #f0f,
      0 0 20px #f0f;
  }
  .neon-sign.flicker {
    animation: neon-flicker 4s infinite;
  }
  @keyframes neon-flicker {
    0%,
    19%,
    21%,
    23%,
    25%,
    54%,
    56%,
    100% {
      opacity: 1;
    }
    20%,
    24%,
    55% {
      opacity: 0.3;
    }
  }
</style>
