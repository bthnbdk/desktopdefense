import { WaveDefinition, EnemyType, Point } from '../types';
import { EnemyManager } from './EnemyManager';
import { EventBus } from './EventBus';

export class WaveManager {
  private waves: WaveDefinition[] = [];
  public currentWaveIndex: number = 0;
  private activeGroups: Array<{
    type: EnemyType;
    remaining: number;
    intervalMax: number;
    intervalTimer: number;
    hpMultiplier: number;
    speedMultiplier: number;
  }> = [];

  public prewaveTimer: number = 0;
  public isBetweenWaves: boolean = true;
  private isFinished: boolean = false;

  constructor(private eventBus: EventBus, private enemyManager: EnemyManager) {}

  public init(waves: WaveDefinition[]) {
    // Only use the first wave as a base, or we can just keep the defined ones and infinite after.
    this.waves = [...waves];
    this.currentWaveIndex = 0;
    this.activeGroups = [];
    this.isFinished = false;
    
    if (this.waves.length === 0) {
        this.generateInfiniteWave(0);
    }

    this.isBetweenWaves = true;
    this.prewaveTimer = this.waves[0].prewaveDelayMs / 1000;
  }

  private generateInfiniteWave(index: number) {
      const waveNumber = index + 1;
      // Mathematical Balancing for Infinite Scaling
      // Enemy HP factor: 25% more HP per wave
      const hpMult = Math.pow(1.25, waveNumber - 1);
      // Speed scales very slightly, capped at 2.5x base mapping
      const speedMult = Math.min(Math.pow(1.02, waveNumber - 1), 2.5);
      
      const count = 10 + Math.floor(waveNumber * 1.5);
      
      const types: EnemyType[] = ['normal'];
      if (waveNumber >= 3) types.push('fast');
      if (waveNumber >= 5) types.push('flying', 'immune');
      if (waveNumber >= 8) types.push('spawn');
      if (waveNumber % 5 === 0) types.push('boss'); // Boss every 5 waves
      
      const waveGroups = [];
      const numGroups = 1 + Math.floor(waveNumber / 4);
      
      for (let i = 0; i < numGroups; i++) {
          const type = types[Math.floor(Math.random() * types.length)];
          let gCount = Math.floor(count / numGroups);
          if (type === 'boss') gCount = 1 + Math.floor(waveNumber / 10);
          
          waveGroups.push({
              type,
              count: max(1, gCount),
              intervalMs: Math.max(300, 1000 - waveNumber * 20),
              hpMultiplier: hpMult,
              speedMultiplier: speedMult
          });
      }
      
      this.waves.push({
          waveNumber,
          prewaveDelayMs: 4000,
          groups: waveGroups
      });
  }

  public sendNextWaveEarly() {
    console.log('[WaveManager] sendNextWaveEarly. isBetweenWaves:', this.isBetweenWaves);
    if (this.isBetweenWaves && !this.isFinished) {
      this.prewaveTimer = 0; // force start
    } else if (!this.isBetweenWaves && !this.isFinished) {
      // Allow force start next wave concurrently
      if (this.currentWaveIndex + 1 >= this.waves.length) {
          this.generateInfiniteWave(this.currentWaveIndex + 1);
      }
      this.startWave(this.currentWaveIndex + 1);
    }
  }

  public update(dt: number, startPoint: Point, cellSize: number, autoWave: boolean = false) {
    if (this.isFinished) return;

    if (this.isBetweenWaves) {
      // If autoWave is true, we always count down.
      // If autoWave is false, we only count down if it's already "pushed" to near-zero or zero.
      if (autoWave || this.prewaveTimer <= 0) {
        this.prewaveTimer -= dt;
      }
      
      if (this.prewaveTimer <= 0) {
        console.log('[WaveManager] Timer zero, starting wave:', this.currentWaveIndex);
        this.startWave(this.currentWaveIndex);
      }
    }

    let spawningInProgress = false;

    // Process all active groups across all started waves
    for (let i = this.activeGroups.length - 1; i >= 0; i--) {
      const g = this.activeGroups[i];
      g.intervalTimer -= dt;
      
      if (g.intervalTimer <= 0) {
        // Spawn
        this.spawn(g.type, startPoint, cellSize, g.hpMultiplier, g.speedMultiplier, this.currentWaveIndex + 1);
        g.remaining--;
        g.intervalTimer = g.intervalMax;

        if (g.remaining <= 0) {
          this.activeGroups.splice(i, 1);
        }
      }
      spawningInProgress = true;
    }

    // Check if wave is fully spawned and clear
    if (!spawningInProgress && !this.isBetweenWaves) {
       // Wave finished spawning
       this.currentWaveIndex++;
       if (this.currentWaveIndex >= this.waves.length) {
           this.generateInfiniteWave(this.currentWaveIndex);
       }
       
       this.isBetweenWaves = true;
       this.prewaveTimer = this.waves[this.currentWaveIndex].prewaveDelayMs / 1000;
    }
  }

  private startWave(index: number) {
    this.currentWaveIndex = index;
    const wave = this.waves[index];
    this.isBetweenWaves = false;

    for (const bg of wave.groups) {
      this.activeGroups.push({
        type: bg.type,
        remaining: bg.count,
        intervalMax: bg.intervalMs / 1000,
        intervalTimer: bg.intervalMs / 1000, 
        hpMultiplier: bg.hpMultiplier,
        speedMultiplier: bg.speedMultiplier
      });
      this.activeGroups[this.activeGroups.length-1].intervalTimer = 0;
    }
  }

  private spawn(type: EnemyType, startPoint: Point, cellSize: number, hpMult: number, speedMult: number, waveNumber: number) {
    const startX = startPoint.col * cellSize + cellSize / 2;
    const startY = startPoint.row * cellSize + cellSize / 2;
    
    let baseHp = 100 * hpMult;
    let baseSpeed = 50 * speedMult;
    
    // Reward scales so gold growth balances with cost scaling
    // baseReward * 1.2^wave
    let baseReward = 8 * Math.pow(1.2, waveNumber - 1);
    
    if (type === 'fast') { baseHp *= 0.4; baseSpeed *= 2.5; }
    if (type === 'boss') { baseHp *= 5; baseSpeed *= 0.6; baseReward *= 4; }
    if (type === 'immune') { baseHp *= 1.2; baseSpeed *= 1.1; baseReward *= 1.5; }
    if (type === 'spawn') { baseHp *= 2; baseReward *= 2; }
    if (type === 'flying') { baseHp *= 0.8; baseSpeed *= 1.2; }
    
    const reward = Math.max(1, Math.floor(baseReward));

    if (type === 'group') {
        baseHp *= 0.3;
        baseSpeed *= 1.8;
        const gReward = Math.max(1, Math.floor(reward * 0.4));
        for (let i = 0; i < 3; i++) {
           setTimeout(() => {
              this.enemyManager.spawn('fast', startX, startY, baseHp, gReward, baseSpeed);
           }, i * 300);
        }
    } else {
        this.enemyManager.spawn(type, startX, startY, baseHp, reward, baseSpeed);
    }
  }

  public isAllWavesSpawned() {
    return false; // Game is infinite now
  }
  
  public getCurrentWaveNumber() {
      if (this.waves.length === 0) return 1;
      return this.waves[Math.min(this.currentWaveIndex, this.waves.length-1)].waveNumber;
  }
}
function max(a: number, b: number): number {
    return a > b ? a : b;
}

