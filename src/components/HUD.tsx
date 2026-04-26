import React, { useState, useEffect } from 'react';
import { VolumeX, Volume2, Pause, Play, FastForward, Heart, Coins, Palette, RotateCw, Maximize2 } from 'lucide-react';
import { useHudStore } from '../store';
import { themes } from '../data/themes';
import { ThemeName } from '../types';

export const HUD: React.FC = () => {
  const { lives, gold, score, soundMuted, autoWave, isPaused, activeTheme, setHudState } = useHudStore();
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleSendWave = () => {
    window.dispatchEvent(new CustomEvent('ui:sendWave'));
  };

  const toggleMute = () => {
    const newState = !soundMuted;
    setHudState({ soundMuted: newState });
    window.dispatchEvent(new CustomEvent('ui:toggleMute', { detail: { muted: newState } }));
  };

  const togglePause = () => {
    const newState = !isPaused;
    window.dispatchEvent(new CustomEvent('ui:togglePause', { detail: { isPaused: newState, stateRef: useHudStore.getState() } }));
  };

  const toggleAutoWave = () => {
    const newState = !autoWave;
    window.dispatchEvent(new CustomEvent('ui:toggleAutoWave', { detail: { autoWave: newState, stateRef: useHudStore.getState() } }));
  };

  const handleRestart = () => {
    window.dispatchEvent(new CustomEvent('ui:restartGame', { detail: { stateRef: useHudStore.getState() } }));
  };

  const cycleTheme = () => {
    const themeNames = Object.keys(themes) as ThemeName[];
    const nextIndex = (themeNames.indexOf(activeTheme) + 1) % themeNames.length;
    setHudState({ activeTheme: themeNames[nextIndex] });
  };

  return (
    <div className="absolute top-0 left-0 w-full h-[48px] px-4 flex items-center justify-between font-mono pointer-events-none border-b border-[var(--border-color)] z-50 panel-glass" style={{ color: 'var(--hud-text)' }}>
      <div className="flex gap-6 pointer-events-auto items-center">
        <div
            onClick={() => {
              setHudState({ gamePhase: 'menu', isPaused: true });
              window.dispatchEvent(new CustomEvent('ui:togglePause', { detail: { isPaused: true, stateRef: useHudStore.getState() } }));
            }}
            className="font-black italic pr-6 cursor-pointer hover:opacity-70 transition-all flex items-center gap-1 group"
        >
            <span className="text-xl tracking-tighter uppercase group-hover:text-[var(--accent-primary)] transition-colors">DESKTOPDEFENSE</span>
        </div>
        
           <div className="flex items-center gap-6 py-1 px-4 border-l border-[var(--border-color)]">
           <div className="flex flex-col">
              <span className="text-[8px] uppercase tracking-widest leading-none mb-1" style={{ color: 'var(--text-dim)' }}>Health</span>
              <div className="flex items-center gap-1.5 text-red-500">
                <Heart size={12} fill="currentColor" />
                <span className="text-sm font-bold leading-none">{lives}</span>
              </div>
           </div>
           
           <div className="flex flex-col">
              <span className="text-[8px] uppercase tracking-widest leading-none mb-1" style={{ color: 'var(--text-dim)' }}>Money</span>
              <div className="flex items-center gap-1.5 text-yellow-500">
                <Coins size={12} fill="currentColor" />
                <span className="text-sm font-bold leading-none">{gold}</span>
              </div>
           </div>

           <div className="flex flex-col">
              <span className="text-[8px] uppercase tracking-widest leading-none mb-1" style={{ color: 'var(--text-dim)' }}>Score</span>
              <div className="flex items-center gap-1.5 text-[var(--accent-primary)]">
                <span className="text-sm font-bold leading-none">{score.toLocaleString()}</span>
              </div>
           </div>
        </div>
      </div>
      
      <div className="flex gap-4 items-center pointer-events-auto">
        <div className="flex gap-1">
            {!isFullScreen && (
               <div className="hidden lg:flex items-center mr-4 text-[8px] font-bold uppercase tracking-widest text-[var(--accent-primary)] animate-pulse">
                  For Best Experience →
               </div>
            )}
            <button 
               onClick={toggleFullScreen}
               className="w-8 h-8 flex items-center justify-center hover:bg-[var(--border-color)] border border-[var(--border-color)] text-sm transition-all cursor-pointer mr-2"
               title="Toggle Full Screen"
            >
              <Maximize2 size={14} />
            </button>
            <button 
               onClick={toggleMute}
               className="w-8 h-8 flex items-center justify-center hover:bg-[var(--border-color)] border border-[var(--border-color)] text-sm transition-all cursor-pointer"
               title={soundMuted ? "Unmute" : "Mute"}
            >
              {soundMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <button 
               onClick={toggleAutoWave}
               className={`h-8 px-3 flex items-center justify-center text-[9px] font-bold tracking-widest transition-all cursor-pointer border ${autoWave ? 'bg-[var(--accent-primary)]/20 border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-[0_0_10px_rgba(var(--accent-primary-rgb),0.2)]' : 'bg-[var(--border-color)] hover:bg-[var(--accent-primary)]/10 border-[var(--border-color)] text-[var(--hud-text)]/40'}`}
               title="Auto Send Wave"
            >
               AUTO <FastForward size={12} className="ml-1" />
            </button>
            <button 
               onClick={togglePause}
               className="w-10 h-8 flex items-center justify-center hover:bg-[var(--border-color)] border border-[var(--border-color)] text-sm transition-all cursor-pointer"
               title={isPaused ? "Play" : "Pause"}
            >
              {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
            </button>
        </div>
        
        <button 
          onClick={handleSendWave}
          className="px-6 py-2 bg-[var(--accent-primary)] hover:brightness-110 active:scale-95 text-[10px] tracking-[0.2em] font-black uppercase transition-all cursor-pointer shadow-[0_0_15px_rgba(0,0,0,0.15)] flex items-center gap-2"
          style={{ color: 'var(--accent-contrast)' }}
        >
          NEXT WAVE <Play size={12} fill="currentColor" />
        </button>

        <div className="flex gap-1 ml-4 border-l border-[var(--border-color)] pl-4">
            <button 
               onClick={handleRestart}
               className="w-8 h-8 flex items-center justify-center hover:bg-orange-500/20 border border-orange-500/20 text-orange-500 transition-all cursor-pointer"
               title="Restart Game"
            >
              <RotateCw size={14} />
            </button>
             <button 
               onClick={cycleTheme}
               className="w-8 h-8 flex items-center justify-center hover:bg-white/10 border border-white/10 text-white/40 transition-all cursor-pointer"
               title="Change Theme"
             >
                <Palette size={14} />
             </button>
        </div>
      </div>
    </div>
  );
};
