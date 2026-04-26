import React from 'react';
import { useHudStore } from '../store';
import { levels } from '../data/waves';

export const WavePreview: React.FC = () => {
  const { wave, gamePhase, activeSpawning } = useHudStore();

  if (gamePhase === 'menu' || gamePhase === 'gameover') return null;

  const lvl = levels[0];
  const currentWaveData = lvl.waves[Math.min(wave - 1, lvl.waves.length - 1)];

  return (
    <div className="absolute bottom-0 right-0 w-[calc(100%-180px)] h-[32px] px-6 flex items-center justify-between pointer-events-auto overflow-hidden panel-glass border-t border-[var(--border-color)]">
      <div className="font-mono font-black text-[10px] mr-6 whitespace-nowrap uppercase tracking-[0.2em]" style={{ color: 'var(--accent-primary)' }}>WAVE {wave}</div>
      <div className="flex gap-1.5 text-[9px] font-mono whitespace-nowrap overflow-x-auto no-scrollbar py-1 h-full items-center">
         {currentWaveData ? currentWaveData.groups.map((g, i) => {
             const isSpawning = activeSpawning.includes(g.type);
             return (
               <div key={i}
                 className={`px-2 py-0.5 border flex items-center gap-2 transition-all duration-300
                   ${isSpawning
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] shadow-[0_0_10px_rgba(var(--accent-primary-rgb),0.2)] animate-pulse'
                      : 'border-[var(--border-color)] bg-[var(--border-color)] text-[var(--hud-text)]/60'}`}
               >
                  <span className={`${isSpawning ? 'opacity-100' : 'opacity-40'} uppercase`}>{g.type}</span>
                  <span className={`font-bold ${isSpawning ? 'text-[var(--hud-text)]' : 'text-[var(--accent-primary)]'}`}>x{g.count}</span>
               </div>
             );
         }) : (
            <span className="opacity-30 text-[8px] uppercase tracking-widest italic">Calculating next sector deployment...</span>
         )}
      </div>
      <div className="text-[9px] font-mono whitespace-nowrap ml-4 flex-shrink-0" style={{ color: 'var(--text-dim)' }}>
        vibecoded by{' '}
        <a href="https://twitter.com/@bthnbdk" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent-primary)] transition-colors" style={{ color: 'var(--accent-primary)' }}>@bthnbdk</a>
      </div>
    </div>
  );
};
