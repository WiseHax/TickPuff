<script lang="ts">
  import type { SceneProps } from './index';
  import Sky from './parts/Sky.svelte';
  import { BOTTOM, GROUND_Y, H, TOP, W, mix, rng } from './art';

  let { time }: SceneProps = $props();
  const dark = $derived(time === 'night' || time === 'late-night');
  const neonOn = $derived(dark || time === 'sunset');

  interface Building {
    x: number;
    y: number;
    w: number;
    h: number;
    antenna: number;
    windows: { x: number; y: number; w: number; color: string }[];
  }

  const WINDOW_COLORS = ['#ffd27a', '#ffe7b0', '#7ff3ff', '#ff8ff0', '#b6a8ff'];

  /** A row of towers with antennae and a scatter of lit windows. */
  function skyline(seed: number, base: number, count: number, minH: number, maxH: number, lit: number): Building[] {
    const random = rng(seed);
    const buildings: Building[] = [];
    let x = -40;
    for (let i = 0; i < count && x < W + 40; i++) {
      const w = 60 + random() * 110;
      const h = minH + random() ** 1.3 * (maxH - minH);
      const y = base - h;
      const windows = [];
      const cols = Math.floor(w / 18);
      const rows = Math.floor(h / 22);
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          if (random() < lit) {
            windows.push({
              x: Math.round(x + 8 + c * 18),
              y: Math.round(y + 12 + r * 22),
              w: 8,
              color: WINDOW_COLORS[Math.floor(random() ** 2 * WINDOW_COLORS.length)],
            });
          }
        }
      }
      buildings.push({
        x: Math.round(x),
        y: Math.round(y),
        w: Math.round(w),
        h: Math.round(h),
        antenna: random() > 0.6 ? 20 + random() * 50 : 0,
        windows,
      });
      x += w + 6 + random() * 30;
    }
    return buildings;
  }

  const farCity = skyline(61, 600, 30, 120, 330, 0.12);
  const midCity = skyline(62, 640, 22, 180, 470, 0.18);

  const random = rng(63);
  const traffic = Array.from({ length: 10 }, (_, i) => ({
    y: 220 + random() * 220,
    duration: 9 + random() * 14,
    delay: -random() * 20,
    color: i % 3 === 0 ? '#ff5fd2' : i % 3 === 1 ? '#7ff3ff' : '#ffd27a',
    reverse: random() > 0.5,
  }));

  const farColor = mix(TOP, BOTTOM, 55);
  const midColor = mix(BOTTOM, '#0a0612', 55);
  const roof = mix(BOTTOM, '#1a1a24', 40);
</script>

<Sky {time} seed={3} sunX={0.78} cloudCount={4} cloudTint="color-mix(in oklab, var(--bg-top) 70%, #8a7a9a)" />

