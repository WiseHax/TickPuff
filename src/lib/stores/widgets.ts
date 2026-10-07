/**
 * Widget layout: which widgets are enabled, which dock they live in and in
 * what order. Presets are named layouts applied in one click.
 */
import { derived } from 'svelte/store';
import { asBoolean, asOneOf, isRecord, persisted, type KeyValueBackend, type PersistSpec } from '$lib/core/persistence';
import type { Preset, WidgetConfig, WidgetDescriptor, WidgetDock, WidgetId, WidgetLayout } from '$lib/types';

export const WIDGETS: readonly WidgetDescriptor[] = [
  { id: 'focus', name: 'Focus', description: 'Pomodoro timer with breaks' },
  { id: 'tasks', name: 'Tasks', description: 'A short to-do list' },
  { id: 'notes', name: 'Notes', description: 'A quick scratch pad' },
  { id: 'summary', name: 'Daily summary', description: 'Focus time, tasks done and streak' },
  { id: 'countdown', name: 'Countdown', description: 'Time left until a date you choose' },
  { id: 'calendar', name: 'Calendar', description: 'Month view (local, no account sync)' },
  {
    id: 'ai',
    name: 'AI workspace',
    description: 'Antigravity and Claude Code status',
    platformNote: 'Windows desktop app',
  },
  {
    id: 'system',
    name: 'System monitor',
    description: 'CPU, memory and GPU usage',
    platformNote: 'GPU on Windows only',
  },
  {
    id: 'nowPlaying',
    name: 'Now playing',
    description: 'Current media session with controls',
    platformNote: 'Windows only',
  },
  { id: 'weather', name: 'Weather', description: 'Local conditions from Open-Meteo', platformNote: 'Needs a location' },
];

export const WIDGET_IDS = WIDGETS.map((widget) => widget.id);

const DOCKS: readonly WidgetDock[] = ['left', 'right'];

const DEFAULT_DOCK: Record<WidgetId, WidgetDock> = {
  focus: 'left',
  tasks: 'left',
  notes: 'left',
  summary: 'left',
  countdown: 'left',
  calendar: 'left',
  ai: 'left',
  system: 'right',
  nowPlaying: 'right',
  weather: 'right',
};

const DEFAULT_ENABLED: WidgetId[] = ['focus', 'ai'];

export function defaultLayout(): WidgetLayout {
  return {
    hero: { clock: true, date: true },
    widgets: WIDGET_IDS.map((id, order) => ({
      id,
      enabled: DEFAULT_ENABLED.includes(id),
      dock: DEFAULT_DOCK[id],
      order,
    })),
  };
}

/** Ensure every known widget appears exactly once with valid fields. */
export function sanitizeLayout(raw: unknown): WidgetLayout | null {
  if (!isRecord(raw)) return null;
  const defaults = defaultLayout();
  const hero = isRecord(raw.hero)
    ? { clock: asBoolean(raw.hero.clock, true), date: asBoolean(raw.hero.date, true) }
    : defaults.hero;

  const seen = new Map<WidgetId, WidgetConfig>();
  for (const entry of Array.isArray(raw.widgets) ? raw.widgets : []) {
    if (!isRecord(entry) || !WIDGET_IDS.includes(entry.id as WidgetId) || seen.has(entry.id as WidgetId)) continue;
    const id = entry.id as WidgetId;
    seen.set(id, {
      id,
      enabled: asBoolean(entry.enabled, false),
      dock: asOneOf(entry.dock, DOCKS, DEFAULT_DOCK[id]),
      order: typeof entry.order === 'number' && Number.isFinite(entry.order) ? entry.order : 1000,
    });
  }
  for (const fallback of defaults.widgets) {
    if (!seen.has(fallback.id)) seen.set(fallback.id, { ...fallback, enabled: false, order: 1000 + fallback.order });
  }
  const widgets = [...seen.values()].sort((a, b) => a.order - b.order).map((widget, order) => ({ ...widget, order }));
  return { hero, widgets };
}

/** Pre-0.1 builds stored boolean feature flags under `tickpuff-features`. */
const LEGACY_FEATURE_MAP: Record<string, WidgetId | 'clock' | 'date'> = {
  clock: 'clock',
  date: 'date',
  focus: 'focus',
  tasks: 'tasks',
  notes: 'notes',
  aiUsage: 'ai',
  systemMonitor: 'system',
  weather: 'weather',
  calendar: 'calendar',
  nowPlaying: 'nowPlaying',
  countdown: 'countdown',
};

export function migrateLegacyFeatures(raw: unknown): WidgetLayout | null {
  if (!isRecord(raw)) return null;
  const layout = defaultLayout();
  for (const [legacyKey, target] of Object.entries(LEGACY_FEATURE_MAP)) {
    if (typeof raw[legacyKey] !== 'boolean') continue;
    const enabled = raw[legacyKey] as boolean;
    if (target === 'clock' || target === 'date') layout.hero[target] = enabled;
    else {
      const widget = layout.widgets.find((w) => w.id === target);
      if (widget) widget.enabled = enabled;
    }
  }
  return layout;
}

