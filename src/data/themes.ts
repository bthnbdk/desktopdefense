import { Theme } from '../types';

export const themes: Record<string, Theme> = {
  desktop: {
    name: 'Desktop',
    bg: '#020617', 
    gridLine: '#94A3B8', // High-contrast bright slate
    pathFill: '#334155', 
    emptyCellFill: '#020617',
    accentPrimary: '#38BDF8',
    accentSecondary: '#94A3B8',
    hudBg: '#0F172A', 
    hudText: '#F8FAFC',
    panelBg: '#0F172A', 
    enemyColors: { normal: '#EF4444', fast: '#F97316', boss: '#7F1D1D', group: '#EC4899', immune: '#64748B', spawn: '#D946EF', flying: '#8B5CF6' },
    towerColors: { pellet: '#38BDF8', splash: '#22C55E', slow: '#EAB308', sniper: '#F8FAFC', chain: '#F472B6', mortar: '#8B5CF6' },
    accentContrast: '#000000'
  },
  neonVoid: {
    name: 'Neon Void',
    bg: '#05040a',
    gridLine: '#7a7a99', // High-contrast violet/gray
    pathFill: '#2a2a4a', 
    emptyCellFill: '#030206',
    accentPrimary: '#00ffee',
    accentSecondary: '#ff00aa',
    hudBg: '#000000',
    hudText: '#00ffee',
    panelBg: '#090812',
    enemyColors: { normal: '#ff3366', fast: '#ff6633', boss: '#ff0000', group: '#ff88aa', immune: '#ddddff', spawn: '#cc0055', flying: '#ff00ff' },
    towerColors: { pellet: '#00ffee', splash: '#00ffaa', slow: '#0055ff', sniper: '#ffffff', chain: '#ffff00', mortar: '#00aaff' },
    accentContrast: '#000000'
  },
  synthwave: {
    name: 'Synthwave',
    bg: '#1a0b2e',
    gridLine: '#9d63eb', // High-contrast bright purple
    pathFill: '#4a2c7a',
    emptyCellFill: '#150826',
    accentPrimary: '#00ffcc',
    accentSecondary: '#ff9900',
    hudBg: '#0d041a',
    hudText: '#00ffcc',
    panelBg: '#200e3a',
    enemyColors: { normal: '#ff0055', fast: '#ff3300', boss: '#aa0000', group: '#ff2277', immune: '#ffdd00', spawn: '#880022', flying: '#ff00aa' },
    towerColors: { pellet: '#00ffcc', splash: '#00ccff', slow: '#9900ff', sniper: '#ffffff', chain: '#00ff55', mortar: '#8800ff' },
    accentContrast: '#000000'
  },
  matrix: {
    name: 'Matrix',
    bg: '#000000',
    gridLine: '#00aa00', // High-contrast neon green
    pathFill: '#004400',
    emptyCellFill: '#000000',
    accentPrimary: '#00ff00',
    accentSecondary: '#008800',
    hudBg: '#000000',
    hudText: '#00ff00',
    panelBg: '#001100',
    enemyColors: { normal: '#ff0000', fast: '#ffaa00', boss: '#cc0000', group: '#ff5555', immune: '#bbbbbb', spawn: '#880000', flying: '#ff00ff' },
    towerColors: { pellet: '#00ff00', splash: '#00cc00', slow: '#0055ff', sniper: '#ffffff', chain: '#00ffff', mortar: '#55ff55' },
    accentContrast: '#000000'
  },
  arctic: {
    name: 'Arctic',
    bg: '#001122',
    gridLine: '#0088cc', // High-contrast bright blue
    pathFill: '#003366',
    emptyCellFill: '#000a14',
    accentPrimary: '#00ccff',
    accentSecondary: '#ffffff',
    hudBg: '#000000',
    hudText: '#00ccff',
    panelBg: '#001933',
    enemyColors: { normal: '#ff5533', fast: '#ffaa33', boss: '#ff0000', group: '#ff77aa', immune: '#aaaaaa', spawn: '#cc3300', flying: '#ff00ff' },
    towerColors: { pellet: '#00ccff', splash: '#ffffff', slow: '#0055aa', sniper: '#00ff00', chain: '#00ffff', mortar: '#5555ff' },
    accentContrast: '#000000'
  },
  lava: {
    name: 'Lava',
    bg: '#220000',
    gridLine: '#cc3333', // High-contrast bright red
    pathFill: '#660000',
    emptyCellFill: '#1a0000',
    accentPrimary: '#ff5500',
    accentSecondary: '#ffcc00',
    hudBg: '#000000',
    hudText: '#ff5500',
    panelBg: '#2a0000',
    enemyColors: { normal: '#ff5500', fast: '#ffcc00', boss: '#ff0000', group: '#ff8800', immune: '#ffffff', spawn: '#555555', flying: '#00ffff' },
    towerColors: { pellet: '#ff5500', splash: '#ffcc00', slow: '#aa0000', sniper: '#ffffff', chain: '#ffff00', mortar: '#ff0000' },
    accentContrast: '#000000'
  },
  monochrome: {
    name: 'Monochrome',
    bg: '#000000',
    gridLine: '#808080', // High-contrast solid gray
    pathFill: '#333333',
    emptyCellFill: '#000000',
    accentPrimary: '#ffffff',
    accentSecondary: '#aaaaaa',
    hudBg: '#000000',
    hudText: '#ffffff',
    panelBg: '#0A0A0A', 
    enemyColors: { normal: '#ffffff', fast: '#cccccc', boss: '#888888', group: '#eeeeee', immune: '#555555', spawn: '#444444', flying: '#999999' },
    towerColors: { pellet: '#ffffff', splash: '#dddddd', slow: '#aaaaaa', sniper: '#cccccc', chain: '#eeeeee', mortar: '#777777' },
    accentContrast: '#000000'
  },
  softLight: {
    name: 'Soft Light',
    bg: '#F1F5F9', 
    gridLine: '#1E293B', // Deep dark slate to pierce the light bg
    pathFill: '#CBD5E1',
    emptyCellFill: '#F1F5F9',
    accentPrimary: '#2563eb',
    accentSecondary: '#475569',
    hudBg: '#FFFFFF', 
    hudText: '#0f172a',
    panelBg: '#FFFFFF', 
    enemyColors: { normal: '#dc2626', fast: '#d97706', boss: '#7f1d1d', group: '#db2777', immune: '#334155', spawn: '#9333ea', flying: '#7c3aed' },
    towerColors: { pellet: '#2563eb', splash: '#059669', slow: '#d97706', sniper: '#1e293b', chain: '#e11d48', mortar: '#7c3aed' },
    isLight: true,
    accentContrast: '#ffffff'
  },
  frost: {
    name: 'Frost',
    bg: '#E0F2FE', 
    gridLine: '#0369A1', // Deep ocean blue
    pathFill: '#BAE6FD',
    emptyCellFill: '#E0F2FE',
    accentPrimary: '#0284c7',
    accentSecondary: '#334155',
    hudBg: '#FFFFFF', 
    hudText: '#082f49',
    panelBg: '#FFFFFF', 
    enemyColors: { normal: '#dc2626', fast: '#ca8a04', boss: '#7f1d1d', group: '#db2777', immune: '#475569', spawn: '#9333ea', flying: '#6d28d9' },
    towerColors: { pellet: '#0284c7', splash: '#10b981', slow: '#d97706', sniper: '#0f172a', chain: '#e11d48', mortar: '#7c3aed' },
    isLight: true,
    accentContrast: '#ffffff'
  },
  papyrus: {
    name: 'Papyrus',
    bg: '#FEF3C7', 
    gridLine: '#92400E', // Deep heavy amber/brown
    pathFill: '#FDE68A',
    emptyCellFill: '#FEF3C7',
    accentPrimary: '#92400e',
    accentSecondary: '#451a03',
    hudBg: '#FFFFFF', 
    hudText: '#451a03',
    panelBg: '#FFFFFF', 
    enemyColors: { normal: '#b91c1c', fast: '#b45309', boss: '#450a0a', group: '#9f1239', immune: '#422006', spawn: '#701a75', flying: '#4c1d95' },
    towerColors: { pellet: '#92400e', splash: '#166534', slow: '#854d0e', sniper: '#0f172a', chain: '#9f1239', mortar: '#581c87' },
    isLight: true,
    accentContrast: '#ffffff'
  },
  mint: {
    name: 'Mint',
    bg: '#DCFCE7', 
    gridLine: '#15803D', // Deep forest green
    pathFill: '#BBF7D0',
    emptyCellFill: '#DCFCE7',
    accentPrimary: '#15803d',
    accentSecondary: '#064e3b',
    hudBg: '#FFFFFF', 
    hudText: '#064e3b',
    panelBg: '#FFFFFF', 
    enemyColors: { normal: '#dc2626', fast: '#ca8a04', boss: '#14532d', group: '#be123c', immune: '#022c22', spawn: '#701a75', flying: '#4c1d95' },
    towerColors: { pellet: '#15803d', splash: '#0891b2', slow: '#92400e', sniper: '#0f172a', chain: '#be123c', mortar: '#581c87' },
    isLight: true,
    accentContrast: '#ffffff'
  }
};