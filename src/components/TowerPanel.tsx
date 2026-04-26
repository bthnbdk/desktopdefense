import React, { useRef, useEffect } from 'react';
import { Coins } from 'lucide-react';
import { useHudStore } from '../store';
import { towers } from '../data/towers';
import { TowerType, TargetMode, ThemeName } from '../types';
import { themes } from '../data/themes';
import { TowerGraphic } from './TowerGraphic';

export const TowerPanel: React.FC = () => {
  const { gold, selectedTowerType, selectedMapTower, selectedTowerInfo, activeTheme, setHudState } = useHudStore();
  const isLight = themes[activeTheme].isLight;

  const handleSelect = (type: TowerType) => {
    setHudState({ selectedTowerType: selectedTowerType === type ? null : type, selectedMapTower: null, selectedTowerInfo: null });
  };
  
  const handleUpgrade = () => {
      window.dispatchEvent(new CustomEvent('ui:upgradeTower', { detail: { id: selectedMapTower, stateRef: useHudStore.getState() } }));
  };
  
  const handleSell = () => {
      window.dispatchEvent(new CustomEvent('ui:sellTower', { detail: { id: selectedMapTower, stateRef: useHudStore.getState() } }));
  };
  
  const handleTarget = (mode: TargetMode) => {
      window.dispatchEvent(new CustomEvent('ui:targetMode', { detail: { id: selectedMapTower, mode, stateRef: useHudStore.getState() } }));
  };

  const renderUpgradePanel = () => {
      if (!selectedTowerInfo) return null;
      const config = towers[selectedTowerInfo.type];
      const upgradeCost = Math.floor(config.cost * Math.pow(1.5, selectedTowerInfo.level));
      const sellValue = Math.floor(selectedTowerInfo.totalInvested * 0.7);
      
      const modes: TargetMode[] = ['first', 'last', 'strongest', 'closest'];
      
      return (
        <div className="p-3 flex flex-col gap-4" style={{ color: 'var(--hud-text)' }}>
           <div className="font-bold border-b border-[var(--border-color)] pb-2 flex items-center gap-2">
              <TowerGraphic type={selectedTowerInfo.type} themeName={activeTheme} angle={0} />
              <span>{config.name} Lvl {selectedTowerInfo.level}</span>
           </div>
           
               <div className="grid grid-cols-2 gap-2 text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
                   <div>DMG: {Math.floor(config.damage * Math.pow(1.5, selectedTowerInfo.level - 1))}</div>
                   <div>RNG: {Math.floor(config.range * Math.pow(1.05, selectedTowerInfo.level - 1))}</div>
                   <div>KILLS: {selectedTowerInfo.kills}</div>
                   <div className="flex items-center gap-1">INV: <Coins size={10} className="text-yellow-500" />{selectedTowerInfo.totalInvested}</div>
               </div>
           
           <div className="flex flex-col gap-1">
              <div className="text-xs" style={{ color: 'var(--text-dim)' }}>Target Priority</div>
              <div className="grid grid-cols-2 gap-1 gap-y-2 text-[10px]">
                 {modes.map(m => (
                    <button 
                        key={m} 
                        onClick={() => handleTarget(m)}
                        className={`py-1 rounded border transition-colors cursor-pointer ${selectedTowerInfo.targetMode === m ? 'bg-[var(--accent-primary)]/20 border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold' : 'bg-[var(--border-color)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/50'}`}
                    >
                        {m.toUpperCase()}
                    </button>
                 ))}
              </div>
           </div>
           
           <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-[var(--border-color)]">
              {selectedTowerInfo.level >= 10 ? (
                  <div className="w-full py-2 px-3 rounded font-bold text-center border bg-[var(--border-color)] border-[var(--border-color)] text-green-600 dark:text-green-400">
                     MAX LEVEL
                  </div>
              ) : (
                  <div className="relative group">
                    <button 
                        onClick={handleUpgrade}
                        disabled={gold < upgradeCost}
                        className={`w-full py-2 px-3 rounded font-bold transition-colors border flex justify-between cursor-pointer ${gold >= upgradeCost ? 'bg-green-600/20 border-green-600 text-green-700 dark:text-green-400 hover:bg-green-600/40' : 'opacity-40 grayscale cursor-not-allowed'}`}
                    >
                        <span>UPGRADE</span>
                        <span className="font-mono flex items-center gap-1"><Coins size={12} className="text-yellow-500" />{upgradeCost}</span>
                    </button>
                    {/* TOOLTIP FOR UPGRADE */}
                    <div className="hidden group-hover:block absolute bottom-full left-0 w-full mb-2 p-2 bg-[var(--panel-bg)] border border-[var(--accent-primary)] text-[var(--hud-text)] text-xs rounded z-50 shadow-lg">
                       <div className="font-bold mb-1 border-b border-[var(--border-color)] pb-1">Next Level Stats</div>
                       <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[9px]">
                          <div>DMG: {Math.floor(config.damage * Math.pow(1.5, selectedTowerInfo.level))}</div>
                          <div>RNG: {Math.floor(config.range * Math.pow(1.05, selectedTowerInfo.level))}</div>
                       </div>
                    </div>
                  </div>
              )}

              <div className="relative group">
                <button 
                   onClick={handleSell}
                   className="w-full py-2 px-3 rounded font-bold cursor-pointer transition-colors border bg-red-600/10 border-red-600 text-red-600 hover:bg-red-600/30 flex justify-between"
                >
                   <span>SELL</span>
                   <span className="font-mono flex items-center gap-1"><Coins size={12} className="text-yellow-500" />{sellValue}</span>
                </button>
                <div className="hidden group-hover:block absolute bottom-full left-0 w-full mb-2 p-2 bg-[var(--panel-bg)] border border-red-600 text-[var(--hud-text)] text-xs rounded z-50 shadow-lg">
                   Return 70% of total gold invested in this tower back to your balance.
                </div>
              </div>
           </div>
        </div>
      );
  }

  return (
    <div className="absolute left-0 top-[48px] w-[180px] h-[calc(100%-48px)] bg-[var(--panel-bg)] border-r border-[var(--border-color)] flex flex-col pointer-events-auto z-40 select-none panel-glass">
      <div className="py-3 border-b border-[var(--border-color)] font-mono font-bold text-[10px] text-center tracking-[0.3em] uppercase" style={{ color: 'var(--text-dim)' }}>
        {selectedMapTower ? 'Subsystem Config' : 'Units'}
      </div>
      
      {selectedMapTower ? (
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {renderUpgradePanel()}
        </div>
      ) : (
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
        {Object.values(towers).map((tower) => {
          const canAfford = gold >= tower.cost;
          const isSelected = selectedTowerType === tower.type;
          
          return (
            <button
              key={tower.type}
              onClick={() => handleSelect(tower.type)}
              className={`w-full text-left p-2 border flex flex-col gap-1.5 transition-all cursor-pointer group relative
                ${isSelected ? 'bg-[var(--accent-primary)]/20 border-[var(--accent-primary)]' : 'bg-[var(--border-color)] border-transparent hover:opacity-100 hover:border-[var(--accent-primary)]/30'}
                ${!canAfford && !isSelected ? 'grayscale opacity-30 cursor-not-allowed' : ''}
              `}
            >
              <div className="flex justify-between items-center w-full">
                 <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-[var(--bg-color)] border border-[var(--border-color)]">
                       <TowerGraphic type={tower.type as TowerType} themeName={activeTheme} size={24} angle={0} />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold tracking-tight leading-none mb-0.5" style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--hud-text)' }}>{tower.name.toUpperCase()}</span>
                       <span className="text-[8px] font-mono uppercase tracking-tighter" style={{ color: 'var(--text-dim)' }}>Class: {tower.type}</span>
                    </div>
                 </div>
                 <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1">
                       <Coins size={10} className={canAfford ? 'text-yellow-500' : 'text-red-500'} />
                       <span className="text-[11px] font-mono font-bold leading-none" style={{ color: canAfford ? 'var(--accent-primary)' : '#EF4444' }}>{tower.cost}</span>
                    </div>
                 </div>
              </div>
              
              <div className="text-[9px] leading-snug line-clamp-2" style={{ color: 'var(--text-dim)' }}>
                 {tower.description}
              </div>
            </button>
          );
        })}
      </div>
      )}
    </div>
  );
};
