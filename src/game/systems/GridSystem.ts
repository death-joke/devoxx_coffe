import { GridCell, GridPosition, MachineType, ConveyorDirection } from '../types/index';
import { GRID_COLS, GRID_ROWS, CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from '../types/constants';

export class GridSystem {
  private cells: GridCell[][];
  readonly cols: number = GRID_COLS;
  readonly rows: number = GRID_ROWS;
  readonly cellSize: number = CELL_SIZE;
  readonly offsetX: number = GRID_OFFSET_X;
  readonly offsetY: number = GRID_OFFSET_Y;

  constructor() {
    this.cells = [];
    for (let row = 0; row < this.rows; row++) {
      this.cells[row] = [];
      for (let col = 0; col < this.cols; col++) {
        this.cells[row][col] = { col, row, occupied: false };
      }
    }
  }

  // ─── Coordinate helpers ────────────────────────────────────────────────────

  worldToGrid(worldX: number, worldY: number): GridPosition | null {
    const col = Math.floor((worldX - this.offsetX) / this.cellSize);
    const row = Math.floor((worldY - this.offsetY) / this.cellSize);
    if (this.isValidPosition(col, row)) {
      return { col, row };
    }
    return null;
  }

  gridToWorld(col: number, row: number): { x: number; y: number } {
    return {
      x: this.offsetX + col * this.cellSize + this.cellSize / 2,
      y: this.offsetY + row * this.cellSize + this.cellSize / 2,
    };
  }

  isValidPosition(col: number, row: number): boolean {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  }

  // ─── Cell access ───────────────────────────────────────────────────────────

  getCell(col: number, row: number): GridCell | null {
    if (!this.isValidPosition(col, row)) return null;
    return this.cells[row][col];
  }

  isCellFree(col: number, row: number): boolean {
    const cell = this.getCell(col, row);
    return cell !== null && !cell.occupied && !cell.isObstacle;
  }

  setObstacle(col: number, row: number): void {
    const cell = this.getCell(col, row);
    if (!cell) return;
    cell.isObstacle = true;
    cell.occupied = true; // treat as occupied so machines can't be placed
  }

  getObstacleCells(): GridCell[] {
    return this.getAllCells().filter(c => c.isObstacle);
  }

  placeMachine(col: number, row: number, type: MachineType, id: string, direction?: ConveyorDirection): boolean {
    if (!this.isCellFree(col, row)) return false;
    const cell = this.cells[row][col];
    cell.occupied = true;
    cell.machineType = type;
    cell.machineId = id;
    if (direction) cell.conveyorDirection = direction;
    return true;
  }

  removeMachine(col: number, row: number): GridCell | null {
    const cell = this.getCell(col, row);
    if (!cell || !cell.occupied) return null;
    cell.occupied = false;
    const removed = { ...cell };
    delete cell.machineType;
    delete cell.machineId;
    delete cell.conveyorDirection;
    return removed;
  }

  getAllCells(): GridCell[] {
    return this.cells.flat();
  }

  getOccupiedCells(): GridCell[] {
    return this.getAllCells().filter(c => c.occupied);
  }

  reset(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.cells[row][col] = { col, row, occupied: false };
      }
    }
  }
}
