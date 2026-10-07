<!--
  Cheap CSS atmosphere: fog always (it's a soft gradient, not particles), and
  rain / snow / fireflies when GPU particles are off. A handful of elements
  at most — never one element per particle.
-->
<script lang="ts">
  import type { AmbientEffect, WeatherType } from '$lib/types';

  let { weather, ambient, fogOnly }: { weather: WeatherType; ambient: AmbientEffect[]; fogOnly: boolean } = $props();

  const fireflies = [
    { top: 62, left: 38, delay: 0, duration: 5.2 },
    { top: 70, left: 55, delay: 1.3, duration: 6.1 },
    { top: 58, left: 71, delay: 2.1, duration: 4.6 },
    { top: 75, left: 46, delay: 0.7, duration: 5.8 },
    { top: 66, left: 83, delay: 2.9, duration: 6.4 },
    { top: 54, left: 62, delay: 3.4, duration: 5 },
  ];
</script>

{#if weather === 'fog'}
  <div class="fog back"></div>
  <div class="fog front"></div>
{/if}

{#if !fogOnly}
  {#if weather === 'rain' || weather === 'heavy-rain'}
    <div class="rain back"></div>
    <div class="rain front" class:heavy={weather === 'heavy-rain'}></div>
  {:else if weather === 'snow'}
    <div class="snow back"></div>
    <div class="snow front"></div>
  {/if}
  {#if ambient.includes('fireflies')}
    {#each fireflies as f, i (i)}
      <div
        class="firefly"
        style="top: {f.top}%; left: {f.left}%; animation-delay: {f.delay}s; animation-duration: {f.duration}s"
      ></div>
    {/each}
  {/if}
{/if}

<style>
  .fog,
  .rain,
  .snow {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .fog.back {
    top: auto;
    height: 60%;
    background: linear-gradient(to top, rgba(255, 255, 255, 0.1), transparent);
    animation: drift 30s infinite alternate linear;
  }
  .fog.front {
    top: auto;
    height: 40%;
    background: linear-gradient(to top, rgba(255, 255, 255, 0.16), transparent);
    animation: drift 15s infinite alternate-reverse linear;
  }
  .rain.back {
    background: repeating-linear-gradient(
      105deg,
      transparent,
      transparent 150px,
      rgba(255, 255, 255, 0.03) 150px,
      rgba(255, 255, 255, 0.03) 151px
    );
    animation: rain-fall 0.6s linear infinite;
  }
  .rain.front {
    background: repeating-linear-gradient(
      102deg,
      transparent,
      transparent 80px,
      rgba(255, 255, 255, 0.08) 80px,
      rgba(255, 255, 255, 0.08) 82px
    );
    animation: rain-fall 0.3s linear infinite;
  }
  .rain.front.heavy {
    background: repeating-linear-gradient(
      102deg,
      transparent,
      transparent 30px,
      rgba(255, 255, 255, 0.1) 30px,
      rgba(255, 255, 255, 0.1) 33px
    );
    animation-duration: 0.2s;
  }
  .snow.back {
    background-image: radial-gradient(circle, rgba(255, 255, 255, 0.3) 1px, transparent 1px);
    background-size: 80px 80px;
    animation: snow-fall 15s linear infinite;
  }
  .snow.front {
    background-image:
      radial-gradient(circle, rgba(255, 255, 255, 0.8) 2px, transparent 2px),
      radial-gradient(circle, rgba(255, 255, 255, 0.6) 1.5px, transparent 1.5px);
    background-size:
      150px 150px,
      90px 90px;
    background-position:
      0 0,
      45px 45px;
    animation: snow-fall 8s linear infinite;
  }
  .firefly {
    position: absolute;
    width: 6px;
    height: 6px;
    background: #cddc39;
    border-radius: 50%;
    box-shadow: 0 0 15px 5px rgba(205, 220, 57, 0.9);
    animation: float-drift ease-in-out infinite alternate;
  }
  @keyframes drift {
    from {
      transform: translateX(-5%);
    }
    to {
      transform: translateX(5%);
    }
  }
  @keyframes rain-fall {
    from {
      background-position: 0 0;
    }
    to {
      background-position: -150px 100vh;
    }
  }
  @keyframes snow-fall {
    from {
      background-position:
        0 0,
        45px 45px;
    }
    to {
      background-position:
        80px 100vh,
        120px 100vh;
    }
  }
  @keyframes float-drift {
    0% {
      transform: translate(0, 0);
      opacity: 0.2;
    }
    50% {
      opacity: 1;
    }
    100% {
      transform: translate(30px, -30px);
      opacity: 0.2;
    }
  }
</style>
