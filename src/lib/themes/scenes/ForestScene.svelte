<script lang="ts">
  import type { TimeOfDay } from '$lib/types';
  import Sky from './parts/Sky.svelte';
  import { BOTTOM, GROUND_Y, H, TOP, W, grass, mix, mountains, pineRow, ridge, specks } from './art';

  let { time }: { time: TimeOfDay } = $props();
  const dark = $derived(time === 'night' || time === 'late-night');

  // Static geometry: computed once per mount.
  const peaks = mountains(11, 430, 230, 4);
  const farHills = ridge(12, { y: 500, amplitude: 40, roughness: 3 });
  const farPines = pineRow(13, { y: 540, count: 70, minHeight: 60, maxHeight: 120, jitter: 30 });
  const midPines = pineRow(14, { y: 600, count: 40, minHeight: 110, maxHeight: 210, jitter: 30 });
  const nearPines = pineRow(15, { y: 660, count: 16, minHeight: 230, maxHeight: 330, gap: [430, 1250] });
  const ground = ridge(16, { y: GROUND_Y, amplitude: 14, roughness: 2, scale: 2 });
  const groundBlades = grass(17, GROUND_Y + 6, 260, 10, 26);
  const frontBlades = grass(18, H - 30, 160, 20, 56);
  const leftTree = pineRow(19, { y: H + 20, count: 1, minHeight: 900, maxHeight: 900, from: -260, to: 80 });
  const flowers = specks(21, 90, GROUND_Y + 30, H - 20, 5);
  const tufts = grass(22, H - 120, 120, 14, 34, 0, W);
  const FLOWER_COLORS = ['#fff6e0', '#ffd75e', '#ffb3c7', '#c9b8ff'];
  const rightTree = pineRow(20, { y: H + 20, count: 1, minHeight: 820, maxHeight: 820, from: 1520, to: 1820 });

  // Layer colours, mixed from the theme's sky so every time of day stays coherent.
  const far = $derived(dark ? mix(TOP, '#6a7aa0', 72) : mix(TOP, 'white', 82));
  const haze = mix(TOP, BOTTOM, 60);
  const mid = mix(BOTTOM, '#0d2418', 75);
  const near = mix(BOTTOM, '#081a10', 45);
  const floor = mix(BOTTOM, '#1d3a1a', 62);
  const ink = mix(BOTTOM, '#030806', 18);
</script>

<Sky {time} seed={1} sunX={0.72} />

<div class="world-layer" style="--depth: 6">
  <svg class="fill" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <clipPath id="forest-peaks"><path d={peaks.body} /></clipPath>
      <linearGradient id="forest-peak-shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="white" stop-opacity="0" />
        <stop offset="1" style="stop-color: {haze}" stop-opacity="0.9" />
      </linearGradient>
    </defs>
    <path d={peaks.body} style="fill: {far}" />
    <path d={peaks.snow} clip-path="url(#forest-peaks)" style="fill: {mix('white', TOP, dark ? 45 : 85)}" />
    <rect x="0" y="200" width={W} height="400" fill="url(#forest-peak-shade)" clip-path="url(#forest-peaks)" />
    <path d={farHills} style="fill: {mix(TOP, BOTTOM, 55)}" />
  </svg>
</div>

<div class="world-layer" style="--depth: 12">
  <svg class="fill" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <path d={farPines} style="fill: {mix(TOP, BOTTOM, 38)}" />
    <rect x="0" y="540" width={W} height="400" style="fill: {mix(TOP, BOTTOM, 38)}" />
  </svg>
  <div class="fog-band" style="--y: 58%; --o: {dark ? 0.18 : 0.32}"></div>
</div>

<div class="world-layer" style="--depth: 20">
  <svg class="fill" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <path d={midPines} style="fill: {mid}" />
    <rect x="0" y="598" width={W} height="400" style="fill: {mid}" />
  </svg>
  <div class="fog-band slow" style="--y: 66%; --o: {dark ? 0.14 : 0.26}"></div>
</div>

