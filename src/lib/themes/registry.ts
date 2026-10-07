/**
 * Theme registry. To add a world: create a definition in ./definitions,
 * a scene component in ./scenes, and register both (see docs/theming.md).
 */
import type { AmbientEffect, ThemeDefinition, TimeOfDay } from '$lib/types';
import { aquarium } from './definitions/aquarium';
import { cyberpunk } from './definitions/cyberpunk';
import { forest } from './definitions/forest';
import { library } from './definitions/library';
import { sakura } from './definitions/sakura';

export const THEMES: readonly ThemeDefinition[] = [forest, sakura, aquarium, cyberpunk, library];

export const DEFAULT_THEME_ID = 'forest';

const byId = new Map(THEMES.map((theme) => [theme.id, theme]));

export function getTheme(id: string): ThemeDefinition {
  return byId.get(id) ?? (byId.get(DEFAULT_THEME_ID) as ThemeDefinition);
}

export function hasTheme(id: string): boolean {
  return byId.has(id);
}

/** Ambient effects a theme shows at the given time of day. */
export function ambientEffectsFor(theme: ThemeDefinition, time: TimeOfDay): AmbientEffect[] {
  return theme.ambient.filter((rule) => !rule.when || rule.when.includes(time)).map((rule) => rule.effect);
}
