/**
 * Visibility-aware polling with an explicit lifecycle.
 *
 * - Never overlaps runs: the next run is scheduled after the previous finishes.
 * - Slows down (or pauses) while the window is hidden.
 * - `stop()` cancels the pending timer and aborts the in-flight run.
 */

export interface PollerOptions {
  /** Interval while the window is visible. */
  intervalMs: number;
  /** Interval while hidden; null pauses polling until visible again. */
  hiddenIntervalMs?: number | null;
  run: (signal: AbortSignal) => Promise<void> | void;
}

export interface Poller {
  start(): void;
  stop(): void;
  /** Run now (if running), then continue on the normal schedule. */
  refresh(): void;
  readonly running: boolean;
}

const isHidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';

export function createPoller(options: PollerOptions): Poller {
  let running = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let controller: AbortController | null = null;
  let inFlight = false;

  const clearTimer = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };

  function schedule() {
    clearTimer();
    if (!running) return;
    const hidden = isHidden();
    const delay = hidden ? (options.hiddenIntervalMs ?? null) : options.intervalMs;
    if (delay === null) return; // paused until visible
    timer = setTimeout(tick, delay);
  }

  async function tick() {
    timer = null;
    if (!running || inFlight) return;
    inFlight = true;
    controller = new AbortController();
    try {
      await options.run(controller.signal);
    } catch (error) {
      if (!controller.signal.aborted) console.warn('[tickpuff] poll failed', error);
    } finally {
      inFlight = false;
      controller = null;
      schedule();
    }
  }

  const onVisibility = () => {
    if (!running) return;
    if (isHidden()) schedule();
    else {
      clearTimer();
      void tick();
    }
  };

  return {
    get running() {
      return running;
    },
    start() {
      if (running) return;
      running = true;
      if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibility);
      void tick();
    },
    stop() {
      if (!running) return;
      running = false;
      clearTimer();
      controller?.abort();
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibility);
    },
    refresh() {
      if (!running) return;
      clearTimer();
      void tick();
    },
  };
}

/**
 * Reference-counted owner for a background process.
 * Each consumer (usually a mounted widget) calls `acquire()` and runs the
 * returned release function on cleanup; the process runs while count > 0.
 */
export function createSharedLifecycle(start: () => void, stop: () => void) {
  let count = 0;
  return {
    acquire(): () => void {
      count += 1;
      if (count === 1) start();
      let released = false;
      return () => {
        if (released) return;
        released = true;
        count -= 1;
        if (count === 0) stop();
      };
    },
    get consumers() {
      return count;
    },
  };
}
