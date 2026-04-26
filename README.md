# Desktop Defense V2 - Technical Profile

Desktop Defense V2 is a high-performance, tactical tower defense engine built with TypeScript and HTML5 Canvas. It features a custom game engine architecture designed for efficiency, scalability, and modularity.

## Directory Structure & Architecture

```
/src
  /components     # React UI layer (HUD, Sidebar, Modals)
  /data           # Static definitions (Tower configs, Wave data, Themes)
  /engine         # Core Business Logic (authoritative game state)
    GameEngine.ts # Main orchestrator and loop manager
    Grid.ts       # Spatial management and cell occupancy
    Pathfinder.ts # A* implementation with Min-Heap optimization
    EnemyManager.ts  # Pool-based entity management for units
    TowerManager.ts  # Combat logic, targeting, and projectiles
    WaveManager.ts   # Spawning schedules and infinite difficulty scaling
    EffectManager.ts # Particle systems and floating UI feedback
  /renderer       # Drawing logic (Canvas rendering)
  /store          # Global shared state (Zustand)
  /types          # TypeScript interfaces and definitions
  /utils          # Helper functions and drawing primitives
```

## Game Logic & Math

### Combat Math
Combat logic follows a strict deterministic set of calculations to ensure balance across infinite levels:

*   **Tower Upgrading**: Damage scales exponentially: `Damage = Base * 1.5^(Level - 1)`. Range scales logarithmically to prevent screen-clearing towers: `Range = Base * 1.05^(Level - 1)`.
*   **Targeting Modes**: Towers support four targeting priorities:
    *   `First`: Target with the highest `distanceTraveled`.
    *   `Last`: Target with the lowest `distanceTraveled`.
    *   `Strongest`: Target with the highest current `HP`.
    *   `Closest`: Target with the minimum Euclidean distance to tower.

### Infinite Scaling Algorithm
Wave difficulty scales using a compounding growth model:
*   **HP Scaling**: `HP_Multiplier = 1.25^(Wave - 1)`. Every wave increases enemy vitality by 25%.
*   **Speed Scaling**: `Speed_Multiplier = min(1.02^(Wave - 1), 2.5)`. Speed increases by 2% per wave, capped at 2.5x to remain manageable within the grid.
*   **Economy (Reward Scaling)**: To prevent bankruptcy in later levels, gold rewards scale linearly with enemy difficulty: `Gold = Math.floor(Base * 1.2^(Wave - 1))`.

## Core Algorithms

### 1. Optimized A* Pathfinding
The pathing system uses the **A* (A-Star)** algorithm to find the shortest route between the Entry and Exit points. 
*   **Heuristic**: Manhattan Distance (`|dx| + |dy|`).
*   **Priority Queue**: Implemented using a **Binary Min-Heap** instead of standard array sorting. This reduces the complexity of finding the next best cell from $O(N)$ to $O(\log N)$.
*   **Flow Recalculation**: Pathfinding is performed incrementally. Placing a tower triggers a path validation. If the tower would block all possible exits, placement is denied ($O(V+E)$).

### 2. Entity Management & Spatial Partitioning
*   **Tick Rate**: The engine runs at variable delta-time (`dt`) but clamps updates to a maximum of 100ms to prevent "teleporting" during lag spikes.
*   **Entity Loop**: Enemy and Projectile updates are performed in a single pass over the arrays. Dead entities are removed using an optimized backward-loop splicing strategy to maintain index integrity.
*   **Collision Detection**: Combat use square-distance checks (`dx*dx + dy*dy`) to avoid the overhead of `Math.sqrt()` operations during high-volume particle or projectile processing.

### 3. Rendering Optimization (The "Frame-Budget" Strategy)
*   **Asset Caching**: Tower designs are complex vector shapes. To save frame budget, each tower configuration (Type + Level + Color) is rendered once to an offscreen buffer (OffscreenCanvas) and cached. Redrawing the tower simply involves `drawImage` from the pre-rendered buffer.
*   **Batched Grid Drawing**: Instead of issuing hundreds of `strokeRect` commands, grid lines are calculated as a single path and stroked in one operation, significantly reducing GPU draw calls.
*   **Particle Throttling**: The `EffectManager` automatically scales down particle counts and complexity when the active count exceeds 500 units to maintain 60FPS on mobile and low-end hardware.
