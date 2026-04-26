import { Enemy, Point, EnemyType } from '../types';

export class EnemyManager {
  public enemies: Enemy[] = [];
  private nextEnemyId = 1;

  public spawn(type: EnemyType, startX: number, startY: number, hp: number, reward: number, speed: number) {
    this.enemies.push({
      id: `enemy_${this.nextEnemyId++}`,
      type,
      hp,
      maxHp: hp,
      speed,
      reward,
      pathIndex: 0,
      progress: 0,
      distanceTraveled: 0,
      worldX: startX,
      worldY: startY,
      slowTimer: 0,
      slowAmount: 0,
      active: true,
    });
  }

  public spawnAt(type: EnemyType, startX: number, startY: number, pathIndex: number, progress: number, hp: number, reward: number, speed: number) {
    this.enemies.push({
      id: `enemy_${this.nextEnemyId++}`,
      type,
      hp,
      maxHp: hp,
      speed,
      reward,
      pathIndex,
      progress,
      distanceTraveled: 0, // Inaccurate but doesn't matter much for remaining distance
      worldX: startX,
      worldY: startY,
      slowTimer: 0,
      slowAmount: 0,
      active: true,
    });
  }

  public realignEnemiesToPath(path: Point[], cellSize: number) {
    if (path.length === 0) return;
    
    for (const enemy of this.enemies) {
      if (!enemy.active || enemy.type === 'flying') continue;

      let closestIndex = 0;
      let minDistance = Infinity;

      for (let i = 0; i < path.length; i++) {
        const pX = path[i].col * cellSize + cellSize / 2;
        const pY = path[i].row * cellSize + cellSize / 2;
        const distSq = (enemy.worldX - pX) ** 2 + (enemy.worldY - pY) ** 2;

        if (distSq < minDistance) {
            minDistance = distSq;
            closestIndex = i;
        }
      }

      enemy.pathIndex = closestIndex;
      enemy.progress = 0;
      
      const targetP = path[closestIndex];
      enemy.worldX = targetP.col * cellSize + cellSize / 2;
      enemy.worldY = targetP.row * cellSize + cellSize / 2;
    }
  }

  public update(dt: number, path: Point[], cellSize: number, entry: Point, exit: Point) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy.active) {
        this.enemies.splice(i, 1);
        continue;
      }

      if (path.length === 0 && enemy.type !== 'flying') continue;

      // Handle Slow
      let currentSpeed = enemy.speed;
      if (enemy.slowTimer > 0 && enemy.type !== 'immune') {
          enemy.slowTimer -= dt;
          currentSpeed *= (1 - enemy.slowAmount);
      } else {
          enemy.slowTimer = 0;
          enemy.slowAmount = 0;
      }

      if (enemy.type === 'flying') {
          // Flying goes straight from entry to exit linearly based on distance
          const entryX = entry.col * cellSize + cellSize / 2;
          const entryY = entry.row * cellSize + cellSize / 2;
          const exitX = exit.col * cellSize + cellSize / 2;
          const exitY = exit.row * cellSize + cellSize / 2;
          
          const totalDist = Math.sqrt((exitX - entryX) ** 2 + (exitY - entryY) ** 2);
          
          if (totalDist > 0) {
              const moveDist = currentSpeed * dt;
              enemy.distanceTraveled += moveDist;
              const ratio = Math.min(1, enemy.distanceTraveled / totalDist);
              
              enemy.worldX = entryX + (exitX - entryX) * ratio;
              enemy.worldY = entryY + (exitY - entryY) * ratio;
              
              if (ratio >= 1) {
                  enemy.active = false;
                  enemy.pathIndex = 9999; // trigger exit logic in GameEngine
              }
          }
          continue;
      }

      if (enemy.pathIndex >= path.length) {
        enemy.active = false; // Reached exit
        continue;
      }

      // Handle normal movement
      enemy.progress += (currentSpeed * dt) / cellSize;

      while (enemy.progress >= 1) {
        enemy.progress -= 1;
        enemy.pathIndex++;
        enemy.distanceTraveled += cellSize;
      }

      if (enemy.pathIndex >= path.length) {
        enemy.active = false; // Reached exit
        continue;
      }

      const p1 = enemy.pathIndex === 0 ? path[0] : path[enemy.pathIndex - 1];
      const p2 = path[enemy.pathIndex];

      const p1X = p1.col * cellSize + cellSize / 2;
      const p1Y = p1.row * cellSize + cellSize / 2;
      const p2X = p2.col * cellSize + cellSize / 2;
      const p2Y = p2.row * cellSize + cellSize / 2;

      enemy.worldX = p1X + (p2X - p1X) * enemy.progress;
      enemy.worldY = p1Y + (p2Y - p1Y) * enemy.progress;
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
