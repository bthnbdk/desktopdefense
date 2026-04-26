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
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center font-mono pointer-events-auto">
      <div className="bg-[var(--panel-bg,#090812)] border border-[var(--accent-primary,#00ffee)] p-8 rounded min-w-[300px] flex flex-col gap-6 shadow-[0_0_30px_rgba(0,255,238,0.2)] text-center">
        
        {isWin ? (
           <div>
              <h1 className="text-3xl font-bold text-[#00ffaa] tracking-widest mb-2">VICTORY</h1>
              <p className="text-gray-400 text-sm">The Core is secure.</p>
           </div>
        ) : (
           <div>
              <h1 className="text-3xl font-bold text-[#ff00aa] tracking-widest mb-2">CORE BREACHED</h1>
              <p className="text-gray-400 text-sm">System compromised.</p>
           </div>
        )}
        
        <div className="text-white py-4 border-y border-white/10 flex flex-col gap-2">
           <div className="flex justify-between">
              <span className="text-gray-400">WAVES SURVIVED</span>
              <span className="font-bold">{wave}</span>
           </div>
           <div className="flex justify-between">
              <span className="text-gray-400">FINAL SCORE</span>
              <span className="font-bold text-[#00ffee]">{score}</span>
           </div>
        </div>
        
        <div className="flex flex-col gap-3">
           <button 
             onClick={handleRestart}
             className="px-6 py-3 bg-[var(--accent-primary,#00ffee)]/20 text-[var(--accent-primary,#00ffee)] border border-[var(--accent-primary,#00ffee)] font-bold hover:bg-[var(--accent-primary,#00ffee)]/40 transition-colors"
           >
             RESTART GAME
           </button>
        </div>
      </div>
    </div>
  );
};
