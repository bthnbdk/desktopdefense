import React, { useRef, useEffect } from 'react';
import { Coins } from 'lucide-react';
import { useHudStore } from '../store';
import { towers } from '../data/towers';
import { TowerType, TargetMode, ThemeName } from '../types';
import { themes } from '../data/themes';
import { TowerGraphic } from './TowerGraphic';

export const TowerPanel: React.FC = () => {
  const { gold, selectedTowerType, selectedMapTower, selectedTowerInfo, activeTheme, setHudState } = useHudStore();

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
        <div className="p-3 flex flex-col gap-4" style={{ color: 'var(--hud-text, white)' }}>
           <div className="font-bold border-b border-black/10 pb-2 flex items-center gap-2">
              <TowerGraphic type={selectedTowerInfo.type} themeName={activeTheme} angle={0} />
              <span>{config.name} Lvl {selectedTowerInfo.level}</span>
           </div>
           
           <div className="grid grid-cols-2 gap-2 text-xs font-mono opacity-80">
               <div>DMG: {Math.floor(config.damage * Math.pow(1.5, selectedTowerInfo.level - 1))}</div>
               <div>RNG: {Math.floor(config.range * Math.pow(1.05, selectedTowerInfo.level - 1))}</div>
               <div>KILLS: {selectedTowerInfo.kills}</div>
               <div>INV: ⬡{selectedTowerInfo.totalInvested}</div>
           </div>
           
           <div className="flex flex-col gap-1">
              <div className="text-xs opacity-60">Target Priority</div>
              <div className="grid grid-cols-2 gap-1 gap-y-2 text-[10px]">
                 {modes.map(m => (
                    <button 
                        key={m} 
                        onClick={() => handleTarget(m)}
                        className={`py-1 rounded border transition-colors cursor-pointer ${selectedTowerInfo.targetMode === m ? 'bg-[var(--accent-primary)]/20 border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold' : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30'}`}
                    >
                        {m.toUpperCase()}
                    </button>
                 ))}
              </div>
           </div>
           
           <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-black/10">
              {selectedTowerInfo.level >= 10 ? (
                  <div className="w-full py-2 px-3 rounded font-bold text-center border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-green-600 dark:text-green-400">
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
                        <span className="font-mono">⬡{upgradeCost}</span>
                    </button>
                    {/* TOOLTIP FOR UPGRADE */}
                    <div className="hidden group-hover:block absolute bottom-full left-0 w-full mb-2 p-2 bg-[var(--panel-bg)] border border-[var(--accent-primary)] text-[var(--hud-text)] text-xs rounded z-50 shadow-lg">
                       <div className="font-bold mb-1 border-b border-black/10 pb-1">Next Level Stats</div>
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
                   <span className="font-mono">⬡{sellValue}</span>
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
    <div className="absolute left-0 top-[48px] w-[180px] h-[calc(100%-48px)] bg-[var(--panel-bg,#090812)] border-r border-black/10 flex flex-col pointer-events-auto z-40" style={{ color: 'var(--hud-text, white)' }}>
      <div className="p-3 border-b border-black/10 font-bold text-center tracking-widest" style={{ color: 'var(--accent-primary, #00ffee)' }}>
        {selectedMapTower ? 'TOWER INFO' : 'TOWERS'}
      </div>
      
      {selectedMapTower ? renderUpgradePanel() : (
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {Object.values(towers).map((tower) => {
          const canAfford = gold >= tower.cost;
          const isSelected = selectedTowerType === tower.type;
          
          return (
            <button
              key={tower.type}
              onClick={() => handleSelect(tower.type)}
              disabled={false}
              className={`w-full text-left p-2 rounded border flex flex-col gap-1 transition-all cursor-pointer group relative
                ${isSelected ? 'bg-[var(--accent-primary)]/10' : 'bg-black/5 dark:bg-white/5 opacity-80 hover:opacity-100'}
                ${!canAfford && !isSelected ? 'grayscale opacity-50' : ''}
              `}
              style={{ borderColor: isSelected ? 'var(--accent-primary)' : 'transparent' }}
            >
              <div className="flex justify-between items-center w-full">
                 <div className="flex items-center gap-1.5" style={{ color: 'var(--accent-primary)' }}>
                   <TowerGraphic type={tower.type as TowerType} themeName={activeTheme} />
                   <span className="font-bold whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: 'var(--hud-text)' }}>{tower.name}</span>
                 </div>
                 <span className="font-mono text-sm" style={{ color: 'var(--accent-primary)' }}><Coins size={14} className="inline mr-1" />{tower.cost}</span>
              </div>
              
              <div className="text-[10px] opacity-60 leading-tight">
                 {tower.description}
              </div>
              
              {/* Floating Tooltip Stats */}
              <div className="hidden group-hover:block absolute left-[180px] top-0 ml-2 w-[160px] p-2 bg-[var(--panel-bg)] border border-[var(--accent-primary)] rounded shadow-xl z-50">
                 <div className="font-bold text-xs mb-1 border-b border-black/10 pb-1" style={{ color: 'var(--accent-primary)' }}>{tower.name} Stats</div>
                 <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-mono opacity-80">
                    <div>DMG: {tower.damage}</div>
                    <div>RNG: {tower.range}</div>
                    <div>SPD: {tower.fireRate}/s</div>
                    {tower.splashRadius > 0 && <div>SPL: {tower.splashRadius}px</div>}
                    {tower.slowAmount > 0 && <div>SLW: {Math.floor(tower.slowAmount * 100)}%</div>}
                    {tower.chainTargets > 0 && <div>CHN: {tower.chainTargets} jumps</div>}
                 </div>
                 <div className="mt-1 pt-1 border-t border-black/10 text-[9px] text-green-600 dark:text-green-400">
                    {tower.canTargetFlying ? "Can target flying." : "Cannot target flying."}
                 </div>
              </div>
            </button>
          );
        })}
      </div>
      )}
    </div>
  );
};
