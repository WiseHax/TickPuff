import type { Personality } from '$lib/types';

/** Things the companion can decide to do when it's free to choose. */
export type Choice =
  'idle' | 'explore' | 'visit' | 'run' | 'sit' | 'stretch' | 'look' | 'sleep' | 'play' | 'weather-react' | 'dance';

/** Relative weights for each personality. Higher = more likely. */
export const PERSONALITY_WEIGHTS: Record<Personality, Record<Exclude<Choice, 'weather-react' | 'dance'>, number>> = {
  calm: { idle: 3, explore: 1.5, visit: 1.5, run: 0.2, sit: 2.5, stretch: 0.6, look: 1.5, sleep: 1.2, play: 0.3 },
  playful: { idle: 1.5, explore: 2, visit: 1.2, run: 1.5, sit: 0.8, stretch: 0.6, look: 1, sleep: 0.5, play: 2.5 },
  curious: { idle: 1.5, explore: 3, visit: 2.5, run: 0.6, sit: 1, stretch: 0.5, look: 2, sleep: 0.5, play: 0.8 },
  energetic: { idle: 1, explore: 2.5, visit: 1, run: 2.5, sit: 0.5, stretch: 0.8, look: 0.8, sleep: 0.3, play: 2 },
  sleepy: { idle: 2, explore: 1, visit: 1, run: 0.2, sit: 2, stretch: 1.2, look: 1, sleep: 3, play: 0.3 },
};
