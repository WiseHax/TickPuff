/**
 * Procedural companion models, built at runtime from smooth primitives with
 * cel shading and ink outlines. A definition can point at a GLB instead
 * (docs/companions.md).
 */
import type { ProceduralModelId } from '$lib/types';
import type { CompanionRig } from '../rig';
import { addOutlines } from '../parts';
import { buildOwl, buildPenguin } from './birds';
import { buildFish, buildJellyfish, buildTurtle } from './aquatic';
import { buildDrone, buildRobot } from './machines';
import { buildBear, buildBunny, buildCat, buildFox } from './mammals';

interface ProceduralModel {
  build: () => CompanionRig;
  /** Ink colour: a deep shade of the companion's main colour reads softer than black. */
  outline: number;
}

export const PROCEDURAL_MODELS: Record<ProceduralModelId, ProceduralModel> = {
  fox: { build: buildFox, outline: 0x3b1a0e },
  cat: { build: buildCat, outline: 0x0c0c12 },
  bear: { build: buildBear, outline: 0x2a160c },
  bunny: { build: buildBunny, outline: 0x6b5560 },
  penguin: { build: buildPenguin, outline: 0x10172a },
  owl: { build: buildOwl, outline: 0x3a2412 },
  fish: { build: buildFish, outline: 0x5a1e0c },
  jellyfish: { build: buildJellyfish, outline: 0x4a2a6a },
  turtle: { build: buildTurtle, outline: 0x15301f },
  robot: { build: buildRobot, outline: 0x1d2633 },
  drone: { build: buildDrone, outline: 0x10141c },
};

export function buildProcedural(id: ProceduralModelId): CompanionRig {
  const model = PROCEDURAL_MODELS[id];
  const rig = model.build();
  addOutlines(rig.root, model.outline);
  return rig;
}
