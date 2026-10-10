<script lang="ts">
  import type { SceneProps } from './index';
  import { BOTTOM, GROUND_Y, H, TOP, W, grass, mix, ridge, rng, specks } from './art';

  let { time }: SceneProps = $props();
  const dark = $derived(time === 'night' || time === 'late-night');

  const random = rng(51);
  const f = (n: number) => Math.round(n);

  /** Branching coral as a stroke path (thick at the base, forking upward). */
  function coral(x: number, y: number, height: number, seed: number): { d: string; tips: [number, number][] } {
    const r = rng(seed);
    const tips: [number, number][] = [];
    let d = '';
    const grow = (px: number, py: number, angle: number, length: number, depth: number) => {
      const ex = px + Math.sin(angle) * length;
      const ey = py - Math.cos(angle) * length;
      d += `M${f(px)},${f(py)} Q${f(px + Math.sin(angle + 0.3) * length * 0.5)},${f(py - length * 0.5)} ${f(ex)},${f(ey)} `;
      if (depth === 0) tips.push([f(ex), f(ey)]);
      if (depth > 0) {
        const forks = 2 + (r() > 0.6 ? 1 : 0);
        for (let i = 0; i < forks; i++) {
          grow(ex, ey, angle + (i - (forks - 1) / 2) * (0.5 + r() * 0.3), length * (0.62 + r() * 0.15), depth - 1);
        }
      }
    };
    grow(x, y, 0, height * 0.38, 3);
    return { d, tips };
  }

  /** A swaying kelp ribbon from (x, bottom) up to height. */
  function kelp(x: number, bottom: number, height: number, seed: number): string {
    const r = rng(seed);
    const segments = 7;
    let left = `M${x - 8},${bottom}`;
    let right = '';
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const sway = Math.sin(t * Math.PI * 2.2 + r() * 0.5) * 22;
      const width = 17 * (1 - t * 0.65);
      const y = bottom - height * t;
      left += ` Q${f(x + sway - width * 2)},${f(y + height / segments / 2)} ${f(x + sway - width)},${f(y)}`;
      right = ` Q${f(x + sway + width * 2)},${f(y + height / segments / 2)} ${f(x + sway + width)},${f(y)}` + right;
    }
    return `${left} L${x + 8},${bottom - height}${right} L${x + 8},${bottom} Z`;
  }

  const farReef = ridge(52, { y: 560, amplitude: 60, roughness: 4, scale: 0.8 });
  const midReef = ridge(53, { y: 610, amplitude: 36, roughness: 3 });
  const sand = ridge(54, { y: GROUND_Y, amplitude: 12, roughness: 2, scale: 2 });
  const pebbles = specks(55, 70, GROUND_Y + 30, H - 10, 6);
  const plankton = specks(56, 60, 80, 700, 3);

  interface Kelp {
    d: string;
    /** Placement as percentages of the layer. */
    left: number;
    bottom: number;
    height: number;
    aspect: string;
    delay: number;
  }

  /**
   * Kelp drawn in its own small SVG (positioned in % of the layer) so its sway
   * animates on the compositor instead of repainting the whole scene.
   */
  function kelpStalk(x: number, base: number, height: number, seed: number): Kelp {
    const box = height + 40;
    return {
      d: kelp(60, box, height, seed),
      left: ((x - 60) / W) * 100,
      bottom: ((H - base) / H) * 100,
      height: (box / H) * 100,
      aspect: `120 / ${box}`,
      delay: random() * -6,
    };
  }

  const kelpBack = Array.from({ length: 9 }, (_, i) =>
    kelpStalk(40 + i * 190 + random() * 80, 640, 260 + random() * 200, 60 + i),
  );
  const kelpFront = [80, 170, 1540].map((x, i) => kelpStalk(x, 920, 520 + random() * 160, 80 + i));
  const corals = [
    { x: 300, y: 700, h: 190, color: '#ff7a8a', seed: 90 },
    { x: 360, y: 715, h: 120, color: '#ffb35a', seed: 94 },
    { x: 1170, y: 690, h: 170, color: '#ffb35a', seed: 91 },
    { x: 1240, y: 700, h: 110, color: '#ff7a8a', seed: 95 },
    { x: 1500, y: 730, h: 230, color: '#c58cff', seed: 92 },
    { x: 520, y: 660, h: 120, color: '#ff9fc0', seed: 93 },
    { x: 860, y: 655, h: 90, color: '#7fe3c4', seed: 96 },
  ].map((c) => ({ ...c, ...coral(c.x, c.y, c.h, c.seed) }));
  const seaGrass = grass(57, GROUND_Y + 14, 150, 18, 48);

  const water = mix(TOP, BOTTOM, 45);

  const schools = Array.from({ length: 3 }, (_, i) => ({
    top: 22 + random() * 30,
    width: 11 + random() * 7,
    duration: 45 + random() * 35,
    delay: -random() * 60,
    reverse: i % 2 === 1,
    fish: Array.from({ length: 6 + Math.floor(random() * 5) }, () => ({
      x: random() * 95,
      y: 8 + random() * 34,
    })),
  }));
  const far = mix(BOTTOM, TOP, 70);
  const mid = mix(BOTTOM, '#062a44', 70);
  const sandColor = $derived(dark ? mix('#3a4a5a', BOTTOM, 40) : mix('#f2dcae', BOTTOM, 70));
