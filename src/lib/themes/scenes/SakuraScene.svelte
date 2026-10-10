<script lang="ts">
  import type { SceneProps } from './index';
  import Sky from './parts/Sky.svelte';
  import { switchable } from './parts/switchable.svelte';
  import { BOTTOM, GROUND_Y, H, TOP, W, canopy, grass, mix, ridge, rng, specks } from './art';

  let { time, season }: SceneProps = $props();
  const dark = $derived(time === 'night' || time === 'late-night');
  const lit = $derived(dark || time === 'sunset');
  const toro = switchable(() => lit);

  /** Tree colours through the year: blossoms, summer leaves, momiji, snow. */
  const FOLIAGE = {
    spring: { inner: '#ffd9e6', outer: '#f48fb1', light: '#ffe4ee', grove: '#ffb7cf', ground: ['#ffc4d6', '#ffe0ea'] },
    summer: { inner: '#bfe6a0', outer: '#5f9e4f', light: '#d8f2c4', grove: '#7fb069', ground: [] },
    autumn: { inner: '#ffc46b', outer: '#d9542b', light: '#ffdca0', grove: '#e07a3a', ground: ['#e8743a', '#f2b04e'] },
    winter: { inner: '#ffffff', outer: '#d6e0ec', light: '#ffffff', grove: '#e6edf5', ground: [] },
  } as const;
  const foliage = $derived(FOLIAGE[season]);

  // A Fuji-like volcano: broad slopes with a flattened summit.
  const fuji = 'M180,600 C360,520 520,330 640,232 C660,218 700,214 720,226 C850,320 1000,500 1220,600 Z';
  const fujiSnow =
    'M640,232 C660,218 700,214 720,226 C750,248 790,280 820,312 C790,300 770,318 748,300 C726,322 704,296 684,318 C664,296 640,320 616,302 C596,316 576,298 566,306 C590,278 614,254 640,232 Z';
  const hills = ridge(31, { y: 560, amplitude: 36, roughness: 2, scale: 1.6 });
  const nearHills = ridge(32, { y: 610, amplitude: 22, roughness: 2, scale: 2 });
  const ground = ridge(33, { y: GROUND_Y, amplitude: 10, roughness: 2, scale: 2 });
  const blades = grass(34, GROUND_Y + 8, 220, 8, 22);
  const petalsOnGround = specks(35, 140, GROUND_Y + 20, H - 10, 4);

  // Rows of distant blossom trees on the hills.
  const random = rng(36);
  const grove = Array.from({ length: 22 }, (_, i) => {
    const x = (i / 22) * W + random() * 60;
    const y = 560 + random() * 40;
    const r = 34 + random() * 30;
    return { d: canopy(100 + i, x, y - r * 0.6, r * 1.3, r, 9), x, y, r };
  });
  const bigTree = canopy(40, 1340, 250, 330, 190, 26);
  const bigTreeLight = canopy(41, 1300, 210, 260, 140, 18);

  const pagodaRoofs = [0, 1, 2, 3, 4].map((i) => {
    const y = 330 + i * 46;
    const w = 70 + i * 14;
    return `M${232 - w},${y} Q232,${y - 26} ${232 + w},${y} L${232 + w - 10},${y + 8} L${232 - w + 10},${y + 8} Z`;
  });

  const far = $derived(dark ? mix(TOP, '#7a6a9a', 70) : mix(TOP, 'white', 70));
  const hillColor = mix(BOTTOM, TOP, 55);
  const nearHill = mix(BOTTOM, '#7a5a7a', 70);
  const floor = $derived(
    season === 'winter'
      ? mix('#eef3f8', BOTTOM, dark ? 40 : 80)
      : dark
        ? mix(BOTTOM, '#2a3a2a', 60)
        : mix(season === 'summer' ? '#8fc67a' : '#9fc58f', BOTTOM, 55),
  );
  const ink = mix(BOTTOM, '#1a0f16', 30);
