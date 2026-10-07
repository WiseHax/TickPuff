<script lang="ts">
  let {
    checked,
    label,
    description = '',
    onchange,
    disabled = false,
  }: {
    checked: boolean;
    label: string;
    description?: string;
    onchange: (value: boolean) => void;
    disabled?: boolean;
  } = $props();
  const id = $props.id();
</script>

<div class="row" class:disabled>
  <label for={id}>
    <span class="label">{label}</span>
    {#if description}<span class="description">{description}</span>{/if}
  </label>
  <input {id} type="checkbox" role="switch" {checked} {disabled} onchange={(e) => onchange(e.currentTarget.checked)} />
</div>

<style>
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.55rem 0;
    border-bottom: 1px solid var(--panel-line);
  }
  .row.disabled {
    opacity: 0.5;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    cursor: pointer;
  }
  .label {
    font-size: 0.9rem;
  }
  .description {
    font-size: 0.72rem;
    color: var(--panel-muted);
  }
  input {
    appearance: none;
    flex: none;
    width: 40px;
    height: 22px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.14);
    position: relative;
    cursor: pointer;
    transition: background 0.25s;
  }
  input::before {
    content: '';
    position: absolute;
    top: 4px;
    left: 4px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.25s;
  }
  input:checked {
    background: var(--accent-color);
  }
  input:checked::before {
    transform: translateX(18px);
  }
</style>
