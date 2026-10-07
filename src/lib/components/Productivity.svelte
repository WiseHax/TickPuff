<script lang="ts">
  import { tasksStore } from '$lib/stores/tasks';
  import { isFocusMode, progressStore } from '$lib/stores/productivity';
  import { featuresStore } from '$lib/stores/features';
  import { aiStore } from '$lib/stores/ai';
  import { systemStore } from '$lib/stores/system';
  import { fade, slide } from 'svelte/transition';
  
  let newTaskText = '';
  
  function addTask() {
    if (newTaskText.trim()) {
      tasksStore.addTask(newTaskText.trim());
      newTaskText = '';
    }
  }

  // Focus Timer Logic
  const POMODORO_MINS = 25;
  let timerMinutes = POMODORO_MINS;
  let timerSeconds = 0;
  let timerRunning = false;
  let timerInterval: ReturnType<typeof setInterval>;
  let endTime = 0;

  function updateTimerDisplay(remainingMs: number) {
    if (remainingMs <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      $isFocusMode = false;
      progressStore.addFocusSession(POMODORO_MINS);
      timerMinutes = POMODORO_MINS;
      timerSeconds = 0;
      return;
    }
    const totalSeconds = Math.ceil(remainingMs / 1000);
    timerMinutes = Math.floor(totalSeconds / 60);
    timerSeconds = totalSeconds % 60;
  }

  function toggleTimer() {
    if (timerRunning) {
      clearInterval(timerInterval);
      timerRunning = false;
      $isFocusMode = false;
    } else {
      timerRunning = true;
      $isFocusMode = true;
      // Calculate endTime based on current display time
      endTime = Date.now() + (timerMinutes * 60 + timerSeconds) * 1000;
      
      timerInterval = setInterval(() => {
        const remaining = endTime - Date.now();
        updateTimerDisplay(remaining);
      }, 500); // 500ms for responsive updates without drift
    }
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    $isFocusMode = false;
    timerMinutes = POMODORO_MINS;
    timerSeconds = 0;
  }

  import { onDestroy } from 'svelte';
  onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
  });

  // Note Logic
  const isBrowser = typeof window !== 'undefined';
  let noteText = isBrowser ? localStorage.getItem('tickpuff-note') || '' : '';
  
  function saveNote() {
    if (isBrowser) localStorage.setItem('tickpuff-note', noteText);
  }

  $: completedTasksCount = $tasksStore.filter(t => t.completed).length;

  // Calendar Logic
  const todayDate = new Date();
  const currentMonthStr = todayDate.toLocaleString('default', { month: 'long' });
  const currentYear = todayDate.getFullYear();
  const currentDay = todayDate.getDate();
  const daysInMonth = new Date(currentYear, todayDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentYear, todayDate.getMonth(), 1).getDay();
  const calendarDays = Array.from({length: 42}, (_, i) => {
    const d = i - firstDay + 1;
    return (d > 0 && d <= daysInMonth) ? d : null;
  });
</script>

