import { Enemy, Point, EnemyType } from '../types';

export class EnemyManager {
  public enemies: Enemy[] = [];
  private freeList: Enemy[] = [];
  private nextEnemyId = 1;

  constructor() {
    this.preallocatePool(300);
  }

  private preallocatePool(count: number) {
    for (let i = 0; i < count; i++) {
      this.freeList.push(this.createEmptyEnemy());
    }
  }

  private createEmptyEnemy(): Enemy {
    return {
      id: '',
      type: 'normal',
      hp: 0,
      maxHp: 0,
      speed: 0,
      reward: 0,
      pathIndex: 0,
      progress: 0,
      distanceTraveled: 0,
      worldX: 0,
      worldY: 0,
      slowTimer: 0,
      slowAmount: 0,
      active: false,
      movementType: 'ground',
    };
  }

  public acquire(type: EnemyType, startX: number, startY: number, hp: number, reward: number, speed: number): Enemy {
    let enemy = this.freeList.pop();
    if (!enemy) {
      enemy = this.createEmptyEnemy();
    }
    
    enemy.id = `enemy_${this.nextEnemyId++}`;
    enemy.type = type;
    enemy.hp = hp;
    enemy.maxHp = hp;
    enemy.speed = speed;
    enemy.reward = reward;
    enemy.pathIndex = 0;
    enemy.progress = 0;
    enemy.distanceTraveled = 0;
    enemy.worldX = startX;
    enemy.worldY = startY;
    enemy.slowTimer = 0;
    enemy.slowAmount = 0;
    enemy.active = true;
    enemy.movementType = type === 'flying' ? 'flying' : 'ground';
    enemy.phase = type === 'boss' ? 1 : undefined;
    enemy.armored = type === 'boss';
    
    return enemy;
  }

