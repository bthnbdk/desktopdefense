import { EventBus } from './EventBus';
import { Grid } from './Grid';
import { Pathfinder } from './Pathfinder';
import { EnemyManager } from './EnemyManager';
import { TowerManager } from './TowerManager';
import { WaveManager } from './WaveManager';
import { EffectManager } from './EffectManager';
import { SoundManager } from './SoundManager';
import { GameRenderer } from '../renderer/GameRenderer';
import { GameState, RenderSnapshot, Point } from '../types';
import { themes } from '../data/themes';
import { levels } from '../data/waves';
import { towers } from '../data/towers';

import { useHudStore } from '../store';

export class GameEngine {
  private rafId: number = 0;
  private lastTime: number = 0;
  private state: GameState;
  private eventBus: EventBus;
  private grid: Grid;
  private pathfinder: Pathfinder;
  private enemyManager: EnemyManager;
  private towerManager: TowerManager;
  private waveManager: WaveManager;
  private effectManager: EffectManager;
  private soundManager: SoundManager;
  private renderer: GameRenderer;

  private canvasW: number = 0;
  private canvasH: number = 0;
  private cellSize: number = 40;
  private readonly COLS = 32;
  private readonly ROWS = 18;
  private path: Point[] = [];
  private entry: Point = { col: 0, row: 0 };
  private exit: Point = { col: 0, row: 0 };
  private hoveredCell: Point | null = null;
  private lastPlacementSelectedType: string | null = null;
  private placementValid: boolean = false;

  private isRunning: boolean = false;
  private accumulator: number = 0;
  private readonly FIXED_DT: number = 1 / 60; // 60 updates per second

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.grid = new Grid(0, 0);
    this.pathfinder = new Pathfinder();
    this.enemyManager = new EnemyManager();
    this.towerManager = new TowerManager();
    this.waveManager = new WaveManager(eventBus, this.enemyManager);
    this.effectManager = new EffectManager();
    this.soundManager = new SoundManager();
    this.renderer = new GameRenderer();

    this.state = {
      phase: 'menu',
      lives: 20,
      gold: 200,
      score: 0,
      currentWave: 1,
      totalWaves: 1,
      mode: 'campaign',
      levelId: 1,
      infiniteWave: 0,
      autoWave: false,
      isPaused: false
    };

    // console.log('[GameEngine] Initialized');
    
    // Wire HUD actions
    this.eventBus.on('ui:sendWave', () => {
       this.waveManager.sendNextWaveEarly();
    });
    this.eventBus.on('ui:sellTower', (data) => {
       this.sellTower(data.id, data.stateRef);
    });
    this.eventBus.on('ui:upgradeTower', (data) => {
       this.upgradeTower(data.id, data.stateRef);
    });
    this.eventBus.on('ui:targetMode', (data) => {
       this.setTargetMode(data.id, data.mode, data.stateRef);
    });
    this.eventBus.on('ui:startGame', (data) => {
       this.state.phase = 'playing';
       this.state.isPaused = false;
       
       if (data?.stateRef) {
          data.stateRef.setHudState({ gamePhase: 'playing', isPaused: false });
       } else {
          useHudStore.getState().setHudState({ gamePhase: 'playing', isPaused: false });
       }

       const lvl = levels[0];
       this.state.gold = lvl.startGold;
       this.state.lives = lvl.startLives;
       this.state.currentWave = 1;
       this.state.score = 0;
       
       this.towerManager.towers = [];
       this.towerManager.projectiles = [];
       this.enemyManager.enemies = [];
       this.grid.clearTactical(); // Need to add this helper to Grid
       
       if (this.canvasW > 0) {
         this.initMap(this.canvasW - 180, this.canvasH - 48, true);
       }
       this.soundManager.playPlaceTower();
       this.broadcastHudUpdate();
    });
    this.eventBus.on('ui:restartGame', (data) => {
       this.state.phase = 'playing';
       data.stateRef.setHudState({ gamePhase: 'playing' });
       const lvl = levels[0];
       this.state.gold = lvl.startGold;
       this.state.lives = lvl.startLives;
       this.state.currentWave = 1;
       this.state.score = 0;
       
       this.towerManager.towers = [];
       this.towerManager.projectiles = [];
       this.enemyManager.enemies = [];
       this.initMap(this.canvasW - 180, this.canvasH - 48, true); 
       this.soundManager.playPlaceTower();
       this.broadcastHudUpdate();
    });
    this.eventBus.on('ui:toggleMute', (data) => {
       this.soundManager.setMuted(data.muted);
    });
    this.eventBus.on('ui:togglePause', (data) => {
       if (data.stateRef) {
           this.state.isPaused = data.isPaused;
           data.stateRef.setHudState({ isPaused: data.isPaused });
       }
    });
    this.eventBus.on('ui:toggleAutoWave', (data) => {
       if (data.stateRef) {
           this.state.autoWave = data.autoWave;
           data.stateRef.setHudState({ autoWave: data.autoWave });
       }
    });
    this.eventBus.on('ui:quitGame', (data) => {
       if (data.stateRef) {
           this.state.phase = 'menu';
           data.stateRef.setHudState({ gamePhase: 'menu' });
       }
    });

