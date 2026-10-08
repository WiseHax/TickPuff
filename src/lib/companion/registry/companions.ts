/**
 * Companion registry.
 *
 * Every companion ships as a procedural model (built at runtime with cel
 * shading and outlines). A definition can point at a GLB/GLTF asset instead —
 * see docs/companions.md.
 */
import type { CompanionDefinition, CompanionId } from '$lib/types';

export const COMPANIONS: Record<CompanionId, CompanionDefinition> = {
  fox: {
    id: 'fox',
    name: 'Red Fox',
    model: { kind: 'procedural', id: 'fox' },
    locomotion: 'quadruped',
    personality: 'curious',
    scale: 1,
    speed: { walk: 1.3, run: 3.2 },
  },
  cat: {
    id: 'cat',
    name: 'Black Cat',
    model: { kind: 'procedural', id: 'cat' },
    locomotion: 'quadruped',
    personality: 'sleepy',
    scale: 0.9,
    speed: { walk: 1.1, run: 3 },
  },
  bear: {
    id: 'bear',
    name: 'Brown Bear',
    model: { kind: 'procedural', id: 'bear' },
    locomotion: 'quadruped',
    personality: 'calm',
    scale: 1.15,
    speed: { walk: 0.9, run: 2.2 },
  },
  bunny: {
    id: 'bunny',
    name: 'Snow Bunny',
    model: { kind: 'procedural', id: 'bunny' },
    locomotion: 'hop',
    personality: 'playful',
    scale: 0.85,
    speed: { walk: 1.2, run: 2.8 },
  },
  penguin: {
    id: 'penguin',
    name: 'Little Penguin',
    model: { kind: 'procedural', id: 'penguin' },
    locomotion: 'swim',
    personality: 'playful',
    scale: 0.9,
    speed: { walk: 1.4, run: 3.2 },
    altitude: { min: 0.4, max: 2.6 },
  },
  owl: {
    id: 'owl',
    name: 'Barn Owl',
    model: { kind: 'procedural', id: 'owl' },
    locomotion: 'biped',
    personality: 'calm',
    scale: 0.9,
    speed: { walk: 0.7, run: 1.6 },
  },
  fish: {
    id: 'fish',
    name: 'Koi Fish',
    model: { kind: 'procedural', id: 'fish' },
    locomotion: 'swim',
    personality: 'curious',
    scale: 0.8,
    speed: { walk: 1.2, run: 3 },
    altitude: { min: 0.6, max: 3 },
  },
  jellyfish: {
    id: 'jellyfish',
    name: 'Ghost Jelly',
    model: { kind: 'procedural', id: 'jellyfish' },
    locomotion: 'pulse',
    personality: 'calm',
    scale: 0.9,
    speed: { walk: 0.6, run: 1.2 },
    altitude: { min: 1, max: 3.2 },
  },
  turtle: {
    id: 'turtle',
    name: 'Sea Turtle',
    model: { kind: 'procedural', id: 'turtle' },
    locomotion: 'swim',
    personality: 'sleepy',
    scale: 1,
    speed: { walk: 0.7, run: 1.5 },
    altitude: { min: 0.4, max: 2.2 },
  },
  robot: {
    id: 'robot',
    name: 'Helper Bot',
    model: { kind: 'procedural', id: 'robot' },
    locomotion: 'hover',
    personality: 'energetic',
    scale: 1,
    speed: { walk: 1.3, run: 3 },
    altitude: { min: 0.35, max: 0.6 },
  },
  drone: {
    id: 'drone',
    name: 'Scout Drone',
    model: { kind: 'procedural', id: 'drone' },
    locomotion: 'hover',
    personality: 'curious',
    scale: 0.9,
    speed: { walk: 1.6, run: 3.6 },
    altitude: { min: 1.4, max: 3 },
  },
};

export const COMPANION_IDS = Object.keys(COMPANIONS) as CompanionId[];

export function isCompanionId(value: unknown): value is CompanionId {
  return typeof value === 'string' && value in COMPANIONS;
}

export function getCompanion(id: CompanionId): CompanionDefinition {
  return COMPANIONS[id];
}
