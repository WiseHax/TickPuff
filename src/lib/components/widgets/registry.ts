/** Widget id → component. Descriptions live in $lib/stores/widgets (WIDGETS). */
import type { Component } from 'svelte';
import type { WidgetId } from '$lib/types';
import AIWidget from './AIWidget.svelte';
import CalendarWidget from './CalendarWidget.svelte';
import CountdownWidget from './CountdownWidget.svelte';
import FocusWidget from './FocusWidget.svelte';
import NotesWidget from './NotesWidget.svelte';
import NowPlayingWidget from './NowPlayingWidget.svelte';
import SummaryWidget from './SummaryWidget.svelte';
import SystemWidget from './SystemWidget.svelte';
import TasksWidget from './TasksWidget.svelte';
import WeatherWidget from './WeatherWidget.svelte';

export const WIDGET_COMPONENTS: Record<WidgetId, Component> = {
  focus: FocusWidget,
  tasks: TasksWidget,
  notes: NotesWidget,
  summary: SummaryWidget,
  countdown: CountdownWidget,
  calendar: CalendarWidget,
  ai: AIWidget,
  system: SystemWidget,
  nowPlaying: NowPlayingWidget,
  weather: WeatherWidget,
};
