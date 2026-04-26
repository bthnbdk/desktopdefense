import { create } from 'zustand';
import { GamePhase, ThemeName, TowerType, TowerId } from './types';

export interface HudState {
  lives: number;
  gold: number;
  score: number;
  wave: number;
  waveMax: number;
  enemiesLeft: number;
  isPaused: boolean;
  gamePhase: GamePhase;
  selectedTowerType: TowerType | null;
  selectedMapTower: TowerId | null;
  selectedTowerInfo: any | null;
  activeTheme: ThemeName;
  soundMuted: boolean;
  autoWave: boolean;
  highScore: number;
  timesPlayed: number;
}

interface HudStore extends HudState {
  setHudState: (partial: Partial<HudState>) => void;
  registerGamePlay: (finalScore: number) => void;
}

export const useHudStore = create<HudStore>((set) => ({
  lives: 20,
  gold: 200,
  score: 0,
  wave: 1,
  waveMax: 20,
  enemiesLeft: 0,
  isPaused: false,
  gamePhase: 'menu',
  selectedTowerType: null,
  selectedMapTower: null,
  selectedTowerInfo: null,
  activeTheme: 'desktop',
  soundMuted: false,
  autoWave: false,
  highScore: parseInt(localStorage.getItem('dd_highScore') || '0'),
  timesPlayed: parseInt(localStorage.getItem('dd_timesPlayed') || '0'),
  setHudState: (partial) => set((state) => ({ ...state, ...partial })),
  registerGamePlay: (finalScore: number) => set((state) => {
    const newTimesPlayed = state.timesPlayed + 1;
    const newHighScore = Math.max(state.highScore, finalScore);
    localStorage.setItem('dd_highScore', newHighScore.toString());
    localStorage.setItem('dd_timesPlayed', newTimesPlayed.toString());
    return { ...state, highScore: newHighScore, timesPlayed: newTimesPlayed };
  }),
}));
