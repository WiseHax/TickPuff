<script lang="ts">
  import type { TimeOfDay } from '$lib/types';

  let { time }: { time: TimeOfDay } = $props();
  const dark = $derived(time === 'night' || time === 'late-night');
  const lanternLit = $derived(dark || time === 'sunset');
</script>

<div class="world-layer" style="--depth: 10">
  {#if time === 'sunset'}
    <div class="sunset-glow"></div>
    <div class="sun"></div>
  {:else if dark}
    <div class="stars"></div>
    <div class="moon"></div>
  {/if}
  <svg class="mountain-distant" viewBox="0 0 1000 300" preserveAspectRatio="none">
    <path d="M0,300 L0,200 L300,120 L600,180 L900,100 L1000,140 L1000,300 Z" fill="rgba(0,0,0,0.1)" />
  </svg>
  <div class="distant-fog"></div>
</div>

<div class="world-layer" style="--depth: 20">
  <svg class="mountain-mid" viewBox="0 0 1000 250" preserveAspectRatio="none">
    <path d="M0,250 L0,150 L350,60 L600,160 L1000,80 L1000,250 Z" fill="rgba(0,0,0,0.2)" />
  </svg>
  <div class="torii">
    <svg viewBox="0 0 200 200">
      <rect x="20" y="40" width="160" height="15" fill="rgba(0,0,0,0.5)" rx="4" />
      <rect x="10" y="20" width="180" height="15" fill="rgba(0,0,0,0.6)" rx="2" />
      <path d="M10,20 Q100,-10 190,20 L190,30 Q100,0 10,30 Z" fill="rgba(0,0,0,0.7)" />
      <rect x="40" y="40" width="15" height="160" fill="rgba(0,0,0,0.5)" />
      <rect x="145" y="40" width="15" height="160" fill="rgba(0,0,0,0.5)" />
    </svg>
  </div>
  <div class="lantern" class:lit={lanternLit}></div>
</div>

<div class="world-layer" style="--depth: 40">
  <svg class="ground" viewBox="0 0 1000 150" preserveAspectRatio="none">
    <path d="M0,150 L0,70 Q300,30 600,80 T1000,50 L1000,150 Z" fill="rgba(0,0,0,0.5)" />
  </svg>
  <svg class="branch" viewBox="0 0 500 400">
    <path
      d="M500,0 Q400,100 200,150 Q100,170 0,160"
      fill="none"
      stroke="rgba(0,0,0,0.7)"
      stroke-width="25"
      stroke-linecap="round"
    />
    <path d="M300,120 Q250,250 150,300" fill="none" stroke="rgba(0,0,0,0.7)" stroke-width="15" stroke-linecap="round" />
    <path d="M400,60 Q350,200 250,250" fill="none" stroke="rgba(0,0,0,0.7)" stroke-width="12" stroke-linecap="round" />
    <circle cx="200" cy="150" r="40" fill="#f48fb1" opacity="0.9" />
    <circle cx="230" cy="130" r="30" fill="#ffb2c8" opacity="0.9" />
    <circle cx="150" cy="300" r="35" fill="#f48fb1" opacity="0.9" />
    <circle cx="250" cy="250" r="30" fill="#ffb2c8" opacity="0.9" />
    <circle cx="50" cy="160" r="25" fill="#f48fb1" opacity="0.9" />
    <circle cx="200" cy="160" r="30" fill="#d81b60" opacity="0.5" />
    <circle cx="150" cy="310" r="25" fill="#d81b60" opacity="0.5" />
  </svg>
</div>

<style>
  .sun {
    position: absolute;
    top: 30%;
    left: 20%;
    width: 150px;
    height: 150px;
    border-radius: 50%;
    background: linear-gradient(to bottom, #ffcdd2, #ff8a80);
    box-shadow: 0 0 100px 40px rgba(255, 138, 128, 0.4);
  }
  .sunset-glow {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 70%;
    background: radial-gradient(circle at 30% 100%, rgba(255, 64, 129, 0.25) 0%, transparent 60%);
  }
  .moon {
    position: absolute;
    top: 15%;
    right: 20%;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: #ffebee;
    box-shadow: 0 0 80px 30px rgba(255, 235, 238, 0.3);
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
  .torii {
    position: absolute;
    bottom: 50px;
    left: 50%;
    transform: translateX(-50%);
    width: 250px;
    height: 250px;
    opacity: 0.7;
  }
  .lantern {
    position: absolute;
    left: 20%;
    bottom: 120px;
    width: 30px;
    height: 45px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 4px;
    transition: 0.5s;
  }
  .lantern.lit {
    background: #ffb2c8;
    box-shadow: 0 0 25px 5px rgba(255, 64, 129, 0.8);
    animation: float 5s infinite alternate;
  }
  .ground {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 180px;
    filter: drop-shadow(0 -5px 10px rgba(0, 0, 0, 0.5));
  }
  .branch {
    position: absolute;
    right: -50px;
    top: -50px;
    width: 600px;
    height: 500px;
    filter: drop-shadow(0 10px 10px rgba(0, 0, 0, 0.5));
  }
  @keyframes twinkle {
    from {
      opacity: 0.5;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes float {
    to {
      transform: translateY(-15px);
    }
  }
</style>