</script>

<div class="world-layer" style="--depth: 4">
  <div class="surface"></div>
  <div class="godrays" class:dim={dark}></div>
  <svg class="fill" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <path d={farReef} style="fill: {far}" opacity="0.7" />
    <!-- Distant rock arch. -->
    <path
      d="M900,600 C900,420 980,330 1080,330 C1180,330 1250,420 1250,600 L1190,600 C1190,470 1140,410 1080,410 C1020,410 970,470 970,600 Z"
      style="fill: {far}"
      opacity="0.85"
    />
  </svg>
</div>

<div class="world-layer" style="--depth: 14">
  <!-- Distant schools of fish drifting through the background. -->
  {#each schools as school, i (i)}
    <svg
      class="school"
      class:reverse={school.reverse}
      style="top: {school.top}%; width: {school.width}%; animation-duration: {school.duration}s; animation-delay: {school.delay}s"
      viewBox="0 0 120 50"
      aria-hidden="true"
    >
      {#each school.fish as fish, j (j)}
        <path
          d="M{fish.x},{fish.y} q6,-4 12,0 l5,-3 v6 l-5,-3 q-6,4 -12,0 Z"
          style="fill: {mix(BOTTOM, '#04182c', 55)}"
          opacity={dark ? 0.35 : 0.55}
        />
      {/each}
    </svg>
  {/each}
  {#each kelpBack as k, i (i)}
    <svg
      class="kelp sway"
      viewBox="0 0 120 {k.aspect.split(' / ')[1]}"
      style="left: {k.left}%; bottom: {k.bottom}%; height: {k.height}%; aspect-ratio: {k.aspect}; animation-delay: {k.delay}s"
      aria-hidden="true"
    >
      <path d={k.d} style="fill: {mix('#2f8f6a', water, 45)}" />
    </svg>
  {/each}
  <svg class="fill" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <path d={midReef} style="fill: {mid}" />
  </svg>
</div>

<div class="world-layer" style="--depth: 26">
  <svg class="fill" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <linearGradient id="aqua-sand" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style="stop-color: {mix(sandColor, 'white', 80)}" />
        <stop offset="0.3" style="stop-color: {sandColor}" />
        <stop offset="1" style="stop-color: {mix(sandColor, '#01121f', 45)}" />
      </linearGradient>
    </defs>
    <path d={sand} fill="url(#aqua-sand)" />
    <!-- Sand ripples. -->
    {#each [700, 740, 790, 845] as y, i (i)}
      <path
        d="M0,{y} Q200,{y - 10} 400,{y} T800,{y} T1200,{y} T1600,{y}"
        fill="none"
        style="stroke: {mix(sandColor, '#000', 75)}"
        stroke-width={2 + i}
        opacity="0.35"
      />
    {/each}
    {#each corals as c, i (i)}
      <path
        d={c.d}
        fill="none"
        style="stroke: {dark ? mix(c.color, BOTTOM, 70) : c.color}"
        stroke-width={c.h / 7}
        stroke-linecap="round"
        class:glow={dark}
      />
      {#each c.tips as [tx, ty], j (j)}
        <circle
          cx={tx}
          cy={ty}
          r={c.h / 11}
          style="fill: {dark ? c.color : mix(c.color, 'white', 75)}"
          class:glow={dark}
        />
      {/each}
    {/each}
    <path d={seaGrass} style="fill: {dark ? '#1f5a4a' : '#3f9f6a'}" opacity="0.85" />
    <!-- Brain coral and anemone mounds. -->
    <ellipse cx="420" cy="712" rx="54" ry="34" style="fill: {dark ? '#3a4a7a' : '#7fd0c0'}" />
    <ellipse cx="420" cy="700" rx="40" ry="20" style="fill: {dark ? '#4a5a8a' : '#a6e6d4'}" />
    {#each pebbles as p, i (i)}
      <ellipse cx={p.x} cy={p.y} rx={p.r * 1.4} ry={p.r * 0.8} style="fill: {mix(sandColor, '#5a4a3a', 55)}" />
    {/each}
    <!-- Starfish and a shell. -->
    <path
      transform="translate(640 820) rotate(12)"
      d="M0,-26 L7,-8 L26,-8 L11,4 L17,23 L0,12 L-17,23 L-11,4 L-26,-8 L-7,-8 Z"
      fill="#ff8a5c"
      stroke="#e0603a"
      stroke-width="3"
      stroke-linejoin="round"
    />
    <path transform="translate(1000 850)" d="M-22,0 A22,20 0 0,1 22,0 L0,6 Z" fill="#ffe2d0" />
    <path
      transform="translate(1000 850)"
      d="M0,4 L-16,-12 M0,4 L-6,-19 M0,4 L6,-19 M0,4 L16,-12"
      stroke="#e8b8a0"
      stroke-width="2"
    />
  </svg>

  {#if dark}
    <div class="plankton">
      {#each plankton as p, i (i)}
        <span style="left: {(p.x / W) * 100}%; top: {(p.y / H) * 100}%; width: {p.r}px; animation-delay: {-p.hue * 6}s"
        ></span>
      {/each}
    </div>
  {/if}
</div>

<div class="world-layer" style="--depth: 40">
  {#each kelpFront as k, i (i)}
    <svg
      class="kelp sway slow"
      viewBox="0 0 120 {k.aspect.split(' / ')[1]}"
      style="left: {k.left}%; bottom: {k.bottom}%; height: {k.height}%; aspect-ratio: {k.aspect}; animation-delay: {k.delay}s"
      aria-hidden="true"
    >
      <path d={k.d} style="fill: {mix('#1f6a4a', BOTTOM, 60)}" />
    </svg>
  {/each}
  <svg class="fill" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <!-- Rock ledge on the right (the "Rock ledge" zone). -->
    <path
      d="M1180,900 C1170,800 1200,740 1260,722 C1330,700 1420,700 1480,730 C1540,760 1560,820 1560,900 Z"
      style="fill: {mix(BOTTOM, '#1a2a3a', 55)}"
    />
    <path
      d="M1230,744 C1290,712 1400,706 1470,736 C1400,728 1300,730 1230,744 Z"
      style="fill: {mix(TOP, BOTTOM, 40)}"
      opacity="0.7"
    />
  </svg>
  <!-- Seaweed by the "Seaweed" zone (x ≈ 0.36). -->
  <svg class="prop seaweed" viewBox="0 0 120 220" aria-hidden="true">
    <path class="sway" d={kelp(40, 220, 200, 70)} transform="translate(-10 0)" fill="#3fae6e" />
    <path class="sway slow" d={kelp(70, 220, 160, 71)} fill="#2e8f58" />
    <path class="sway" d={kelp(95, 220, 120, 72)} transform="translate(-5 0)" fill="#58c486" />
  </svg>
</div>

<style>
  .fill {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .surface {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 22%;
    background:
      repeating-radial-gradient(ellipse 60px 14px at 30% 0%, rgba(255, 255, 255, 0.12) 0 2px, transparent 3px 22px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.25), transparent);
    animation: shimmer 9s ease-in-out infinite alternate;
  }
  .godrays {
    position: absolute;
    inset: -10% -10% 30% -10%;
    background: repeating-linear-gradient(
      100deg,
      transparent 0 70px,
      rgba(255, 255, 255, 0.09) 90px 130px,
      transparent 150px 230px
    );
    mask-image: linear-gradient(to bottom, black, transparent);
    animation: rays 14s ease-in-out infinite alternate;
  }
  .godrays.dim {
    opacity: 0.25;
  }
  .kelp {
    position: absolute;
    overflow: visible;
  }
  .sway {
    transform-box: fill-box;
    transform-origin: 50% 100%;
    animation: sway 7s ease-in-out infinite alternate;
  }
  .sway.slow {
    animation-duration: 10s;
  }
  .glow {
    filter: drop-shadow(0 0 8px rgba(190, 160, 255, 0.75));
  }
  .prop {
    position: absolute;
  }
  .seaweed {
    left: 29%;
    bottom: 11%;
    width: clamp(70px, 8vw, 130px);
  }
  .plankton span {
    position: absolute;
    aspect-ratio: 1;
    border-radius: 50%;
    background: #9ff4ff;
    box-shadow: 0 0 8px 2px rgba(120, 230, 255, 0.7);
    animation: glimmer 6s ease-in-out infinite;
  }
  .school {
    position: absolute;
    left: 0;
    overflow: visible;
    animation: swim-across 60s linear infinite;
  }
  .school.reverse {
    animation-name: swim-back;
  }
  @keyframes swim-across {
    0% {
      transform: translate(-15vw, 0);
    }
    50% {
      transform: translate(50vw, -2vh);
    }
    100% {
      transform: translate(115vw, 0);
    }
  }
  @keyframes swim-back {
    0% {
      transform: translate(115vw, 0) scaleX(-1);
    }
    50% {
      transform: translate(50vw, 2vh) scaleX(-1);
    }
    100% {
      transform: translate(-15vw, 0) scaleX(-1);
    }
  }
  @keyframes sway {
    from {
      transform: rotate(-3deg);
    }
    to {
      transform: rotate(3deg);
    }
  }
  @keyframes shimmer {
    to {
      background-position:
        80px 0,
        0 0;
    }
  }
  @keyframes rays {
    to {
      transform: translateX(6%);
      opacity: 0.7;
    }
  }
  @keyframes glimmer {
    0%,
    100% {
      opacity: 0.15;
      transform: translateY(0);
    }
    50% {
      opacity: 1;
      transform: translateY(-12px);
    }
  }
</style>
