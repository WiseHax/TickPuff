// See https://svelte.dev/docs/kit/types#app.d.ts

declare global {
  /** App version from package.json, injected by Vite (see vite.config.js). */
  const __APP_VERSION__: string;
  /** True in the Microsoft Store package (no self-updater, startup via Windows Settings). */
  const __STORE_BUILD__: boolean;

  namespace App {}
}

export {};