  public release(enemy: Enemy) {
    enemy.active = false;
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) {
      // Swap with last pattern
      const lastIdx = this.enemies.length - 1;
      this.enemies[idx] = this.enemies[lastIdx];
      this.enemies.pop();
      this.freeList.push(enemy);
    }
  }

  public spawn(type: EnemyType, startX: number, startY: number, hp: number, reward: number, speed: number) {
    const enemy = this.acquire(type, startX, startY, hp, reward, speed);
    this.enemies.push(enemy);
  }

  public spawnAt(type: EnemyType, startX: number, startY: number, pathIndex: number, progress: number, hp: number, reward: number, speed: number) {
    const enemy = this.acquire(type, startX, startY, hp, reward, speed);
    enemy.pathIndex = pathIndex;
    enemy.progress = progress;
    this.enemies.push(enemy);
  }

  public realignEnemiesToPath(path: Point[], cellSize: number) {
    if (path.length < 2) return;

    const hcs = cellSize / 2;

    for (const enemy of this.enemies) {
      if (!enemy.active || enemy.type === 'flying') continue;

      let bestSegIndex = 0;
      let bestProgress = 0;
      let bestDistSq = Infinity;

      // Project enemy onto every path segment, find closest projection
      for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i];
        const p2 = path[i + 1];
        const p1X = p1.col * cellSize + hcs;
        const p1Y = p1.row * cellSize + hcs;
        const p2X = p2.col * cellSize + hcs;
        const p2Y = p2.row * cellSize + hcs;

        const segDx = p2X - p1X;
        const segDy = p2Y - p1Y;
        const segLenSq = segDx * segDx + segDy * segDy;

        // Project enemy position onto segment, clamp to [0,1]
        let t = 0;
        if (segLenSq > 0) {
          t = ((enemy.worldX - p1X) * segDx + (enemy.worldY - p1Y) * segDy) / segLenSq;
          t = Math.max(0, Math.min(1, t));
        }

        const projX = p1X + segDx * t;
        const projY = p1Y + segDy * t;
        const dx = enemy.worldX - projX;
        const dy = enemy.worldY - projY;
        const distSq = dx * dx + dy * dy;

        if (distSq < bestDistSq) {
          bestDistSq = distSq;
          bestSegIndex = i;
          bestProgress = t;
        }
      }

      // Set segment and progress — enemy stays at current world position.
      // The next update() tick will interpolate from this point along the new path.
      enemy.pathIndex = bestSegIndex;
      enemy.progress = bestProgress;
    }
  }

  public update(dt: number, path: Point[], cellSize: number, entry: Point, exit: Point) {
    const enemiesToProcess = this.enemies;
    const pathLen = path.length;
    const hcs = cellSize / 2;

    for (let i = enemiesToProcess.length - 1; i >= 0; i--) {
      const enemy = enemiesToProcess[i];
      if (!enemy.active) continue;

      if (pathLen === 0 && enemy.movementType !== 'flying') continue;

      // Handle Slow
      let currentSpeed = enemy.speed;
      if (enemy.slowTimer > 0 && enemy.type !== 'immune') {
          enemy.slowTimer -= dt;
          currentSpeed *= (1 - enemy.slowAmount);
      } else if (enemy.slowAmount > 0) {
          enemy.slowTimer = 0;
          enemy.slowAmount = 0;
      }

      if (enemy.movementType === 'flying') {
          const entryX = entry.col * cellSize + hcs;
          const entryY = entry.row * cellSize + hcs;
          const exitX = exit.col * cellSize + hcs;
          const exitY = exit.row * cellSize + hcs;
          
          const dx = exitX - entryX;
          const dy = exitY - entryY;
          const totalDist = Math.sqrt(dx * dx + dy * dy);
          
          if (totalDist > 0) {
              enemy.distanceTraveled += currentSpeed * dt;
              const ratio = Math.min(1, enemy.distanceTraveled / totalDist);
              
              enemy.worldX = entryX + dx * ratio;
              enemy.worldY = entryY + dy * ratio;
              
              if (ratio >= 1) {
                  enemy.active = false;
                  enemy.pathIndex = 9999;
              }
          }
          continue;
      }

      if (enemy.pathIndex >= pathLen - 1) {
        // Towards exit cell center
        const targetX = exit.col * cellSize + hcs;
        const targetY = exit.row * cellSize + hcs;
        const dx = targetX - enemy.worldX;
        const dy = targetY - enemy.worldY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const move = currentSpeed * dt;
        
        if (move >= dist) {
            enemy.active = false;
            enemy.pathIndex = 9999;
        } else {
            const ratio = move / dist;
            enemy.worldX += dx * ratio;
            enemy.worldY += dy * ratio;
            enemy.distanceTraveled += move;
        }
        continue;
      }

      // Handle movement
      const p1 = path[enemy.pathIndex];
      const p2 = path[enemy.pathIndex + 1];

      const p1X = p1.col * cellSize + hcs;
      const p1Y = p1.row * cellSize + hcs;
      const p2X = p2.col * cellSize + hcs;
      const p2Y = p2.row * cellSize + hcs;

      const segDx = p2X - p1X;
      const segDy = p2Y - p1Y;
      const segLen = Math.sqrt(segDx * segDx + segDy * segDy);
      
      const moveAmount = currentSpeed * dt;
      enemy.distanceTraveled += moveAmount;
      enemy.progress = (enemy.progress || 0) + (moveAmount / segLen);

      while (enemy.progress >= 1 && enemy.pathIndex < pathLen - 1) {
        enemy.progress -= 1;
        enemy.pathIndex++;
        if (enemy.pathIndex >= pathLen - 1) break;
      }

      if (enemy.pathIndex < pathLen - 1) {
          const np1 = path[enemy.pathIndex];
          const np2 = path[enemy.pathIndex + 1];
          const np1X = np1.col * cellSize + hcs;
          const np1Y = np1.row * cellSize + hcs;
          const np2X = np2.col * cellSize + hcs;
          const np2Y = np2.row * cellSize + hcs;
          
          enemy.worldX = np1X + (np2X - np1X) * enemy.progress;
          enemy.worldY = np1Y + (np2Y - np1Y) * enemy.progress;
      }
    }
  }

  public dealDamage(enemy: Enemy, damage: number, effectManager: EffectManager, config?: any) {
      if (!enemy.active) return;
      
      let finalDamage = damage;
      if (enemy.armored) {
          finalDamage *= 0.7; // 30% reduction
      }
      
      const oldHpPercent = enemy.hp / (enemy.maxHp || 1);
      enemy.hp -= finalDamage;
      const newHpPercent = enemy.hp / (enemy.maxHp || 1);
      
      if (config) {
          if (config.slowAmount > 0 && enemy.type !== 'immune') {
              enemy.slowAmount = config.slowAmount;
              enemy.slowTimer = config.slowDuration;
          }
      }

      if (enemy.hp <= 0) {
          enemy.active = false;
          enemy.hp = 0;
      }
      
      // Boss Phase Transition logic
      if (enemy.type === 'boss' && enemy.phase) {
          const thresholds = [0.66, 0.33];
          const currentThreshold = thresholds[enemy.phase - 1];
          
          if (oldHpPercent >= currentThreshold && newHpPercent < currentThreshold && enemy.phase < 3) {
              enemy.phase++;
              // Speed burst
              const originalSpeed = enemy.speed;
              enemy.speed *= 1.5;
              setTimeout(() => { enemy.speed = originalSpeed; }, 2000);
              
              // Spawn Minions
              this.spawnAt('normal', enemy.worldX, enemy.worldY, enemy.pathIndex, enemy.progress, enemy.maxHp * 0.1, 5, enemy.speed * 1.2);
              
              effectManager.spawnExplosion(enemy.worldX, enemy.worldY, '#ffffff', 30);
          }
      }
  }

  public hasEnemyAt(col: number, row: number, cellSize: number): boolean {
    for (const enemy of this.enemies) {
      if (!enemy.active || enemy.type === 'flying') continue;
      // Fast rough check
      const eCol = Math.floor(enemy.worldX / cellSize);
      const eRow = Math.floor(enemy.worldY / cellSize);
      if (eCol === col && eRow === row) {
          return true;
      }
    }
    return false;
  }

  public getActiveEnemies() {
    return this.enemies.filter((e) => e.active);
  }
}
