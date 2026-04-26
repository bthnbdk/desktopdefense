import React from 'react';
import { useHudStore } from '../store';
import { ThemeName, TowerType } from '../types';
import { TowerGraphic } from './TowerGraphic';

export const MainMenu: React.FC = () => {
  const { gamePhase, activeTheme, setHudState, highScore, isPaused } = useHudStore();

  if (gamePhase !== 'menu') return null;

  const handleStart = (isContinue: boolean = false) => {
    if (!isContinue) {
        window.dispatchEvent(new CustomEvent('ui:startGame', { detail: { stateRef: useHudStore.getState() } }));
    } else {
        setHudState({ gamePhase: 'playing', isPaused: false });
    }
  };

  const themes: ThemeName[] = ['desktop', 'neonVoid', 'synthwave', 'matrix', 'arctic', 'lava', 'monochrome', 'softLight', 'frost', 'papyrus', 'mint'];
  const displayTowers: TowerType[] = ['pellet', 'splash', 'slow', 'sniper', 'chain', 'mortar'];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center font-sans pointer-events-auto" style={{ backgroundColor: 'var(--bg-color, #0f172a)' }}>
      <div className="absolute inset-0 opacity-10" style={{
         backgroundImage: 'radial-gradient(var(--grid-line) 1px, transparent 1px)',
         backgroundSize: '40px 40px'
      }} />

      <div className="relative border-t-2 p-12 rounded shadow-2xl backdrop-blur-md panel-glass max-w-lg w-full" 
           style={{ borderColor: 'var(--accent-primary)' }}>
        
        <div className="text-center flex flex-col items-center">
            <div className="flex gap-4 mb-8 justify-center flex-wrap">
                {displayTowers.map((type, i) => (
                    <div key={type} className="animate-pulse" style={{ animationDelay: `${i * 0.15}s` }}>
                        <TowerGraphic type={type} themeName={activeTheme} size={40} angle={Math.PI/6} />
                    </div>
                ))}
            </div>

            <h1 className="text-5xl font-extrabold tracking-tighter mb-4 flex items-center justify-center italic" style={{ color: 'var(--hud-text)' }}>
                DESKTOP<span className="text-[var(--accent-primary)] font-black">DEFENSE</span>
            </h1>
            <div className="flex gap-6 text-[10px] font-mono tracking-widest uppercase mb-8" style={{ color: 'var(--text-bright)' }}>
                <div className="flex flex-col items-start border-l border-[var(--border-color)] pl-4">
                    <span style={{ color: 'var(--text-dim)' }}>High Score</span>
                    <span className="text-lg font-bold" style={{ color: 'var(--accent-primary)' }}>{highScore.toLocaleString()}</span>
                </div>
            </div>
        </div>
        
        <div className="mb-8 p-4 bg-[var(--border-color)] border border-[var(--border-color)] rounded-sm">
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest mb-3 border-b border-[var(--border-color)] pb-1" style={{ color: 'var(--text-dim)' }}>How to Play</h3>
            <ul className="text-[10px] font-mono space-y-2" style={{ color: 'var(--text-bright)' }}>
                <li className="flex gap-2"><span className="text-[var(--accent-primary)]">01</span> Pick a tower from the left panel and click an empty cell to place it.</li>
                <li className="flex gap-2"><span className="text-[var(--accent-primary)]">02</span> Click any placed tower to upgrade, sell, or switch targeting mode.</li>
                <li className="flex gap-2"><span className="text-[var(--accent-primary)]">03</span> Stop every enemy from reaching the exit — or it's game over.</li>
            </ul>
        </div>
        
        <div className="flex flex-col gap-3 w-full">
           {isPaused && (
           <button 
             onClick={() => handleStart(true)}
             className="px-8 py-3 font-mono font-bold transition-all text-sm uppercase tracking-[0.2em] border border-[var(--border-color)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10"
             style={{ color: 'var(--hud-text)' }}
           >
             RESUME DEPLOYMENT
           </button>
           )}
           <button 
             onClick={() => handleStart(false)}
             className="px-8 py-4 font-mono font-bold transition-all text-sm uppercase tracking-[0.3em] bg-[var(--accent-primary)]"
             style={{ color: 'var(--accent-contrast)' }}
           >
             {isPaused ? 'RESTART GAME' : 'START GAME'}
           </button>
        </div>

        <div className="mt-8 border-t border-[var(--border-color)] pt-4">
           <div className="text-[9px] mb-4 font-mono text-center" style={{ color: 'var(--text-dim)' }}>
             vibecoded by{' '}
             <a href="https://twitter.com/@bthnbdk" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent-primary)] transition-colors underline underline-offset-2" style={{ color: 'var(--accent-primary)' }}>@bthnbdk</a>
           </div>
           <div className="text-[10px] mb-4 font-mono font-bold text-center tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>System Theme Selection</div>
           <div className="grid grid-cols-4 gap-1">
              {themes.map(t => (
                  <button 
                     key={t}
                     onClick={() => setHudState({ activeTheme: t })}
                     className="py-1.5 text-[8px] font-mono font-bold transition-all uppercase border text-center"
                     style={{
                         borderColor: activeTheme === t ? 'var(--accent-primary)' : 'var(--border-color)',
                         color: activeTheme === t ? 'var(--accent-contrast)' : 'var(--hud-text)',
                         backgroundColor: activeTheme === t ? 'var(--accent-primary)' : 'var(--border-color)',
                         opacity: activeTheme === t ? 1 : 0.4
                     }}
                  >
                     {t}
                  </button>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
