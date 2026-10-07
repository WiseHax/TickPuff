import { writable } from 'svelte/store';

export const mouseX = writable(0.5);
export const mouseY = writable(0.5);

if (typeof window !== 'undefined') {
  let ticking = false;
  window.addEventListener('mousemove', (e) => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = (e.clientY / window.innerHeight) * 2 - 1;
        mouseX.set(x);
        mouseY.set(y);
        ticking = false;
      });
      ticking = true;
    }
  });
}
