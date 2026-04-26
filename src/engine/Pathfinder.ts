import { Point } from '../types';
import { Grid } from './Grid';

// A simple Min-Heap for A* open set
class PriorityQueue<T> {
  private elements: { item: T; priority: number }[] = [];

  enqueue(item: T, priority: number) {
    this.elements.push({ item, priority });
    this.elements.sort((a, b) => a.priority - b.priority); // Simple sort-based for now, sufficient for small grids
  }

  dequeue(): T | undefined {
    return this.elements.shift()?.item;
  }

  isEmpty(): boolean {
    return this.elements.length === 0;
  }
}

export class Pathfinder {
  /**
   * Finds the shortest path using A* on a 4-directional grid.
   * Returns array of points from entry to exit, or null if no path.
   */
  public findPath(grid: Grid, entry: Point, exit: Point): Point[] | null {
    const startId = this.toId(entry.col, entry.row);
    const goalId = this.toId(exit.col, exit.row);

    const frontier = new PriorityQueue<Point>();
    frontier.enqueue(entry, 0);

    const cameFrom = new Map<string, Point | null>();
    const costSoFar = new Map<string, number>();

    cameFrom.set(startId, null);
    costSoFar.set(startId, 0);

    while (!frontier.isEmpty()) {
      const current = frontier.dequeue()!;
      const currentId = this.toId(current.col, current.row);

      if (current.col === exit.col && current.row === exit.row) {
        break; // Reached goal
      }

      for (const next of this.getNeighbors(grid, current)) {
        const nextId = this.toId(next.col, next.row);
        
        const type = grid.get(next.col, next.row);
        if (type === 'tower') continue; // Blocked

        const newCost = costSoFar.get(currentId)! + 1;

        if (!costSoFar.has(nextId) || newCost < costSoFar.get(nextId)!) {
          costSoFar.set(nextId, newCost);
          const priority = newCost + this.heuristic(next, exit);
          frontier.enqueue(next, priority);
          cameFrom.set(nextId, current);
        }
      }
    }

    if (!cameFrom.has(goalId)) {
      return null;
    }

    // Reconstruct path
    let currentId = goalId;
    const path: Point[] = [];
    while (currentId !== startId) {
      const p = this.fromId(currentId);
      path.push(p);
      const parent = cameFrom.get(currentId)!;
      currentId = this.toId(parent.col, parent.row);
    }
    path.push(entry);
    path.reverse();

    return path;
  }

  /**
   * Validates if placing a tower at the given cell keeps a valid path.
   */
  public canPlaceTower(grid: Grid, col: number, row: number, entry: Point, exit: Point): boolean {
    if (col === entry.col && row === entry.row) return false;
    if (col === exit.col && row === exit.row) return false;
    
    // Temporarily mark as tower
    const original = grid.get(col, row);
    if (original === 'tower') return true; // Already a tower

    grid.set(col, row, 'tower');
    const path = this.findPath(grid, entry, exit);
    
    // Revert
    grid.set(col, row, original);

    return path !== null;
  }

  private getNeighbors(grid: Grid, p: Point): Point[] {
    const neighbors: Point[] = [];
    const dirs = [
      { dc: 0, dr: -1 }, // Up
      { dc: 1, dr: 0 },  // Right
      { dc: 0, dr: 1 },  // Down
      { dc: -1, dr: 0 }  // Left
    ];

    for (const d of dirs) {
      const nc = p.col + d.dc;
      const nr = p.row + d.dr;
      if (!grid.isOutOfBounds(nc, nr)) {
        neighbors.push({ col: nc, row: nr });
      }
    }

    return neighbors;
  }

  private heuristic(a: Point, b: Point): number {
    return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
  }

  private toId(col: number, row: number): string {
    return `${col},${row}`;
  }

  private fromId(id: string): Point {
    const [c, r] = id.split(',').map(Number);
    return { col: c, row: r };
  }
}
