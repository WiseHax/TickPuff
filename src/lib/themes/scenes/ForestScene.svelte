<script lang="ts">
  import type { TimeOfDay } from '$lib/types';

  let { time }: { time: TimeOfDay } = $props();
  const dark = $derived(time === 'night' || time === 'late-night');
</script>

<div class="world-layer" style="--depth: 10">
  {#if dark}
    <div class="moon"></div>
    <div class="stars"></div>
  {:else if time === 'morning'}
    <div class="morning-rays"></div>
  {/if}
  <svg class="mountain-distant" viewBox="0 0 1000 300" preserveAspectRatio="none">
    <path d="M0,300 L0,150 L150,80 L350,180 L550,50 L800,160 L1000,90 L1000,300 Z" fill="rgba(0,0,0,0.15)" />
  </svg>
  <div class="distant-fog"></div>
</div>

<div class="world-layer" style="--depth: 20">
  <svg class="mountain-mid" viewBox="0 0 1000 250" preserveAspectRatio="none">
    <path d="M0,250 L0,120 L250,40 L450,150 L750,30 L1000,110 L1000,250 Z" fill="rgba(0,0,0,0.3)" />
  </svg>
  <div class="tree mid-left">
    <svg viewBox="0 0 200 400"
      ><path d="M100,0 L20,300 L80,300 L0,400 L200,400 L120,300 L180,300 Z" fill="rgba(0,0,0,0.4)" /></svg
    >
  </div>
  <div class="tree mid-right">
    <svg viewBox="0 0 200 350"
      ><path d="M100,0 L20,250 L80,250 L0,350 L200,350 L120,250 L180,250 Z" fill="rgba(0,0,0,0.4)" /></svg
    >
  </div>
</div>

<div class="world-layer" style="--depth: 40">
  <svg class="ground" viewBox="0 0 1000 150" preserveAspectRatio="none">
    <path d="M0,150 L0,50 Q250,0 500,60 T1000,40 L1000,150 Z" fill="rgba(0,0,0,0.6)" />
  </svg>
  <div class="tree fg-left">
    <svg viewBox="0 0 150 600"><path d="M0,0 L120,0 L150,600 L0,600 Z" fill="rgba(0,0,0,0.8)" /></svg>
  </div>
  <div class="tree fg-right">
    <svg viewBox="0 0 250 500"
      ><path d="M125,0 L10,350 L80,350 L0,500 L250,500 L170,350 L240,350 Z" fill="rgba(0,0,0,0.8)" /></svg
    >
  </div>
  <div class="mushroom" style="bottom: 9%; left: 36%"></div>
  <div class="mushroom small" style="bottom: 8.5%; left: 38%"></div>
</div>

<style>
  .moon {
    position: absolute;
    top: 15%;
    right: 20%;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: #fff9c4;
    box-shadow:
      0 0 80px 30px rgba(255, 249, 196, 0.3),
      inset -10px -10px 20px rgba(0, 0, 0, 0.1);
  }
  .stars {
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(1px 1px at 20px 30px, white, transparent),
      radial-gradient(1px 1px at 40px 70px, rgba(255, 255, 255, 0.8), transparent),
      radial-gradient(2px 2px at 90px 40px, rgba(255, 255, 255, 0.9), transparent);
    background-size: 200px 200px;
    animation: twinkle 5s infinite alternate;
  }
  .morning-rays {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
      from 0deg at 50% 0%,
      transparent 0deg,
      rgba(255, 255, 255, 0.06) 15deg,
      transparent 30deg
    );
    animation: rotate 80s linear infinite;
  }
  .mountain-distant {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 350px;
  }
  .distant-fog {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 200px;
    background: linear-gradient(to top, rgba(255, 255, 255, 0.1), transparent);
  }
  .mountain-mid {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 280px;
  }
  .tree {
    position: absolute;
    bottom: 20px;
  }
  .tree svg {
    width: 100%;
    height: 100%;
  }
  .mid-left {
    left: 5%;
    width: 200px;
    height: 400px;
  }
  .mid-right {
    right: 10%;
    width: 200px;
    height: 350px;
    transform: scaleX(-1);
  }
  .ground {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 180px;
    filter: drop-shadow(0 -5px 10px rgba(0, 0, 0, 0.5));
  }
  .fg-left {
    left: -50px;
    bottom: 0;
    width: 150px;
    height: 600px;
  }
  .fg-right {
    right: -20px;
    bottom: 0;
    width: 250px;
    height: 500px;
  }
  .mushroom {
    position: absolute;
    width: 20px;
    height: 12px;
    background: #e74c3c;
    border-radius: 10px 10px 2px 2px;
    box-shadow: inset 4px 2px 0 -2px rgba(255, 255, 255, 0.5);
  }
  .mushroom::after {
    content: '';
    position: absolute;
    top: 11px;
    left: 6px;
    width: 8px;
    height: 10px;
    background: #ecf0f1;
    border-radius: 2px;
  }
  .mushroom.small {
    transform: scale(0.6);
  }
  @keyframes twinkle {
    from {
      opacity: 0.5;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes rotate {
    to {
      transform: rotate(360deg);
    }
  }
</style>