<div class="widgets-panel" class:focus-active={$isFocusMode} transition:fade>
  
  {#if $featuresStore.focus}
    <div class="widget glass" transition:slide|local>
      <div class="widget-header">
        Focus
        {#if $progressStore.streakDays > 0}
          <span class="streak" title="Daily Streak">🔥 {$progressStore.streakDays}</span>
        {/if}
      </div>
      <div class="timer-display" class:running={timerRunning}>
        {timerMinutes.toString().padStart(2, '0')}:{timerSeconds.toString().padStart(2, '0')}
      </div>
      <div class="timer-controls">
        <button class="btn-primary" on:click={toggleTimer}>{timerRunning ? 'Pause' : 'Start'}</button>
        {#if !timerRunning && (timerMinutes !== POMODORO_MINS || timerSeconds !== 0)}
          <button class="btn-ghost" on:click={resetTimer}>Reset</button>
        {/if}
      </div>
      {#if $progressStore.completedPomodoros > 0}
        <div class="daily-progress">
          <div class="progress-dot"></div>
          {$progressStore.completedPomodoros} sessions ({$progressStore.totalFocusMinutes}m)
        </div>
      {/if}
    </div>
  {/if}

  {#if $featuresStore.tasks}
    <div class="widget glass" transition:slide|local>
      <div class="widget-header">
        Tasks
        <span class="progress-text">{completedTasksCount}/{$tasksStore.length}</span>
      </div>
      <ul class="task-list">
        {#each $tasksStore as task (task.id)}
          <li class="task-item" class:completed={task.completed} transition:slide|local>
            <label class="task-label">
              <input type="checkbox" checked={task.completed} on:change={() => tasksStore.toggleTask(task.id)} />
              <span class="custom-checkbox"></span>
              <span class="task-text">{task.text}</span>
            </label>
            <button class="delete-btn" on:click={() => tasksStore.removeTask(task.id)}>×</button>
          </li>
        {/each}
      </ul>
      <form class="add-task" on:submit|preventDefault={addTask}>
        <input type="text" bind:value={newTaskText} placeholder="Add a new task..." />
      </form>
    </div>
  {/if}

  {#if $featuresStore.notes}
    <div class="widget glass" transition:slide|local>
      <div class="widget-header">Quick Notes</div>
      <textarea 
        bind:value={noteText} 
        on:input={saveNote}
        placeholder="Jot down a thought..."
        rows="2"
      ></textarea>
    </div>
  {/if}

  {#if $featuresStore.aiUsage}
    <div class="widget glass" transition:slide|local>
      <div class="widget-header">AI Workspace</div>
      <div class="ai-list">
        {#each $aiStore as provider}
          <div class="ai-provider">
            <div class="ai-title-row">
              <span class="ai-title">{provider.name}</span>
              {#if provider.plan}
                <span class="ai-plan">{provider.plan}</span>
              {/if}
            </div>
            
            <div class="ai-status">
              <span class="status-dot" class:active={provider.status === 'ACTIVE' || provider.status === 'RUNNING'}>
                {provider.status === 'NOT DETECTED' || provider.status === 'NOT INSTALLED' ? '○' : '●'}
              </span>
              <span class="status-text">{provider.status}</span>
            </div>

            {#if provider.status !== 'NOT DETECTED' && provider.status !== 'NOT INSTALLED'}
              <div class="ai-details">
                {#if provider.quotas && provider.quotas.length > 0}
                  {#each provider.quotas as quota}
                    <div class="quota-block">
                      <div class="detail-row">
                        <span>{quota.label}</span>
                        <span>{quota.remainingPercent !== null ? `${quota.remainingPercent}% remaining` : 'Unknown'}</span>
                      </div>
                      {#if quota.refreshStr}
                        <div class="detail-row refresh-row">
                          <span>Refreshes in {quota.refreshStr}</span>
                          {#if quota.resetsAt}
                            <span>{quota.resetsAt}</span>
                          {/if}
                        </div>
                      {/if}
                    </div>
                  {/each}
                {:else if provider.errorMessage}
                  <div class="detail-row">
                    <span>Usage</span>
                    <span class="unavailable">{provider.errorMessage}</span>
                  </div>
                {/if}

                {#if provider.lastUpdated}
                  <div class="last-updated" class:stale={provider.dataFreshness === 'STALE'}>
                    Last updated: {provider.lastUpdated}
                    {#if provider.dataFreshness === 'STALE'}
                      <span class="stale-badge">STALE</span>
                    {/if}
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if $featuresStore.systemMonitor}
    <div class="widget glass" transition:slide|local>
      <div class="widget-header">Local System</div>
      <div class="system-stats">
        <div class="sys-row">
          <span>CPU</span>
          <span>{$systemStore.cpu}%</span>
        </div>
        <div class="sys-row">
          <span>RAM</span>
          <span>{$systemStore.ram}%</span>
        </div>
        <div class="sys-row">
          <span>GPU</span>
          <span>{typeof $systemStore.gpu === 'number' ? `${$systemStore.gpu}%` : $systemStore.gpu}</span>
        </div>
      </div>
    </div>
  {/if}

  {#if $featuresStore.calendar}
    <div class="widget glass" transition:slide|local>
      <div class="widget-header">
        {currentMonthStr} {currentYear}
      </div>
      <div class="calendar-grid">
        <div class="cal-day-name">Su</div>
        <div class="cal-day-name">Mo</div>
        <div class="cal-day-name">Tu</div>
        <div class="cal-day-name">We</div>
        <div class="cal-day-name">Th</div>
        <div class="cal-day-name">Fr</div>
        <div class="cal-day-name">Sa</div>
        {#each calendarDays as day}
          <div class="cal-day" class:empty={day === null} class:today={day === currentDay}>
            {day !== null ? day : ''}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if $featuresStore.nowPlaying}
    <div class="widget glass now-playing" transition:slide|local>
      <div class="np-header">
        <span class="np-title">Now Playing</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
      </div>
      <div class="np-body">
        <div class="np-art"></div>
        <div class="np-info">
          <div class="np-track">Lofi Study Beats</div>
          <div class="np-artist">TickPuff Radio</div>
        </div>
      </div>
      <div class="np-progress">
        <div class="np-bar"><div class="np-fill"></div></div>
      </div>
      <div class="np-controls">
        <button class="np-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg></button>
        <button class="np-btn play"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg></button>
        <button class="np-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg></button>
      </div>
    </div>
  {/if}

</div>

<style>
  /* Calendar Styles */
  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-top: 8px;
    text-align: center;
    font-size: 0.8rem;
  }
  .cal-day-name {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.7rem;
    margin-bottom: 4px;
  }
  .cal-day {
    padding: 4px 0;
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.9);
  }
  .cal-day:not(.empty):hover {
    background: rgba(255, 255, 255, 0.1);
  }
  .cal-day.today {
    background: rgba(255, 255, 255, 0.2);
    font-weight: bold;
    color: white;
  }

  /* Now Playing Styles */
  .now-playing {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .np-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .np-body {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .np-art {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }
  .np-info {
    flex: 1;
    overflow: hidden;
  }
  .np-track {
    font-size: 0.9rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .np-artist {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
  }
  .np-progress {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }
  .np-fill {
    width: 40%;
    height: 100%;
    background: white;
    border-radius: 2px;
  }
  .np-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    margin-top: 4px;
  }
  .np-btn {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .np-btn:hover {
    color: white;
    transform: scale(1.1);
  }
  .np-btn.play {
    color: white;
  }

  .widgets-panel {
    position: absolute;
    bottom: 2rem;
    left: 2rem;
    width: 280px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    z-index: 20;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    max-height: calc(100vh - 4rem);
    overflow-y: auto;
    padding-right: 10px;
  }
  
  .widgets-panel::-webkit-scrollbar { width: 4px; }
  .widgets-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

  .widgets-panel.focus-active {
    transform: translateX(-10px);
    opacity: 0.3;
  }
  .widgets-panel.focus-active:hover {
    opacity: 1;
  }

  .widget {
    background: rgba(10, 10, 10, 0.25);
    border-color: rgba(255, 255, 255, 0.05);
    padding: 1.2rem;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    transition: all 0.3s;
  }

  .widget:hover {
    background: rgba(10, 10, 10, 0.4);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .widget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: var(--text-muted);
    font-weight: 600;
  }

  .streak { color: #ff9800; font-weight: 700; letter-spacing: normal; }
  .progress-text { font-size: 0.65rem; opacity: 0.6; letter-spacing: 1px; }

  /* Focus */
  .timer-display {
    font-size: 2.5rem;
    font-weight: 300;
    text-align: left;
    font-variant-numeric: tabular-nums;
    font-family: 'Space Mono', monospace;
    letter-spacing: -2px;
    color: var(--text-color);
    transition: color 0.3s;
  }

  .timer-display.running {
    color: var(--accent-color);
    text-shadow: 0 0 10px rgba(255,255,255,0.1);
  }

  .timer-controls { display: flex; gap: 0.5rem; }

  .btn-primary, .btn-ghost {
    padding: 0.4rem 1rem;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.2s;
  }

  .btn-primary { background: var(--text-color); color: var(--bg-bottom); }
  .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }

  .btn-ghost { background: transparent; color: var(--text-muted); }
  .btn-ghost:hover { color: var(--text-color); background: rgba(255,255,255,0.05); }

  .daily-progress {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.7rem;
    color: var(--text-muted);
    margin-top: 0.2rem;
  }
  .progress-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--accent-color);
  }

  /* Tasks */
  .task-list { list-style: none; max-height: 150px; overflow-y: auto; }

  .task-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 0.3rem 0;
    font-size: 0.85rem;
  }

  .task-label {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    cursor: pointer;
    position: relative;
    flex: 1;
  }

  .task-label input { opacity: 0; position: absolute; }

  .custom-checkbox {
    width: 14px; height: 14px;
    border: 1px solid var(--text-muted);
    border-radius: 4px;
    margin-top: 2px;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .task-label input:checked ~ .custom-checkbox {
    background: var(--text-color);
    border-color: var(--text-color);
  }

  .task-text { transition: color 0.2s; flex: 1; line-height: 1.4; }
  .completed .task-text { text-decoration: line-through; color: var(--text-muted); opacity: 0.4; }

  .delete-btn { opacity: 0; color: var(--text-muted); font-size: 1.2rem; padding: 0 0.2rem; }
  .task-item:hover .delete-btn { opacity: 1; }

  .add-task input, textarea {
    width: 100%;
    background: transparent;
    border: none;
    color: var(--text-color);
    font-size: 0.85rem;
    outline: none;
    padding: 0;
  }
  .add-task input::placeholder, textarea::placeholder { color: var(--text-muted); opacity: 0.4; }
  textarea { resize: none; line-height: 1.4; }

  /* AI */
  .ai-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .ai-provider {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .ai-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .ai-title {
    font-size: 0.85rem;
    font-weight: 500;
  }

  .ai-plan {
    font-size: 0.65rem;
    background: rgba(255,255,255,0.1);
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--accent-color);
  }

  .ai-status {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .status-dot.active {
    color: var(--accent-color);
    text-shadow: 0 0 5px var(--accent-color);
  }

  .ai-details {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-top: 0.2rem;
    padding-left: 0.5rem;
    border-left: 1px solid rgba(255,255,255,0.1);
  }

  .quota-block {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    margin-top: 0.3rem;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    color: var(--text-muted);
  }

  .refresh-row {
    font-size: 0.65rem;
    opacity: 0.7;
  }

  .unavailable {
    opacity: 0.6;
    font-style: italic;
  }

  .last-updated {
    font-size: 0.6rem;
    opacity: 0.5;
    margin-top: 0.4rem;
    text-align: right;
  }
  
  .last-updated.stale {
    color: #ff9800;
    opacity: 1;
  }

  .stale-badge {
    background: rgba(255,152,0,0.2);
    padding: 1px 4px;
    border-radius: 3px;
    margin-left: 4px;
    font-weight: 600;
  }

  /* System */
  .system-stats {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .sys-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    font-family: 'Space Mono', monospace;
  }
</style>
