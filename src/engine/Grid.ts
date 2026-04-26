import { CellType } from '../types';

export class Grid {
  public cells: CellType[][] = [];
  public cols: number = 0;
  public rows: number = 0;

  constructor(cols: number, rows: number) {
    this.init(cols, rows);
  }

  public init(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
    this.cells = Array.from({ length: cols }, () => Array(rows).fill('empty'));
  }

  public get(col: number, row: number): CellType {
    if (this.isOutOfBounds(col, row)) return 'empty';
    return this.cells[col][row];
  }

  public set(col: number, row: number, type: CellType) {
    if (this.isOutOfBounds(col, row)) return;
    this.cells[col][row] = type;
  }

  public isOutOfBounds(col: number, row: number): boolean {
    return col < 0 || row < 0 || col >= this.cols || row >= this.rows;
  }
}
