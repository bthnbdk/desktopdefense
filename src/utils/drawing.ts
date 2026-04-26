import { TowerType } from '../types';

export const drawTowerDesign = (ctx: CanvasRenderingContext2D, type: TowerType, color: string, size: number, isLight: boolean = false) => {
    ctx.save();
    
    // Base Glow / Shadow
    ctx.shadowBlur = isLight ? 2 : 4;
    ctx.shadowColor = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.5)';

    // Outline
    ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.4)' : '#FFFFFF';
    ctx.lineWidth = 1.5;
    
    ctx.beginPath();
    if (type === 'pellet') {
        ctx.rect(-size/2, -size/2, size, size);
    } else if (type === 'splash') {
        ctx.arc(0, 0, size/2, 0, Math.PI*2);
    } else if (type === 'slow') {
        ctx.moveTo(0, -size/1.4); 
        ctx.lineTo(size/1.4, 0); 
        ctx.lineTo(0, size/1.4); 
        ctx.lineTo(-size/1.4, 0);
    } else if (type === 'sniper') {
        ctx.moveTo(size/1.2, 0); 
        ctx.lineTo(-size/2, size/1.8); 
        ctx.lineTo(-size/2, -size/1.8);
    } else if (type === 'chain') {
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            const vx = Math.cos(angle) * size/1.6;
            const vy = Math.sin(angle) * size/1.6;
            if (i === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
        }
    } else if (type === 'mortar') {
        ctx.rect(-size/1.8, -size/1.8, size/0.9, size/0.9);
    } else {
        ctx.arc(0, 0, size/2, 0, Math.PI*2);
    }
    ctx.closePath();
    
    // Fill with gradient or solid
    ctx.fillStyle = color;
    ctx.fill();
    ctx.stroke();

    // Secondary detail (technical look)
    ctx.fillStyle = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, size/4, 0, Math.PI*2);
    ctx.fill();

    // Barrel (Directional hint)
    ctx.fillStyle = isLight ? 'rgba(0,0,0,0.3)' : '#000000';
    ctx.fillRect(2, -size*0.12, size*0.7, size*0.24);
    ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(2, -size*0.12, size*0.7, size*0.24);

    ctx.restore();
}
