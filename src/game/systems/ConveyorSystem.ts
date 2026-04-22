import { Scene } from 'phaser';
import { ItemType, ConveyorDirection } from '../types/index';
import { ITEM_COLORS, CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from '../types/constants';

export type ArrivalResult = 'consumed' | 'blocked' | 'rejected';

export interface ConveyorConnection {
  fromCol: number;
  fromRow: number;
  toCol: number;
  toRow: number;
  direction: ConveyorDirection;
}

export interface ItemOnConveyor {
  id: string;
  itemType: ItemType;
  connection: ConveyorConnection;
  gameObject: Phaser.GameObjects.Arc;
  progress: number; // 0-1
  speedMs: number;
  waiting: boolean; // true when arrived but onArrival returned 'blocked'
  onArrival: (item: ItemType, toCol: number, toRow: number) => ArrivalResult;
}

export class ConveyorSystem {
  private scene: Scene;
  private connections: ConveyorConnection[] = [];
  private items: ItemOnConveyor[] = [];
  private itemCounter = 0;
  private graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
  }

  addConnection(from: { col: number; row: number }, to: { col: number; row: number }, direction: ConveyorDirection): void {
    const exists = this.connections.some(
      c => c.fromCol === from.col && c.fromRow === from.row &&
           c.toCol === to.col && c.toRow === to.row
    );
    if (exists) return;

    // One output per cell
    this.connections = this.connections.filter(
      c => !(c.fromCol === from.col && c.fromRow === from.row)
    );
    this.connections.push({
      fromCol: from.col, fromRow: from.row,
      toCol: to.col, toRow: to.row,
      direction,
    });
    this.drawConnections();
  }

  removeConnectionsAt(col: number, row: number): void {
    this.connections = this.connections.filter(
      c => !(c.fromCol === col && c.fromRow === row) &&
           !(c.toCol === col && c.toRow === row)
    );
    this.drawConnections();
  }

  /** True if any item (in transit OR waiting) is targeting this cell. */
  isCellReserved(col: number, row: number): boolean {
    return this.items.some(i => i.connection.toCol === col && i.connection.toRow === row);
  }

  private worldPos(col: number, row: number) {
    return {
      x: GRID_OFFSET_X + col * CELL_SIZE + CELL_SIZE / 2,
      y: GRID_OFFSET_Y + row * CELL_SIZE + CELL_SIZE / 2,
    };
  }

  drawConnections(): void {
    this.graphics.clear();
    this.graphics.setDepth(2);

    for (const conn of this.connections) {
      const from = this.worldPos(conn.fromCol, conn.fromRow);
      const to = this.worldPos(conn.toCol, conn.toRow);

      this.graphics.lineStyle(14, 0x555555, 0.9);
      this.graphics.lineBetween(from.x, from.y, to.x, to.y);

      this.graphics.lineStyle(4, 0x888888, 0.7);
      this.graphics.lineBetween(from.x, from.y, to.x, to.y);

      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      const aLen = 7;
      this.graphics.lineStyle(2, 0xFFCC44, 0.9);
      switch (conn.direction) {
        case ConveyorDirection.Right:
          this.graphics.lineBetween(midX - aLen, midY - aLen, midX, midY);
          this.graphics.lineBetween(midX - aLen, midY + aLen, midX, midY);
          break;
        case ConveyorDirection.Left:
          this.graphics.lineBetween(midX + aLen, midY - aLen, midX, midY);
          this.graphics.lineBetween(midX + aLen, midY + aLen, midX, midY);
          break;
        case ConveyorDirection.Down:
          this.graphics.lineBetween(midX - aLen, midY - aLen, midX, midY);
          this.graphics.lineBetween(midX + aLen, midY - aLen, midX, midY);
          break;
        case ConveyorDirection.Up:
          this.graphics.lineBetween(midX - aLen, midY + aLen, midX, midY);
          this.graphics.lineBetween(midX + aLen, midY + aLen, midX, midY);
          break;
      }
    }
  }

  spawnItem(
    itemType: ItemType,
    fromCol: number,
    fromRow: number,
    toCol: number,
    toRow: number,
    direction: ConveyorDirection,
    speedMs: number,
    onArrival: (item: ItemType, col: number, row: number) => ArrivalResult
  ): void {
    const from = this.worldPos(fromCol, fromRow);
    const circle = this.scene.add.arc(from.x, from.y, 10, 0, 360, false, ITEM_COLORS[itemType]);
    circle.setStrokeStyle(2, 0xFFFFFF, 0.7);
    circle.setDepth(10);

    const connection: ConveyorConnection = { fromCol, fromRow, toCol, toRow, direction };
    this.items.push({
      id: `item_${++this.itemCounter}`,
      itemType,
      connection,
      gameObject: circle,
      progress: 0,
      speedMs,
      waiting: false,
      onArrival,
    });
  }

  update(deltaMs: number): void {
    const toRemove: string[] = [];

    for (const item of this.items) {
      if (item.waiting) {
        // Retry delivery every frame
        const result = item.onArrival(item.itemType, item.connection.toCol, item.connection.toRow);
        if (result === 'consumed' || result === 'rejected') {
          item.gameObject.destroy();
          toRemove.push(item.id);
        }
        // 'blocked' → keep waiting
      } else {
        item.progress += deltaMs / item.speedMs;

        if (item.progress >= 1) {
          const to = this.worldPos(item.connection.toCol, item.connection.toRow);
          item.gameObject.setPosition(to.x, to.y);

          const result = item.onArrival(item.itemType, item.connection.toCol, item.connection.toRow);
          if (result === 'consumed' || result === 'rejected') {
            item.gameObject.destroy();
            toRemove.push(item.id);
          } else {
            // Blocked — freeze item at destination and wait
            item.waiting = true;
            item.progress = 1;
          }
        } else {
          const from = this.worldPos(item.connection.fromCol, item.connection.fromRow);
          const to = this.worldPos(item.connection.toCol, item.connection.toRow);
          item.gameObject.setPosition(
            from.x + (to.x - from.x) * item.progress,
            from.y + (to.y - from.y) * item.progress
          );
        }
      }
    }

    this.items = this.items.filter(i => !toRemove.includes(i.id));
  }

  clear(): void {
    for (const item of this.items) item.gameObject.destroy();
    this.items = [];
    this.connections = [];
    this.graphics.clear();
  }

  getConnections(): ConveyorConnection[] { return [...this.connections]; }
}
