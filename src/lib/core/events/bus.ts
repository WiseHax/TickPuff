/**
 * Tiny typed event bus for cross-feature notifications that are not state
 * (e.g. "a focus session just completed" → the companion celebrates).
 * State belongs in stores; events only announce that something happened.
 */
import type { FocusCompletion } from '$lib/types';

export interface AppEvents {
  'focus:completed': FocusCompletion;
  'companion:poked': undefined;
}

type Handler<T> = (payload: T) => void;

const handlers = new Map<keyof AppEvents, Set<Handler<never>>>();

export function on<K extends keyof AppEvents>(event: K, handler: Handler<AppEvents[K]>): () => void {
  let set = handlers.get(event);
  if (!set) handlers.set(event, (set = new Set()));
  set.add(handler as Handler<never>);
  return () => set.delete(handler as Handler<never>);
}

export function emit<K extends keyof AppEvents>(event: K, payload: AppEvents[K]): void {
  for (const handler of handlers.get(event) ?? []) {
    try {
      (handler as Handler<AppEvents[K]>)(payload);
    } catch (error) {
      console.error(`[tickpuff] handler for "${event}" failed`, error);
    }
  }
}
