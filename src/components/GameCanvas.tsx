import React, { useRef, useEffect, useState } from 'react';
import { useGame } from '../hooks/useGame';

export const GameCanvas: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!wrapperRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const targetRatio = 16 / 9;
        const currentRatio = width / height;

        let logicalW = 0;
        let logicalH = 0;

        if (currentRatio > targetRatio) {
          // Window is wider than 16:9, constrain by height
          logicalH = height;
          logicalW = height * targetRatio;
        } else {
          // Window is taller than 16:9, constrain by width
          logicalW = width;
          logicalH = width / targetRatio;
        }

        setDimensions({ width: Math.floor(logicalW), height: Math.floor(logicalH) });
      }
    });

    resizeObserver.observe(wrapperRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas DPI Fix
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;

    ctx.scale(dpr, dpr);
  }, [dimensions]);

  useGame(canvasRef, dimensions.width, dimensions.height);

  return (
    <div ref={wrapperRef} className="w-full h-full flex flex-col items-center justify-center overflow-hidden bg-black relative">
      <canvas
        ref={canvasRef}
        className="block"
        style={{
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.8)'
        }}
      />
    </div>
  );
};
