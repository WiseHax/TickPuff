/**
 * The day the companion last said good morning, so the first time TickPuff is
 * opened each day it runs over to greet the user — once, not on every launch.
 */
import { persisted, type PersistSpec } from '$lib/core/persistence';

export const lastGreetingSpec: PersistSpec<string | null> = {
  key: 'tickpuff-last-greeting',
  version: 1,
  defaults: () => null,
  sanitize: (raw) => (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null),
};

export const lastGreeting = persisted(lastGreetingSpec);
