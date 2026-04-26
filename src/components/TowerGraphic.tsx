import React, { useRef, useEffect } from 'react';
import { TowerType, ThemeName } from '../types';
import { themes } from '../data/themes';
import { drawTowerDesign } from '../utils/drawing';

export const TowerGraphic: React.FC<{ type: TowerType, themeName: ThemeName, angle?: number, size?: number }> = ({ type, themeName, angle = Math.PI / 4, size = 32 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, size, size);
        
        const theme = themes[themeName];
        const color = theme.towerColors[type] || '#ffffff';
        
        ctx.save();
        ctx.translate(size/2, size/2);
        ctx.rotate(angle); 
        
        drawTowerDesign(ctx, type, color, size * 0.5);
        
        ctx.restore();
    }, [type, themeName, angle, size]);
    
    return <canvas ref={canvasRef} width={size} height={size} style={{ width: size, height: size }} className="flex-shrink-0 drop-shadow-md" />;
};
