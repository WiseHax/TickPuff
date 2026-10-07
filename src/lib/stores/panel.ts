import { writable } from 'svelte/store';

export type SettingsTab =
  'world' | 'companion' | 'clock' | 'widgets' | 'focus' | 'integrations' | 'performance' | 'about';

/** Settings panel visibility (not persisted). */
export const settingsPanel = writable<{ open: boolean; tab: SettingsTab }>({ open: false, tab: 'world' });

export function openSettings(tab: SettingsTab = 'world') {
  settingsPanel.set({ open: true, tab });
}

export function closeSettings() {
  settingsPanel.update((state) => ({ ...state, open: false }));
}
