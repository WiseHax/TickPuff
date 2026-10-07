<script lang="ts">
  import { engineStore } from '$lib/stores/theme';
  import { timeOfDay } from '$lib/engine/time';
  import { mouseX, mouseY } from '$lib/stores/parallax';
</script>

<!-- The environment reacts to time of day via CSS filters and opacity -->
<div class="environment layer-container" class:night={$timeOfDay === 'night' || $timeOfDay === 'late-night'}>
  
  <!-- ===============================
       BACKGROUND LAYER (Slowest Parallax)
       =============================== -->
  <div class="layer sky" style="transform: translate({$mouseX * -10}px, {$mouseY * -5}px);">
    {#if $engineStore.themeId === 'forest'}
      {#if $timeOfDay === 'night' || $timeOfDay === 'late-night'}
        <div class="moon"></div>
        <div class="stars"></div>
      {:else if $timeOfDay === 'morning'}
        <div class="morning-rays"></div>
      {/if}
      <svg class="mountain-distant" viewBox="0 0 1000 300" preserveAspectRatio="none">
        <path d="M0,300 L0,150 L150,80 L350,180 L550,50 L800,160 L1000,90 L1000,300 Z" fill="rgba(0,0,0,0.15)"/>
      </svg>
      <div class="distant-fog"></div>
    
    {:else if $engineStore.themeId === 'sakura'}
      {#if $timeOfDay === 'sunset'}
        <div class="sunset-glow"></div>
        <div class="sun"></div>
      {:else if $timeOfDay === 'night' || $timeOfDay === 'late-night'}
        <div class="stars"></div>
        <div class="moon sakura-moon"></div>
      {/if}
      <svg class="mountain-distant" viewBox="0 0 1000 300" preserveAspectRatio="none">
        <path d="M0,300 L0,200 L300,120 L600,180 L900,100 L1000,140 L1000,300 Z" fill="rgba(0,0,0,0.1)"/>
      </svg>
      <div class="distant-fog"></div>

    {:else if $engineStore.themeId === 'aquarium'}
      <div class="water-godrays"></div>
      <div class="deep-water-haze"></div>

    {:else if $engineStore.themeId === 'cyberpunk'}
      {#if $timeOfDay === 'night' || $timeOfDay === 'late-night'}
        <div class="cyber-moon"></div>
      {:else}
        <div class="smog"></div>
      {/if}
      <div class="distant-city">
        <!-- Abstract distant skyscrapers -->
        <svg viewBox="0 0 1000 400" preserveAspectRatio="none" style="position: absolute; bottom: 0; width: 100%; height: 300px; opacity: 0.2;">
          <rect x="50" y="150" width="80" height="250" fill="#000"/>
          <rect x="180" y="80" width="120" height="320" fill="#000"/>
          <rect x="350" y="200" width="90" height="200" fill="#000"/>
          <rect x="500" y="100" width="150" height="300" fill="#000"/>
          <rect x="750" y="180" width="100" height="220" fill="#000"/>
          <rect x="900" y="120" width="80" height="280" fill="#000"/>
        </svg>
      </div>

    {:else if $engineStore.themeId === 'library'}
      <div class="window-light" class:dark={$timeOfDay === 'night'}></div>
    {/if}

    <!-- Background Weather Particles (slower, smaller, deeper) -->
    <div class="weather-bg">
      <!-- Managed by 3D ParticleEngine now -->
    </div>
  </div>

  <!-- ===============================
       MIDGROUND LAYER (Medium Parallax)
       =============================== -->
  <div class="layer midground" style="transform: translate({$mouseX * -20}px, {$mouseY * -10}px);">
    {#if $engineStore.themeId === 'forest'}
      <svg class="mountain-mid" viewBox="0 0 1000 250" preserveAspectRatio="none">
        <path d="M0,250 L0,120 L250,40 L450,150 L750,30 L1000,110 L1000,250 Z" fill="rgba(0,0,0,0.3)"/>
      </svg>
      <div class="tree-cluster mid-left">
        <svg viewBox="0 0 200 400"><path d="M100,0 L20,300 L80,300 L0,400 L200,400 L120,300 L180,300 Z" fill="rgba(0,0,0,0.4)"/></svg>
      </div>
      <div class="tree-cluster mid-right">
        <svg viewBox="0 0 200 350"><path d="M100,0 L20,250 L80,250 L0,350 L200,350 L120,250 L180,250 Z" fill="rgba(0,0,0,0.4)"/></svg>
      </div>
    
    {:else if $engineStore.themeId === 'sakura'}
      <svg class="mountain-mid" viewBox="0 0 1000 250" preserveAspectRatio="none">
        <path d="M0,250 L0,150 L350,60 L600,160 L1000,80 L1000,250 Z" fill="rgba(0,0,0,0.2)"/>
      </svg>
      <!-- Traditional gate (Torii) in the midground -->
      <div class="torii-gate">
        <svg viewBox="0 0 200 200">
          <rect x="20" y="40" width="160" height="15" fill="rgba(0,0,0,0.5)" rx="4"/>
          <rect x="10" y="20" width="180" height="15" fill="rgba(0,0,0,0.6)" rx="2"/>
          <path d="M10,20 Q100,-10 190,20 L190,30 Q100,0 10,30 Z" fill="rgba(0,0,0,0.7)"/>
          <rect x="40" y="40" width="15" height="160" fill="rgba(0,0,0,0.5)"/>
          <rect x="145" y="40" width="15" height="160" fill="rgba(0,0,0,0.5)"/>
        </svg>
      </div>
      <div class="lantern" style="left: 20%;" class:lit={$timeOfDay === 'night' || $timeOfDay === 'sunset' || $timeOfDay === 'late-night'}></div>

    {:else if $engineStore.themeId === 'aquarium'}
      <svg class="coral-mid" viewBox="0 0 1000 300" preserveAspectRatio="none">
        <path d="M0,300 C150,200 250,50 400,150 C550,250 700,80 1000,180 L1000,300 Z" fill="rgba(0,0,0,0.4)"/>
      </svg>
      <div class="kelp-forest">
        <svg viewBox="0 0 100 400" class="kelp k1"><path d="M50,400 Q10,300 50,200 T50,0" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="15" stroke-linecap="round"/></svg>
        <svg viewBox="0 0 100 400" class="kelp k2"><path d="M50,400 Q90,250 50,150 T50,20" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="12" stroke-linecap="round"/></svg>
      </div>

    {:else if $engineStore.themeId === 'cyberpunk'}
      <div class="mid-city">
        <!-- Detailed midground buildings -->
        <svg viewBox="0 0 1000 400" preserveAspectRatio="none" style="position: absolute; bottom: 0; width: 100%; height: 350px; opacity: 0.6;">
          <!-- Building 1 -->
          <rect x="100" y="100" width="150" height="300" fill="#0a0a0a" stroke="#222" stroke-width="2"/>
          <rect x="120" y="120" width="20" height="20" fill="#0ff" opacity="0.4"/><rect x="150" y="120" width="20" height="20" fill="#f0f" opacity="0.4"/>
          <rect x="120" y="150" width="20" height="20" fill="#0ff" opacity="0.4"/><rect x="150" y="150" width="20" height="20" fill="#f0f" opacity="0.4"/>
          <!-- Building 2 -->
          <rect x="350" y="50" width="200" height="350" fill="#0a0a0a" stroke="#222" stroke-width="2"/>
          <line x1="380" y1="50" x2="380" y2="400" stroke="#0ff" stroke-width="2" opacity="0.3"/>
          <line x1="450" y1="50" x2="450" y2="400" stroke="#0ff" stroke-width="2" opacity="0.3"/>
          <line x1="520" y1="50" x2="520" y2="400" stroke="#0ff" stroke-width="2" opacity="0.3"/>
          <!-- Building 3 -->
          <rect x="700" y="150" width="180" height="250" fill="#0a0a0a" stroke="#222" stroke-width="2"/>
          <polygon points="700,150 790,80 880,150" fill="#111" stroke="#222"/>
          <circle cx="790" cy="180" r="30" fill="none" stroke="#f0f" stroke-width="4" opacity="0.5"/>
        </svg>
      </div>
      
    {:else if $engineStore.themeId === 'library'}
      <div class="bookshelves-mid">
        <svg viewBox="0 0 1000 400" preserveAspectRatio="none" style="width: 100%; height: 100%;">
          <rect x="0" y="0" width="1000" height="400" fill="repeating-linear-gradient(0deg, #1a100d, #1a100d 30px, transparent 30px, transparent 120px)"/>
          <path d="M100,120 L120,120 L120,90 L100,90 Z" fill="rgba(0,0,0,0.5)"/>
          <path d="M130,120 L150,120 L140,80 L120,80 Z" fill="rgba(0,0,0,0.4)"/>
          <path d="M300,240 L330,240 L330,190 L300,190 Z" fill="rgba(0,0,0,0.6)"/>
        </svg>
      </div>
    {/if}
  </div>

  <!-- ===============================
       FOREGROUND LAYER (Fast Parallax)
       =============================== -->
  <div class="layer foreground" style="transform: translate({$mouseX * -40}px, {$mouseY * -20}px);">
    {#if $engineStore.themeId === 'forest'}
      <svg class="ground-fg" viewBox="0 0 1000 150" preserveAspectRatio="none">
        <path d="M0,150 L0,50 Q250,0 500,60 T1000,40 L1000,150 Z" fill="rgba(0,0,0,0.6)"/>
      </svg>
      <div class="tree-cluster fg-left">
        <!-- Giant foreground tree trunk blocking part of screen -->
        <svg viewBox="0 0 150 600"><path d="M0,0 L120,0 L150,600 L0,600 Z" fill="rgba(0,0,0,0.8)"/></svg>
      </div>
      <div class="tree-cluster fg-right">
        <!-- Detailed pine in foreground -->
        <svg viewBox="0 0 250 500"><path d="M125,0 L10,350 L80,350 L0,500 L250,500 L170,350 L240,350 Z" fill="rgba(0,0,0,0.8)"/></svg>
      </div>
      <!-- Small details -->
      <div class="mushroom" style="bottom: 10px; left: 30%;"></div>
      <div class="mushroom small" style="bottom: 5px; left: 33%;"></div>
    
    {:else if $engineStore.themeId === 'sakura'}
      <svg class="ground-fg" viewBox="0 0 1000 150" preserveAspectRatio="none">
        <path d="M0,150 L0,70 Q300,30 600,80 T1000,50 L1000,150 Z" fill="rgba(0,0,0,0.5)"/>
      </svg>
      <div class="sakura-tree-fg">
        <!-- Highly detailed sakura branch hanging over screen -->
        <svg viewBox="0 0 500 400" style="position: absolute; right: -50px; top: -50px; width: 600px; height: 500px; filter: drop-shadow(0 10px 10px rgba(0,0,0,0.5));">
          <!-- Branches -->
          <path d="M500,0 Q400,100 200,150 Q100,170 0,160" fill="none" stroke="rgba(0,0,0,0.7)" stroke-width="25" stroke-linecap="round"/>
          <path d="M300,120 Q250,250 150,300" fill="none" stroke="rgba(0,0,0,0.7)" stroke-width="15" stroke-linecap="round"/>
          <path d="M400,60 Q350,200 250,250" fill="none" stroke="rgba(0,0,0,0.7)" stroke-width="12" stroke-linecap="round"/>
          <!-- Blossom Clusters (layered) -->
          <circle cx="200" cy="150" r="40" fill="#f48fb1" opacity="0.9"/>
          <circle cx="230" cy="130" r="30" fill="#ffb2c8" opacity="0.9"/>
          <circle cx="150" cy="300" r="35" fill="#f48fb1" opacity="0.9"/>
          <circle cx="250" cy="250" r="30" fill="#ffb2c8" opacity="0.9"/>
          <circle cx="50" cy="160" r="25" fill="#f48fb1" opacity="0.9"/>
          <!-- Darker under-petals -->
          <circle cx="200" cy="160" r="30" fill="#d81b60" opacity="0.5"/>
          <circle cx="150" cy="310" r="25" fill="#d81b60" opacity="0.5"/>
        </svg>
      </div>

    {:else if $engineStore.themeId === 'aquarium'}
      <svg class="ground-fg" viewBox="0 0 1000 150" preserveAspectRatio="none">
        <path d="M0,150 L0,40 Q250,80 550,30 T1000,70 L1000,150 Z" fill="rgba(0,0,0,0.8)"/>
      </svg>
      <div class="rocks-fg">
        <svg viewBox="0 0 200 150" class="rock r1"><path d="M0,150 L20,50 Q100,0 180,60 L200,150 Z" fill="rgba(0,0,0,0.9)"/></svg>
        <svg viewBox="0 0 300 200" class="rock r2"><path d="M0,200 L40,80 Q150,10 260,90 L300,200 Z" fill="rgba(0,0,0,0.9)"/></svg>
      </div>
      <div class="seaweed">
        <svg viewBox="0 0 50 200"><path d="M25,200 Q0,150 25,100 T25,0" fill="none" stroke="#2e7d32" stroke-width="12" stroke-linecap="round" opacity="0.6"/></svg>
      </div>

    {:else if $engineStore.themeId === 'cyberpunk'}
      <!-- Detailed foreground rooftop elements -->
      <div class="rooftop-floor"></div>
      <div class="rooftop-fence">
        <svg viewBox="0 0 1000 100" preserveAspectRatio="none" style="width:100%; height:100px;">
          <!-- Wire mesh -->
          <pattern id="mesh" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M0,20 L20,0 M0,0 L20,20" fill="none" stroke="rgba(0,0,0,0.6)" stroke-width="2"/>
          </pattern>
          <rect x="0" y="20" width="1000" height="80" fill="url(#mesh)"/>
          <!-- Top railing -->
          <rect x="0" y="10" width="1000" height="15" fill="#111" stroke="#222" stroke-width="2"/>
          <!-- Posts -->
          <rect x="100" y="25" width="15" height="75" fill="#0a0a0a"/>
          <rect x="500" y="25" width="15" height="75" fill="#0a0a0a"/>
          <rect x="900" y="25" width="15" height="75" fill="#0a0a0a"/>
        </svg>
      </div>
      <!-- Detailed Neon Sign -->
      <div class="neon-sign-fg" class:flicker={$timeOfDay === 'night'}>
        <div class="neon-text">ラーメン</div>
      </div>

    {:else if $engineStore.themeId === 'library'}
      <div class="desk-fg">
        <div class="desk-surface"></div>
        <div class="desk-items">
          <!-- Stack of books -->
          <div class="book-stack">
            <div class="book b1"></div>
            <div class="book b2"></div>
            <div class="book b3"></div>
          </div>
          <div class="candle" class:lit={$timeOfDay === 'night' || $timeOfDay === 'late-night' || $timeOfDay === 'sunset'}></div>
        </div>
      </div>
    {/if}
  </div>

  <!-- ===============================
       WEATHER & PARTICLES (Independent Parallax)
       =============================== -->
  <div class="layer particles" style="transform: translate({$mouseX * -30}px, {$mouseY * -15}px);">
    <!-- FOREGROUND WEATHER SYSTEM -->
    <!-- Managed by 3D ParticleEngine now -->

    <!-- THEME SPECIFIC AMBIENCE (Fireflies, etc) -->
    {#if $engineStore.themeId === 'forest' && ($timeOfDay === 'night' || $timeOfDay === 'late-night')}
      {#each Array(6) as _, i}
        <div class="firefly" style="top: {50 + Math.random() * 30}%; left: {Math.random() * 100}%; animation-delay: {Math.random() * 4}s; animation-duration: {4 + Math.random() * 3}s;"></div>
      {/each}
    {/if}
  </div>
</div>

<style>
  /* Base structural styles */
  .layer-container {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none; overflow: hidden; z-index: 1;
    transition: filter 1.5s ease;
  }
  .layer-container.night { filter: brightness(0.8) contrast(1.1); }
  
  .layer {
    position: absolute; top: -5%; left: -5%; width: 110%; height: 110%; /* Oversized for parallax */
    transition: transform 0.1s ease-out; /* Smooth parallax response */
  }

  /* --- SKY & LIGHTING --- */
  .moon {
    position: absolute; top: 15%; right: 20%; width: 100px; height: 100px;
    border-radius: 50%; background: #fff9c4;
    box-shadow: 0 0 80px 30px rgba(255, 249, 196, 0.3), inset -10px -10px 20px rgba(0,0,0,0.1);
  }
  .sakura-moon { background: #ffebee; box-shadow: 0 0 80px 30px rgba(255, 235, 238, 0.3); }
  .cyber-moon {
    position: absolute; top: 10%; right: 15%; width: 140px; height: 140px;
    border-radius: 50%; background: transparent;
    box-shadow: inset -25px 0 0 0 #0ff, 0 0 60px rgba(0, 255, 255, 0.2);
  }
  .sun {
    position: absolute; top: 30%; left: 20%; width: 150px; height: 150px;
    border-radius: 50%; background: linear-gradient(to bottom, #ffcdd2, #ff8a80);
    box-shadow: 0 0 100px 40px rgba(255, 138, 128, 0.4);
  }
  .sunset-glow {
    position: absolute; bottom: 0; width: 100%; height: 70%;
    background: radial-gradient(circle at 30% 100%, rgba(255, 64, 129, 0.25) 0%, transparent 60%);
  }
  .stars {
    position: absolute; width: 100%; height: 100%;
    background-image: radial-gradient(1px 1px at 20px 30px, white, rgba(0,0,0,0)), radial-gradient(1px 1px at 40px 70px, rgba(255,255,255,0.8), rgba(0,0,0,0)), radial-gradient(2px 2px at 90px 40px, rgba(255,255,255,0.9), rgba(0,0,0,0));
    background-repeat: repeat; background-size: 200px 200px;
    animation: twinkle 5s infinite alternate;
  }
  .morning-rays {
    position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
    background: conic-gradient(from 0deg at 50% 0%, transparent 0deg, rgba(255,255,255,0.06) 15deg, transparent 30deg);
    animation: rotate 80s linear infinite;
  }
  .water-godrays {
    position: absolute; top: -20%; left: -20%; width: 140%; height: 140%;
    background: repeating-linear-gradient(15deg, transparent, transparent 150px, rgba(255, 255, 255, 0.04) 150px, rgba(255, 255, 255, 0.04) 180px);
    animation: sway 20s ease-in-out infinite alternate;
  }
  .window-light {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: radial-gradient(circle at 50% 40%, rgba(255, 224, 130, 0.15) 0%, transparent 70%);
    transition: opacity 2s;
  }
  .window-light.dark { opacity: 0.4; }

  /* --- MIDGROUND ENVIRONMENTS --- */
  .mountain-distant { position: absolute; bottom: 0; width: 100%; height: 350px; z-index: 1; }
  .distant-fog { position: absolute; bottom: 0; width: 100%; height: 200px; background: linear-gradient(to top, rgba(255,255,255,0.1), transparent); z-index: 2; }
  
  .mountain-mid { position: absolute; bottom: 0; width: 100%; height: 280px; }
  .tree-cluster { position: absolute; bottom: 20px; }
  .mid-left { left: 5%; width: 200px; height: 400px; }
  .mid-right { right: 10%; width: 200px; height: 350px; transform: scaleX(-1); }

  .torii-gate { position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%); width: 250px; height: 250px; opacity: 0.7; }
  .lantern { position: absolute; bottom: 120px; width: 30px; height: 45px; background: rgba(0,0,0,0.7); border-radius: 4px; transition: 0.5s; }
  .lantern.lit { background: #ffb2c8; box-shadow: 0 0 25px 5px rgba(255, 64, 129, 0.8); animation: float 5s infinite alternate; }

  .kelp-forest { position: absolute; bottom: 0; left: 20%; width: 100px; height: 400px; opacity: 0.5; }
  .kelp { position: absolute; bottom: 0; animation: sway-kelp 4s ease-in-out infinite alternate; transform-origin: bottom center; }
  .k1 { animation-delay: 0s; } .k2 { animation-delay: -2s; }

  /* --- FOREGROUND ENVIRONMENTS --- */
  .ground-fg { position: absolute; bottom: 0; width: 100%; height: 180px; z-index: 2; filter: drop-shadow(0 -5px 10px rgba(0,0,0,0.5)); }
  .fg-left { left: -50px; bottom: 0; width: 150px; height: 600px; z-index: 3; }
  .fg-right { right: -20px; bottom: 0; width: 250px; height: 500px; z-index: 3; }
  
  .mushroom { position: absolute; width: 20px; height: 25px; background: #e74c3c; border-radius: 10px 10px 0 0; z-index: 4; }
  .mushroom::after { content: ''; position: absolute; bottom: -10px; left: 5px; width: 10px; height: 10px; background: #ecf0f1; border-radius: 2px; }
  .mushroom.small { transform: scale(0.6); }

  .rocks-fg { position: absolute; bottom: -20px; width: 100%; z-index: 3; }
  .rock { position: absolute; bottom: 0; filter: drop-shadow(0 -5px 15px rgba(0,0,0,0.6)); }
  .r1 { left: 5%; width: 200px; height: 150px; }
  .r2 { right: 10%; width: 300px; height: 200px; }
  .seaweed { position: absolute; bottom: 0; left: 30%; width: 50px; height: 200px; z-index: 4; animation: sway-kelp 3s infinite alternate; transform-origin: bottom; }

  .rooftop-floor { position: absolute; bottom: 0; width: 100%; height: 120px; background: linear-gradient(to top, #000, #0a0a0a); border-top: 3px solid #222; z-index: 2; box-shadow: 0 -10px 20px rgba(0,0,0,0.5); }
  .rooftop-fence { position: absolute; bottom: 120px; width: 100%; height: 100px; z-index: 3; }
  .neon-sign-fg { position: absolute; bottom: 180px; right: 15%; padding: 10px 20px; background: rgba(0,0,0,0.8); border: 2px solid #f0f; border-radius: 4px; z-index: 4; box-shadow: inset 0 0 10px rgba(255,0,255,0.2); }
  .neon-text { color: #f0f; font-family: 'Inter', sans-serif; font-size: 1.5rem; font-weight: 900; letter-spacing: 5px; text-shadow: 0 0 10px #f0f, 0 0 20px #f0f; }
  .neon-sign-fg.flicker { animation: neon-flicker 4s infinite; }

  .desk-fg { position: absolute; bottom: 0; left: 0; width: 100%; height: 150px; z-index: 2; }
  .desk-surface { position: absolute; bottom: 0; width: 100%; height: 100px; background: #2a1a15; border-top: 10px solid #3e2723; box-shadow: inset 0 30px 30px rgba(0,0,0,0.6); }
  .desk-items { position: absolute; bottom: 100px; left: 20%; width: 60%; height: 100px; }
  .book-stack { position: absolute; bottom: 0; left: 10%; }
  .book { height: 15px; border-radius: 2px; border: 1px solid rgba(0,0,0,0.5); margin-bottom: 2px; }
  .b1 { width: 120px; background: #795548; }
  .b2 { width: 100px; background: #5d4037; transform: translateX(10px); }
  .b3 { width: 110px; background: #8d6e63; transform: translateX(5px) rotate(-2deg); }
  .candle { position: absolute; bottom: 0; right: 20%; width: 15px; height: 35px; background: #f5f5f5; border-radius: 2px; box-shadow: inset -3px 0 0 rgba(0,0,0,0.1); }
  .candle.lit::after { content: ''; position: absolute; top: -15px; left: 3px; width: 8px; height: 15px; background: #ffb300; border-radius: 50% 50% 20% 20%; box-shadow: 0 0 20px 8px rgba(255, 179, 0, 0.5); animation: flicker 0.15s infinite alternate; }

  /* --- MULTI-DEPTH WEATHER --- */
  .rain-layer-back { position: absolute; width: 100%; height: 100%; background: repeating-linear-gradient(105deg, transparent, transparent 150px, rgba(255,255,255,0.03) 150px, rgba(255,255,255,0.03) 151px); animation: rain-fall 0.6s linear infinite; }
  .rain-layer-front { position: absolute; width: 100%; height: 100%; background: repeating-linear-gradient(102deg, transparent, transparent 80px, rgba(255,255,255,0.08) 80px, rgba(255,255,255,0.08) 82px); animation: rain-fall 0.3s linear infinite; }
  .rain-layer-front.heavy { background: repeating-linear-gradient(102deg, transparent, transparent 30px, rgba(255,255,255,0.1) 30px, rgba(255,255,255,0.1) 33px); animation: rain-fall 0.2s linear infinite; }
  
  .snow-layer-back { position: absolute; width: 100%; height: 100%; background-image: radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px); background-size: 80px 80px; animation: snow-fall 15s linear infinite; }
  .snow-layer-front { position: absolute; width: 100%; height: 100%; background-image: radial-gradient(circle, rgba(255,255,255,0.8) 2px, transparent 2px), radial-gradient(circle, rgba(255,255,255,0.6) 1.5px, transparent 1.5px); background-size: 150px 150px, 90px 90px; background-position: 0 0, 45px 45px; animation: snow-fall 8s linear infinite; filter: blur(0.5px); }
  
  .fog-layer-back { position: absolute; bottom: 0; width: 100%; height: 60%; background: linear-gradient(to top, rgba(255,255,255,0.08), transparent); animation: drift 30s infinite alternate linear; }
  .fog-layer-front { position: absolute; bottom: 0; width: 100%; height: 40%; background: linear-gradient(to top, rgba(255,255,255,0.15), transparent); animation: drift 15s infinite alternate linear reverse; }

  .petal { position: absolute; width: 16px; height: 12px; background: #f8bbd0; border-radius: 16px 0 16px 0; box-shadow: inset -2px -2px 4px rgba(0,0,0,0.1); animation: fall linear infinite; }
  .bubble { position: absolute; width: 12px; height: 12px; border: 1.5px solid rgba(255,255,255,0.5); border-radius: 50%; box-shadow: inset 2px 2px 4px rgba(255,255,255,0.4); animation: rise ease-in infinite; }
  .dust-mote { position: absolute; width: 4px; height: 4px; background: rgba(255,224,130,0.8); border-radius: 50%; box-shadow: 0 0 6px 2px rgba(255,224,130,0.5); animation: float-drift 6s ease-in-out infinite alternate; }
  .firefly { position: absolute; width: 6px; height: 6px; background: #cddc39; border-radius: 50%; box-shadow: 0 0 15px 5px rgba(205, 220, 57, 0.9); animation: float-drift ease-in-out infinite alternate; }

  /* --- ANIMATIONS --- */
  @keyframes twinkle { 0% { opacity: 0.5; } 100% { opacity: 1; } }
  @keyframes drift { 0% { transform: translateX(-5%); } 100% { transform: translateX(5%); } }
  @keyframes sway { 0% { transform: translateX(-2%) rotate(0deg); } 100% { transform: translateX(2%) rotate(1deg); } }
  @keyframes sway-kelp { 0% { transform: skewX(-5deg); } 100% { transform: skewX(5deg); } }
  @keyframes float { 0% { transform: translateY(0); } 100% { transform: translateY(-15px); } }
  @keyframes float-drift { 0% { transform: translate(0, 0); opacity: 0.2; } 50% { opacity: 1; } 100% { transform: translate(30px, -30px); opacity: 0.2; } }
  @keyframes fall { 0% { transform: translate(0, 0) rotate(0deg); opacity: 1; } 100% { transform: translate(100px, 110vh) rotate(360deg); opacity: 0; } }
  @keyframes rise { 0% { transform: translateY(0) scale(1); opacity: 0.7; } 100% { transform: translateY(-110vh) scale(1.5); opacity: 0; } }
  @keyframes rotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @keyframes rain-fall { 0% { background-position: 0 0; } 100% { background-position: -150px 100vh; } }
  @keyframes snow-fall { 0% { background-position: 0 0, 45px 45px; } 100% { background-position: 80px 100vh, 120px 100vh; } }
  @keyframes flicker { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(0.9); } }
  @keyframes neon-flicker { 0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; } 20%, 24%, 55% { opacity: 0.3; } }
</style>
