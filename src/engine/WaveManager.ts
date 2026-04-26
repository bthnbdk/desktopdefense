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

  private getHPMultiplier(wave: number): number {
    if (wave <= 30) {
      return Math.pow(1.18, wave - 1);
    } else if (wave <= 80) {
      const hp30 = Math.pow(1.18, 29);
      return hp30 * (1 + 0.08 * Math.log(wave - 29));
    } else {
      const hp80 = Math.pow(1.18, 29) * (1 + 0.08 * Math.log(51));
      return hp80 + 12 * (wave - 80);
    }
  }

  private getGoldReward(wave: number, base: number): number {
    // Wave 1: ~10 gold per enemy. Wave 50: ~100 gold
    const reward = Math.floor(8 + wave * 2);
    return reward;
  }

  private generateInfiniteWave(index: number) {
      const waveNumber = index + 1;
      const hpMult = this.getHPMultiplier(waveNumber);
      
      // Revised Speed: Logarithmic ramp
      const speedMult = 1 + Math.log2(1 + (waveNumber - 1) / 10);
      const finalSpeedMult = Math.min(speedMult, 2.5);
      
      const count = 10 + Math.floor(waveNumber * 1.2);
      
      const types: EnemyType[] = ['normal'];
      if (waveNumber >= 3) types.push('fast');
      if (waveNumber >= 5) types.push('flying', 'immune');
      if (waveNumber >= 8) types.push('spawn');
      
      const isBossWave = waveNumber % 10 === 0;
      if (isBossWave) types.push('boss');
      
      const waveGroups = [];
      const numGroups = 1 + Math.floor(waveNumber / 8);
      
      for (let i = 0; i < numGroups; i++) {
          const type = types[Math.floor(Math.random() * types.length)];
          let gCount = Math.max(1, Math.floor(count / numGroups));
          
          let gHpMult = hpMult;

          if (type === 'boss') {
              gCount = 1;
              gHpMult *= 6;
          }
          
          waveGroups.push({
              type,
              count: gCount,
              intervalMs: Math.max(250, 1000 - waveNumber * 15),
              hpMultiplier: gHpMult,
              speedMultiplier: finalSpeedMult
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

    let baseReward = this.getGoldReward(waveNumber, 1);
    
    if (type === 'fast') { baseHp *= 0.4; baseSpeed *= 2.5; }
    else if (type === 'boss') { baseHp *= 5; baseSpeed *= 0.6; baseReward *= 4; }
    else if (type === 'immune') { baseHp *= 1.2; baseSpeed *= 1.1; baseReward *= 1.5; }
    else if (type === 'spawn') { baseHp *= 2; baseReward *= 2; }
    else if (type === 'flying') { baseHp *= 0.8; baseSpeed *= 1.2; }
    else if (type === 'group') {
        // Instead of immediate spawning with timeout, we create a sub-group
        this.activeGroups.push({
            type: 'fast',
            remaining: 3,
            intervalMax: 0.3,
            intervalTimer: 0.3,
            hpMultiplier: hpMult * 0.3,
            speedMultiplier: speedMult * 1.8
        });
        return; // Don't spawn the 'group' dummy enemy
    }
    
    const reward = Math.max(1, Math.floor(baseReward));
    this.enemyManager.spawn(type, startX, startY, baseHp, reward, baseSpeed);
  }

  public isAllWavesSpawned() {
    return false; // Game is infinite now
  }
  
  public getCurrentWaveNumber() {
      if (this.waves.length === 0) return 1;
      return this.waves[Math.min(this.currentWaveIndex, this.waves.length-1)].waveNumber;
  }

  public getActiveSpawningTypes(): EnemyType[] {
    const types = new Set<EnemyType>();
    for (const g of this.activeGroups) {
      types.add(g.type);
    }
    return Array.from(types);
  }
}
function max(a: number, b: number): number {
    return a > b ? a : b;
}