<div class="world-layer" style="--depth: 6">
  <svg class="fill" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <linearGradient id="cyber-haze" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ff4fd8" stop-opacity="0" />
        <stop offset="1" stop-color={neonOn ? '#ff4fd8' : '#ffb36b'} stop-opacity={neonOn ? 0.28 : 0.18} />
      </linearGradient>
    </defs>
    {#each farCity as b, i (i)}
      <rect x={b.x} y={b.y} width={b.w} height={b.h + 400} style="fill: {farColor}" />
      {#if b.antenna}
        <rect x={b.x + b.w / 2 - 2} y={b.y - b.antenna} width="4" height={b.antenna} style="fill: {farColor}" />
        <circle cx={b.x + b.w / 2} cy={b.y - b.antenna} r="3" fill="#ff3b3b" opacity={neonOn ? 0.9 : 0.4} />
      {/if}
      {#if neonOn}
        {#each b.windows as win, j (j)}
          <rect x={win.x} y={win.y} width={win.w} height="10" fill={win.color} opacity="0.55" />
        {/each}
      {/if}
    {/each}
    <rect x="0" y="300" width={W} height="400" fill="url(#cyber-haze)" />
  </svg>
</div>

<div class="world-layer" style="--depth: 14">
  <div class="traffic">
    {#each traffic as car, i (i)}
      <span
        class:reverse={car.reverse}
        style="top: {(car.y / H) *
          100}%; animation-duration: {car.duration}s; animation-delay: {car.delay}s; --c: {car.color}"
      ></span>
    {/each}
  </div>
  <svg class="fill" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    {#each midCity as b, i (i)}
      <rect x={b.x} y={b.y} width={b.w} height={b.h + 400} style="fill: {midColor}" />
      <rect x={b.x} y={b.y} width={b.w} height="6" style="fill: {mix(midColor, TOP, 70)}" />
      {#if b.antenna}
        <rect x={b.x + 10} y={b.y - b.antenna} width="3" height={b.antenna} style="fill: {midColor}" />
      {/if}
      {#each b.windows as win, j (j)}
        <rect
          x={win.x}
          y={win.y}
          width={win.w}
          height="11"
          fill={neonOn ? win.color : mix(TOP, 'white', 60)}
          opacity={neonOn ? 0.85 : 0.25}
        />
      {/each}
    {/each}
    <!-- Vertical neon signs on the towers. -->
    {#each [{ x: 330, y: 260, c: '#ff4fd8', t: 'ネオン' }, { x: 1090, y: 210, c: '#4ff3ff', t: '夜市' }, { x: 1380, y: 300, c: '#ffd24f', t: '酒' }] as sign, i (i)}
      <g class="vsign" class:on={neonOn} style="--c: {sign.c}">
        <rect x={sign.x} y={sign.y} width="44" height={sign.t.length * 46 + 16} rx="6" />
        {#each [...sign.t] as ch, j (j)}
          <text x={sign.x + 22} y={sign.y + 46 + j * 46} text-anchor="middle">{ch}</text>
        {/each}
      </g>
    {/each}
    <!-- Billboard. -->
    <g class="billboard" class:on={neonOn}>
      <rect x="1000" y="450" width="230" height="110" rx="6" />
      <text x="1115" y="498" text-anchor="middle" class="big">TICK·PUFF</text>
      <text x="1115" y="532" text-anchor="middle" class="small">24/7 COZY TIME</text>
    </g>
  </svg>
</div>

<div class="world-layer" style="--depth: 30">
  <svg class="fill" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <linearGradient id="cyber-roof" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style="stop-color: {mix(roof, TOP, 75)}" />
        <stop offset="1" style="stop-color: {mix(roof, '#000', 60)}" />
      </linearGradient>
      <linearGradient id="cyber-reflect" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color={neonOn ? '#ff4fd8' : '#ffffff'} stop-opacity={neonOn ? 0.35 : 0.12} />
        <stop offset="1" stop-color="#4ff3ff" stop-opacity="0" />
      </linearGradient>
    </defs>
    <!-- Rooftop deck. -->
    <rect x="0" y={GROUND_Y - 4} width={W} height={H - GROUND_Y + 10} fill="url(#cyber-roof)" />
    {#each [0, 1, 2, 3, 4, 5, 6, 7] as i (i)}
      <path
        d="M{800 + (i - 3.5) * 120},{GROUND_Y} L{800 + (i - 3.5) * 520},{H}"
        style="stroke: {mix(roof, '#000', 70)}"
        stroke-width="2"
        opacity="0.5"
      />
    {/each}
    <!-- Puddles reflecting the city. -->
    <ellipse cx="560" cy="790" rx="170" ry="18" fill="url(#cyber-reflect)" />
    <ellipse cx="1150" cy="840" rx="220" ry="22" fill="url(#cyber-reflect)" />
    <!-- Back railing (the "Rooftop railing" zone runs along it). -->
    <g style="fill: {mix(roof, '#000', 50)}">
      <rect x="0" y={GROUND_Y - 58} width={W} height="6" />
      <rect x="0" y={GROUND_Y - 30} width={W} height="3" />
      {#each Array.from({ length: 33 }, (_, i) => i * 50) as x (x)}
        <rect {x} y={GROUND_Y - 58} width="5" height="58" />
      {/each}
    </g>
    <!-- Water tank and AC units. -->
    <g style="fill: {mix(roof, '#000', 45)}">
      <rect x="120" y="470" width="150" height="150" rx="8" />
      <path d="M110,470 L195,425 L280,470 Z" />
      <rect x="140" y="620" width="10" height="40" />
      <rect x="240" y="620" width="10" height="40" />
      <rect x="1250" y="600" width="120" height="70" rx="4" />
      <circle cx="1310" cy="635" r="26" style="fill: {mix(roof, '#000', 30)}" />
    </g>
  </svg>

  <svg class="fan" viewBox="0 0 50 50" aria-hidden="true"><circle cx="25" cy="25" r="20" /></svg>

  <!-- Ramen sign on the right (the "Neon sign" zone). -->
  <div class="neon-sign" class:on={neonOn}>
    <span class="neon-text" lang="ja">ラーメン</span>
    <span class="neon-sub">OPEN</span>
  </div>
</div>

<div class="world-layer" style="--depth: 44">
  <svg class="fill" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <!-- Foreground cables and a pipe framing the view. -->
    <path d="M-20,90 Q400,190 820,120 T1640,150" fill="none" stroke="#06060a" stroke-width="5" />
    <path d="M-20,140 Q500,260 1100,170" fill="none" stroke="#06060a" stroke-width="3" />
    <rect x="1530" y="0" width="40" height={H} fill="#07070c" />
    <rect x="1526" y="380" width="48" height="16" fill="#101018" />
  </svg>
</div>

<style>
  .fill {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .traffic span {
    position: absolute;
    left: -5%;
    width: 46px;
    height: 3px;
    border-radius: 2px;
    background: linear-gradient(to right, transparent, var(--c));
    box-shadow: 0 0 8px var(--c);
    animation: fly linear infinite;
  }
  .traffic span.reverse {
    background: linear-gradient(to left, transparent, var(--c));
    animation-name: fly-back;
  }
  .vsign rect {
    fill: #0b0610;
    stroke: var(--c);
    stroke-width: 2;
    opacity: 0.85;
  }
  .vsign text {
    font-size: 34px;
    font-weight: 900;
    fill: #3a2a3a;
  }
  .vsign.on text {
    fill: var(--c);
    filter: drop-shadow(0 0 6px var(--c));
  }
  .vsign.on rect {
    filter: drop-shadow(0 0 8px var(--c));
  }
  .billboard rect {
    fill: #120a1e;
    stroke: #7ff3ff;
    stroke-width: 2;
  }
  .billboard text {
    font-family: 'Space Mono', monospace;
    fill: #5a6a7a;
  }
  .billboard.on text {
    fill: #7ff3ff;
    filter: drop-shadow(0 0 5px #4ff3ff);
  }
  .billboard .big {
    font-size: 34px;
    font-weight: 700;
    letter-spacing: 3px;
  }
  .billboard .small {
    font-size: 16px;
    letter-spacing: 4px;
  }
  .fan {
    position: absolute;
    left: 81.3%;
    bottom: 29.5%;
    width: 2.9%;
    fill: none;
    stroke: #2a2a34;
    stroke-width: 5;
    stroke-dasharray: 16 14;
    animation: spin 1.6s linear infinite;
  }
  .neon-sign {
    position: absolute;
    left: 74%;
    bottom: 27%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5em 1em;
    font-size: clamp(12px, 1.4vw, 22px);
    background: rgba(8, 4, 12, 0.85);
    border: 2px solid #5a3a5a;
    border-radius: 6px;
    transition: border-color 1s ease;
  }
  .neon-sign.on {
    border-color: #f0f;
    box-shadow:
      0 0 18px rgba(255, 0, 255, 0.45),
      inset 0 0 12px rgba(255, 0, 255, 0.25);
    animation: flicker 7s infinite;
  }
  .neon-text {
    color: #5a3a5a;
    font-size: 1.5em;
    font-weight: 900;
    letter-spacing: 0.25em;
  }
  .neon-sign.on .neon-text {
    color: #ffd6ff;
    text-shadow:
      0 0 6px #f0f,
      0 0 16px #f0f,
      0 0 30px #f0f;
  }
  .neon-sub {
    margin-top: 0.2em;
    font-size: 0.7em;
    letter-spacing: 0.5em;
    color: #3a5a5a;
  }
  .neon-sign.on .neon-sub {
    color: #b8ffff;
    text-shadow: 0 0 8px #0ff;
  }
  @keyframes fly {
    to {
      transform: translateX(110vw);
    }
  }
  @keyframes fly-back {
    from {
      transform: translateX(110vw);
    }
    to {
      transform: translateX(0);
    }
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes flicker {
    0%,
    91%,
    93%,
    100% {
      opacity: 1;
    }
    92% {
      opacity: 0.55;
    }
  }
</style>
