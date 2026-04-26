import { RenderSnapshot } from '../types';
import { towers } from '../data/towers';
import { drawTowerDesign } from '../utils/drawing';

export class GameRenderer {
  private designCache: Map<string, HTMLCanvasElement> = new Map();

  private getCachedTower(type: import('../types').TowerType, color: string, size: number, isLight: boolean): HTMLCanvasElement {
    const key = `${type}-${color}-${size}-${isLight}`;
    if (this.designCache.has(key)) return this.designCache.get(key)!;

    const cacheCanvas = document.createElement('canvas');
    const scale = window.devicePixelRatio || 1;
    cacheCanvas.width = (size * 2) * scale;
    cacheCanvas.height = (size * 2) * scale;
    const ctx = cacheCanvas.getContext('2d')!;
    ctx.scale(scale, scale);
    ctx.translate(size, size);
    
    drawTowerDesign(ctx, type, color, size, isLight);
    
    this.designCache.set(key, cacheCanvas);
    return cacheCanvas;
  }

  public render(ctx: CanvasRenderingContext2D, snapshot: RenderSnapshot, canvasW: number, canvasH: number) {
    const { theme, cols, rows, cellSize, grid } = snapshot;
    const hcs = cellSize / 2;

    // 1. Clear 
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, canvasW, canvasH);

    const mapW = canvasW - 180;
    const mapH = canvasH - 48;
    const gridW = cols * cellSize;
    const gridH = rows * cellSize;
    
    const offsetX = 180 + (mapW - gridW) / 2;
    const offsetY = 48 + (mapH - gridH) / 2;
    
    ctx.save();
    ctx.translate(offsetX, offsetY);

    // 2. Draw grid background & hinting
    // Optimization: Batch fill calls where possible
    ctx.fillStyle = theme.pathFill;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const cell = grid[c]?.[r] || 'empty';
        if (cell === 'pathHint' || cell === 'entry' || cell === 'exit') {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }

    // Grid lines - drawn in one pass using single path
    ctx.beginPath();
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = theme.isLight ? 'rgba(0,0,0,0.1)' : theme.gridLine + '44'; 
    for (let c = 0; c <= cols; c++) {
      ctx.moveTo(c * cellSize, 0);
      ctx.lineTo(c * cellSize, gridH);
    }
    for (let r = 0; r <= rows; r++) {
      ctx.moveTo(0, r * cellSize);
      ctx.lineTo(gridW, r * cellSize);
    }
    ctx.stroke();

    // 3. Draw path line
    const { path } = snapshot;
    if (path && path.length > 0) {
      ctx.beginPath();
      ctx.moveTo(path[0].col * cellSize + hcs, path[0].row * cellSize + hcs);
      for (let i = 1; i < path.length; i++) {
        const p = path[i];
        ctx.lineTo(p.col * cellSize + hcs, p.row * cellSize + hcs);
      }
      ctx.strokeStyle = theme.accentSecondary + '88';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 4. Draw placement preview
    const { hoveredCell, selectedTowerTypePreview, placementValid } = snapshot;
    if (hoveredCell && selectedTowerTypePreview) {
      const cx = hoveredCell.col * cellSize + hcs;
      const cy = hoveredCell.row * cellSize + hcs;
      const color = placementValid ? theme.accentPrimary : '#EF4444';
      const config = towers[selectedTowerTypePreview];

      ctx.save();
      ctx.globalAlpha = 0.5;
      const cached = this.getCachedTower(selectedTowerTypePreview, color, cellSize * 0.5, theme.isLight);
      ctx.drawImage(cached, cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, config.range * cellSize, 0, Math.PI * 2);
      ctx.fillStyle = color + '11';
      ctx.fill();
      ctx.strokeStyle = color + '44';
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Draw towers
    const towerSize = cellSize * 0.5;
    for (const tower of snapshot.towers) {
      const cx = tower.col * cellSize + hcs;
      const cy = tower.row * cellSize + hcs;
      const color = theme.towerColors[tower.type];
      const isSelected = snapshot.selectedTowerId === tower.id;

      ctx.save();
      if (isSelected) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
      }
      
      const cached = this.getCachedTower(tower.type, color, towerSize, theme.isLight);
      ctx.translate(cx, cy);
      ctx.rotate(tower.angle);
      ctx.drawImage(cached, -towerSize, -towerSize, cellSize, cellSize);
      ctx.restore();

      if (tower.level > 1) {
          ctx.save();
          ctx.translate(cx + cellSize * 0.25, cy - cellSize * 0.25);
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = theme.isLight ? '#000000' : '#ffffff';
          ctx.fillText(`★${tower.level}`, 0, 0);
          ctx.restore();
      }
      
      if (isSelected) {
          ctx.save();
          const config = towers[tower.type];
          const rangeMultiplier = Math.pow(1.05, tower.level - 1);
          const rangePx = (config.range * rangeMultiplier) * cellSize;
          ctx.beginPath();
          ctx.arc(cx, cy, rangePx, 0, Math.PI * 2);
          ctx.fillStyle = color + '22';
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.restore();
      }
    }

    // 6. Draw enemies
    for (const enemy of snapshot.enemies) {
      const color = theme.enemyColors[enemy.type] || '#ffffff';
      ctx.save();
      ctx.fillStyle = color;
      ctx.translate(enemy.worldX, enemy.worldY);
      
      if (enemy.type === 'boss') {
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-14, -14, 28, 28);
      } else if (enemy.type === 'flying') {
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(12, 10);
        ctx.lineTo(-12, 10);
        ctx.fill();
      } else {
        const radius = (enemy.type === 'fast' || enemy.type === 'group') ? 8 : 12;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      if (enemy.hp < enemy.maxHp) {
        const hpPercent = Math.max(0, enemy.hp / enemy.maxHp);
        const barW = 24; const barH = 2;
        const bX = enemy.worldX - 12; const bY = enemy.worldY - 18;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(bX, bY, barW, barH);
        ctx.fillStyle = hpPercent > 0.5 ? '#22C55E' : hpPercent > 0.25 ? '#EAB308' : '#EF4444';
        ctx.fillRect(bX, bY, barW * hpPercent, barH);
      }
    }

    // 7. Projectiles
    ctx.fillStyle = theme.accentPrimary;
    for (const p of snapshot.projectiles) {
        if (p.splashRadius > 0) {
            ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
        } else {
            ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
        }
    }

    // 8. Particles
    for (const p of snapshot.particles) {
       ctx.save();
       ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
       ctx.fillStyle = p.color;
       ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
       ctx.restore();
    }

    // 9. Floating texts
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    for (const ft of snapshot.floatingTexts) {
       ctx.globalAlpha = Math.max(0, Math.min(1, ft.life / ft.maxLife));
       ctx.fillStyle = ft.color;
       ctx.fillText(ft.text, ft.x, ft.y);
    }

    ctx.restore();
  }
}