</script>

<Sky {time} seed={2} sunX={0.4} cloudCount={5} />

<div class="world-layer" style="--depth: 6">
  <svg class="fill" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <linearGradient id="sakura-fuji" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0.2" style="stop-color: {far}" />
        <stop offset="1" style="stop-color: {mix(TOP, BOTTOM, 50)}" />
      </linearGradient>
    </defs>
    <path d={fuji} fill="url(#sakura-fuji)" />
    <path d={fujiSnow} style="fill: {mix('white', TOP, dark ? 50 : 92)}" />
    <path d={hills} style="fill: {hillColor}" />
    {#each grove as tree, i (i)}
      <path d={tree.d} style="fill: {mix(foliage.grove, hillColor, dark ? 30 : 55)}" />
    {/each}
  </svg>
  <div class="mist" style="--o: {dark ? 0.12 : 0.35}"></div>
</div>

<div class="world-layer" style="--depth: 14">
  <svg class="fill" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <path d={nearHills} style="fill: {nearHill}" />
    <!-- Five-storey pagoda on the far-left hill. -->
    <g style="fill: {mix(nearHill, '#2a1420', 55)}">
      <rect x="226" y="270" width="12" height="70" />
      <circle cx="232" cy="268" r="7" />
      {#each pagodaRoofs as roof, i (i)}
        <path d={roof} />
        <rect x={232 - (46 + i * 10)} y={338 + i * 46} width={92 + i * 20} height="38" />
      {/each}
    </g>
    {#if lit}
      <g class="windows">
        {#each [0, 1, 2, 3, 4] as i (i)}
          <rect x={222 - i * 4} y={350 + i * 46} width={20 + i * 8} height="10" rx="2" />
        {/each}
      </g>
    {/if}
  </svg>
</div>

<div class="world-layer" style="--depth: 26">
  <svg class="fill" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <linearGradient id="sakura-floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style="stop-color: {mix(floor, 'white', 80)}" />
        <stop offset="0.25" style="stop-color: {floor}" />
        <stop offset="1" style="stop-color: {mix(floor, ink, 55)}" />
      </linearGradient>
    </defs>
    <path d={ground} fill="url(#sakura-floor)" />
    <path d={blades} style="fill: {mix(floor, '#203a20', 75)}" />
    <!-- Stepping-stone path leading to the gate. -->
    {#each [[800, 880, 46], [780, 810, 38], [800, 752, 30], [790, 706, 24], [800, 672, 18]] as [x, y, r], i (i)}
      <ellipse cx={x} cy={y} rx={r * 1.6} ry={r * 0.45} style="fill: {mix(TOP, '#7a7080', 30)}" opacity="0.85" />
    {/each}
    {#if foliage.ground.length > 0}
      {#each petalsOnGround as petal, i (i)}
        <ellipse
          cx={petal.x}
          cy={petal.y}
          rx={petal.r}
          ry={petal.r * 0.6}
          fill={foliage.ground[petal.hue > 0.5 ? 0 : 1]}
          opacity={dark ? 0.35 : 0.9}
        />
      {/each}
    {/if}
  </svg>

  <!-- Torii gate behind the stage centre (the "Torii gate" zone). -->
  <svg class="prop torii" viewBox="0 0 260 240" aria-hidden="true">
    <g class="gate">
      <path d="M0,22 Q130,-6 260,22 L254,40 Q130,16 6,40 Z" fill="#2a1414" />
      <path d="M8,30 Q130,8 252,30 L248,44 Q130,24 12,44 Z" fill="#d23a2a" />
      <rect x="28" y="64" width="204" height="16" rx="2" fill="#c23224" />
      <rect x="116" y="44" width="28" height="22" fill="#b02e22" />
      <rect x="48" y="40" width="20" height="200" fill="#d23a2a" />
      <rect x="192" y="40" width="20" height="200" fill="#d23a2a" />
      <rect x="44" y="218" width="28" height="22" fill="#2a1414" />
      <rect x="188" y="218" width="28" height="22" fill="#2a1414" />
      <rect x="48" y="40" width="6" height="178" fill="#000" opacity="0.15" />
      <rect x="192" y="40" width="6" height="178" fill="#000" opacity="0.15" />
    </g>
  </svg>
</div>

<div class="world-layer" style="--depth: 40">
  <svg class="fill" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <radialGradient id="sakura-bloom" cx="0.4" cy="0.3" r="0.8">
        <stop offset="0" stop-color={foliage.inner} />
        <stop offset="1" stop-color={foliage.outer} />
      </radialGradient>
    </defs>
    <!-- The big cherry tree on the right (the "Under the blossoms" zone). -->
    <path
      d="M1420,900 C1400,760 1430,640 1380,520 C1350,450 1300,400 1240,360 L1260,340 C1320,370 1360,410 1400,470 C1420,400 1450,330 1520,280 L1540,300 C1480,360 1460,430 1450,520 C1470,620 1480,760 1500,900 Z"
      style="fill: {mix('#4a2a2a', BOTTOM, 70)}"
    />
    <path d={bigTree} fill="url(#sakura-bloom)" opacity={season === 'winter' ? 0.55 : dark ? 0.75 : 0.95} />
    <path d={bigTreeLight} fill={foliage.light} opacity={dark ? 0.25 : 0.5} />
    <!-- Overhanging branch top-left frames the clock. -->
    <path
      d="M-20,120 C120,140 240,170 360,230 M140,150 C180,200 200,240 190,290"
      fill="none"
      style="stroke: {mix('#3a2020', BOTTOM, 70)}"
      stroke-width="16"
      stroke-linecap="round"
    />
    <path d={canopy(42, 260, 200, 150, 70, 12)} fill="url(#sakura-bloom)" opacity={dark ? 0.7 : 0.92} />
  </svg>

  <!-- Stone lantern (tōrō), lit at dusk and night. -->
  <div class="prop toro clickable" class:lit={toro.on} onclick={toro.toggle} aria-hidden="true">
    <svg viewBox="0 0 60 110" aria-hidden="true">
      <path d="M6,24 L30,8 L54,24 Z" fill="#6d6872" />
      <rect x="26" y="2" width="8" height="8" rx="3" fill="#6d6872" />
      <rect x="14" y="24" width="32" height="26" fill="#7d7882" />
      <rect class="light" x="20" y="29" width="20" height="16" rx="2" />
      <rect x="10" y="50" width="40" height="7" fill="#6d6872" />
      <rect x="24" y="57" width="12" height="38" fill="#7d7882" />
      <rect x="12" y="95" width="36" height="12" rx="2" fill="#6d6872" />
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
  .mist {
    position: absolute;
    left: 0;
    right: 0;
    top: 52%;
    height: 18%;
    background: linear-gradient(to bottom, transparent, rgba(255, 240, 246, var(--o)) 50%, transparent);
  }
  .windows rect {
    fill: #ffcf7a;
    opacity: 0.85;
  }
  .prop {
    position: absolute;
  }
  .torii {
    left: 43.5%;
    bottom: 24.5%;
    width: clamp(120px, 14vw, 220px);
  }
  .toro {
    left: 27%;
    bottom: 15%;
    width: clamp(34px, 4vw, 60px);
  }
  .toro svg {
    display: block;
    width: 100%;
  }
  .toro .light {
    fill: #3a3036;
    transition: fill 2s ease;
  }
  .toro.lit .light {
    fill: #ffd27a;
  }
  .toro.lit::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 34%;
    width: 320%;
    aspect-ratio: 1;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 196, 120, 0.42), transparent 65%);
    animation: flicker 3s ease-in-out infinite;
  }
  @keyframes flicker {
    50% {
      opacity: 0.75;
    }
  }
</style>
