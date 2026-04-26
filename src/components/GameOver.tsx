import React, { useEffect } from 'react';
import { useHudStore } from '../store';

export const GameOver: React.FC = () => {
  const { gamePhase, score, wave, setHudState, registerGamePlay } = useHudStore();

  useEffect(() => {
    if (gamePhase === 'gameover') {
        registerGamePlay(score);
    }
  }, [gamePhase, score, registerGamePlay]);

  if (gamePhase !== 'gameover' && gamePhase !== 'waveComplete') return null;

  const isWin = gamePhase === 'waveComplete';

  const handleRestart = () => {
    window.dispatchEvent(new CustomEvent('ui:restartGame', { detail: { stateRef: useHudStore.getState() } }));
    setHudState({ gamePhase: 'playing' });
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center font-sans pointer-events-auto" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="relative border-t-4 p-10 rounded shadow-[0_0_50px_rgba(0,0,0,0.5)] panel-glass max-w-sm w-full text-center bg-[var(--panel-bg)]" 
           style={{ borderColor: isWin ? '#22C55E' : '#EF4444' }}>
        
        {isWin ? (
           <div className="mb-8">
              <div className="w-16 h-16 bg-[#22C55E]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#22C55E]/50">
                 <div className="w-8 h-8 bg-[#22C55E] rounded-sm animate-pulse" />
              </div>
              <h1 className="text-4xl font-black italic tracking-tighter mb-1 uppercase" style={{ color: '#22C55E' }}>MISSION SUCCESS</h1>
              <p className="text-[10px] font-mono tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>Threat neutralized. Core secured.</p>
           </div>
        ) : (
           <div className="mb-8">
              <div className="w-16 h-16 bg-[#EF4444]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#EF4444]/50">
                 <div className="w-8 h-8 bg-[#EF4444] rotate-45" />
              </div>
              <h1 className="text-4xl font-black italic tracking-tighter mb-1 uppercase" style={{ color: '#EF4444' }}>GAME OVER</h1>
              <p className="text-[10px] font-mono tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>The enemies breached your defenses.</p>
           </div>
        )}
        
        <div className="py-6 border-y border-[var(--border-color)] flex flex-col gap-4 mb-8">
           <div className="flex justify-between items-end">
              <span className="text-[10px] font-mono tracking-widest uppercase mb-1" style={{ color: 'var(--text-dim)' }}>Final Wave</span>
              <span className="text-2xl font-bold font-mono tracking-tighter leading-none" style={{ color: 'var(--text-bright)' }}>{wave}</span>
           </div>
           <div className="flex justify-between items-end">
              <span className="text-[10px] font-mono tracking-widest uppercase mb-1" style={{ color: 'var(--text-dim)' }}>Final Score</span>
              <span className="text-2xl font-bold font-mono tracking-tighter leading-none" style={{ color: 'var(--accent-primary)' }}>{score.toLocaleString()}</span>
           </div>
        </div>
        
        <div className="flex flex-col gap-3">
           <button 
             onClick={handleRestart}
             className="px-8 py-4 bg-[var(--accent-primary)] font-mono font-bold transition-all text-xs uppercase tracking-[0.4em] hover:brightness-110 active:scale-95 cursor-pointer shadow-lg"
             style={{ color: 'var(--accent-contrast)' }}
           >
             PLAY AGAIN
           </button>
           <button 
             onClick={() => setHudState({ gamePhase: 'menu' })}
             className="px-8 py-3 border border-[var(--border-color)] font-mono font-bold transition-all text-[9px] uppercase tracking-[0.2em] hover:bg-white/5 cursor-pointer"
             style={{ color: 'var(--text-dim)' }}
           >
             MAIN MENU
           </button>
        </div>
      </div>
    </div>
  );
};
