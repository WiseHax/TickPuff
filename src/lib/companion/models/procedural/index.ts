/**
 * Procedural companion models. These are lightweight technical stand-ins
 * built from primitives — swap in a GLB per companion for final art
 * (docs/companions.md).
 */
import type { ProceduralModelId } from '$lib/types';
import type { CompanionRig } from '../rig';
import { buildOwl, buildPenguin } from './birds';
import { buildFish, buildJellyfish, buildTurtle } from './aquatic';
import { buildDrone, buildRobot } from './machines';
import { buildBear, buildBunny, buildCat, buildFox } from './mammals';

export const PROCEDURAL_MODELS: Record<ProceduralModelId, () => CompanionRig> = {
  fox: buildFox,
  cat: buildCat,
  bear: buildBear,
  bunny: buildBunny,
  penguin: buildPenguin,
  owl: buildOwl,
  fish: buildFish,
  jellyfish: buildJellyfish,
  turtle: buildTurtle,
  robot: buildRobot,
  drone: buildDrone,
};

export function buildProcedural(id: ProceduralModelId): CompanionRig {
  return PROCEDURAL_MODELS[id]();
}
