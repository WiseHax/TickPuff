import { writable, type Readable } from 'svelte/store';
import { getStorageBackend, loadPersisted, savePersisted, type PersistSpec } from './storage';

export interface PersistedStore<T> extends Readable<T> {
  set(value: T): void;
  update(fn: (value: T) => T): void;
  /** Restore defaults (and persist them). */
  reset(): void;
  /** Write any pending debounced value immediately. */
  flush(): void;
}

export interface PersistedOptions {
  /** Delay writes (e.g. for text typed per keystroke). */
  debounceMs?: number;
}

const pendingFlushes = new Set<() => void>();

if (typeof window !== 'undefined') {
  // Make sure debounced writes land before the window goes away.
  window.addEventListener('pagehide', () => pendingFlushes.forEach((flush) => flush()));
}

/** A Svelte store backed by versioned persistence (see storage.ts). */
export function persisted<T>(spec: PersistSpec<T>, options: PersistedOptions = {}): PersistedStore<T> {
  const store = writable<T>(loadPersisted(spec));
  let current: T | undefined;
  store.subscribe((value) => (current = value))();

  let timer: ReturnType<typeof setTimeout> | null = null;

  const write = () => {
    timer = null;
    pendingFlushes.delete(flush);
    savePersisted(spec, current as T, getStorageBackend());
  };

  function flush() {
    if (timer !== null) {
      clearTimeout(timer);
      write();
    }
  }

  function schedule() {
    if (!options.debounceMs) {
      write();
      return;
    }
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(write, options.debounceMs);
    pendingFlushes.add(flush);
  }

  function set(value: T) {
    current = value;
    store.set(value);
    schedule();
  }

  return {
    subscribe: store.subscribe,
    set,
    update: (fn) => set(fn(current as T)),
    reset: () => set(spec.defaults()),
    flush,
  };
}
