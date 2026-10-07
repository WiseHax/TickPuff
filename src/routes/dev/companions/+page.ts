import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';

// Development tool only: preview every companion model and animation.
export const prerender = false;

export function load() {
  if (!dev) error(404, 'Not found');
}
