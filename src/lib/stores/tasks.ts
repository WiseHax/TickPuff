import { writable } from 'svelte/store';

export type Task = {
  id: string;
  text: string;
  completed: boolean;
};

function createTasksStore() {
  const isBrowser = typeof window !== 'undefined';
  let initialTasks: Task[] = [];
  if (isBrowser) {
    const saved = localStorage.getItem('tickpuff-tasks');
    if (saved) {
      try {
        initialTasks = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse tasks from localStorage", e);
        initialTasks = [];
      }
    }
  }

  const { subscribe, set, update } = writable<Task[]>(initialTasks);

  function saveTasks(tasks: Task[]) {
    if (isBrowser) localStorage.setItem('tickpuff-tasks', JSON.stringify(tasks));
    return tasks;
  }

  return {
    subscribe,
    addTask: (text: string) => update(tasks => saveTasks([...tasks, { id: Date.now().toString(), text, completed: false }])),
    toggleTask: (id: string) => update(tasks => saveTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t))),
    removeTask: (id: string) => update(tasks => saveTasks(tasks.filter(t => t.id !== id))),
    setTasks: (tasks: Task[]) => {
      saveTasks(tasks);
      set(tasks);
    }
  };
}

export const tasksStore = createTasksStore();
