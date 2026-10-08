<script lang="ts">
  import type { TimeOfDay } from '$lib/types';
  import { BOTTOM, GROUND_Y, H, TOP, W, mix, rng, starField } from './art';

  let { time }: { time: TimeOfDay } = $props();
  const dark = $derived(time === 'night' || time === 'late-night');
  const candleLit = $derived(dark || time === 'sunset');

  const BOOK_COLORS = ['#8e3b2f', '#2f5d50', '#c99a3b', '#3b4a7a', '#6b3a5a', '#d8c7a0', '#4a6b2f', '#a0522d'];

  interface Book {
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    tilt: number;
  }

  /** Fill a bookcase's shelves with spines of varied size and colour. */
  function bookcase(seed: number, x: number, top: number, width: number, shelves: number, shelfH: number): Book[] {
    const random = rng(seed);
    const books: Book[] = [];
    for (let s = 0; s < shelves; s++) {
      const base = top + (s + 1) * shelfH - 8;
      let bx = x + 10;
      while (bx < x + width - 30) {
        if (random() < 0.08) {
          bx += 20 + random() * 30; // a gap
          continue;
        }
        const w = 10 + random() * 14;
        const h = shelfH * (0.55 + random() * 0.35);
        const tilt = random() < 0.06 ? 12 : 0;
        books.push({
          x: Math.round(bx),
          y: Math.round(base - h),
          w: Math.round(w),
          h: Math.round(h),
          color: BOOK_COLORS[Math.floor(random() * BOOK_COLORS.length)],
          tilt,
        });
        bx += w + 1 + (tilt ? 8 : 0);
      }
    }
    return books;
  }

  const leftCase = bookcase(71, 0, 60, 380, 6, 96);
  const rightCase = bookcase(72, 1220, 60, 380, 6, 96);
  const stars = starField(73, 40, 400);

  const wall = mix(TOP, BOTTOM, 55);
  const wood = mix(BOTTOM, '#3a2216', 45);
  const woodDark = mix(BOTTOM, '#1a0e08', 30);
  const SKY: Record<TimeOfDay, [string, string]> = {
    morning: ['#a8cbe8', '#ffe2c0'],
    day: ['#8fc8f0', '#d6ecfa'],
    sunset: ['#5a5aa0', '#ffb070'],
    night: ['#0c1430', '#24305a'],
    'late-night': ['#05070f', '#11182e'],
  };
  const ORB: Record<TimeOfDay, { x: number; y: number }> = {
    morning: { x: 640, y: 300 },
    day: { x: 720, y: 140 },
    sunset: { x: 940, y: 400 },
    night: { x: 930, y: 150 },
    'late-night': { x: 660, y: 180 },
  };
  const sky = $derived(SKY[time]);
  const orb = $derived(ORB[time]);
</script>

