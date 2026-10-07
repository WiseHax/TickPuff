<script lang="ts">
  import '../app.css';
  import '$lib/components/ui/fonts';
  import { activeColors } from '$lib/stores/world';

  let { children } = $props();

  // Theme colours → CSS variables used across the app.
  $effect(() => {
    const root = document.documentElement.style;
    root.setProperty('--bg-top', $activeColors.bgTop);
    root.setProperty('--bg-bottom', $activeColors.bgBottom);
    root.setProperty('--text-color', $activeColors.text);
    root.setProperty('--text-muted', $activeColors.textMuted);
    root.setProperty('--accent-color', $activeColors.accent);
    root.setProperty('--glass-bg', $activeColors.glass);
  });
</script>

{@render children()}
