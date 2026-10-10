/** 2D scenery component per theme id (data lives in ../definitions). */
import type { Component } from 'svelte';
import type { Season } from '$lib/core/time/season';
import type { TimeOfDay } from '$lib/types';

/** What every scene receives. */
export interface SceneProps {
  time: TimeOfDay;
  season: Season;
}
import AquariumScene from './AquariumScene.svelte';
import CyberpunkScene from './CyberpunkScene.svelte';
import ForestScene from './ForestScene.svelte';
import LibraryScene from './LibraryScene.svelte';
import SakuraScene from './SakuraScene.svelte';

export const SCENES: Record<string, Component<SceneProps>> = {
  forest: ForestScene,
  sakura: SakuraScene,
  aquarium: AquariumScene,
  cyberpunk: CyberpunkScene,
  library: LibraryScene,
};
