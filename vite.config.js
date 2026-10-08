import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

const host = process.env.TAURI_DEV_HOST;
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// https://vite.dev/config/
export default defineConfig({
  plugins: [sveltekit()],
  build: {
    // three.js alone is ~600 kB minified; it's loaded from disk, not the network.
    // Keep the limit just above it so real regressions still warn.
    chunkSizeWarningLimit: 700,
  },
  define: {
    __APP_VERSION__: JSON.stringify(version),
    // Microsoft Store build (`npm run build:msix`): the Store updates the app and manages startup.
    __STORE_BUILD__: JSON.stringify(process.env.TICKPUFF_STORE === '1'),
  },

  // Options for `tauri dev` / `tauri build`:
  // 1. keep Rust errors visible
  clearScreen: false,
  // 2. Tauri expects a fixed port; fail if it is taken
  server: {
    port: 1420,
    strictPort: true,
    host: host || '127.0.0.1',
    hmr: host ? { protocol: 'ws', host, port: 1421 } : undefined,
    // 3. don't watch the Rust sources
    watch: { ignored: ['**/src-tauri/**'] },
  },

  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
