/**
 * Theme switching and persistence across "restarts" (re-importing the store
 * modules against the same storage).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import { MemoryBackend } from '$lib/core/persistence/storage';

let backend: MemoryBackend;

/** Simulate an app start: fresh modules reading the same storage. */
async function boot() {
  vi.resetModules();
  const storage = await import('$lib/core/persistence/storage');
  storage.setStorageBackend(backend);
  return import('$lib/stores/world');
}

beforeEach(() => {
  backend = new MemoryBackend();
});

afterEach(async () => (await import('$lib/core/persistence/storage')).setStorageBackend(null));

describe('world state', () => {
  it('starts in the default forest with its defaults', async () => {
    const { world, activeTheme, activeThemeState } = await boot();
    expect(get(world).themeId).toBe('forest');
    expect(get(activeTheme).name).toBe('Cozy Forest');
    expect(get(activeThemeState)).toEqual({ weather: 'fog', companion: 'cat' });
  });

  it('remembers each world’s own weather and companion when switching', async () => {
    const { world, activeThemeState } = await boot();
    world.setCompanion('fox');
    world.setWeather('snow');
    world.setTheme('sakura');
    expect(get(activeThemeState)).toEqual({ weather: 'petals', companion: 'fox' });
    world.setCompanion('bunny');
    world.setTheme('forest');
    expect(get(activeThemeState)).toEqual({ weather: 'snow', companion: 'fox' });
    world.setTheme('sakura');
    expect(get(activeThemeState).companion).toBe('bunny');
  });

  it('ignores weather and companions a world does not support', async () => {
    const { world, activeThemeState } = await boot();
    world.setTheme('library');
    world.setWeather('rain');
    world.setCompanion('jellyfish');
    expect(get(activeThemeState)).toEqual({ weather: 'dust', companion: 'owl' });
    world.setTheme('atlantis');
    expect(get(world).themeId).toBe('library');
  });

  it('persists across restarts', async () => {
    const first = await boot();
    first.world.setTheme('cyberpunk');
    first.world.setCompanion('drone');
    const second = await boot();
    expect(get(second.world).themeId).toBe('cyberpunk');
    expect(get(second.activeThemeState).companion).toBe('drone');
  });

  it('migrates pre-0.1 per-theme keys and removes them', async () => {
    backend.setItem('tickpuff-theme', 'sakura');
    backend.setItem('tickpuff-theme-state-sakura', JSON.stringify({ weather: 'rain', petId: 'cat' }));
    backend.setItem('tickpuff-theme-state-forest', JSON.stringify({ weather: 'stars', petId: 'unicorn' }));
    const { world, activeThemeState } = await boot();
    expect(get(world).themeId).toBe('sakura');
    expect(get(activeThemeState)).toEqual({ weather: 'rain', companion: 'cat' });
    // Unsupported legacy values fall back to the theme's defaults.
    world.setTheme('forest');
    expect(get(activeThemeState)).toEqual({ weather: 'fog', companion: 'cat' });
    expect(backend.getItem('tickpuff-theme')).toBeNull();
    expect(backend.getItem('tickpuff-theme-state-sakura')).toBeNull();
  });

  it('recovers from a corrupt world record', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    backend.setItem('tickpuff-world', '{"v":1,"data":');
    const { world } = await boot();
    expect(get(world).themeId).toBe('forest');
    expect(backend.getItem('tickpuff-world.backup')).toBe('{"v":1,"data":');
    vi.restoreAllMocks();
  });
});
