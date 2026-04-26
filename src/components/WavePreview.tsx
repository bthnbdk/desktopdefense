import React from 'react';
import { useHudStore } from '../store';
import { levels } from '../data/waves';

export const WavePreview: React.FC = () => {
  const { wave, gamePhase } = useHudStore();

  if (gamePhase === 'menu' || gamePhase === 'gameover') return null;

  // wave is 1-indexed, so current wave is wave - 1
  // next wave is wave
  // However, often "wave" represents the active wave. If we are playing wave 1, next is wave 2.
  // Wait, if wave is currently spawning, we might want to say "WAVE X". 
  // Let's just show the groups of the current wave.
  const lvl = levels[0];
  const currentWaveData = lvl.waves[Math.min(wave - 1, lvl.waves.length - 1)];

  return (
    <div className="absolute bottom-0 right-0 w-[calc(100%-180px)] h-[36px] bg-[var(--hud-bg)]/80 backdrop-blur border-t border-[var(--grid-line)] px-4 flex items-center justify-start pointer-events-auto overflow-hidden">
      <div className="font-bold text-xs mr-4 whitespace-nowrap" style={{ color: 'var(--accent-primary)' }}>WAVE {wave}:</div>
      <div className="flex gap-2 text-[10px] font-mono whitespace-nowrap overflow-x-auto no-scrollbar py-1 h-full items-center">
         {currentWaveData?.groups.map((g, i) => (
             <div key={i} className="px-2 py-0.5 rounded border border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10" style={{ color: 'var(--accent-primary)' }}>
                {g.type.toUpperCase()} ×{g.count}
             </div>
         ))}
      </div>
    </div>
  );
};
