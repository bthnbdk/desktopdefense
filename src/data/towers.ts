import { TowerConfig, TowerType } from '../types';

export const towers: Record<TowerType, TowerConfig> = {
  pellet: {
    type: 'pellet',
    name: 'Pellet',
    cost: 50,
    damage: 20,
    range: 3.5,
    fireRate: 2,
    projectileSpeed: 300,
    splashRadius: 0,
    slowAmount: 0,
    slowDuration: 0,
    chainTargets: 0,
    canTargetFlying: false,
    description: 'Fast fire rate, basic tower'
  },
  splash: {
    type: 'splash',
    name: 'Splash',
    cost: 80,
    damage: 40,
    range: 3,
    fireRate: 0.8,
    projectileSpeed: 200,
    splashRadius: 80, // pixels
    slowAmount: 0,
    slowDuration: 0,
    chainTargets: 0,
    canTargetFlying: false,
    description: 'AoE damage, hits all in radius'
  },
  slow: {
    type: 'slow',
    name: 'Slow',
    cost: 60,
    damage: 8,
    range: 3.5,
    fireRate: 1.5,
    projectileSpeed: 250,
    splashRadius: 0,
    slowAmount: 0.5, // 50% slow
    slowDuration: 2, // seconds
    chainTargets: 0,
    canTargetFlying: false,
    description: 'Applies 50% slow for 2s'
  },
  sniper: {
    type: 'sniper',
    name: 'Sniper',
    cost: 120,
    damage: 150,
    range: 8,
    fireRate: 0.4,
    projectileSpeed: 600,
    splashRadius: 0,
    slowAmount: 0,
    slowDuration: 0,
    chainTargets: 0,
    canTargetFlying: true,
    description: 'Sniper, long range, high damage'
  },
  chain: {
    type: 'chain',
    name: 'Chain',
    cost: 100,
    damage: 30,
    range: 3,
    fireRate: 1,
    projectileSpeed: 400,
    splashRadius: 0,
    slowAmount: 0,
    slowDuration: 0,
    chainTargets: 3,
    canTargetFlying: true,
    description: 'Jumps to 3 nearby enemies'
  },
  mortar: {
    type: 'mortar',
    name: 'Mortar',
    cost: 150,
    damage: 80,
    range: 6,
    fireRate: 0.5,
    projectileSpeed: 150,
    splashRadius: 120,
    slowAmount: 0,
    slowDuration: 0,
    chainTargets: 0,
    canTargetFlying: false,
    description: 'Slow, large AoE damage'
  }
};
