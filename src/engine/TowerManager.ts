import { Enemy, Projectile, Tower, TowerType, TargetMode, TowerId } from '../types';
import { towers } from '../data/towers';
import { EffectManager } from './EffectManager';
import { SoundManager } from './SoundManager';

// Spatial Partitioning
class SpatialHash {
  private buckets: Map<string, Enemy[]> = new Map();
  private bucketSize: number;

  constructor(bucketSize: number) {
    this.bucketSize = bucketSize;
  }

  public clear() {
    this.buckets.clear();
  }

  public insert(enemy: Enemy) {
    const k = this.getKey(enemy.worldX, enemy.worldY);
    let b = this.buckets.get(k);
    if (!b) {
      b = [];
      this.buckets.set(k, b);
    }
    b.push(enemy);
  }

  public queryRadius(cx: number, cy: number, radius: number): Enemy[] {
    const res: Enemy[] = [];
    const minBCol = Math.floor((cx - radius) / this.bucketSize);
    const maxBCol = Math.floor((cx + radius) / this.bucketSize);
    const minBRow = Math.floor((cy - radius) / this.bucketSize);
    const maxBRow = Math.floor((cy + radius) / this.bucketSize);

    const radiusSq = radius * radius;

    for (let c = minBCol; c <= maxBCol; c++) {
      for (let r = minBRow; r <= maxBRow; r++) {
        const bucket = this.buckets.get(`${c},${r}`);
        if (bucket) {
          for (const e of bucket) {
            const dx = e.worldX - cx;
            const dy = e.worldY - cy;
            if (dx * dx + dy * dy <= radiusSq) {
              res.push(e);
            }
          }
        }
      }
    }
    return res;
  }

  private getKey(x: number, y: number): string {
    return `${Math.floor(x / this.bucketSize)},${Math.floor(y / this.bucketSize)}`;
  }
}

export class TowerManager {
  public towers: Tower[] = [];
  public projectiles: Projectile[] = [];
  private nextTowerId = 1;
  private nextProjectileId = 1;
  private spatialHash = new SpatialHash(80); // bucketsize = cellSize * 2

  public placeTower(type: TowerType, col: number, row: number) {
    const config = towers[type];
    this.towers.push({
      id: `tower_${this.nextTowerId++}`,
      type,
      col,
      row,
      level: 1,
      targetMode: 'first',
      currentTargetId: null,
      angle: 0,
      cooldownTimer: 0,
      totalInvested: config.cost,
      kills: 0
    });
  }

  public update(dt: number, enemies: Enemy[], cellSize: number, effectManager: EffectManager, soundManager: SoundManager, isLight: boolean = false, enemyManager: any) {
    const activeEnemies = enemies.filter(e => e.active);
    const hasProjectiles = this.projectiles.length > 0;
    
    if (activeEnemies.length === 0 && !hasProjectiles) {
      for (const tower of this.towers) {
        tower.cooldownTimer = Math.max(0, tower.cooldownTimer - dt);
      }
      return;
    }

    const hcs = cellSize / 2;
    const enemyMap = new Map<string, Enemy>();
    this.spatialHash.clear();
    for (const enemy of activeEnemies) {
      enemyMap.set(enemy.id, enemy);
      this.spatialHash.insert(enemy);
    }

    const towersById = new Map<string, Tower>();

    // Update towers
    for (const tower of this.towers) {
      towersById.set(tower.id, tower);
      const config = towers[tower.type];
      tower.cooldownTimer = Math.max(0, tower.cooldownTimer - dt);

      const tX = tower.col * cellSize + hcs;
      const tY = tower.row * cellSize + hcs;
      
      const levelMinusOne = tower.level - 1;
      const damageMultiplier = Math.pow(1.5, levelMinusOne);
      const rangeMultiplier = Math.pow(1.05, levelMinusOne);
      
      const rangePx = (config.range * rangeMultiplier) * cellSize;
      const rangePxSq = rangePx * rangePx;

      let target: Enemy | null = null;
      
      if (tower.currentTargetId) {
          const currentTarget = enemyMap.get(tower.currentTargetId);
          if (currentTarget && currentTarget.active) {
              const dx = currentTarget.worldX - tX;
              const dy = currentTarget.worldY - tY;
              if (dx*dx + dy*dy <= rangePxSq) {
                  target = currentTarget;
              }
          }
      }

      if (!target) {
          let targetDistSq = Infinity;
          let maxDistTraveled = -1;
          let maxHp = -1;
          
          const tMode = tower.targetMode;
          const canHitsFlying = config.canTargetFlying;

          const candidates = this.spatialHash.queryRadius(tX, tY, rangePx);

          for (const enemy of candidates) {
            if (enemy.type === 'flying' && !canHitsFlying) continue;
    
            const dx = enemy.worldX - tX;
            const dy = enemy.worldY - tY;
            const distSq = dx * dx + dy * dy;
    
            if (distSq <= rangePxSq) {
              if (tMode === 'first') {
                if (enemy.distanceTraveled > maxDistTraveled) {
                  maxDistTraveled = enemy.distanceTraveled;
                  target = enemy;
                }
              } else if (tMode === 'last') {
                if (maxDistTraveled === -1 || enemy.distanceTraveled < maxDistTraveled) {
                  maxDistTraveled = enemy.distanceTraveled;
                  target = enemy;
                }
              } else if (tMode === 'closest') {
                if (distSq < targetDistSq) {
                  targetDistSq = distSq;
                  target = enemy;
                }
              } else if (tMode === 'strongest') {
                if (enemy.hp > maxHp) {
                  maxHp = enemy.hp;
                  target = enemy;
                }
              }
            }
          }
      }

      if (target) {
        tower.currentTargetId = target.id;
        tower.angle = Math.atan2(target.worldY - tY, target.worldX - tX);

        if (tower.cooldownTimer <= 0) {
          tower.cooldownTimer = 1 / config.fireRate;
          this.fireProjectile(tower, target, tX, tY, { ...config, damage: config.damage * damageMultiplier });
          soundManager.playShoot(tower.type);
        }
      } else {
        tower.currentTargetId = null;
      }
    }

    // Update projectiles
    const hitColor = isLight ? '#000000' : '#ffffff';
    const splashColor = isLight ? '#dc2626' : '#ff0055';

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!p.active) {
        this.projectiles.splice(i, 1);
        continue;
      }

