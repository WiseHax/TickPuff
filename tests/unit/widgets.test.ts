import { describe, expect, it } from 'vitest';
import {
  PRESETS,
  WIDGET_IDS,
  applyPreset,
  defaultLayout,
  migrateLegacyFeatures,
  moveWidget,
  normalizeOrder,
  sanitizeLayout,
} from '$lib/stores/widgets';

const enabledIds = (layout: ReturnType<typeof defaultLayout>) =>
  layout.widgets
    .filter((w) => w.enabled)
    .sort((a, b) => a.order - b.order)
    .map((w) => w.id);

describe('widget layout', () => {
  it('migrates legacy feature flags (including renamed keys)', () => {
    const layout = migrateLegacyFeatures({
      clock: true,
      date: false,
      focus: false,
      tasks: true,
      aiUsage: true,
      systemMonitor: true,
    });
    expect(layout?.hero).toEqual({ clock: true, date: false });
    expect(enabledIds(layout!)).toEqual(expect.arrayContaining(['tasks', 'ai', 'system']));
    expect(enabledIds(layout!)).not.toContain('focus');
  });

  it('repairs layouts with unknown, duplicate or missing widgets', () => {
    const layout = sanitizeLayout({
      hero: { clock: false },
      widgets: [
        { id: 'tasks', enabled: true, dock: 'right', order: 3 },
        { id: 'tasks', enabled: false, dock: 'left', order: 1 },
        { id: 'teleporter', enabled: true },
        { id: 'notes', enabled: true, dock: 'middle', order: 0 },
      ],
    });
    expect(layout).not.toBeNull();
    expect(layout!.widgets.map((w) => w.id).sort()).toEqual([...WIDGET_IDS].sort());
    expect(layout!.widgets.find((w) => w.id === 'tasks')).toMatchObject({ enabled: true, dock: 'right' });
    expect(layout!.widgets.find((w) => w.id === 'notes')?.dock).toBe('left');
    expect(layout!.hero).toEqual({ clock: false, date: true });
    expect(layout!.widgets.map((w) => w.order)).toEqual(layout!.widgets.map((_, i) => i));
  });

  it('applies presets: exactly the preset widgets, in preset order and docks', () => {
    const developer = PRESETS.find((p) => p.id === 'developer')!;
    const layout = applyPreset(defaultLayout(), developer);
    expect(enabledIds(layout)).toEqual(['focus', 'ai', 'system']);
    expect(layout.widgets.find((w) => w.id === 'system')?.dock).toBe('right');
    const calm = applyPreset(
      layout,
      PRESETS.find((p) => p.id === 'calm')!,
    );
    expect(enabledIds(calm)).toEqual([]);
  });

  it('moves widgets within their dock only', () => {
    const base = normalizeOrder(
      applyPreset(
        defaultLayout(),
        PRESETS.find((p) => p.id === 'deep-work')!,
      ),
    );
    const moved = normalizeOrder(moveWidget(base, 'tasks', -1));
    const left = moved.widgets
      .filter((w) => w.dock === 'left' && w.enabled)
      .sort((a, b) => a.order - b.order)
      .map((w) => w.id);
    expect(left.slice(0, 3)).toEqual(['tasks', 'focus', 'notes']);
    // Can't move past the edge.
    expect(moveWidget(moved, 'tasks', -1)).toBe(moved);
  });
});
