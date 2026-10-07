<script lang="ts">
  import type { TimeOfDay } from '$lib/types';

  let { time }: { time: TimeOfDay } = $props();
  const dark = $derived(time === 'night' || time === 'late-night');
  const candleLit = $derived(dark || time === 'sunset');
</script>

<div class="world-layer" style="--depth: 10">
  <div class="window-light" class:dark></div>
</div>

<div class="world-layer" style="--depth: 20">
  <svg class="shelves" viewBox="0 0 1000 400" preserveAspectRatio="none">
    <defs>
      <pattern id="library-shelf" width="1000" height="120" patternUnits="userSpaceOnUse">
        <rect x="0" y="0" width="1000" height="30" fill="#1a100d" />
      </pattern>
    </defs>
    <rect x="0" y="0" width="1000" height="400" fill="url(#library-shelf)" opacity="0.6" />
    <path d="M100,120 L120,120 L120,90 L100,90 Z" fill="rgba(0,0,0,0.5)" />
    <path d="M130,120 L150,120 L140,80 L120,80 Z" fill="rgba(0,0,0,0.4)" />
    <path d="M300,240 L330,240 L330,190 L300,190 Z" fill="rgba(0,0,0,0.6)" />
    <path d="M620,120 L650,120 L650,70 L620,70 Z" fill="rgba(0,0,0,0.5)" />
    <path d="M820,360 L845,360 L845,300 L820,300 Z" fill="rgba(0,0,0,0.45)" />
  </svg>
</div>

<div class="world-layer" style="--depth: 40">
  <div class="desk">
    <div class="desk-surface"></div>
    <div class="desk-items">
      <div class="book-stack">
        <div class="book b1"></div>
        <div class="book b2"></div>
        <div class="book b3"></div>
      </div>
      <div class="candle" class:lit={candleLit}></div>
    </div>
  </div>
</div>

<style>
  .window-light {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 40%, rgba(255, 224, 130, 0.15) 0%, transparent 70%);
    transition: opacity 2s;
  }
  .window-light.dark {
    opacity: 0.4;
  }
  .shelves {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .desk {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 150px;
  }
  .desk-surface {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 100px;
    background: #2a1a15;
    border-top: 10px solid #3e2723;
    box-shadow: inset 0 30px 30px rgba(0, 0, 0, 0.6);
  }
  .desk-items {
    position: absolute;
    bottom: 100px;
    left: 20%;
    width: 60%;
    height: 100px;
  }
  .book-stack {
    position: absolute;
    bottom: 0;
    left: 10%;
  }
  .book {
    height: 15px;
    border-radius: 2px;
    border: 1px solid rgba(0, 0, 0, 0.5);
    margin-bottom: 2px;
  }
  .b1 {
    width: 120px;
    background: #795548;
  }
  .b2 {
    width: 100px;
    background: #5d4037;
    transform: translateX(10px);
  }
  .b3 {
    width: 110px;
    background: #8d6e63;
    transform: translateX(5px) rotate(-2deg);
  }
  .candle {
    position: absolute;
    bottom: 0;
    right: 20%;
    width: 15px;
    height: 35px;
    background: #f5f5f5;
    border-radius: 2px;
    box-shadow: inset -3px 0 0 rgba(0, 0, 0, 0.1);
  }
  .candle.lit::after {
    content: '';
    position: absolute;
    top: -15px;
    left: 3px;
    width: 8px;
    height: 15px;
    background: #ffb300;
    border-radius: 50% 50% 20% 20%;
    box-shadow: 0 0 20px 8px rgba(255, 179, 0, 0.5);
    animation: flicker 0.15s infinite alternate;
  }
  @keyframes flicker {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0.8;
      transform: scale(0.9);
    }
  }
</style>