      const target = enemyMap.get(p.targetId);
      if (!target) { p.active = false; continue; }

      const dx = target.worldX - p.x;
      const dy = target.worldY - p.y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);

      const move = p.speed * dt;

      if (move >= dist) {
        // Hit
        const tower = towersById.get(p.towerId);
        const config = towers[tower?.type || 'pellet'];
        
        effectManager.spawnHit(p.x, p.y, hitColor, 5);

        if (p.splashRadius > 0) {
           effectManager.spawnExplosion(p.x, p.y, splashColor, 12);
           const splashRadiusSq = p.splashRadius * p.splashRadius;
           const canHitsFlying = config.canTargetFlying;

           for (const enemy of activeEnemies) {
               if (enemy.type === 'flying' && !canHitsFlying) continue;
               const edx = enemy.worldX - p.x;
               const edy = enemy.worldY - p.y;
               if (edx*edx + edy*edy <= splashRadiusSq) {
                   enemyManager.dealDamage(enemy, p.damage, effectManager, config);
               }
           }
        } else {
            enemyManager.dealDamage(target, p.damage, effectManager, config);
            
            if (target.hp <= 0 && tower) {
                tower.kills++;
            }
            
            // Chain logic
            if (config.chainTargets && config.chainTargets > 0) {
                let currentChains = 0;
                let lastHitTarget = target;
                let hitIds = new Set<string>();
                hitIds.add(target.id);
                
                const chainRangeSq = 150*150;
                const canHitsFlying = config.canTargetFlying;

                while (currentChains < config.chainTargets) {
                    let nextTarget: Enemy | null = null;
                    let closestDistSq = Infinity;
                    
                    for (const enemy of activeEnemies) {
                        if (hitIds.has(enemy.id)) continue;
                        if (enemy.type === 'flying' && !canHitsFlying) continue;
                        
                        const cdx = enemy.worldX - lastHitTarget.worldX;
                        const cdy = enemy.worldY - lastHitTarget.worldY;
                        const cDistSq = cdx*cdx + cdy*cdy;
                        
                        if (cDistSq < chainRangeSq && cDistSq < closestDistSq) {
                            closestDistSq = cDistSq;
                            nextTarget = enemy;
                        }
                    }
                    
                    if (nextTarget) {
                        enemyManager.dealDamage(nextTarget, p.damage * 0.7, effectManager, config);
                        if (nextTarget.hp <= 0 && tower) {
                            tower.kills++;
                        }
                        hitIds.add(nextTarget.id);
                        lastHitTarget = nextTarget;
                        currentChains++;
                    } else {
                        break;
                    }
                }
            }
        }
        
        p.active = false;
      } else {
        const invDist = move / dist;
        p.x += dx * invDist;
        p.y += dy * invDist;
      }
    }
  }

  private applyEffects(enemy: Enemy, config: any) {
      if (config.slowAmount > 0 && enemy.type !== 'immune') {
          enemy.slowAmount = config.slowAmount;
          enemy.slowTimer = config.slowDuration;
      }
  }

  private fireProjectile(tower: Tower, target: Enemy, tX: number, tY: number, config: import('../types').TowerConfig) {
    this.projectiles.push({
      id: `proj_${this.nextProjectileId++}`,
      towerId: tower.id,
      targetId: target.id,
      x: tX,
      y: tY,
      speed: config.projectileSpeed,
      damage: config.damage,
      splashRadius: config.splashRadius,
      active: true
    });
  }

  public getActiveTowers() {
      return this.towers;
  }

  public getActiveProjectiles() {
      return this.projectiles.filter(p => p.active);
  }
}
