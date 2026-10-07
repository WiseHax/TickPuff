/**
 * Thin, typed bridge to the Tauri backend.
 *
 * The UI also runs in a plain browser (`npm run dev`) for fast iteration;
 * there, backend calls fail with PlatformUnavailableError and every feature
 * shows an "unavailable" state instead of fake data.
 */

export class PlatformUnavailableError extends Error {
  constructor(command: string) {
    super(`"${command}" needs the TickPuff desktop app (not available in a browser preview).`);
    this.name = 'PlatformUnavailableError';
  }
}

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/** Every backend command and its argument / result types. */
export interface BackendCommands {
  system_stats: { args: undefined; result: import('$lib/types').SystemStats };
  detect_ai_tools: { args: undefined; result: import('$lib/types').AIDetectionReport };
  media_current: { args: undefined; result: import('$lib/types').MediaInfo | null };
  media_control: { args: { action: import('$lib/types').MediaAction }; result: void };
}

export async function invokeCommand<K extends keyof BackendCommands>(
  command: K,
  ...args: BackendCommands[K]['args'] extends undefined ? [] : [BackendCommands[K]['args']]
): Promise<BackendCommands[K]['result']> {
  if (!isTauri()) throw new PlatformUnavailableError(command);
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<BackendCommands[K]['result']>(command, args[0] as Record<string, unknown> | undefined);
}

/** Open an http(s) URL in the user's default browser. */
export async function openExternal(url: string): Promise<void> {
  if (!/^https:\/\//.test(url)) throw new Error('Only https links can be opened.');
  if (!isTauri()) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  const { openUrl } = await import('@tauri-apps/plugin-opener');
  await openUrl(url);
}
