export interface CompanionDefinition {
  id: string;
  name: string;
  modelUrl?: string; // If undefined, uses procedural fallback
  proceduralId?: 'fox' | 'cat' | 'robot' | 'bear' | 'bunny' | 'penguin' | 'owl' | 'fish' | 'generic';
  scale: number;
  yOffset: number;
  zOffset: number;
  personality: 'CALM' | 'PLAYFUL' | 'CURIOUS' | 'ENERGETIC' | 'SLEEPY';
  shadowSoftness: number;
}

export const companionRegistry: Record<string, CompanionDefinition> = {
  fox: {
    id: 'fox',
    name: 'Red Fox',
    proceduralId: 'fox',
    scale: 1,
    yOffset: 0,
    zOffset: 0,
    personality: 'CURIOUS',
    shadowSoftness: 0.5,
  },
  cat: {
    id: 'cat',
    name: 'Black Cat',
    proceduralId: 'cat',
    scale: 0.9,
    yOffset: 0,
    zOffset: 0,
    personality: 'SLEEPY',
    shadowSoftness: 0.6,
  },
  robot: {
    id: 'robot',
    name: 'Helper Bot',
    proceduralId: 'robot',
    scale: 1.2,
    yOffset: 0.5, // Hovers
    zOffset: 0,
    personality: 'ENERGETIC',
    shadowSoftness: 0.2,
  },
  bunny: {
    id: 'bunny',
    name: 'Snow Bunny',
    proceduralId: 'bunny',
    scale: 0.7,
    yOffset: 0,
    zOffset: 0,
    personality: 'PLAYFUL',
    shadowSoftness: 0.8,
  },
  bear: {
    id: 'bear',
    name: 'Brown Bear',
    proceduralId: 'bear',
    scale: 1.5,
    yOffset: 0,
    zOffset: -1,
    personality: 'CALM',
    shadowSoftness: 0.4,
  },
  penguin: {
    id: 'penguin',
    name: 'Emperor Penguin',
    proceduralId: 'penguin',
    scale: 0.8,
    yOffset: 0,
    zOffset: 0,
    personality: 'PLAYFUL',
    shadowSoftness: 0.7,
  },
  jellyfish: {
    id: 'jellyfish',
    name: 'Ghost Jelly',
    proceduralId: 'generic',
    scale: 1,
    yOffset: 2,
    zOffset: 0,
    personality: 'CALM',
    shadowSoftness: 0.9,
  },
  fish: {
    id: 'fish',
    name: 'Koi Fish',
    proceduralId: 'fish',
    scale: 0.6,
    yOffset: 1,
    zOffset: 0,
    personality: 'CURIOUS',
    shadowSoftness: 0.9,
  },
  turtle: {
    id: 'turtle',
    name: 'Sea Turtle',
    proceduralId: 'generic',
    scale: 1.2,
    yOffset: 0,
    zOffset: 0,
    personality: 'CALM',
    shadowSoftness: 0.5,
  },
  drone: {
    id: 'drone',
    name: 'Scout Drone',
    proceduralId: 'robot',
    scale: 0.8,
    yOffset: 2,
    zOffset: 0,
    personality: 'ENERGETIC',
    shadowSoftness: 0.1,
  },
  owl: {
    id: 'owl',
    name: 'Barn Owl',
    proceduralId: 'owl',
    scale: 0.9,
    yOffset: 1.5,
    zOffset: 0,
    personality: 'CALM',
    shadowSoftness: 0.6,
  }
};
