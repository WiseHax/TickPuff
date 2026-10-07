/**
 * Versioned key/value persistence.
 *
 * Values are stored as `{ "v": <schema version>, "data": <value> }`.
 * Anything else found under a key is treated as a legacy (version 0) value
 * and handed to the store's `migrate` function, so preferences written by
 * older builds are upgraded instead of dropped.
 *
 * Unreadable or invalid data is copied to `<key>.backup` before the store
 * falls back to its defaults, so nothing is silently destroyed.
 */

export interface KeyValueBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** In-memory backend used in tests and when localStorage is unavailable. */
export class MemoryBackend implements KeyValueBackend {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  keys(): string[] {
    return [...this.map.keys()];
  }
}

let backendOverride: KeyValueBackend | null = null;
let fallbackBackend: MemoryBackend | null = null;

/** Replace the storage backend (tests). Pass null to restore the default. */
export function setStorageBackend(backend: KeyValueBackend | null): void {
  backendOverride = backend;
}

export function getStorageBackend(): KeyValueBackend {
  if (backendOverride) return backendOverride;
  try {
    if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
  } catch {
    // Access can throw when storage is disabled.
  }
  fallbackBackend ??= new MemoryBackend();
  return fallbackBackend;
}

export interface LegacySource {
  /** Read legacy data spread over other keys. Return undefined when absent. */
  read(backend: KeyValueBackend): unknown;
  /** Keys to remove once the migrated value has been written successfully. */
  keys(backend: KeyValueBackend): string[];
}

export interface PersistSpec<T> {
  key: string;
  /** Current schema version (>= 1). */
  version: number;
  defaults: () => T;
  /**
   * Validate and normalize a value of the *current* version.
   * Return null when the value is unusable.
   */
  sanitize: (raw: unknown) => T | null;
  /**
   * Upgrade data from `fromVersion` (0 = legacy, unversioned) to the current
   * version's shape. The result still goes through `sanitize`.
   */
  migrate?: (raw: unknown, fromVersion: number) => unknown;
  /** Legacy data stored under other keys, read when `key` is empty. */
  legacy?: LegacySource;
}

interface Envelope {
  v: number;
  data: unknown;
}

function isEnvelope(value: unknown): value is Envelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Envelope).v === 'number' &&
    'data' in (value as object)
  );
}

function backup(backend: KeyValueBackend, key: string, raw: string): void {
  try {
    backend.setItem(`${key}.backup`, raw);
  } catch {
    // Best effort only.
  }
}

/** Load a persisted value, applying migrations; never throws. */
export function loadPersisted<T>(spec: PersistSpec<T>, backend = getStorageBackend()): T {
  let raw: string | null;
  try {
    raw = backend.getItem(spec.key);
  } catch {
    return spec.defaults();
  }

  if (raw === null) {
    if (!spec.legacy) return spec.defaults();
    let legacyValue: unknown;
    try {
      legacyValue = spec.legacy.read(backend);
    } catch {
      legacyValue = undefined;
    }
    if (legacyValue === undefined) return spec.defaults();
    const migrated = upgrade(spec, legacyValue, 0);
    if (migrated === null) return spec.defaults();
    if (savePersisted(spec, migrated, backend)) {
      for (const legacyKey of spec.legacy.keys(backend)) {
        try {
          backend.removeItem(legacyKey);
        } catch {
          // Ignore; stale legacy keys are harmless.
        }
      }
    }
    return migrated;
  }

  let parsed: unknown;
  let corrupt = false;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Legacy builds stored some values as bare strings (e.g. `ECO`), but text
    // that starts like JSON and doesn't parse is a damaged record.
    corrupt = /^\s*[[{]/.test(raw);
    parsed = raw;
  }

  let value: T | null;
  if (corrupt) {
    value = null;
  } else if (isEnvelope(parsed)) {
    if (parsed.v === spec.version) {
      value = safeSanitize(spec, parsed.data);
    } else if (parsed.v < spec.version) {
      value = upgrade(spec, parsed.data, parsed.v);
      if (value !== null) savePersisted(spec, value, backend);
    } else {
      // Written by a newer build: read what we can, but keep a copy.
      backup(backend, spec.key, raw);
      value = safeSanitize(spec, parsed.data);
    }
  } else {
    value = upgrade(spec, parsed, 0);
    if (value !== null) savePersisted(spec, value, backend);
  }

  if (value === null) {
    backup(backend, spec.key, raw);
    console.warn(`[tickpuff] Unreadable data under "${spec.key}" was backed up; using defaults.`);
    return spec.defaults();
  }
  return value;
}

function safeSanitize<T>(spec: PersistSpec<T>, data: unknown): T | null {
  try {
    return spec.sanitize(data);
  } catch {
    return null;
  }
}

function upgrade<T>(spec: PersistSpec<T>, data: unknown, fromVersion: number): T | null {
  try {
    const migrated = spec.migrate ? spec.migrate(data, fromVersion) : data;
    return spec.sanitize(migrated);
  } catch {
    return null;
  }
}

/** Write a value; returns false when storage rejected it (quota, disabled). */
export function savePersisted<T>(spec: PersistSpec<T>, value: T, backend = getStorageBackend()): boolean {
  try {
    backend.setItem(spec.key, JSON.stringify({ v: spec.version, data: value } satisfies Envelope));
    return true;
  } catch (error) {
    console.warn(`[tickpuff] Could not save "${spec.key}"`, error);
    return false;
  }
}
