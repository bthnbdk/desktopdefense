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
  private path: Point[] = [];
  private entry: Point = { col: 0, row: 0 };
  private exit: Point = { col: 0, row: 0 };

  private isRunning: boolean = false;

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

    console.log('[GameEngine] Initialized');
    
    // Wire HUD actions
    this.eventBus.on('ui:sendWave', () => {
       console.log('[GameEngine] ui:sendWave');
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
    this.eventBus.on('ui:startGame', () => {
       console.log('[GameEngine] ui:startGame received');
       this.state.phase = 'playing';
       useHudStore.getState().setHudState({ gamePhase: 'playing', isPaused: false });
       const lvl = levels[0];
       this.state.gold = lvl.startGold;
       this.state.lives = lvl.startLives;
       this.state.currentWave = 1;
       this.state.score = 0;
       
       if (this.canvasW > 0) {
         this.initMap(this.canvasW - 180, this.canvasH - 48, true);
       }
       this.soundManager.playPlaceTower();
       this.broadcastHudUpdate();
    });
    this.eventBus.on('ui:restartGame', (data) => {
       console.log('[GameEngine] ui:restartGame');
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
      if (e.type === 'ui:sendWave' || e.type === 'ui:startGame' || e.type === 'ui:restartGame') {
          this.eventBus.emit(e.type);
      } else if (['ui:sellTower', 'ui:upgradeTower', 'ui:targetMode', 'ui:toggleMute', 'ui:togglePause', 'ui:toggleAutoWave', 'ui:quitGame'].includes(e.type)) {
          const customEvent = e as CustomEvent;
          this.eventBus.emit(e.type, customEvent.detail);
      }
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
        this.effectManager.spawnExplosion(tx, ty, '#ff00aa', 20);
        this.effectManager.spawnFloatingText(tx, ty, `+${sellValue}`, '#ffaa00');
        
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
           this.effectManager.spawnExplosion(tx, ty, '#00ffee', 15);
           this.effectManager.spawnFloatingText(tx, ty, `UPGRADED`, '#00ffee');
           
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
    const cols = Math.max(12, Math.floor(mapWidth / Math.max(this.cellSize, 1)));
    const rows = Math.max(8, Math.floor(mapHeight / Math.max(this.cellSize, 1)));
    this.grid = new Grid(cols, rows);
    this.entry = { col: 0, row: Math.floor(rows / 2) };
    this.exit = { col: cols - 1, row: Math.floor(rows / 2) };
    
    this.grid.set(this.entry.col, this.entry.row, 'entry');
    this.grid.set(this.exit.col, this.exit.row, 'exit');
    
    this.path = this.pathfinder.findPath(this.grid, this.entry, this.exit) || [];
    
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

    const loop = (ts: number) => {
      if (!this.isRunning) return;
      const dt = Math.min((ts - this.lastTime) / 1000, 0.1);
      this.lastTime = ts;

      this.update(dt);
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
    
    const selectedType = stateRef.selectedTowerType;

    if (x > sidebarWidth && y > hudHeight && type === 'click') {
      const col = Math.floor((x - sidebarWidth) / this.cellSize);
      const row = Math.floor((y - hudHeight) / this.cellSize);

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

  private update(dt: number) {
    if (this.state.phase !== 'playing' || this.state.isPaused) return;

    this.waveManager.update(dt, this.path[0] || this.entry, this.cellSize, this.state.autoWave);
    this.enemyManager.update(dt, this.path, this.cellSize, this.entry, this.exit);
    this.towerManager.update(dt, this.enemyManager.enemies, this.cellSize, this.effectManager, this.soundManager);
    this.effectManager.update(dt);

    // Update state wave number
    const targetWave = this.waveManager.getCurrentWaveNumber();
    if (this.state.currentWave !== targetWave) {
       this.state.currentWave = targetWave;
       this.broadcastHudUpdate();
    }

    // Process hits, kills, leaks
    let needsHudUpdate = false;

    for (let i = this.enemyManager.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemyManager.enemies[i];
      
      if (!enemy.active) {
        if (enemy.hp <= 0) {
          // Killed
          this.state.score += enemy.reward;
          this.state.gold += enemy.reward;
          needsHudUpdate = true;
          
          this.effectManager.spawnExplosion(enemy.worldX, enemy.worldY, '#ff00aa', 15);
          this.effectManager.spawnFloatingText(enemy.worldX, enemy.worldY, `+${enemy.reward}`, '#00ffaa');
          
          if (enemy.type === 'spawn') {
             // Spawn 2 normal enemies at its position, with some spacing if possible 
             // but since they just spawn, we can set progress/pathIndex
             for (let j = 0; j < 2; j++) {
                // Actually easier to let EnemyManager spawn it and just copy its progress/pathIndex
                // Let's add a spawnAt method or just push to enemies manually (we shouldn't do it here easily)
                // wait, EnemyManager has spawn(). But it sets progress 0.
                this.enemyManager.spawnAt('normal', enemy.worldX, enemy.worldY, enemy.pathIndex, Math.max(0, enemy.progress - j*0.05), enemy.maxHp / 2, Math.floor(enemy.reward / 2), enemy.speed * 1.2);
             }
          }
          
          this.enemyManager.enemies.splice(i, 1);
        } else if (enemy.pathIndex >= this.path.length) {
          // Reached exit
          const damage = enemy.type === 'boss' ? 3 : 1;
          this.state.lives = Math.max(0, this.state.lives - damage);
          needsHudUpdate = true;
          this.enemyManager.enemies.splice(i, 1);
          
          if (this.state.lives <= 0) {
            this.state.phase = 'gameover';
            this.eventBus.emit('game:over', { score: this.state.score, wave: this.state.currentWave, reason: 'lives' });
            this.broadcastHudUpdate();
          }
        }
      }
    }
    
    // Check win condition
    if (this.waveManager.isAllWavesSpawned() && this.enemyManager.getActiveEnemies().length === 0 && this.state.phase === 'playing') {
       this.state.phase = 'waveComplete';
       this.eventBus.emit('game:over', { score: this.state.score, wave: this.state.currentWave, reason: 'win' });
       needsHudUpdate = true;
    }

    if (needsHudUpdate) {
      this.broadcastHudUpdate();
    }
  }

  private broadcastHudUpdate() {
    this.eventBus.emit('hud:update', {
      lives: this.state.lives,
      gold: this.state.gold,
      score: this.state.score,
      wave: this.state.currentWave,
      waveMax: this.state.totalWaves,
      enemiesLeft: this.enemyManager.getActiveEnemies().length,
      gamePhase: this.state.phase,
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
      hoveredCell: null,
      selectedTowerId: state.selectedMapTower,
      selectedTowerTypePreview: state.selectedTowerType,
      placementValid: true,
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
