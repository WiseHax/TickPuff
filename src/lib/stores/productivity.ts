/** Tasks, notes and countdown — small local productivity tools. */
import { derived } from 'svelte/store';
import { asBoolean, asNumber, asString, isRecord, persisted, type PersistSpec } from '$lib/core/persistence';
import { localDateKey, today } from '$lib/core/time/clock';

// ── Tasks ────────────────────────────────────────────────────

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  /** Local date (YYYY-MM-DD) the task was completed, for the daily summary. */
  completedOn: string | null;
}

const MAX_TASK_LENGTH = 500;
const MAX_TASKS = 200;

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export function sanitizeTasks(raw: unknown): Task[] | null {
  if (!Array.isArray(raw)) return null;
  const tasks: Task[] = [];
  const ids = new Set<string>();
  for (const entry of raw) {
    if (!isRecord(entry) || typeof entry.text !== 'string' || entry.text.trim() === '') continue;
    let id = typeof entry.id === 'string' && entry.id ? entry.id : newId();
    if (ids.has(id)) id = newId();
    ids.add(id);
    const completed = asBoolean(entry.completed, false);
    tasks.push({
      id,
      text: entry.text.slice(0, MAX_TASK_LENGTH),
      completed,
      completedOn: completed && typeof entry.completedOn === 'string' ? entry.completedOn : null,
    });
  }
  return tasks.slice(0, MAX_TASKS);
}

export const tasksSpec: PersistSpec<Task[]> = {
  key: 'tickpuff-tasks',
  version: 1,
  defaults: () => [],
  sanitize: sanitizeTasks, // v0 tasks ({id, text, completed}) sanitize directly
};

function createTasks() {
  const store = persisted(tasksSpec);
  return {
    subscribe: store.subscribe,
    add(text: string) {
      const trimmed = text.trim().slice(0, MAX_TASK_LENGTH);
      if (!trimmed) return;
      store.update((tasks) =>
        tasks.length >= MAX_TASKS
          ? tasks
          : [...tasks, { id: newId(), text: trimmed, completed: false, completedOn: null }],
      );
    },
    toggle(id: string) {
      const todayKey = localDateKey(new Date());
      store.update((tasks) =>
        tasks.map((t) =>
          t.id === id ? { ...t, completed: !t.completed, completedOn: t.completed ? null : todayKey } : t,
        ),
      );
    },
    remove: (id: string) => store.update((tasks) => tasks.filter((t) => t.id !== id)),
    clearCompleted: () => store.update((tasks) => tasks.filter((t) => !t.completed)),
  };
}

export const tasks = createTasks();

// ── Notes ────────────────────────────────────────────────────

const MAX_NOTE_LENGTH = 20_000;

export const notesSpec: PersistSpec<string> = {
  key: 'tickpuff-note',
  version: 1,
  defaults: () => '',
  // v0 stored the note as a bare string, which loads as-is.
  sanitize: (raw) => (typeof raw === 'string' ? raw.slice(0, MAX_NOTE_LENGTH) : null),
};

export const note = persisted(notesSpec, { debounceMs: 400 });

// ── Countdown ────────────────────────────────────────────────

export interface Countdown {
  label: string;
  /** Epoch ms, or null when not configured. */
  target: number | null;
}

export const countdownSpec: PersistSpec<Countdown> = {
  key: 'tickpuff-countdown',
  version: 1,
  defaults: () => ({ label: '', target: null }),
  sanitize: (raw) =>
    isRecord(raw)
      ? {
          label: asString(raw.label, '', 60),
          target: raw.target === null ? null : asNumber(raw.target, NaN) || null,
        }
      : null,
};

export const countdown = persisted(countdownSpec);

export interface CountdownParts {
  done: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function countdownParts(target: number, now: number): CountdownParts {
  const diff = Math.max(0, target - now);
  const total = Math.floor(diff / 1000);
  return {
    done: diff === 0,
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/** Tasks completed today, for the daily summary. */
export const tasksDoneToday = derived(
  [tasks, today],
  ([$tasks, $today]) => $tasks.filter((t) => t.completed && t.completedOn === $today).length,
);
