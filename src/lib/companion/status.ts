import { writable } from 'svelte/store';
import type { CompanionState } from '$lib/types';

/** Whether the WebGL layer could start. `unavailable` switches effects to CSS. */
export const rendererStatus = writable<'starting' | 'running' | 'unavailable'>('starting');

/** Latest companion state, for the accessible label of the companion button. */
export const companionState = writable<CompanionState | null>(null);
