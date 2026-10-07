/**
 * A soft two-note chime synthesized with Web Audio, so no audio file (and no
 * audio licence) is needed. The context is created lazily and closed after use.
 */
export function playChime(volume = 0.15): void {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') return;
  let context: AudioContext;
  try {
    context = new AudioContext();
  } catch {
    return;
  }
  const notes = [880, 1318.5];
  const start = context.currentTime + 0.02;
  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    const t = start + index * 0.18;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(t);
    oscillator.stop(t + 1.25);
  });
  setTimeout(() => void context.close(), 2000);
}
