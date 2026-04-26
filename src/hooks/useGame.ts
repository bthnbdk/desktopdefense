import { RefObject, useEffect, useRef, useState } from 'react';
import { GameEngine } from '../engine/GameEngine';
import { EventBus } from '../engine/EventBus';
import { useHudStore } from '../store';

export function useGame(canvasRef: RefObject<HTMLCanvasElement | null>, logicalW: number, logicalH: number) {
  const engineRef = useRef<GameEngine | null>(null);
  const eventBusRef = useRef<EventBus | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || logicalW === 0 || logicalH === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!eventBusRef.current) {
      eventBusRef.current = new EventBus();
    }
    
    // Subscribe to events
    const handleHudUpdate = (payload: any) => {
      useHudStore.getState().setHudState(payload);
    };
    eventBusRef.current.on('hud:update', handleHudUpdate);

    if (!engineRef.current) {
      engineRef.current = new GameEngine(eventBusRef.current);
      console.log('[useGame] Engine instance created');
    }

    engineRef.current.start(canvas, ctx, logicalW, logicalH);

    // Event listener for clicks
    const handlePointerUp = (e: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = logicalW / rect.width;
        const scaleY = logicalH / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        engineRef.current?.handleInput(x, y, 'click', useHudStore.getState());
    };
    
    canvas.addEventListener('pointerup', handlePointerUp);

    return () => {
      // We don't call destroy() here if we want to preserve instance state between resizes.
      // But we should stop the loop and remove listeners to avoid duplicates.
      engineRef.current?.stopLoop(); 
      eventBusRef.current?.off('hud:update', handleHudUpdate);
      canvas.removeEventListener('pointerup', handlePointerUp);
    };
  }, [canvasRef, logicalW, logicalH]);

  // Handle true unmount
  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  return {
    actions: {
      placeTower: (type: any, col: number, row: number) => {},
      sellTower: (towerId: any) => {},
      upgradeTower: (towerId: any) => {},
      setTargetMode: (towerId: any, mode: any) => {},
      sendNextWave: () => {},
      togglePause: () => {},
      setTheme: (themeName: any) => {}
    }
  };
}
