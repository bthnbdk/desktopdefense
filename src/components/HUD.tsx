import React from 'react';
import { VolumeX, Volume2, Pause, Play, FastForward, Heart, Coins, Palette, RotateCw } from 'lucide-react';
import { useHudStore } from '../store';
import { themes } from '../data/themes';
import { ThemeName } from '../types';

export const HUD: React.FC = () => {
  const { lives, gold, score, soundMuted, autoWave, isPaused, activeTheme, setHudState } = useHudStore();

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
    if (window.confirm("Are you sure you want to restart the game?")) {
        window.dispatchEvent(new CustomEvent('ui:restartGame', { detail: { stateRef: useHudStore.getState() } }));
    }
  };

  const cycleTheme = () => {
    const themeNames = Object.keys(themes) as ThemeName[];
    const nextIndex = (themeNames.indexOf(activeTheme) + 1) % themeNames.length;
    setHudState({ activeTheme: themeNames[nextIndex] });
  };

  return (
    <div className="absolute top-0 left-0 w-full h-[48px] px-4 flex items-center justify-between font-mono pointer-events-none border-b border-[var(--grid-line,rgba(255,255,255,0.2))] z-50" style={{ backgroundColor: 'var(--hud-bg, rgba(255, 255, 255, 0.9))', color: 'var(--hud-text, #0f172a)' }}>
      <div className="flex gap-6 pointer-events-auto items-center">
        <div 
            onClick={() => setHudState({ gamePhase: 'menu' })}
            className="font-bold border-r border-[var(--grid-line,rgba(255,255,255,0.2))] pr-6 tracking-tight flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity"
        >
            <span className="font-extrabold uppercase">DesktopDefense</span>
            <span className="text-[var(--accent-primary)]">.com</span>
        </div>
        <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 py-1 px-3 rounded-lg border border-black/10 dark:border-white/10">
           <div className="flex items-center gap-1.5 text-red-600 dark:text-red-500">
             <Heart size={16} fill="currentColor" />
             <span className="text-lg font-bold leading-none">{lives}</span>
           </div>
           <div className="w-[1px] h-4 bg-black/10 dark:bg-white/10" />
           <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-500">
             <Coins size={16} fill="currentColor" />
             <span className="text-lg font-bold leading-none">{gold}</span>
           </div>
           <div className="w-[1px] h-4 bg-black/10 dark:bg-white/10" />
           <div className="flex items-center gap-2">
             <span className="text-[10px] uppercase font-bold opacity-60">Score</span>
             <span className="font-bold text-[var(--accent-primary)] leading-none">{score}</span>
           </div>
        </div>
      </div>
      
      <div className="flex gap-6 items-center pointer-events-auto">
        <div className="flex gap-2">
            <button 
               onClick={toggleMute}
               className="w-8 h-8 flex items-center justify-center bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-black/20 dark:border-white/30 rounded text-sm transition-colors cursor-pointer"
               title={soundMuted ? "Unmute" : "Mute"}
            >
              {soundMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button 
               onClick={toggleAutoWave}
               className={`h-8 px-2 flex items-center justify-center rounded text-xs font-bold transition-colors cursor-pointer border ${autoWave ? 'bg-[var(--accent-primary)]/20 border-[var(--accent-primary)] text-[var(--accent-primary)]' : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border-black/20 dark:border-white/30 text-current opacity-70'}`}
               title="Auto Send Wave"
            >
               AUTO <FastForward size={14} className="ml-1" />
            </button>
            <button 
               onClick={togglePause}
               className="w-8 h-8 flex items-center justify-center bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-black/20 dark:border-white/30 rounded text-sm transition-colors cursor-pointer"
               title={isPaused ? "Play" : "Pause"}
            >
              {isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
            </button>
        </div>
        <button 
          onClick={handleSendWave}
          className="px-4 md:px-6 py-1.5 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 active:scale-95 rounded font-bold border border-[var(--accent-primary)] shadow-sm transition-all cursor-pointer"
        >
          SEND WAVE ▶
        </button>
        <div className="w-[1px] h-6 bg-black/10 dark:bg-white/10 mx-1" />
        <div className="flex gap-2">
            <button 
               onClick={handleRestart}
               className="w-8 h-8 flex items-center justify-center bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded text-orange-600 transition-colors cursor-pointer"
               title="Restart Game"
            >
              <RotateCw size={16} />
            </button>
             <button 
               onClick={cycleTheme}
               className="w-8 h-8 flex items-center justify-center bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-black/20 dark:border-white/30 rounded transition-colors cursor-pointer"
               title="Change Theme"
             >
                <Palette size={16} />
             </button>
        </div>
      </div>
    </div>
  );
};