const LEGACY_FEATURES_KEY = 'tickpuff-features';

export const widgetLayoutSpec: PersistSpec<WidgetLayout> = {
  key: 'tickpuff-widgets',
  version: 1,
  defaults: defaultLayout,
  sanitize: sanitizeLayout,
  migrate: (raw, from) => (from === 0 ? migrateLegacyFeatures(raw) : raw),
  legacy: {
    read(backend: KeyValueBackend) {
      const raw = backend.getItem(LEGACY_FEATURES_KEY);
      if (raw === null) return undefined;
      return JSON.parse(raw);
    },
    keys: () => [LEGACY_FEATURES_KEY],
  },
};

export const PRESETS: readonly Preset[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Clock, focus timer and AI workspace',
    hero: { clock: true, date: true },
    widgets: [
      { id: 'focus', dock: 'left' },
      { id: 'ai', dock: 'left' },
    ],
  },
  {
    id: 'calm',
    name: 'Calm',
    description: 'Just the clock and the world',
    hero: { clock: true, date: true },
    widgets: [],
  },
  {
    id: 'deep-work',
    name: 'Deep work',
    description: 'Focus, tasks, notes and a daily summary',
    hero: { clock: true, date: false },
    widgets: [
      { id: 'focus', dock: 'left' },
      { id: 'tasks', dock: 'left' },
      { id: 'notes', dock: 'left' },
      { id: 'summary', dock: 'right' },
    ],
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'Focus, AI tools and system load',
    hero: { clock: true, date: true },
    widgets: [
      { id: 'focus', dock: 'left' },
      { id: 'ai', dock: 'left' },
      { id: 'system', dock: 'right' },
    ],
  },
];

export function applyPreset(layout: WidgetLayout, preset: Preset): WidgetLayout {
  const chosen = new Map(preset.widgets.map((entry, index) => [entry.id, { ...entry, index }]));
  const widgets = layout.widgets
    .map((widget) => {
      const pick = chosen.get(widget.id);
      return pick
        ? { ...widget, enabled: true, dock: pick.dock, order: pick.index }
        : { ...widget, enabled: false, order: preset.widgets.length + widget.order };
    })
    .sort((a, b) => a.order - b.order)
    .map((widget, order) => ({ ...widget, order }));
  return { hero: { ...preset.hero }, widgets };
}

/** Move a widget one step up/down within its dock. */
export function moveWidget(layout: WidgetLayout, id: WidgetId, direction: -1 | 1): WidgetLayout {
  const target = layout.widgets.find((w) => w.id === id);
  if (!target) return layout;
  const dockMates = layout.widgets.filter((w) => w.dock === target.dock).sort((a, b) => a.order - b.order);
  const index = dockMates.findIndex((w) => w.id === id);
  const swapWith = dockMates[index + direction];
  if (!swapWith) return layout;
  return {
    ...layout,
    widgets: layout.widgets.map((w) =>
      w.id === id ? { ...w, order: swapWith.order } : w.id === swapWith.id ? { ...w, order: target.order } : w,
    ),
  };
}

/** Re-number `order` to 0..n-1 keeping the current relative order. */
export function normalizeOrder(layout: WidgetLayout): WidgetLayout {
  const widgets = [...layout.widgets].sort((a, b) => a.order - b.order).map((w, order) => ({ ...w, order }));
  return { ...layout, widgets };
}

function createWidgetLayout() {
  const store = persisted(widgetLayoutSpec);
  const commit = (fn: (layout: WidgetLayout) => WidgetLayout) => store.update((layout) => normalizeOrder(fn(layout)));
  const patchWidget = (id: WidgetId, patch: Partial<WidgetConfig>) =>
    commit((layout) => ({ ...layout, widgets: layout.widgets.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));
  return {
    subscribe: store.subscribe,
    toggle: (id: WidgetId) =>
      commit((layout) => ({
        ...layout,
        widgets: layout.widgets.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w)),
      })),
    /** Moving to another dock appends the widget at the end of that dock. */
    setDock: (id: WidgetId, dock: WidgetDock) => patchWidget(id, { dock, order: Number.MAX_SAFE_INTEGER }),
    move: (id: WidgetId, direction: -1 | 1) => commit((layout) => moveWidget(layout, id, direction)),
    setHero: (key: 'clock' | 'date', value: boolean) =>
      commit((layout) => ({ ...layout, hero: { ...layout.hero, [key]: value } })),
    applyPreset: (preset: Preset) => commit((layout) => applyPreset(layout, preset)),
    reset: store.reset,
  };
}

export const widgetLayout = createWidgetLayout();

/** Enabled widgets per dock, in display order. */
export const dockedWidgets = derived(widgetLayout, ($layout) => {
  const enabled = $layout.widgets.filter((w) => w.enabled).sort((a, b) => a.order - b.order);
  return {
    left: enabled.filter((w) => w.dock === 'left').map((w) => w.id),
    right: enabled.filter((w) => w.dock === 'right').map((w) => w.id),
  };
});

export const isWidgetEnabled = (id: WidgetId) =>
  derived(widgetLayout, ($layout) => $layout.widgets.some((w) => w.id === id && w.enabled));
