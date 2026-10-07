// See https://svelte.dev/docs/kit/types#app.d.ts

declare global {
  /** App version from package.json, injected by Vite (see vite.config.js). */
  const __APP_VERSION__: string;

  namespace App {}
}

export {};
