/** Bundled fonts (SIL Open Font License, see THIRD_PARTY_NOTICES.md) and their CSS stacks. */
import '@fontsource-variable/inter';
import '@fontsource-variable/outfit';
import '@fontsource-variable/pixelify-sans';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';
import '@fontsource/vt323/400.css';

const STACKS: Record<string, string> = {
  'Pixelify Sans': "'Pixelify Sans Variable', 'Pixelify Sans', monospace",
  VT323: "'VT323', monospace",
  'Space Mono': "'Space Mono', monospace",
  Outfit: "'Outfit Variable', 'Outfit', sans-serif",
  Inter: "'Inter Variable', 'Inter', sans-serif",
  System: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

export function fontStack(name: string): string {
  return STACKS[name] ?? STACKS.System;
}
