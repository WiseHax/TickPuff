<script lang="ts">
  import type { TimeOfDay } from '$lib/types';

  let { time }: { time: TimeOfDay } = $props();
  const dark = $derived(time === 'night' || time === 'late-night');
</script>

<div class="world-layer" style="--depth: 10">
  <div class="godrays" class:dim={dark}></div>
  <div class="haze"></div>
</div>

<div class="world-layer" style="--depth: 20">
  <svg class="coral" viewBox="0 0 1000 300" preserveAspectRatio="none">
    <path d="M0,300 C150,200 250,50 400,150 C550,250 700,80 1000,180 L1000,300 Z" fill="rgba(0,0,0,0.4)" />
  </svg>
  <div class="kelp-forest">
    <svg viewBox="0 0 100 400" class="kelp k1"
      ><path
        d="M50,400 Q10,300 50,200 T50,0"
        fill="none"
        stroke="rgba(0,0,0,0.3)"
        stroke-width="15"
        stroke-linecap="round"
      /></svg
    >
    <svg viewBox="0 0 100 400" class="kelp k2"
      ><path
        d="M50,400 Q90,250 50,150 T50,20"
        fill="none"
        stroke="rgba(0,0,0,0.3)"
        stroke-width="12"
        stroke-linecap="round"
      /></svg
    >
  </div>
</div>

<div class="world-layer" style="--depth: 40">
  <svg class="ground" viewBox="0 0 1000 150" preserveAspectRatio="none">
    <path d="M0,150 L0,40 Q250,80 550,30 T1000,70 L1000,150 Z" fill="rgba(0,0,0,0.8)" />
  </svg>
  <svg viewBox="0 0 200 150" class="rock r1"
    ><path d="M0,150 L20,50 Q100,0 180,60 L200,150 Z" fill="rgba(0,0,0,0.9)" /></svg
  >
  <svg viewBox="0 0 300 200" class="rock r2"
    ><path d="M0,200 L40,80 Q150,10 260,90 L300,200 Z" fill="rgba(0,0,0,0.9)" /></svg
  >
  <svg class="seaweed" viewBox="0 0 50 200"
    ><path
      d="M25,200 Q0,150 25,100 T25,0"
      fill="none"
      stroke="#2e7d32"
      stroke-width="12"
      stroke-linecap="round"
      opacity="0.6"
    /></svg
  >
</div>

<style>
  .godrays {
    position: absolute;
    top: -20%;
    left: -20%;
    width: 140%;
    height: 140%;
    background: repeating-linear-gradient(
      15deg,
      transparent,
      transparent 150px,
      rgba(255, 255, 255, 0.04) 150px,
      rgba(255, 255, 255, 0.04) 180px
    );
    animation: sway 20s ease-in-out infinite alternate;
    transition: opacity 2s;
  }
  .godrays.dim {
    opacity: 0.35;
  }
  .haze {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 60%;
    background: linear-gradient(to top, rgba(0, 20, 40, 0.35), transparent);
  }
  .coral {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 300px;
  }
  .kelp-forest {
    position: absolute;
    bottom: 0;
    left: 20%;
    width: 100px;
    height: 400px;
    opacity: 0.5;
  }
  .kelp {
    position: absolute;
    bottom: 0;
    height: 100%;
    animation: sway-kelp 4s ease-in-out infinite alternate;
    transform-origin: bottom center;
  }
  .k2 {
    left: 40px;
    animation-delay: -2s;
  }
  .ground {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 180px;
  }
  .rock {
    position: absolute;
    bottom: -20px;
    filter: drop-shadow(0 -5px 15px rgba(0, 0, 0, 0.6));
  }
  .r1 {
    left: 5%;
    width: 200px;
    height: 150px;
  }
  .r2 {
    right: 10%;
    width: 300px;
    height: 200px;
  }
  .seaweed {
    position: absolute;
    bottom: 0;
    left: 30%;
    width: 50px;
    height: 200px;
    animation: sway-kelp 3s infinite alternate;
    transform-origin: bottom;
  }
  @keyframes sway {
    from {
      transform: translateX(-2%) rotate(0deg);
    }
    to {
      transform: translateX(2%) rotate(1deg);
    }
  }
  @keyframes sway-kelp {
    from {
      transform: skewX(-5deg);
    }
    to {
      transform: skewX(5deg);
    }
  }
</style>
