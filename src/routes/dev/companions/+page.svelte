<!--
  Companion viewer (dev only): `npm run dev`, then open /dev/companions.
  Shows every registered companion side by side playing the selected activity.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { COMPANIONS } from '$lib/companion/registry/companions';
  import { loadProceduralCompanion, type LoadedCompanion } from '$lib/companion/engine/CompanionLoader';
  import type { CompanionActivity, CompanionId } from '$lib/types';

  const ACTIVITIES: CompanionActivity[] = [
    'idle',
    'walk',
    'run',
    'sit',
    'sleep',
    'wake',
    'stretch',
    'look',
    'react',
    'play',
    'celebrate',
    'focus',
    'weather-react',
  ];

  let host: HTMLDivElement;
  let activity = $state<CompanionActivity>('idle');
  let turn = $state(0.5);
  let only = $state<CompanionId | 'all'>('all');
  let activityStart = 0;
  /** Animation clock in seconds. */
  let time = 0;

  onMount(() => {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    // three.js owns this canvas; the container is otherwise empty.
    // eslint-disable-next-line svelte/no-dom-manipulating
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#2a3340');
    scene.add(new THREE.HemisphereLight('#dfe8ff', '#3a3226', 1.2));
    const key = new THREE.DirectionalLight('#fff6e8', 1.6);
    key.position.set(4, 8, 6);
    scene.add(key);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

    const loaded: LoadedCompanion[] = Object.values(COMPANIONS).map((definition, index) => {
      const companion = loadProceduralCompanion(definition);
      const column = index % 6;
      const row = Math.floor(index / 6);
      companion.rig.root.position.set((column - 2.5) * 2.4, (definition.altitude ? 0.4 : 0) - row * 2.8, 0);
      scene.add(companion.rig.root);
      return companion;
    });

    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      camera.position.set(0, 1.6, 22);
      camera.lookAt(0, -0.6, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // A timer instead of requestAnimationFrame so the viewer also renders in background tabs.
    const timer = setInterval(() => {
      const dt = 1 / 30;
      time += dt;
      const moving = activity === 'walk' || activity === 'run';
      for (const companion of loaded) {
        companion.rig.root.visible = only === 'all' || only === companion.definition.id;
        if (only === companion.definition.id) {
          const p = companion.rig.root.position;
          camera.position.set(p.x, p.y + 1, p.z + 4.2);
          camera.lookAt(p.x, p.y + 0.7, p.z);
        }
        companion.rig.root.rotation.y = turn;
        companion.animator.update(dt, time, {
          activity,
          activityTime: time - activityStart,
          speed: moving ? (activity === 'run' ? companion.definition.speed.run : companion.definition.speed.walk) : 0,
          runSpeed: companion.definition.speed.run,
          lookYaw: 0,
          lookPitch: 0,
          lookWeight: 0,
        });
      }
      if (only === 'all') {
        camera.position.set(0, 1.6, 22);
        camera.lookAt(0, -0.6, 0);
      }
      renderer.render(scene, camera);
    }, 33);

    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', resize);
      loaded.forEach((companion) => companion.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  });
</script>

<div class="viewer">
  <div class="toolbar">
    {#each ACTIVITIES as name (name)}
      <button class:active={activity === name} onclick={() => ((activity = name), (activityStart = time))}
        >{name}</button
      >
    {/each}
    <select bind:value={only} aria-label="Companion">
      <option value="all">All companions</option>
      {#each Object.values(COMPANIONS) as c (c.id)}<option value={c.id}>{c.name}</option>{/each}
    </select>
    <label>Turn <input type="range" min={-Math.PI} max={Math.PI} step="0.05" bind:value={turn} /></label>
  </div>
  <div class="labels">
    {#each Object.values(COMPANIONS) as c (c.id)}<span>{c.name}</span>{/each}
  </div>
  <div class="stage" bind:this={host}></div>
</div>

<style>
  .viewer {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    background: #1b222b;
    color: #eee;
    font-size: 13px;
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 8px;
    align-items: center;
  }
  button {
    padding: 4px 8px;
    border-radius: 4px;
    background: #2f3a48;
  }
  button.active {
    background: #4caf50;
  }
  .labels {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    padding: 0 8px;
    opacity: 0.7;
  }
  .stage {
    flex: 1;
  }
</style>
