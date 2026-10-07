/**
 * Widget and preset types.
 *
 * A widget is a functional tool (focus timer, tasks, ...). Widgets work in
 * every theme. A preset is a named widget layout.
 */

export type WidgetId =
  'focus' | 'tasks' | 'notes' | 'ai' | 'system' | 'countdown' | 'weather' | 'calendar' | 'nowPlaying' | 'summary';

/** Where a docked widget is shown. */
export type WidgetDock = 'left' | 'right';

export interface WidgetConfig {
  id: WidgetId;
  enabled: boolean;
  dock: WidgetDock;
  /** Sort order inside its dock (ascending). */
  order: number;
}

export interface WidgetDescriptor {
  id: WidgetId;
  name: string;
  description: string;
  /** Short notice shown in settings for platform-limited widgets. */
  platformNote?: string;
}

/** Visibility of the hero elements in the middle of the screen. */
export interface HeroConfig {
  clock: boolean;
  date: boolean;
}

export interface WidgetLayout {
  hero: HeroConfig;
  widgets: WidgetConfig[];
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  hero: HeroConfig;
  /** Widgets enabled by the preset, in order, with their dock. */
  widgets: { id: WidgetId; dock: WidgetDock }[];
}
