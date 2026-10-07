<script lang="ts">
  import { time } from '$lib/stores/time';
  import { clockSettings } from '$lib/stores/clockSettings';
  import { fade } from 'svelte/transition';

  $: hours = $time.getHours();
  $: minutes = $time.getMinutes();
  $: seconds = $time.getSeconds();
  
  // Format based on settings
  $: displayHours = $clockSettings.use24Hour ? hours : (hours % 12 || 12);
  $: ampm = $clockSettings.use24Hour ? '' : (hours >= 12 ? 'PM' : 'AM');
  $: displayMinutes = minutes.toString().padStart(2, '0');
  $: displaySeconds = seconds.toString().padStart(2, '0');
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  $: dayName = days[$time.getDay()];
  $: monthName = months[$time.getMonth()];
  $: date = $time.getDate();

  $: fontFamily = $clockSettings.font === 'System' ? 'inherit' : `"${$clockSettings.font}", monospace, sans-serif`;
</script>

<div class="clock-container" transition:fade>
  <div 
    class="time" 
    style="
      font-family: {fontFamily}; 
      font-size: {$clockSettings.size}rem; 
      font-weight: {$clockSettings.weight};
      letter-spacing: {$clockSettings.letterSpacing}px;
      color: {$clockSettings.color};
    "
  >
    <span class="hours">{displayHours}</span>
    <span class="colon">:</span>
    <span class="minutes">{displayMinutes}</span>
    {#if $clockSettings.showSeconds}
      <span class="colon">:</span>
      <span class="seconds">{displaySeconds}</span>
    {/if}
    {#if ampm}
      <span class="ampm" style="font-size: {Math.max($clockSettings.size * 0.3, 1.5)}rem;">{ampm}</span>
    {/if}
  </div>
  <div class="date" style="font-family: 'Outfit', sans-serif;">
    {dayName} · {monthName} {date}
  </div>
</div>

<style>
  .clock-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10;
    text-align: center;
    text-shadow: 0 4px 30px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0,0,0,0.5);
  }

  .time {
    display: flex;
    align-items: baseline;
    line-height: 1;
    margin-bottom: 0.5rem;
    transition: all 0.3s ease;
  }

  .colon {
    margin: 0 0.05em;
    animation: blink 2s infinite;
    opacity: 0.8;
  }

  .ampm {
    margin-left: 0.5em;
    opacity: 0.8;
    letter-spacing: normal;
    font-weight: 400;
  }

  .seconds {
    opacity: 0.9;
  }

  .date {
    font-size: 1.4rem;
    font-weight: 300;
    opacity: 0.9;
    letter-spacing: 4px;
    text-transform: uppercase;
  }

  @keyframes blink {
    0%, 50%, 100% { opacity: 1; }
    25%, 75% { opacity: 0.4; }
  }
</style>
