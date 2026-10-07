import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import {
  MemoryBackend,
  loadPersisted,
  savePersisted,
  setStorageBackend,
  type PersistSpec,
} from '$lib/core/persistence/storage';
import { persisted } from '$lib/core/persistence/persisted';

interface Prefs {
  size: number;
  name: string;
}

const spec: PersistSpec<Prefs> = {
  key: 'prefs',
  version: 2,
  defaults: () => ({ size: 1, name: 'default' }),
  sanitize: (raw) => {
    const r = raw as Partial<Prefs> | null;
    if (!r || typeof r.size !== 'number' || !Number.isFinite(r.size) || typeof r.name !== 'string') return null;
    return { size: r.size, name: r.name };
  },
  migrate: (raw, from) => {
    if (from === 0) return { size: Number(raw), name: 'migrated' }; // v0 stored a bare number
    if (from === 1) return { ...(raw as object), name: 'from-v1' };
    return raw;
  },
};

let backend: MemoryBackend;

beforeEach(() => {
  backend = new MemoryBackend();
  setStorageBackend(backend);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  setStorageBackend(null);
  vi.restoreAllMocks();
});

describe('loadPersisted', () => {
  it('returns defaults when nothing is stored', () => {
    expect(loadPersisted(spec, backend)).toEqual({ size: 1, name: 'default' });
  });

  it('round-trips a value in a versioned envelope', () => {
    savePersisted(spec, { size: 5, name: 'x' }, backend);
    expect(JSON.parse(backend.getItem('prefs') as string)).toEqual({ v: 2, data: { size: 5, name: 'x' } });
    expect(loadPersisted(spec, backend)).toEqual({ size: 5, name: 'x' });
  });

  it('backs up corrupt JSON instead of silently discarding it', () => {
    backend.setItem('prefs', '{not json');
    expect(loadPersisted(spec, backend)).toEqual({ size: 1, name: 'default' });
    expect(backend.getItem('prefs.backup')).toBe('{not json');
  });

  it('treats truncated JSON as corruption, not as a legacy value', () => {
    backend.setItem('prefs', '{"v":2,"data":{"size":');
    expect(loadPersisted(spec, backend)).toEqual({ size: 1, name: 'default' });
    expect(backend.getItem('prefs.backup')).toBe('{"v":2,"data":{"size":');
  });

  it('backs up structurally invalid data', () => {
    backend.setItem('prefs', JSON.stringify({ v: 2, data: { size: 'big' } }));
    expect(loadPersisted(spec, backend)).toEqual({ size: 1, name: 'default' });
    expect(backend.getItem('prefs.backup')).toContain('big');
  });

  it('migrates legacy bare values (v0) and rewrites them as envelopes', () => {
    backend.setItem('prefs', '7');
    expect(loadPersisted(spec, backend)).toEqual({ size: 7, name: 'migrated' });
    expect(JSON.parse(backend.getItem('prefs') as string).v).toBe(2);
  });

  it('migrates older envelope versions', () => {
    backend.setItem('prefs', JSON.stringify({ v: 1, data: { size: 3, name: 'old' } }));
    expect(loadPersisted(spec, backend)).toEqual({ size: 3, name: 'from-v1' });
  });

  it('keeps a copy of data written by a newer version', () => {
    const newer = JSON.stringify({ v: 9, data: { size: 4, name: 'future' } });
    backend.setItem('prefs', newer);
    expect(loadPersisted(spec, backend)).toEqual({ size: 4, name: 'future' });
    expect(backend.getItem('prefs.backup')).toBe(newer);
  });

  it('reads legacy multi-key data once, then removes the old keys', () => {
    backend.setItem('old-size', '11');
    const withLegacy: PersistSpec<Prefs> = {
      ...spec,
      legacy: {
        read: (b) => b.getItem('old-size') ?? undefined,
        keys: () => ['old-size'],
      },
    };
    expect(loadPersisted(withLegacy, backend)).toEqual({ size: 11, name: 'migrated' });
    expect(backend.getItem('old-size')).toBeNull();
    expect(JSON.parse(backend.getItem('prefs') as string).data.size).toBe(11);
  });

  it('survives a storage backend that throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => undefined,
    };
    expect(loadPersisted(spec, broken)).toEqual({ size: 1, name: 'default' });
    expect(savePersisted(spec, { size: 2, name: 'y' }, broken)).toBe(false);
  });
});

describe('persisted store', () => {
  it('writes through on every change', () => {
    const store = persisted(spec);
    store.set({ size: 2, name: 'a' });
    expect(loadPersisted(spec, backend)).toEqual({ size: 2, name: 'a' });
    store.update((v) => ({ ...v, size: 3 }));
    expect(get(store).size).toBe(3);
    expect(loadPersisted(spec, backend).size).toBe(3);
  });

  it('debounces writes and flushes on demand', () => {
    vi.useFakeTimers();
    try {
      const store = persisted(spec, { debounceMs: 400 });
      store.set({ size: 8, name: 'typing' });
      expect(backend.getItem('prefs')).toBeNull();
      store.flush();
      expect(loadPersisted(spec, backend).size).toBe(8);
      store.set({ size: 9, name: 'typing' });
      vi.advanceTimersByTime(400);
      expect(loadPersisted(spec, backend).size).toBe(9);
    } finally {
      vi.useRealTimers();
    }
  });

  it('resets to defaults', () => {
    const store = persisted(spec);
    store.set({ size: 2, name: 'a' });
    store.reset();
    expect(get(store)).toEqual({ size: 1, name: 'default' });
    expect(loadPersisted(spec, backend)).toEqual({ size: 1, name: 'default' });
  });
});