<div class="world-layer" style="--depth: 30">
  <svg class="fill" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <linearGradient id="forest-floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style="stop-color: {mix('var(--accent-color)', BOTTOM, dark ? 10 : 22)}" />
        <stop offset="0.12" style="stop-color: {floor}" />
        <stop offset="1" style="stop-color: {ink}" />
      </linearGradient>
      <radialGradient id="forest-clearing" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" style="stop-color: {mix('var(--accent-color)', TOP, 30)}" stop-opacity={dark ? 0.12 : 0.28} />
        <stop offset="1" stop-color="white" stop-opacity="0" />
      </radialGradient>
    </defs>
    <path d={nearPines} style="fill: {near}" />
    <path d={ground} fill="url(#forest-floor)" />
    <ellipse cx="960" cy="735" rx="520" ry="70" fill="url(#forest-clearing)" />
    <path d={groundBlades} style="fill: {mix(floor, 'var(--accent-color)', 80)}" />
    <path d={tufts} style="fill: {mix(floor, '#000', 70)}" />
    {#each flowers as flower, i (i)}
      <circle
        cx={flower.x}
        cy={flower.y}
        r={flower.r}
        fill={FLOWER_COLORS[Math.floor(flower.hue * FLOWER_COLORS.length)]}
        opacity={dark ? 0.35 : 0.85}
      />
    {/each}
    <!-- Mossy boulders. -->
    {#each [{ x: 300, y: 812, s: 1 }, { x: 395, y: 826, s: 0.55 }, { x: 1455, y: 800, s: 0.8 }] as rock, i (i)}
      <g transform="translate({rock.x} {rock.y}) scale({rock.s})">
        <path d="M-80,0 C-84,-40 -50,-70 -6,-72 C40,-74 78,-46 82,0 Z" style="fill: {mix(TOP, ink, 32)}" />
        <path d="M-60,-40 C-40,-66 30,-72 64,-36 C30,-50 -20,-52 -60,-40 Z" style="fill: {mix(TOP, ink, 50)}" />
        <path
          d="M-50,-58 C-20,-80 40,-76 58,-50 C30,-62 -10,-64 -50,-58 Z"
          style="fill: {mix('var(--accent-color)', floor, 40)}"
        />
      </g>
    {/each}
    <!-- Winding footpath through the clearing. -->
    <path
      d="M560,900 C640,820 760,790 900,770 C1050,748 1150,720 1260,690"
      fill="none"
      style="stroke: {mix(TOP, floor, 22)}"
      stroke-opacity="0.18"
      stroke-width="60"
      stroke-linecap="round"
    />
  </svg>
</div>

<div class="world-layer" style="--depth: 42">
  <svg class="fill" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <path d={leftTree} style="fill: {ink}" />
    <path d={rightTree} style="fill: {ink}" />
    <path d={frontBlades} style="fill: {ink}" />
  </svg>

  <!-- Mushrooms by the stage's "mushrooms" zone (x ≈ 0.37). -->
  <svg class="prop mushrooms" class:glowing={dark} viewBox="0 0 120 80" aria-hidden="true">
    <ellipse cx="60" cy="76" rx="50" ry="5" fill="black" opacity="0.25" />
    <g class="cap-glow"><ellipse cx="44" cy="40" rx="34" ry="24" /></g>
    <path d="M40,76 C38,60 40,48 44,40 L52,40 C54,50 54,62 54,76 Z" fill="#f2e8d8" />
    <path d="M18,44 C18,22 70,14 74,40 C64,46 28,48 18,44 Z" fill="#e04e3e" />
    <circle cx="34" cy="31" r="4" fill="#fff4e8" />
    <circle cx="52" cy="26" r="3" fill="#fff4e8" />
    <circle cx="62" cy="36" r="2.5" fill="#fff4e8" />
    <path d="M82,76 C81,68 82,62 84,58 L88,58 C89,64 89,70 89,76 Z" fill="#f2e8d8" />
    <path d="M72,60 C72,48 98,44 100,58 C94,62 78,63 72,60 Z" fill="#ef7a4a" />
    <circle cx="84" cy="53" r="2" fill="#fff4e8" />
    <path d="M100,76 L101,70 L104,70 L104,76 Z" fill="#f2e8d8" />
    <path d="M96,71 C96,64 110,63 110,70 Z" fill="#e04e3e" />
  </svg>

  <!-- Lantern hanging from the pine by the "Under the pine" zone. -->
  <div class="prop lantern" class:lit={dark || time === 'sunset'}>
    <svg viewBox="0 0 40 90" aria-hidden="true">
      <path d="M20,0 L20,24" stroke="#20140c" stroke-width="2" />
      <path d="M10,30 L30,30 L27,24 L13,24 Z" fill="#2a1d14" />
      <rect class="pane" x="11" y="30" width="18" height="26" rx="3" />
      <path d="M8,56 L32,56 L28,62 L12,62 Z" fill="#2a1d14" />
      <path d="M15,30 L15,56 M25,30 L25,56" stroke="#2a1d14" stroke-width="1.5" />
    </svg>
  </div>
</div>

<style>
  .fill {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .fog-band {
    position: absolute;
    left: -20%;
    top: var(--y);
    width: 140%;
    height: 14%;
    background: radial-gradient(ellipse at center, rgba(255, 255, 255, var(--o)) 0%, transparent 70%);
    filter: blur(8px);
    animation: drift 70s ease-in-out infinite alternate;
  }
  .fog-band.slow {
    animation-duration: 110s;
    animation-direction: alternate-reverse;
  }
  .prop {
    position: absolute;
  }

  .mushrooms {
    left: 30.5%;
    bottom: 12.5%;
    width: clamp(70px, 8vw, 130px);
  }
  .cap-glow {
    fill: #ffb27a;
    opacity: 0;
    filter: blur(10px);
    transition: opacity 2s ease;
  }
  .mushrooms.glowing .cap-glow {
    opacity: 0.55;
    animation: pulse 4s ease-in-out infinite;
  }
  .lantern {
    left: 79%;
    bottom: 31%;
    width: clamp(22px, 2.4vw, 38px);
    transform-origin: 50% 0;
    animation: sway 6s ease-in-out infinite;
  }
  .lantern svg {
    display: block;
    width: 100%;
    overflow: visible;
  }
  .lantern .pane {
    fill: #3a2a1a;
    transition: fill 2s ease;
  }
  .lantern.lit .pane {
    fill: #ffd27a;
  }
  .lantern.lit::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 48%;
    width: 340%;
    aspect-ratio: 1;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 200, 110, 0.45), transparent 65%);
    animation: pulse 3.5s ease-in-out infinite;
    pointer-events: none;
  }
  @keyframes drift {
    to {
      transform: translateX(10%);
    }
  }
  @keyframes pulse {
    50% {
      opacity: 0.7;
    }
  }
  @keyframes sway {
    0%,
    100% {
      transform: rotate(-3deg);
    }
    50% {
      transform: rotate(3deg);
    }
  }
</style>