<div class="world-layer" style="--depth: 4">
  <!-- The view through the arched window (drawn larger than the opening so parallax never shows a gap). -->
  <svg class="fill" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <linearGradient id="lib-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color={sky[0]} />
        <stop offset="1" stop-color={sky[1]} />
      </linearGradient>
      <radialGradient id="lib-orb-glow">
        <stop offset="0" stop-color={dark ? '#e8ecff' : '#fff6d0'} stop-opacity="0.7" />
        <stop offset="1" stop-color={dark ? '#e8ecff' : '#fff6d0'} stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect x="480" y="0" width="640" height="620" fill="url(#lib-sky)" />
    <!-- Old glass: a warm tint keeps the clock readable against a bright sky. -->
    <rect x="480" y="0" width="640" height="620" fill="#5a3a20" opacity={dark ? 0 : 0.22} />
    {#if dark}
      {#each stars as star, i (i)}
        <circle
          cx={540 + (star.x / W) * 520}
          cy={20 + star.y}
          r={star.r}
          fill="white"
          style="animation-delay: {star.delay}s"
        />
      {/each}
    {/if}
    <circle cx={orb.x} cy={orb.y} r="110" fill="url(#lib-orb-glow)" />
    <circle cx={orb.x} cy={orb.y} r="34" fill={dark ? '#fdfbe8' : time === 'sunset' ? '#ffc070' : '#fffbe6'} />
    <!-- Rooftops of the town outside. -->
    <path
      d="M480,620 L480,500 L540,500 L540,470 L565,452 L590,470 L590,490 L650,490 L650,450 L690,450 L690,420 L706,404 L722,420 L722,480 L790,480 L790,460 L870,460 L870,494 L950,494 L950,440 L974,424 L998,440 L998,476 L1060,476 L1060,456 L1120,456 L1120,620 Z"
      fill={dark ? '#0a0e1c' : 'rgba(60, 70, 100, 0.4)'}
    />
    {#if dark}
      {#each [[560, 480], [668, 470], [704, 430], [820, 476], [972, 450], [1080, 470]] as [x, y], i (i)}
        <rect {x} {y} width="8" height="8" fill="#ffd27a" />
      {/each}
    {/if}
  </svg>
</div>

<div class="world-layer" style="--depth: 10">
  <svg class="fill" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <pattern id="lib-wallpaper" width="60" height="60" patternUnits="userSpaceOnUse">
        <rect width="60" height="60" style="fill: {wall}" />
        <path d="M30,8 C38,18 38,26 30,34 C22,26 22,18 30,8 Z" style="fill: {mix(wall, 'white', 88)}" />
        <rect x="0" y="0" width="2" height="60" style="fill: {mix(wall, '#000', 90)}" />
      </pattern>
      <mask id="lib-window-hole">
        <rect width={W} height={H} fill="white" />
        <path d="M560,560 L560,250 A240,240 0 0,1 1040,250 L1040,560 Z" fill="black" />
      </mask>
    </defs>
    <!-- Wall with a hole for the window. -->
    <rect width={W} height={H} fill="url(#lib-wallpaper)" mask="url(#lib-window-hole)" />
    <!-- Wainscoting. -->
    <rect x="0" y="470" width={W} height="200" style="fill: {mix(wood, wall, 75)}" />
    <rect x="0" y="466" width={W} height="10" style="fill: {woodDark}" />
    {#each Array.from({ length: 12 }, (_, i) => i * 140 + 20) as x (x)}
      <rect
        {x}
        y="496"
        width="110"
        height="140"
        rx="4"
        fill="none"
        style="stroke: {mix(woodDark, wall, 60)}"
        stroke-width="3"
      />
    {/each}
    <!-- Window frame, mullions and sill. -->
    <path
      d="M560,560 L560,250 A240,240 0 0,1 1040,250 L1040,560"
      fill="none"
      style="stroke: {woodDark}"
      stroke-width="26"
    />
    <path d="M800,10 L800,560 M560,330 L1040,330" style="stroke: {woodDark}" stroke-width="12" />
    <rect x="530" y="556" width="540" height="22" rx="4" style="fill: {wood}" />
    <!-- Curtains. -->
    <path
      d="M500,0 C540,200 520,400 560,600 L470,600 C440,400 470,200 440,0 Z"
      style="fill: {mix('#7a2a2a', BOTTOM, 70)}"
    />
    <path
      d="M1100,0 C1060,200 1080,400 1040,600 L1130,600 C1160,400 1130,200 1160,0 Z"
      style="fill: {mix('#7a2a2a', BOTTOM, 70)}"
    />
    <rect x="420" y="0" width="760" height="14" style="fill: {woodDark}" />
  </svg>
</div>

{#if !dark}
  <!-- Sunbeam falling across the floor (its own layer so its shimmer is cheap). -->
  <div class="world-layer" style="--depth: 12">
    <svg class="fill beam" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="lib-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff4d6" stop-opacity="0.32" />
          <stop offset="1" stop-color="#fff4d6" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path d="M570,300 L1030,300 L1260,{H} L380,{H} Z" fill="url(#lib-beam)" />
    </svg>
  </div>
{/if}

<div class="world-layer" style="--depth: 18">
  <svg class="fill" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <!-- Bookcases on both sides. -->
    {#each [{ x: 0, books: leftCase }, { x: 1220, books: rightCase }] as shelf, i (i)}
      <rect x={shelf.x} y="40" width="400" height="640" style="fill: {woodDark}" />
      <rect x={shelf.x + 10} y="60" width="380" height="580" style="fill: {mix(woodDark, '#000', 70)}" />
      {#each [1, 2, 3, 4, 5, 6] as s (s)}
        <rect x={shelf.x} y={60 + s * 96 - 8} width="400" height="10" style="fill: {wood}" />
      {/each}
      {#each shelf.books as book, j (j)}
        <rect
          x={book.x}
          y={book.y}
          width={book.w}
          height={book.h}
          rx="2"
          fill={book.color}
          transform={book.tilt ? `rotate(${book.tilt} ${book.x} ${book.y + book.h})` : undefined}
          opacity={dark ? 0.7 : 0.95}
        />
        <rect x={book.x + 2} y={book.y + book.h * 0.2} width={book.w - 4} height="3" fill="#f2d48a" opacity="0.5" />
      {/each}
    {/each}
  </svg>
</div>

<div class="world-layer" style="--depth: 28">
  <svg class="fill" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <linearGradient id="lib-floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style="stop-color: {mix(wood, wall, 85)}" />
        <stop offset="1" style="stop-color: {mix(wood, '#000', 55)}" />
      </linearGradient>
      <radialGradient id="lib-rug" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#b8584a" />
        <stop offset="0.7" stop-color="#8a3a32" />
        <stop offset="0.72" stop-color="#e6c48a" />
        <stop offset="0.78" stop-color="#8a3a32" />
        <stop offset="1" stop-color="#6a2a24" />
      </radialGradient>
    </defs>
    <!-- Wooden floor in perspective. -->
    <rect x="0" y={GROUND_Y - 10} width={W} height={H - GROUND_Y + 20} fill="url(#lib-floor)" />
    {#each Array.from({ length: 15 }, (_, i) => i) as i (i)}
      <path
        d="M{800 + (i - 7) * 110},{GROUND_Y - 10} L{800 + (i - 7) * 420},{H}"
        style="stroke: {mix(wood, '#000', 60)}"
        stroke-width="2"
        opacity="0.45"
      />
    {/each}
    <rect x="0" y={GROUND_Y - 14} width={W} height="8" style="fill: {woodDark}" />
    <!-- Round rug under the stage. -->
    <ellipse cx="880" cy="790" rx="520" ry="88" fill="url(#lib-rug)" opacity={dark ? 0.75 : 0.9} />
    <!-- Potted plant (left) and globe (right). -->
    <g transform="translate(460 690)">
      <path d="M-34,0 L34,0 L26,60 L-26,60 Z" fill="#b5653a" />
      <rect x="-38" y="-6" width="76" height="12" rx="3" fill="#c97a4a" />
      {#each [[-40, -90, -30], [10, -110, 10], [40, -80, 35], [-10, -70, -10], [30, -130, 20]] as [x, y, r], i (i)}
        <ellipse cx={x} cy={y} rx="22" ry="44" transform="rotate({r} {x} {y})" fill={i % 2 ? '#3f7a3a' : '#4f9a4a'} />
      {/each}
    </g>
    <g transform="translate(1180 640)">
      <rect x="-4" y="40" width="8" height="40" style="fill: {woodDark}" />
      <ellipse cx="0" cy="84" rx="34" ry="8" style="fill: {woodDark}" />
      <circle r="44" fill="#3a7a9a" />
      <path
        d="M-30,-18 C-10,-30 10,-10 20,-24 C26,-6 4,6 -12,0 C-24,8 -34,-4 -30,-18 Z M0,16 C12,10 24,22 18,34 C6,30 -6,30 0,16 Z"
        fill="#7aa85a"
      />
      <path d="M-50,0 A50,50 0 0,0 50,0" fill="none" stroke="#c99a3b" stroke-width="5" />
    </g>
  </svg>

  <!-- Stack of books by the "Stack of books" zone (x ≈ 0.36). -->
  <svg class="prop books" viewBox="0 0 130 110" aria-hidden="true">
    <rect x="10" y="84" width="110" height="22" rx="3" fill="#2f5d50" />
    <rect x="10" y="84" width="110" height="5" fill="#f2e4c4" opacity="0.6" />
    <rect x="20" y="62" width="96" height="22" rx="3" fill="#8e3b2f" />
    <rect x="20" y="62" width="96" height="5" fill="#f2e4c4" opacity="0.6" />
    <rect x="6" y="42" width="100" height="20" rx="3" fill="#c99a3b" transform="rotate(-4 56 52)" />
    <rect x="30" y="22" width="70" height="20" rx="3" fill="#3b4a7a" transform="rotate(3 65 32)" />
    <path d="M44,22 L46,4 L52,4 L50,22 Z" fill="#d8c7a0" />
  </svg>

  <!-- Candle on a little stool by the "Candle" zone (x ≈ 0.66). -->
  <div class="prop candle" class:lit={candleLit}>
    <svg viewBox="0 0 60 120" aria-hidden="true">
      <rect x="4" y="82" width="52" height="8" rx="2" fill="#5a3a26" />
      <rect x="10" y="90" width="6" height="30" fill="#4a2e1e" />
      <rect x="44" y="90" width="6" height="30" fill="#4a2e1e" />
      <ellipse cx="30" cy="80" rx="16" ry="4" fill="#c9a24a" />
      <rect x="22" y="44" width="16" height="36" rx="3" fill="#f6eedc" />
      <path d="M30,44 L30,38" stroke="#2a1a10" stroke-width="2" />
      <path class="flame" d="M30,20 C36,30 36,36 30,40 C24,36 24,30 30,20 Z" />
    </svg>
  </div>
</div>

<div class="world-layer" style="--depth: 40">
  <!-- Hanging lamp. -->
  <div class="lamp" class:lit={dark || time === 'sunset'}>
    <svg viewBox="0 0 120 200" aria-hidden="true">
      <path d="M60,0 L60,110" stroke="#1a0e08" stroke-width="3" />
      <path d="M20,150 C20,118 100,118 100,150 Z" fill="#2f5d50" />
      <ellipse class="bulb" cx="60" cy="152" rx="40" ry="6" />
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
  .beam {
    animation: beam 10s ease-in-out infinite alternate;
  }
  .prop {
    position: absolute;
  }
  .books {
    left: 26%;
    bottom: 13%;
    width: clamp(80px, 9vw, 140px);
  }
  .candle {
    left: 69%;
    bottom: 14%;
    width: clamp(32px, 3.6vw, 56px);
  }
  .candle svg,
  .lamp svg {
    display: block;
    width: 100%;
    overflow: visible;
  }
  .flame {
    fill: transparent;
    transform-box: fill-box;
    transform-origin: 50% 100%;
  }
  .candle.lit .flame {
    fill: #ffcf5a;
    filter: drop-shadow(0 0 6px #ffb347);
    animation: flame 0.9s ease-in-out infinite alternate;
  }
  .candle.lit::after,
  .lamp.lit::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 22%;
    width: 520%;
    aspect-ratio: 1;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 190, 100, 0.35), transparent 62%);
    animation: glow 3s ease-in-out infinite;
    pointer-events: none;
  }
  .lamp {
    position: absolute;
    left: 81%;
    top: 0;
    width: clamp(60px, 7vw, 110px);
  }
  .lamp.lit::after {
    top: 78%;
    width: 400%;
  }
  .lamp .bulb {
    fill: #3a3020;
  }
  .lamp.lit .bulb {
    fill: #ffe2a0;
  }
  @keyframes beam {
    to {
      opacity: 0.6;
    }
  }
  @keyframes flame {
    from {
      transform: scale(0.9, 1) rotate(-3deg);
    }
    to {
      transform: scale(1.05, 1.12) rotate(3deg);
    }
  }
  @keyframes glow {
    50% {
      opacity: 0.75;
    }
  }
</style>
