<script lang="ts">
  import '../app.css';
  import { activeColors } from '$lib/stores/theme';
  import { onMount } from 'svelte';

  $: {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--bg-top', $activeColors.bgTop);
      root.style.setProperty('--bg-bottom', $activeColors.bgBottom);
      root.style.setProperty('--text-color', $activeColors.text);
      root.style.setProperty('--text-muted', $activeColors.textMuted);
      root.style.setProperty('--accent-color', $activeColors.accent);
      root.style.setProperty('--glass-bg', $activeColors.glass);
    }
  }
</script>

<slot />
