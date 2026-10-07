import { writable } from 'svelte/store';

export const isFocusMode = writable(false);

interface ProgressState {
  completedPomodoros: number;
  totalFocusMinutes: number;
  streakDays: number;
  lastActiveDate: string;
}

function createProgressStore() {
  const isBrowser = typeof window !== 'undefined';
  
  const today = new Date().toDateString();
  let initialState: ProgressState = {
    completedPomodoros: 0,
    totalFocusMinutes: 0,
    streakDays: 0,
    lastActiveDate: today
  };

  if (isBrowser) {
    const saved = localStorage.getItem('tickpuff-progress');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.lastActiveDate !== today) {
        // Reset daily stats but keep streak if consecutive
        const lastDate = new Date(parsed.lastActiveDate);
        const diff = (new Date(today).getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
        
        initialState = {
          completedPomodoros: 0,
          totalFocusMinutes: 0,
          streakDays: diff === 1 ? parsed.streakDays + 1 : (diff === 0 ? parsed.streakDays : 0),
          lastActiveDate: today
        };
      } else {
        initialState = parsed;
      }
    }
  }

  const { subscribe, update } = writable<ProgressState>(initialState);

  return {
    subscribe,
    addFocusSession: (minutes: number) => {
      update(state => {
        const newState = {
          ...state,
          completedPomodoros: state.completedPomodoros + 1,
          totalFocusMinutes: state.totalFocusMinutes + minutes,
          lastActiveDate: today,
          streakDays: state.streakDays === 0 ? 1 : state.streakDays
        };
        if (isBrowser) localStorage.setItem('tickpuff-progress', JSON.stringify(newState));
        return newState;
      });
    }
  };
}

export const progressStore = createProgressStore();
