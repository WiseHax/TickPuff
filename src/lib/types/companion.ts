/**
 * Companion types.
 *
 * A companion is the living character in the world. Its definition is pure
 * data; the renderer, animator and behavior controller interpret it.
 */

export type CompanionId =
  'fox' | 'cat' | 'bear' | 'bunny' | 'penguin' | 'owl' | 'fish' | 'jellyfish' | 'turtle' | 'robot' | 'drone';

/** Everything a companion can be doing. Drives both movement and animation. */
export type CompanionActivity =
  | 'idle'
  | 'walk'
  | 'run'
  | 'sit'
  | 'sleep'
  | 'wake'
  | 'stretch'
  | 'look'
  | 'react'
  | 'play'
  | 'celebrate'
  | 'focus'
  | 'weather-react'
  | 'explore';

export type Personality = 'calm' | 'playful' | 'curious' | 'energetic' | 'sleepy';

/** How the body moves; selects the procedural animation set. */
export type Locomotion = 'quadruped' | 'biped' | 'hop' | 'hover' | 'swim' | 'pulse';

/** Identifier of a built-in procedural model (used as a fallback for GLB models too). */
export type ProceduralModelId = CompanionId;

export type CompanionModelSource =
  | { kind: 'procedural'; id: ProceduralModelId }
  | {
      kind: 'gltf';
      /** URL relative to the app root, e.g. `companions/fox/fox.glb`. */
      url: string;
      /** Animation clip name per activity. Missing activities fall back to `idle`. */
      clips: Partial<Record<CompanionActivity, string>>;
      /** Procedural model shown while loading or when the asset fails. */
      fallback: ProceduralModelId;
    };

export interface CompanionDefinition {
  id: CompanionId;
  name: string;
  model: CompanionModelSource;
  locomotion: Locomotion;
  personality: Personality;
  /** Uniform scale applied to the model. Models are authored ~1.6 units tall. */
  scale: number;
  /** Movement speeds in world units per second. */
  speed: { walk: number; run: number };
  /** For swimmers and hovering companions: altitude range in world units. */
  altitude?: { min: number; max: number };
}

/** Snapshot of the companion exposed to the UI (for debugging / accessibility). */
export interface CompanionState {
  id: CompanionId;
  activity: CompanionActivity;
  moving: boolean;
}
