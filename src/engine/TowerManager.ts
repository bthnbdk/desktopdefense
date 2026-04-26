import { Enemy, Projectile, Tower, TowerType, TargetMode, TowerId } from '../types';
import { towers } from '../data/towers';
import { EffectManager } from './EffectManager';
import { SoundManager } from './SoundManager';

export class TowerManager {
  public towers: Tower[] = [];
  public projectiles: Projectile[] = [];
  private nextTowerId = 1;
  private nextProjectileId = 1;

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

  public update(dt: number, enemies: Enemy[], cellSize: number, effectManager: EffectManager, soundManager: SoundManager) {
    // Update towers
    for (const tower of this.towers) {
      const config = towers[tower.type];
      tower.cooldownTimer = Math.max(0, tower.cooldownTimer - dt);

      const tX = tower.col * cellSize + cellSize / 2;
      const tY = tower.row * cellSize + cellSize / 2;
      
      const damageMultiplier = Math.pow(1.5, tower.level - 1);
      const rangeMultiplier = Math.pow(1.05, tower.level - 1);
      
      const rangePx = (config.range * rangeMultiplier) * cellSize;

      let target: Enemy | null = null;
      let targetDistSq = Infinity;

      // Find target
      let maxDistTraveled = -1;
      let minHp = Infinity;
      let maxHp = -1;
      
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        if (enemy.type === 'flying' && !config.canTargetFlying) continue;

        const dx = enemy.worldX - tX;
        const dy = enemy.worldY - tY;
        const distSq = dx * dx + dy * dy;

        if (distSq <= rangePx * rangePx) {
          if (tower.targetMode === 'first' && enemy.distanceTraveled > maxDistTraveled) {
            maxDistTraveled = enemy.distanceTraveled;
            target = enemy;
            targetDistSq = distSq;
          } else if (tower.targetMode === 'last' && (maxDistTraveled === -1 || enemy.distanceTraveled < maxDistTraveled)) {
             maxDistTraveled = enemy.distanceTraveled;
             target = enemy;
             targetDistSq = distSq;
          } else if (tower.targetMode === 'closest' && distSq < targetDistSq) {
             targetDistSq = distSq;
             target = enemy;
          } else if (tower.targetMode === 'strongest' && enemy.hp > maxHp) {
             maxHp = enemy.hp;
             target = enemy;
             targetDistSq = distSq;
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
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!p.active) {
        this.projectiles.splice(i, 1);
        continue;
      }

      const target = enemies.find(e => e.id === p.targetId && e.active);
      if (!target && p.splashRadius === 0) {
        p.active = false; // Target lost for single target projectiles
        continue;
      }

      // If target lost but it's a splash projectile (like mortar), it should still hit the location, 
      // but for simplicity let's just make it disappear if main target vanishes unless we set a target location.
      // Let's just do target tracking for now.
      if (!target) { p.active=false; continue; }

      const dx = target.worldX - p.x;
      const dy = target.worldY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const move = p.speed * dt;

      if (move >= dist) {
        // Hit
        const config = towers[this.towers.find(t=>t.id===p.towerId)?.type || 'pellet'];
        
        effectManager.spawnHit(p.x, p.y, '#ffffff', 5);

        if (p.splashRadius > 0) {
           effectManager.spawnExplosion(p.x, p.y, '#ff0055', 12);
           // AoE damage
           for (const enemy of enemies) {
               if (!enemy.active) continue;
               if (enemy.type === 'flying' && !config.canTargetFlying) continue;
               const edx = enemy.worldX - p.x;
               const edy = enemy.worldY - p.y;
               if (edx*edx + edy*edy <= p.splashRadius * p.splashRadius) {
                   enemy.hp -= p.damage;
                   this.applyEffects(enemy, config);
               }
           }
        } else {
            target.hp -= p.damage;
            this.applyEffects(target, config);
            
            // Chain logic
            if (config.chainTargets && config.chainTargets > 0) {
                let currentChains = 0;
                let lastHitTarget = target;
                let hitIds = new Set<string>();
                hitIds.add(target.id);
                
                // Super primitive instant-chain
                while (currentChains < config.chainTargets) {
                    let nextTarget: Enemy | null = null;
                    let closestDistSq = Infinity;
                    
                    for (const enemy of enemies) {
                        if (!enemy.active || hitIds.has(enemy.id)) continue;
                        if (enemy.type === 'flying' && !config.canTargetFlying) continue;
                        
                        const cdx = enemy.worldX - lastHitTarget.worldX;
                        const cdy = enemy.worldY - lastHitTarget.worldY;
                        const cDistSq = cdx*cdx + cdy*cdy;
                        
                        // typical chain range = 150px
                        if (cDistSq < 150*150 && cDistSq < closestDistSq) {
                            closestDistSq = cDistSq;
                            nextTarget = enemy;
                        }
                    }
                    
                    if (nextTarget) {
                        nextTarget.hp -= p.damage * 0.7; // reduces damage each jump
                        this.applyEffects(nextTarget, config);
                        hitIds.add(nextTarget.id);
                        lastHitTarget = nextTarget;
                        currentChains++;
                    } else {
                        break;
                    }
                }
            }
        }
        
        // hp <= 0 handling is broadly done in GameEngine, but we can flag dead instantly just in case
        for (const e of enemies) {
           if (e.hp <= 0 && e.active) e.active = false;
        }
        
        p.active = false;
      } else {
        p.x += (dx / dist) * move;
        p.y += (dy / dist) * move;
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
