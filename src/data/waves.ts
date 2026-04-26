import { LevelDefinition } from '../types';

export const levels: LevelDefinition[] = [
  {
    id: 1,
    name: 'Level 1: The Beginning',
    description: 'A simple introduction',
    gridTemplate: [], // Will be generated procedurally for now
    entryPoint: { col: 0, row: 5 },
    exitPoint: { col: 20, row: 5 },
    startGold: 150,
    startLives: 20,
    unlockCondition: null,
    waves: [
      {
        waveNumber: 1,
        prewaveDelayMs: 2000,
        groups: [
          { type: 'normal', count: 10, intervalMs: 1000, hpMultiplier: 1, speedMultiplier: 1 }
        ]
      },
      {
        waveNumber: 2,
        prewaveDelayMs: 5000,
        groups: [
          { type: 'normal', count: 15, intervalMs: 800, hpMultiplier: 1.2, speedMultiplier: 1 }
        ]
      },
      {
        waveNumber: 3,
        prewaveDelayMs: 5000,
        groups: [
          { type: 'spawn', count: 2, intervalMs: 1500, hpMultiplier: 1, speedMultiplier: 1 },
          { type: 'flying', count: 4, intervalMs: 1000, hpMultiplier: 1, speedMultiplier: 1 },
          { type: 'normal', count: 10, intervalMs: 800, hpMultiplier: 1.5, speedMultiplier: 1 },
          { type: 'fast', count: 5, intervalMs: 500, hpMultiplier: 1, speedMultiplier: 1 }
        ]
      }
    ]
  },
  {
    id: 2,
    name: 'Level 2: Speed and Power',
    description: 'Introducing fast enemies',
    gridTemplate: [],
    entryPoint: { col: 0, row: 8 },
    exitPoint: { col: 20, row: 8 },
    startGold: 200,
    startLives: 20,
    unlockCondition: 'previous',
    waves: [
      {
        waveNumber: 1,
        prewaveDelayMs: 3000,
        groups: [
          { type: 'fast', count: 10, intervalMs: 700, hpMultiplier: 1, speedMultiplier: 1 }
        ]
      },
      {
        waveNumber: 2,
        prewaveDelayMs: 5000,
        groups: [
          { type: 'normal', count: 20, intervalMs: 600, hpMultiplier: 1.5, speedMultiplier: 1 }
        ]
      },
      {
        waveNumber: 3,
        prewaveDelayMs: 5000,
        groups: [
          { type: 'fast', count: 10, intervalMs: 500, hpMultiplier: 1.2, speedMultiplier: 1 },
          { type: 'boss', count: 1, intervalMs: 1000, hpMultiplier: 1, speedMultiplier: 1 }
        ]
      }
    ]
  },
  {
    id: 3,
    name: 'Level 3: The Swarm',
    description: 'Swarm logic',
    gridTemplate: [],
    entryPoint: { col: 0, row: 3 },
    exitPoint: { col: 20, row: 3 },
    startGold: 250,
    startLives: 20,
    unlockCondition: 'previous',
    waves: [
      {
        waveNumber: 1,
        prewaveDelayMs: 2000,
        groups: [
          { type: 'group', count: 3, intervalMs: 2000, hpMultiplier: 1, speedMultiplier: 1 }
        ]
      },
      {
        waveNumber: 2,
        prewaveDelayMs: 5000,
        groups: [
          { type: 'normal', count: 15, intervalMs: 600, hpMultiplier: 1.8, speedMultiplier: 1 },
          { type: 'immune', count: 5, intervalMs: 1000, hpMultiplier: 1, speedMultiplier: 1 }
        ]
      },
      {
        waveNumber: 3,
        prewaveDelayMs: 5000,
        groups: [
          { type: 'boss', count: 2, intervalMs: 3000, hpMultiplier: 1.5, speedMultiplier: 1 }
        ]
      }
    ]
  }
];
