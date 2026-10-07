<script lang="ts">
  import { THEMES } from '$lib/themes/registry';
  import { world } from '$lib/stores/world';
  import { timeOfDay } from '$lib/core/time/clock';
</script>

<p class="hint">Each world remembers its own companion and atmosphere.</p>
<div class="grid" role="radiogroup" aria-label="World">
  {#each THEMES as theme (theme.id)}
    {@const colors = theme.colors[$timeOfDay]}
    <button
      class="card"
      role="radio"
      aria-checked={$world.themeId === theme.id}
      onclick={() => world.setTheme(theme.id)}
      style="background: linear-gradient(to bottom right, {colors.bgTop}, {colors.bgBottom})"
    >
      <span class="name">{theme.name}</span>
      <span class="desc">{theme.description}</span>
    </button>
  {/each}
</div>

<style>
  .grid {
    margin-top: 0.8rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.8rem;
  }
  .card {
    position: relative;
    height: 92px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: flex-start;
    padding: 0.75rem;
    overflow: hidden;
    text-align: left;
    transition:
      transform 0.2s,
      border-color 0.2s;
  }
  .card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.1));
  }
  .card:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.35);
  }
  .card[aria-checked='true'] {
    border: 2px solid #fff;
  }
  .name,
  .desc {
    position: relative;
  }
  .name {
    font-size: 0.95rem;
    font-weight: 500;
    color: #fff;
  }
  .desc {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.7);
  }
</style>
