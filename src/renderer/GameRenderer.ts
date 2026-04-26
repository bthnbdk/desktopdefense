import { RenderSnapshot } from '../types';
import { towers } from '../data/towers';
import { drawTowerDesign } from '../utils/drawing';

export class GameRenderer {
  public render(ctx: CanvasRenderingContext2D, snapshot: RenderSnapshot, canvasW: number, canvasH: number) {
    const { theme, cols, rows, cellSize, grid } = snapshot;

    // 1. Clear canvas with theme.bg
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Map area offset: left sidebar 180px, top HUD 48px
    ctx.save();
    ctx.translate(180, 48);

    // 2. Draw grid cells
    ctx.lineWidth = 1;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const cell = grid[c]?.[r] || 'empty';
        const x = c * cellSize;
        const y = r * cellSize;

        if (cell === 'empty') {
          ctx.fillStyle = theme.emptyCellFill;
        } else if (cell === 'pathHint' || cell === 'entry' || cell === 'exit') {
          ctx.fillStyle = theme.pathFill;
        } else if (cell === 'tower') {
          ctx.fillStyle = theme.emptyCellFill; // Just base for now...
        } else {
          ctx.fillStyle = theme.emptyCellFill;
        }

        ctx.fillRect(x, y, cellSize, cellSize);

        if (cell === 'tower') {
          // Add back tower base
          ctx.fillStyle = theme.emptyCellFill;
          ctx.fillRect(x, y, cellSize, cellSize);
        }

        // Grid border
        ctx.strokeStyle = theme.gridLine;
        ctx.strokeRect(x, y, cellSize, cellSize);
      }
    }

    // 3. Draw path line
    const { path } = snapshot;
    if (path && path.length > 0) {
      ctx.beginPath();
      for (let i = 0; i < path.length; i++) {
        const p = path[i];
        const cx = p.col * cellSize + cellSize / 2;
        const cy = p.row * cellSize + cellSize / 2;
        if (i === 0) {
          ctx.moveTo(cx, cy);
        } else {
          ctx.lineTo(cx, cy);
        }
      }
      ctx.strokeStyle = theme.accentSecondary + '88'; // semi-transparent
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 5. Draw towers
    for (const tower of snapshot.towers) {
      const cx = tower.col * cellSize + cellSize / 2;
      const cy = tower.row * cellSize + cellSize / 2;
      const color = theme.towerColors[tower.type];

      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = color;
      
      ctx.translate(cx, cy);
      ctx.rotate(tower.angle);

      drawTowerDesign(ctx, tower.type, color, cellSize * 0.5);
      
      ctx.restore();

      if (tower.level > 1) {
          ctx.save();
          ctx.translate(cx + cellSize * 0.25, cy - cellSize * 0.25);
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 4;
          ctx.shadowColor = '#000000';
          ctx.fillText(`★${tower.level}`, 0, 0);
          ctx.restore();
      }
      
      // Range preview
      if (snapshot.selectedTowerId === tower.id) {
          ctx.save();
          const config = towers[tower.type];
          const rangeMultiplier = Math.pow(1.1, tower.level - 1);
          const rangePx = (config.range * rangeMultiplier) * cellSize;
          
          ctx.beginPath();
          ctx.arc(cx, cy, rangePx, 0, Math.PI * 2);
          ctx.fillStyle = color + '22'; // low opacity
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.restore();
      }
    }

    // 6. Draw enemies (with HP bars)
    for (const enemy of snapshot.enemies) {
      const color = theme.enemyColors[enemy.type] || '#ffffff';
      
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      
      ctx.beginPath();
      if (enemy.type === 'boss') {
        ctx.translate(enemy.worldX, enemy.worldY);
        ctx.rotate(Math.PI / 4);
        ctx.rect(-14, -14, 28, 28); // diamond
      } else if (enemy.type === 'flying') {
        ctx.translate(enemy.worldX, enemy.worldY);
        ctx.moveTo(0, -14);
        ctx.lineTo(12, 10);
        ctx.lineTo(-12, 10);
        ctx.closePath(); // triangle
      } else {
        const radius = enemy.type === 'fast' || enemy.type === 'group' ? 8 : 12;
        ctx.arc(enemy.worldX, enemy.worldY, radius, 0, Math.PI * 2); // circle
      }
      ctx.fill();
      ctx.restore();

      // HP Bar
      if (enemy.hp < enemy.maxHp) {
        const hpPercent = Math.max(0, enemy.hp / enemy.maxHp);
        const barW = 20;
        const barH = 3;
        const barX = enemy.worldX - barW / 2;
        const barY = enemy.worldY - 20;

        ctx.fillStyle = '#440000';
        ctx.fillRect(barX, barY, barW, barH);

        ctx.fillStyle = hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(barX, barY, barW * hpPercent, barH);
      }
    }

    // 7. Draw projectiles
    for (const p of snapshot.projectiles) {
        ctx.save();
        const color = theme.accentPrimary; // Use tower color later
        ctx.shadowBlur = 6;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.beginPath();
        if (p.splashRadius > 0) {
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        } else {
            ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
        }
        ctx.fill();
        ctx.restore();
    }

    // 8. Draw particles
    for (const p of snapshot.particles) {
       ctx.save();
       ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
       ctx.fillStyle = p.color;
       ctx.beginPath();
       ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
       ctx.fill();
       ctx.restore();
    }

    // 9. Draw floating texts
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    for (const ft of snapshot.floatingTexts) {
       ctx.save();
       ctx.globalAlpha = Math.max(0, Math.min(1, ft.life / ft.maxLife));
       ctx.fillStyle = ft.color;
       ctx.shadowBlur = 4;
       ctx.shadowColor = '#000000';
       ctx.fillText(ft.text, ft.x, ft.y);
       ctx.restore();
    }

    ctx.restore();
  }
}
