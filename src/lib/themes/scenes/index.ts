/** 2D scenery component per theme id (data lives in ../definitions). */
import type { Component } from 'svelte';
import type { TimeOfDay } from '$lib/types';
import AquariumScene from './AquariumScene.svelte';
import CyberpunkScene from './CyberpunkScene.svelte';
import ForestScene from './ForestScene.svelte';
import LibraryScene from './LibraryScene.svelte';
import SakuraScene from './SakuraScene.svelte';

export const SCENES: Record<string, Component<{ time: TimeOfDay }>> = {
  forest: ForestScene,
  sakura: SakuraScene,
  aquarium: AquariumScene,
  cyberpunk: CyberpunkScene,
  library: LibraryScene,
};