    // Listen to window events
    this.handleGlobalUiEvent = this.handleGlobalUiEvent.bind(this);
    window.addEventListener('ui:sendWave', this.handleGlobalUiEvent);
    window.addEventListener('ui:sellTower', this.handleGlobalUiEvent);
    window.addEventListener('ui:upgradeTower', this.handleGlobalUiEvent);
    window.addEventListener('ui:targetMode', this.handleGlobalUiEvent);
    window.addEventListener('ui:startGame', this.handleGlobalUiEvent);
    window.addEventListener('ui:restartGame', this.handleGlobalUiEvent);
    window.addEventListener('ui:toggleMute', this.handleGlobalUiEvent);
    window.addEventListener('ui:togglePause', this.handleGlobalUiEvent);
    window.addEventListener('ui:toggleAutoWave', this.handleGlobalUiEvent);
    window.addEventListener('ui:quitGame', this.handleGlobalUiEvent);
  }

  private handleGlobalUiEvent(e: Event) {
      const customEvent = e as CustomEvent;
      this.eventBus.emit(e.type, customEvent.detail);
  }

  private sellTower(id: string, stateRef: any) {
     const tIndex = this.towerManager.towers.findIndex(t => t.id === id);
     if (tIndex >= 0) {
        const t = this.towerManager.towers[tIndex];
        const sellValue = Math.floor(t.totalInvested * 0.7);
        this.state.gold += sellValue;
        this.grid.set(t.col, t.row, 'empty');
        this.towerManager.towers.splice(tIndex, 1);
        this.path = this.pathfinder.findPath(this.grid, this.entry, this.exit) || [];
        this.enemyManager.realignEnemiesToPath(this.path, this.cellSize);
        stateRef.setHudState({ selectedMapTower: null, selectedTowerInfo: null });
        this.soundManager.playError(); // Re-using error sound for sell sound (pitch down)
        
        const tx = t.col * this.cellSize + this.cellSize / 2;
        const ty = t.row * this.cellSize + this.cellSize / 2;
        const theme = themes[stateRef.activeTheme as ThemeName];
        const isLight = theme.isLight;
        
        this.effectManager.spawnExplosion(tx, ty, isLight ? '#db2777' : '#ff00aa', 20);
        this.effectManager.spawnFloatingText(tx, ty, `+${sellValue}`, isLight ? '#b45309' : '#ffaa00');
        
        this.broadcastHudUpdate();
     }
  }
  
  private upgradeTower(id: string, stateRef: any) {
     const t = this.towerManager.towers.find(t => t.id === id);
     if (t) {
        if (t.level >= 10) {
            this.soundManager.playError();
            return;
        }
        const config = towers[t.type];
        const cost = Math.floor(config.cost * Math.pow(1.5, t.level));
        if (this.state.gold >= cost) {
           this.state.gold -= cost;
           t.level++;
           t.totalInvested += cost;
           stateRef.setHudState({ selectedTowerInfo: { ...t } }); // Update UI view
           this.soundManager.playPlaceTower(); // Use place sound for upgrade
           
           const tx = t.col * this.cellSize + this.cellSize / 2;
           const ty = t.row * this.cellSize + this.cellSize / 2;
           const theme = themes[stateRef.activeTheme as ThemeName];
           const isLight = theme.isLight;
           
           this.effectManager.spawnExplosion(tx, ty, isLight ? '#0891b2' : '#00ffee', 15);
           this.effectManager.spawnFloatingText(tx, ty, `UPGRADED`, isLight ? '#0891b2' : '#00ffee');
           
           this.broadcastHudUpdate();
        } else {
           this.soundManager.playError();
        }
     }
  }
  
  private setTargetMode(id: string, mode: string, stateRef: any) {
      const t = this.towerManager.towers.find(t => t.id === id);
      if (t) {
         t.targetMode = mode as any;
         stateRef.setHudState({ selectedTowerInfo: { ...t } });
      }
  }

  public initMap(mapWidth: number, mapHeight: number, resetState: boolean = false) {
    if (mapWidth <= 0 || mapHeight <= 0) return;
    
    // Calculate cellSize to fit COLS x ROWS into the given dimensions
    const cellW = mapWidth / this.COLS;
    const cellH = mapHeight / this.ROWS;
    this.cellSize = Math.min(cellW, cellH);

    const cols = this.COLS;
    const rows = this.ROWS;
    
    const gridResized = this.grid.cols !== cols || this.grid.rows !== rows;

    if (gridResized) {
      this.grid = new Grid(cols, rows);
    } else if (resetState) {
      this.grid.init(cols, rows);
    }

    this.entry = { col: 0, row: Math.floor(rows / 2) };
    this.exit = { col: cols - 1, row: Math.floor(rows / 2) };
    
    this.grid.set(this.entry.col, this.entry.row, 'entry');
    this.grid.set(this.exit.col, this.exit.row, 'exit');
    
    this.path = this.pathfinder.findPath(this.grid, this.entry, this.exit) || [];

    // Realign all active enemies to new cellSize
    this.enemyManager.realignEnemiesToPath(this.path, this.cellSize);
    
    if (resetState) {
        // Only load level data if we are intentionally starting/restarting
        const lvl = levels[0];
        this.state.gold = lvl.startGold;
        this.state.score = 0;
        this.state.lives = lvl.startLives;
        this.state.currentWave = 1;
        this.state.totalWaves = lvl.waves.length;
        this.waveManager.init(lvl.waves);
    }

    this.broadcastHudUpdate();
  }

  public start(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, logicalW: number, logicalH: number) {
    this.canvasW = logicalW;
    this.canvasH = logicalH;
    
    // Sync with store if we are starting up (e.g. after a resize)
    const storeState = useHudStore.getState();
    if (this.state.phase === 'menu' && storeState.gamePhase === 'playing') {
        this.state.phase = 'playing';
        console.log('[GameEngine] Restoring playing phase from store');
    }
    
    const sidebarWidth = 180;
    const hudHeight = 48;
    this.initMap(logicalW - sidebarWidth, logicalH - hudHeight);

    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;

    const loop = (ts: number) => {
      if (!this.isRunning) return;
      
      const frameTime = Math.min((ts - this.lastTime) / 1000, 0.25); // Cap to 250ms to avoid spiral of death
      this.lastTime = ts;
      this.accumulator += frameTime;

      while (this.accumulator >= this.FIXED_DT) {
        this.update(this.FIXED_DT);
        this.accumulator -= this.FIXED_DT;
      }

      this.renderer.render(ctx, this.buildRenderSnapshot(ts), logicalW, logicalH);
      
      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
    
    // Initial update to sync UI
    this.broadcastHudUpdate();
  }

  public stopLoop() {
    this.isRunning = false;
    cancelAnimationFrame(this.rafId);
  }

  public destroy() {
    this.stopLoop();
    window.removeEventListener('ui:sendWave', this.handleGlobalUiEvent);
    window.removeEventListener('ui:sellTower', this.handleGlobalUiEvent);
    window.removeEventListener('ui:upgradeTower', this.handleGlobalUiEvent);
    window.removeEventListener('ui:targetMode', this.handleGlobalUiEvent);
    window.removeEventListener('ui:startGame', this.handleGlobalUiEvent);
    window.removeEventListener('ui:restartGame', this.handleGlobalUiEvent);
    window.removeEventListener('ui:toggleMute', this.handleGlobalUiEvent);
    window.removeEventListener('ui:togglePause', this.handleGlobalUiEvent);
    window.removeEventListener('ui:toggleAutoWave', this.handleGlobalUiEvent);
    window.removeEventListener('ui:quitGame', this.handleGlobalUiEvent);
  }

  public handleInput(x: number, y: number, type: string, stateRef: any) {
    if (this.state.phase !== 'playing' || this.state.isPaused) return;

    const sidebarWidth = 180;
    const hudHeight = 48;
    const mapW = this.canvasW - sidebarWidth;
    const mapH = this.canvasH - hudHeight;
    const gridW = this.COLS * this.cellSize;
    const gridH = this.ROWS * this.cellSize;
    
    const offsetX = sidebarWidth + (mapW - gridW) / 2;
    const offsetY = hudHeight + (mapH - gridH) / 2;
    
    const selectedType = stateRef.selectedTowerType;

    if (x >= offsetX && x <= offsetX + gridW && y >= offsetY && y <= offsetY + gridH) {
      const col = Math.floor((x - offsetX) / this.cellSize);
      const row = Math.floor((y - offsetY) / this.cellSize);

      if (type === 'mousemove') {
          if (!this.grid.isOutOfBounds(col, row)) {
              if (this.hoveredCell?.col === col && this.hoveredCell?.row === row && this.lastPlacementSelectedType === selectedType) {
                  return;
              }
              this.hoveredCell = { col, row };
              this.lastPlacementSelectedType = selectedType;

              if (selectedType) {
                  const currentCell = this.grid.get(col, row);
                  const hasEnemy = this.enemyManager.hasEnemyAt(col, row, this.cellSize);
                  const config = towers[selectedType];
                  this.placementValid = currentCell === 'empty' && 
                                       !hasEnemy && 
                                       this.state.gold >= config.cost &&
                                       this.pathfinder.canPlaceTower(this.grid, col, row, this.entry, this.exit);
              } else {
                  this.placementValid = false;
              }
          } else {
              this.hoveredCell = null;
              this.placementValid = false;
          }
          return;
      }

      if (type === 'click') {
          if (!this.grid.isOutOfBounds(col, row)) {
            const currentType = this.grid.get(col, row);
            
            if (currentType === 'empty') {
          // Deselect existing if selected
          if (stateRef.selectedMapTower) {
             stateRef.setHudState({ selectedMapTower: null, selectedTowerInfo: null, selectedTowerType: null });
             return; // just deselect and do nothing else
          }

          if (selectedType) {
              const config = towers[selectedType];
              const cost = config ? config.cost : 50;
              
              if (this.enemyManager.hasEnemyAt(col, row, this.cellSize)) {
                  this.soundManager.playError();
                  this.effectManager.spawnFloatingText(col * this.cellSize + this.cellSize/2, row * this.cellSize, "ENEMY PRESENT", "#ff0000");
              } else if (this.state.gold >= cost && this.pathfinder.canPlaceTower(this.grid, col, row, this.entry, this.exit)) {
                this.state.gold -= cost;
                this.grid.set(col, row, 'tower');
                this.towerManager.placeTower(selectedType, col, row);
                this.path = this.pathfinder.findPath(this.grid, this.entry, this.exit) || [];
                this.enemyManager.realignEnemiesToPath(this.path, this.cellSize);
                this.soundManager.playPlaceTower();
                
                const tx = col * this.cellSize + this.cellSize / 2;
                const ty = row * this.cellSize + this.cellSize / 2;
                this.effectManager.spawnExplosion(tx, ty, '#00ffaa', 10);
                this.effectManager.spawnFloatingText(tx, ty, `-${cost} G`, '#ffaa00');

                this.broadcastHudUpdate();
              } else if (this.state.gold < cost) {
                 this.soundManager.playError();
                 this.effectManager.spawnFloatingText(col * this.cellSize + this.cellSize/2, row * this.cellSize, "NO FUNDS", "#ff0000");
              } else {
                 this.soundManager.playError();
                 this.effectManager.spawnFloatingText(col * this.cellSize + this.cellSize/2, row * this.cellSize, "BLOCKED", "#ff0000");
              }
          }
        } else if (currentType === 'tower') {
            const t = this.towerManager.towers.find(t => t.col === col && t.row === row);
            if (t) {
                stateRef.setHudState({ selectedMapTower: t.id, selectedTowerInfo: t, selectedTowerType: null });
            }
        }
      }
    }
  }
}

  private update(dt: number) {
    if (this.state.phase !== 'playing' || this.state.isPaused) return;

    this.waveManager.update(dt, this.path[0] || this.entry, this.cellSize, this.state.autoWave);
    this.enemyManager.update(dt, this.path, this.cellSize, this.entry, this.exit);
    
    const theme = themes[useHudStore.getState().activeTheme as ThemeName];
    this.towerManager.update(dt, this.enemyManager.enemies, this.cellSize, this.effectManager, this.soundManager, theme.isLight, this.enemyManager);
    this.effectManager.update(dt);

    // Update state wave number
    const targetWave = this.waveManager.getCurrentWaveNumber();
    if (this.state.currentWave !== targetWave) {
       this.state.currentWave = targetWave;
       this.broadcastHudUpdate();
    }

    // Process hits, kills, leaks
    let needsHudUpdate = false;
    const enemies = this.enemyManager.enemies;

    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      
      if (!enemy.active) {
        if (enemy.hp <= 0) {
          // Killed - Reward given here
          this.state.score += enemy.reward;
          this.state.gold += enemy.reward;
          needsHudUpdate = true;
          
          const themeName = useHudStore.getState().activeTheme;
          const theme = themes[themeName as ThemeName];
          const isLight = theme.isLight;
          
          this.effectManager.spawnExplosion(enemy.worldX, enemy.worldY, isLight ? '#dc2626' : '#ff0055', 15);
          this.effectManager.spawnFloatingText(enemy.worldX, enemy.worldY, `+${enemy.reward}`, isLight ? '#059669' : '#00ffaa');
          
          if (enemy.type === 'spawn') {
             for (let j = 0; j < 2; j++) {
                this.enemyManager.spawnAt('normal', enemy.worldX, enemy.worldY, enemy.pathIndex, Math.max(0, enemy.progress - j*0.05), enemy.maxHp / 2, Math.floor(enemy.reward / 2), enemy.speed * 1.2);
             }
          }
        } else if (enemy.pathIndex >= this.path.length || enemy.pathIndex === 9999) {
          // Reached exit
          const damage = enemy.type === 'boss' ? 3 : 1;
          this.state.lives = Math.max(0, this.state.lives - damage);
          needsHudUpdate = true;
          this.soundManager.playError(); // play leak sound
          
          if (this.state.lives <= 0) {
            this.state.lives = 0;
            this.state.phase = 'gameover';
            const finalScore = this.calculateFinalScore();
            this.eventBus.emit('game:over', { score: finalScore, wave: this.state.currentWave, reason: 'lives' });
            this.broadcastHudUpdate();
          }
        }
        
        // Return to pool instead of splice
        this.enemyManager.release(enemy);
      }
    }
    
    // Check win condition
    if (this.waveManager.isAllWavesSpawned() && this.enemyManager.getActiveEnemies().length === 0 && this.state.phase === 'playing') {
       this.state.phase = 'waveComplete';
       const finalScore = this.calculateFinalScore();
       this.eventBus.emit('game:over', { score: finalScore, wave: this.state.currentWave, reason: 'win' });
       needsHudUpdate = true;
    }

    if (needsHudUpdate) {
      this.broadcastHudUpdate();
    }
  }

  private calculateFinalScore(): number {
    // Score Formula: W*1000 + (L*500) + (S/10) + (G/5)
    // weights: waves(0.4), lives(0.2), basic score(0.3), gold(0.1)
    const waveBonus = this.state.currentWave * 1000;
    const lBonus = this.state.lives * 500;
    const diversityBonus = this.towerManager.towers.length * 200;
    
    return Math.floor(this.state.score + waveBonus + lBonus + diversityBonus);
  }

  private broadcastHudUpdate() {
    const storeState = useHudStore.getState();
    let selectedTowerInfo = storeState.selectedTowerInfo;

    // If a tower is selected, update its info from the actual tower state
    if (storeState.selectedMapTower) {
      const actualTower = this.towerManager.towers.find(t => t.id === storeState.selectedMapTower);
      if (actualTower) {
        selectedTowerInfo = { ...actualTower };
      }
    }

    this.eventBus.emit('hud:update', {
      lives: this.state.lives,
      gold: this.state.gold,
      score: this.state.score,
      wave: this.state.currentWave,
      waveMax: this.state.totalWaves,
      enemiesLeft: this.enemyManager.getActiveEnemies().length,
      gamePhase: this.state.phase,
      selectedTowerInfo: selectedTowerInfo,
      activeSpawning: this.waveManager.getActiveSpawningTypes(),
    });
  }

  private buildRenderSnapshot(ts: number): RenderSnapshot {
    const state = useHudStore.getState();
    return {
      grid: this.grid.cells,
      path: this.path,
      towers: this.towerManager.getActiveTowers(),
      enemies: this.enemyManager.getActiveEnemies(),
      projectiles: this.towerManager.getActiveProjectiles(),
      floatingTexts: this.effectManager.floatingTexts,
      particles: this.effectManager.particles,
      hoveredCell: this.hoveredCell,
      selectedTowerId: state.selectedMapTower,
      selectedTowerTypePreview: state.selectedTowerType,
      placementValid: this.placementValid,
      entry: this.entry,
      exit: this.exit,
      cellSize: this.cellSize,
      cols: this.grid.cols,
      rows: this.grid.rows,
      // Pass from store/event ideally, but fetch from global for now
      theme: themes[state.activeTheme as keyof typeof themes] || themes['desktop'], 
      tick: Math.floor(ts / 16)
    };
  }
}
