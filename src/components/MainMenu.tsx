import React from 'react';
import { Share2, Twitter, Facebook, Link } from 'lucide-react';
import { useHudStore } from '../store';
import { ThemeName, TowerType } from '../types';
import { TowerGraphic } from './TowerGraphic';

export const MainMenu: React.FC = () => {
  const { gamePhase, activeTheme, setHudState, highScore, timesPlayed, isPaused } = useHudStore();

  if (gamePhase !== 'menu') return null;

  const handleStart = (isContinue: boolean = false) => {
    if (!isContinue) {
        window.dispatchEvent(new CustomEvent('ui:startGame'));
    }
    setHudState({ gamePhase: 'playing', isPaused: false });
  };

  const handleShare = (platform: string) => {
    const text = `I just played DesktopDefense.com and scored ${highScore}! Can you beat it?`;
    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({ title: 'Desktop Defense', text, url });
    } else {
        if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        else if (platform === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        else navigator.clipboard.writeText(url);
    }
  };

  const themes: ThemeName[] = ['desktop', 'neonVoid', 'synthwave', 'matrix', 'arctic', 'lava', 'monochrome'];
  const displayTowers: TowerType[] = ['pellet', 'splash', 'slow', 'sniper', 'chain', 'mortar'];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center font-mono pointer-events-auto" style={{ backgroundColor: 'var(--bg-color, #f8fafc)' }}>
      <div className="absolute inset-0 opacity-10" style={{
         backgroundImage: 'radial-gradient(var(--grid-line) 1px, transparent 1px)',
         backgroundSize: '40px 40px'
      }} />

      <div className="relative border p-12 rounded-xl min-w-[400px] flex flex-col gap-8 shadow-2xl backdrop-blur-md" 
           style={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--grid-line)' }}>
        
        <div className="text-center flex flex-col items-center">
            <div className="flex gap-4 mb-8 justify-center flex-wrap">
                {displayTowers.map((type, i) => (
                    <div key={type} className="animate-bounce" style={{ animationDelay: `${i * 0.15}s`, animationDuration: '2s' }}>
                        <TowerGraphic type={type} themeName={activeTheme} size={48} angle={Math.PI/6} />
                    </div>
                ))}
            </div>

            <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center justify-center" style={{ color: 'var(--hud-text)' }}>
                <span className="font-extrabold uppercase">DesktopDefense</span>
                <span className="text-sm font-light self-start mt-1 ml-1" style={{ color: 'var(--accent-primary)' }}>.com</span>
            </h1>
            <div className="flex gap-4 text-xs opacity-60" style={{ color: 'var(--hud-text)' }}>
                <span>PLAYS: {timesPlayed}</span>
                <span>HIGH SCORE: {highScore}</span>
            </div>
        </div>
        
        <div className="flex flex-col gap-4 items-center">
           {isPaused && (
           <button 
             onClick={() => handleStart(true)}
             className="px-8 py-4 rounded-lg font-bold transition-all text-lg w-full border-2"
             style={{ 
                 borderColor: 'var(--accent-primary)',
                 color: 'var(--accent-primary)'
             }}
           >
             CONTINUE
           </button>
           )}
           <button 
             onClick={() => handleStart(false)}
             className="px-8 py-4 rounded-lg font-bold transition-all text-lg w-full"
             style={{ 
                 backgroundColor: 'var(--accent-primary)',
                 color: 'var(--panel-bg)',
                 boxShadow: '0 4px 14px 0 rgba(0,0,0,0.2)'
             }}
           >
             {isPaused ? 'NEW GAME' : 'START GAME'}
           </button>
        </div>

        <div className="flex justify-center gap-4">
            <button onClick={() => handleShare('twitter')} className="p-2 rounded-full border border-[var(--grid-line)] hover:bg-[var(--accent-primary)] hover:text-white transition-colors" style={{ color: 'var(--hud-text)' }}>
                <Twitter size={20} />
            </button>
            <button onClick={() => handleShare('facebook')} className="p-2 rounded-full border border-[var(--grid-line)] hover:bg-[var(--accent-primary)] hover:text-white transition-colors" style={{ color: 'var(--hud-text)' }}>
                <Facebook size={20} />
            </button>
            <button onClick={() => handleShare('copy')} className="p-2 rounded-full border border-[var(--grid-line)] hover:bg-[var(--accent-primary)] hover:text-white transition-colors" style={{ color: 'var(--hud-text)' }}>
                <Link size={20} />
            </button>
        </div>

        <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--grid-line)' }}>
           <div className="text-xs mb-3 font-bold opacity-60 text-center" style={{ color: 'var(--hud-text)' }}>THEME</div>
           <div className="grid grid-cols-4 gap-2">
              {themes.map(t => (
                  <button 
                     key={t}
                     onClick={() => setHudState({ activeTheme: t })}
                     className="py-1 text-[9px] font-bold rounded transition-colors uppercase border"
                     style={{
                         borderColor: activeTheme === t ? 'var(--accent-primary)' : 'var(--grid-line)',
                         color: activeTheme === t ? 'var(--accent-primary)' : 'var(--hud-text)',
                         backgroundColor: activeTheme === t ? 'var(--grid-line)' : 'transparent',
                         opacity: activeTheme === t ? 1 : 0.6
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
