export type CellType = 'empty' | 'tower' | 'pathHint' | 'entry' | 'exit';
export type EnemyType = 'normal' | 'fast' | 'boss' | 'group' | 'immune' | 'spawn' | 'flying';
export type TowerType = 'pellet' | 'splash' | 'slow' | 'sniper' | 'chain' | 'mortar';
export type TargetMode = 'first' | 'last' | 'strongest' | 'closest';
export type ThemeName = 'desktop' | 'neonVoid' | 'synthwave' | 'matrix' | 'arctic' | 'lava' | 'monochrome' | 'softLight' | 'frost' | 'papyrus' | 'mint';
export type TowerId = string;
export type GamePhase = 'menu' | 'levelSelect' | 'playing' | 'paused' | 'gameover' | 'waveComplete';

export interface Point { col: number; row: number; }
export interface WorldPoint { x: number; y: number; }

export interface Enemy {
  id: string;
  type: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  reward: number;
  pathIndex: number;
  progress: number;
  distanceTraveled: number;
  worldX: number;
  worldY: number;
  slowTimer: number;
  slowAmount: number;
  active: boolean;
  movementType: 'ground' | 'flying';
  phase?: 1 | 2 | 3;
  armored?: boolean;
}

export interface Tower {
  id: TowerId;
  type: TowerType;
  col: number;
  row: number;
  level: number;
  targetMode: TargetMode;
  currentTargetId: string | null;
  angle: number;
  cooldownTimer: number;
  totalInvested: number;
  kills: number;
}

export interface Projectile {
  id: string;
  towerId: TowerId;
  targetId: string;
  x: number;
  y: number;
  speed: number;
  damage: number;
  splashRadius: number;
  active: boolean;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  vy: number;
  active: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  decay: number;
  active: boolean;
}

export interface TowerConfig {
  type: TowerType;
  name: string;
  cost: number;
  damage: number;
  range: number;
  fireRate: number;
  projectileSpeed: number;
  splashRadius: number;
  slowAmount: number;
  slowDuration: number;
  chainTargets: number;
  canTargetFlying: boolean;
  description: string;
}

export interface WaveGroup {
  type: EnemyType;
  count: number;
  intervalMs: number;
  hpMultiplier: number;
  speedMultiplier: number;
}

export interface WaveDefinition {
  waveNumber: number;
  groups: WaveGroup[];
  prewaveDelayMs: number;
}

export interface LevelDefinition {
  id: number;
  name: string;
  description: string;
  gridTemplate: number[][]; // 0=empty, 1=path-hint
  entryPoint: Point;
  exitPoint: Point;
  startGold: number;
  startLives: number;
  waves: WaveDefinition[];
  unlockCondition: 'previous' | null;
}

export interface Theme {
  name: string;
  bg: string;
  gridLine: string;
  pathFill: string;
  emptyCellFill: string;
  accentPrimary: string;
  accentSecondary: string;
  hudBg: string;
  hudText: string;
  panelBg: string;
  enemyColors: Record<EnemyType, string>;
  towerColors: Record<TowerType, string>;
  isLight?: boolean;
  accentContrast?: string;
}

export interface GameState {
  phase: GamePhase;
  lives: number;
  gold: number;
  score: number;
  currentWave: number;
  totalWaves: number;
  mode: 'campaign' | 'infinite' | 'infiniteLevel';
  levelId: number | null;
  infiniteWave: number;
  autoWave: boolean;
  isPaused: boolean;
}

export interface RenderSnapshot {
  grid: CellType[][];
  path: Point[];
  towers: Tower[];
  enemies: Enemy[];
  projectiles: Projectile[];
  floatingTexts: FloatingText[];
  particles: Particle[];
  hoveredCell: Point | null;
  mouseWorldX: number;
  mouseWorldY: number;
  selectedTowerId: TowerId | null;
  selectedTowerTypePreview: TowerType | null;
  placementValid: boolean;
  entry: Point;
  exit: Point;
  cellSize: number;
  cols: number;
  rows: number;
  theme: Theme;
  tick: number;
}
