import { TowerType } from '../types';

export const drawTowerDesign = (ctx: CanvasRenderingContext2D, type: TowerType, color: string, size: number) => {
    ctx.fillStyle = color;
    
    ctx.beginPath();
    if (type === 'pellet') { // Square
        ctx.rect(-size/2, -size/2, size, size);
    } else if (type === 'splash') { // Circle
        ctx.arc(0, 0, size/2, 0, Math.PI*2);
    } else if (type === 'slow') { // Diamond
        ctx.moveTo(0, -size/1.5); 
        ctx.lineTo(size/1.5, 0); 
        ctx.lineTo(0, size/1.5); 
        ctx.lineTo(-size/1.5, 0);
    } else if (type === 'sniper') { // Triangle pointing slightly forward
        ctx.moveTo(size/1.5, 0); 
        ctx.lineTo(-size/2, size/1.5); 
        ctx.lineTo(-size/2, -size/1.5);
    } else if (type === 'chain') { // Hexagon
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            const vx = Math.cos(angle) * size/1.6;
            const vy = Math.sin(angle) * size/1.6;
            if (i === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
        }
    } else if (type === 'mortar') { // Pentagon
        for (let i = 0; i < 5; i++) {
            const angle = i * Math.PI * 2 / 5 - Math.PI/2;
            const vx = Math.cos(angle) * size/1.6;
            const vy = Math.sin(angle) * size/1.6;
            if (i === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
        }
    } else {
        ctx.arc(0, 0, size/2, 0, Math.PI*2);
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Minor decorative inner ring/detail
    if (type !== 'sniper') { // Sniper has a specific shape
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.arc(0, 0, size/4, 0, Math.PI*2);
        ctx.fill();
    }

    // Barrel
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, -size*0.1, size*0.7, size*0.2);
}
