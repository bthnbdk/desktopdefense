/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Smartphone } from 'lucide-react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { TowerPanel } from './components/TowerPanel';
import { WavePreview } from './components/WavePreview';
import { MainMenu } from './components/MainMenu';
import { GameOver } from './components/GameOver';
import { useHudStore } from './store';
import { themes } from './data/themes';

export default function App() {
  const { gamePhase, activeTheme } = useHudStore();
  const showHud = gamePhase === 'playing' || gamePhase === 'waveComplete' || gamePhase === 'paused';
  const theme = themes[activeTheme];

  const themeVars = {
    '--bg-color': theme.bg,
    '--grid-line': theme.gridLine,
    '--panel-bg': theme.panelBg,
    '--hud-bg': theme.hudBg,
    '--hud-text': theme.hudText,
    '--accent-primary': theme.accentPrimary,
    '--accent-secondary': theme.accentSecondary,
    '--accent-contrast': theme.accentContrast || '#ffffff',
    '--is-light': theme.isLight ? '1' : '0',
    '--border-color': theme.isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.05)',
    '--text-dim': theme.isLight ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.4)',
    '--text-bright': theme.isLight ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)',
  } as React.CSSProperties;

  return (
    <div className={`w-screen h-screen ${theme.isLight ? 'bg-white' : 'bg-black'} overflow-hidden m-0 p-0 flex items-center justify-center relative select-none`} style={themeVars}>
      <div className="md:hidden absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center text-white p-4 text-center">
        <Smartphone size={64} className="mb-4 animate-pulse" />
        <h2 className="text-xl font-bold">Please rotate your device</h2>
        <p className="opacity-70">This game requires landscape mode.</p>
      </div>
      <GameCanvas />
      {showHud && (
        <>
          <HUD />
          <TowerPanel />
          <WavePreview />
        </>
      )}
      {gamePhase === 'menu' && <MainMenu />}
      {gamePhase === 'gameover' && <GameOver />}
    </div>
  );
}
