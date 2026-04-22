import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { GridSystem } from '../systems/GridSystem';
import { Machine } from '../systems/Machine';
import { ConveyorSystem, ArrivalResult } from '../systems/ConveyorSystem';
import { CustomerSystem } from '../systems/CustomerSystem';
import { CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, GRID_COLS, GRID_ROWS, LEVELS, ITEM_EMOJIS, ITEM_NAMES, ITEM_COLORS } from '../types/constants';
import { MachineType, MachineState, ConveyorDirection, ItemType, LevelConfig, GameStats, Customer } from '../types/index';

const CONVEYOR_SPEED_MS = 1200;

export class Game extends Scene {
  private grid!: GridSystem;
  private machines: Map<string, Machine> = new Map();
  private conveyorSystem!: ConveyorSystem;
  private customerSystem!: CustomerSystem;

  private gridGraphics!: Phaser.GameObjects.Graphics;
  private machineLayer!: Phaser.GameObjects.Container;

  private selectedMachine: MachineType | null = null;
  private destroyMode: boolean = false;
  private machineCounter = 0;
  private isPlaying = false;
  private preparationPhase = false;
  private currentLevel!: LevelConfig;
  private pendingAutoStart = false;

  private stats: GameStats = { score: 0, level: 1, ordersServed: 0, ordersFailed: 0, consecutiveFailed: 0 };

  private pauseOverlay: Phaser.GameObjects.Container | null = null;

  // Machine visual objects: id → { body, progressBar, stateIndicator }
  private machineVisuals: Map<string, {
    body: Phaser.GameObjects.Graphics;
    progressBar: Phaser.GameObjects.Graphics;
    label: Phaser.GameObjects.Text;
    indicator: Phaser.GameObjects.Arc;
  }> = new Map();

  // Customer visual objects
  private customerVisuals: Map<string, {
    sprite: Phaser.GameObjects.Text;
    bubble: Phaser.GameObjects.Text;
    timerBar: Phaser.GameObjects.Graphics;
  }> = new Map();

  constructor() {
    super('Game');
  }

  init(data?: { autoStart?: boolean }) {
    this.pendingAutoStart = data?.autoStart ?? false;
  }

  create() {
    this.cameras.main.setBackgroundColor(0x2C1810);
    this.grid = new GridSystem();
    this.conveyorSystem = new ConveyorSystem(this);
    this.machines = new Map();
    this.machineVisuals = new Map();
    this.customerVisuals = new Map();
    this.machineCounter = 0;
    this.isPlaying = false;
    this.selectedMachine = null;
    this.destroyMode = false;
    this.stats = { score: 0, level: 1, ordersServed: 0, ordersFailed: 0, consecutiveFailed: 0 };

    this.gridGraphics = this.add.graphics();
    this.machineLayer = this.add.container(0, 0);

    this.drawGrid();

    // Remove any stale EventBus listeners from a previous run of this scene
    EventBus.removeAllListeners('select-machine');
    EventBus.removeAllListeners('level-start');
    EventBus.removeAllListeners('set-destroy-mode');
    EventBus.removeAllListeners('start-day');

    // EventBus listeners
    EventBus.on('select-machine', (type: MachineType | null) => {
      this.selectedMachine = type;
      if (type !== null) {
        // Selecting a machine exits destroy mode
        this.setDestroyMode(false);
      }
    });
    EventBus.on('level-start', (level: LevelConfig) => { this.startLevel(level); });
    // Allow toolbar button to toggle destroy mode
    EventBus.on('set-destroy-mode', (enabled: boolean) => { this.setDestroyMode(enabled); });
    EventBus.on('start-day', () => { this.startDay(); });
    EventBus.on('pause-game', () => { this.pauseGame(); });
    EventBus.on('resume-game', () => { this.resumeGame(); });

    // Keyboard: R toggles destroy mode
    this.input.keyboard?.on('keydown-R', () => {
      this.setDestroyMode(!this.destroyMode);
    });

    // Input
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onPointerMove(p));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onPointerDown(p));

    EventBus.emit('current-scene-ready', this);

    // Auto-start level (e.g. from GameOver "Rejouer" button)
    if (this.pendingAutoStart) {
      this.pendingAutoStart = false;
      this.startLevel(LEVELS[0]);
      EventBus.emit('auto-level-started');
    }
  }

  shutdown() {
    this.isPlaying = false;
    EventBus.removeAllListeners('select-machine');
    EventBus.removeAllListeners('level-start');
    EventBus.removeAllListeners('set-destroy-mode');
    EventBus.removeAllListeners('start-day');
    EventBus.removeAllListeners('pause-game');
    EventBus.removeAllListeners('resume-game');
  }

  private pauseGame(): void {
    this.customerSystem?.pause();

    // Create overlay before pausing so it appears in the frozen frame
    const { width, height } = this.cameras.main;
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.55);
    bg.fillRect(0, 0, width, height);
    bg.setDepth(50);

    const text = this.add.text(width / 2, height / 2, '⏸  JEU EN PAUSE', {
      fontSize: '36px',
      color: '#FFFFFF',
      fontFamily: 'Arial Black',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(51);

    this.pauseOverlay = this.add.container(0, 0, [bg, text]);
    this.pauseOverlay.setDepth(50);

    this.scene.pause();
  }

  private resumeGame(): void {
    this.scene.resume();
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy();
      this.pauseOverlay = null;
    }
    this.customerSystem?.resume();
  }

  // ─── Grid rendering ──────────────────────────────────────────────────────────

  private drawGrid(): void {
    const g = this.gridGraphics;
    g.clear();
    const { cols, rows, cellSize, offsetX, offsetY } = this.grid;

    g.fillStyle(0x1A0F0A, 1);
    g.fillRect(offsetX - 4, offsetY - 4, cols * cellSize + 8, rows * cellSize + 8);

    g.lineStyle(1, 0x4A2C1A, 0.5);
    for (let col = 0; col <= cols; col++) {
      g.lineBetween(offsetX + col * cellSize, offsetY, offsetX + col * cellSize, offsetY + rows * cellSize);
    }
    for (let row = 0; row <= rows; row++) {
      g.lineBetween(offsetX, offsetY + row * cellSize, offsetX + cols * cellSize, offsetY + row * cellSize);
    }

    // Source zone
    g.fillStyle(0x1B5E20, 0.25);
    g.fillRect(offsetX, offsetY, cellSize, rows * cellSize);

    // Output zone
    g.fillStyle(0xF57F17, 0.25);
    g.fillRect(offsetX + (cols - 1) * cellSize, offsetY, cellSize, rows * cellSize);

    this.add.text(offsetX + cellSize / 2, offsetY - 18, 'ENTRÉE', {
      fontSize: '10px', color: '#4CAF50', fontFamily: 'Arial'
    }).setOrigin(0.5);
    this.add.text(offsetX + (cols - 0.5) * cellSize, offsetY - 18, 'COMPTOIR', {
      fontSize: '10px', color: '#FF9800', fontFamily: 'Arial'
    }).setOrigin(0.5);
  }

  // ─── Level management ────────────────────────────────────────────────────────

  private startLevel(level: LevelConfig): void {
    this.currentLevel = level;
    this.isPlaying = true;
    this.preparationPhase = true;
    this.stats = { score: this.stats.score, level: level.id, ordersServed: 0, ordersFailed: 0, consecutiveFailed: 0 };

    // Reset grid
    this.clearAllMachines();
    this.grid.reset();
    this.conveyorSystem.clear();

    // Setup customer system (but do NOT start it yet)
    this.customerSystem = new CustomerSystem(level);
    this.customerSystem.onArrival(c => this.spawnCustomerVisual(c));
    this.customerSystem.onServed((c, points) => this.onOrderServed(c, points));
    this.customerSystem.onFailed(c => this.onOrderFailed(c));

    // Place fixed Source machines on left column
    for (let row = 1; row < GRID_ROWS - 1; row += 2) {
      this.placeSourceMachines(row, level);
    }

    this.emitStats();
    EventBus.emit('prep-phase-started');
  }

  private startDay(): void {
    if (!this.isPlaying || !this.preparationPhase) return;
    this.preparationPhase = false;
    this.customerSystem.start();
    EventBus.emit('day-started');
  }

  private placeSourceMachines(row: number, level: LevelConfig): void {
    const sourceItems = this.getSourceItems(level);
    for (let i = 0; i < sourceItems.length && i < 3; i++) {
      const r = row + i;
      if (r >= GRID_ROWS) break;
      const id = `source_${sourceItems[i]}_${r}`;
      const machine = new Machine(id, MachineType.Source, 0, r);
      machine.sourceItemType = sourceItems[i];
      this.machines.set(id, machine);
      this.grid.placeMachine(0, r, MachineType.Source, id);
      this.renderMachine(machine);
      // Sources auto-generate items
      this.scheduleSourceOutput(machine, sourceItems[i]);
    }
  }

  private getSourceItems(level: LevelConfig): ItemType[] {
    const items: ItemType[] = [ItemType.CoffeeBeans];
    if (level.availableMachines.includes(MachineType.MilkSteamer)) {
      items.push(ItemType.Milk);
    }
    return items;
  }

  private scheduleSourceOutput(machine: Machine, itemType: ItemType): void {
    if (!this.isPlaying) return;
    this.time.delayedCall(2000 + Math.random() * 1000, () => {
      if (!this.isPlaying) return;
      this.tryPushItemFromSource(machine, itemType);
      this.scheduleSourceOutput(machine, itemType);
    });
  }

  private tryPushItemFromSource(source: Machine, item: ItemType): void {
    const connections = this.conveyorSystem.getConnections();
    const conn = connections.find(c => c.fromCol === source.col && c.fromRow === source.row);
    if (!conn) return;

    // Don't push if destination already has an item (back-pressure)
    if (this.conveyorSystem.isCellReserved(conn.toCol, conn.toRow)) return;

    this.conveyorSystem.spawnItem(
      item,
      source.col, source.row,
      conn.toCol, conn.toRow,
      conn.direction,
      CONVEYOR_SPEED_MS,
      (arrivedItem, col, row) => this.onItemArrived(arrivedItem, col, row)
    );
  }

  private onItemArrived(item: ItemType, col: number, row: number): ArrivalResult {
    // Output column — serve to customer
    if (col === GRID_COLS - 1) {
      const served = this.customerSystem?.tryServeItem(item);
      if (!served) {
        this.showFloatingText(col, row, '✗', '#FF5722');
      }
      return 'consumed';
    }

    const cell = this.grid.getCell(col, row);
    if (!cell?.occupied || !cell.machineId) return 'rejected';

    const machine = this.machines.get(cell.machineId);
    if (!machine) return 'rejected';

    if (machine.type === MachineType.Conveyor || machine.type === MachineType.Source) {
      return this.forwardItemOnConveyor(item, col, row);
    }

    // Production machine
    if (!machine.acceptsItem(item)) return 'rejected'; // wrong item — drop it
    const accepted = machine.receiveItem(item);
    return accepted ? 'consumed' : 'blocked';
  }

  private forwardItemOnConveyor(item: ItemType, col: number, row: number): ArrivalResult {
    const connections = this.conveyorSystem.getConnections();
    const conn = connections.find(c => c.fromCol === col && c.fromRow === row);
    if (!conn) return 'blocked'; // dead end — item waits until connected

    // Back-pressure: don't spawn if destination already has an item
    if (this.conveyorSystem.isCellReserved(conn.toCol, conn.toRow)) return 'blocked';

    this.conveyorSystem.spawnItem(
      item, col, row, conn.toCol, conn.toRow, conn.direction,
      CONVEYOR_SPEED_MS,
      (i, c, r) => this.onItemArrived(i, c, r)
    );
    return 'consumed';
  }

  private tryOutputMachine(machine: Machine): void {
    const connections = this.conveyorSystem.getConnections();
    const conn = connections.find(c => c.fromCol === machine.col && c.fromRow === machine.row);
    if (!conn) return; // nowhere to go — item stays in output buffer (machine stays Blocked)

    // Don't collect if destination is reserved (back-pressure from downstream)
    if (this.conveyorSystem.isCellReserved(conn.toCol, conn.toRow)) return;

    const item = machine.collectOutput();
    if (!item) return;

    this.conveyorSystem.spawnItem(
      item, machine.col, machine.row, conn.toCol, conn.toRow, conn.direction,
      CONVEYOR_SPEED_MS,
      (i, c, r) => this.onItemArrived(i, c, r)
    );
  }

  // ─── Order callbacks ──────────────────────────────────────────────────────────

  private onOrderServed(customer: Customer, points: number): void {
    this.stats.ordersServed++;
    this.stats.score += points;
    this.stats.consecutiveFailed = 0;
    this.removeCustomerVisual(customer.id);
    this.showFloatingText(GRID_COLS - 1, 3, `+${points}`, '#4CAF50');
    this.emitStats();
    this.checkLevelComplete();
  }

  private onOrderFailed(customer: Customer): void {
    this.stats.ordersFailed++;
    this.stats.consecutiveFailed++;
    this.removeCustomerVisual(customer.id);
    this.showFloatingText(GRID_COLS - 1, 5, '-Raté!', '#FF5722');
    this.emitStats();

    if (this.stats.consecutiveFailed >= (this.currentLevel?.maxFailedOrders ?? 3)) {
      this.triggerGameOver();
    } else {
      this.checkLevelComplete();
    }
  }

  private checkLevelComplete(): void {
    if (!this.customerSystem) return;
    if (!this.customerSystem.hasMoreCustomers) {
      this.isPlaying = false;
      this.time.delayedCall(1000, () => {
        EventBus.emit('level-complete', {
          ordersServed: this.stats.ordersServed,
          ordersFailed: this.stats.ordersFailed,
        });
      });
    }
  }

  private triggerGameOver(): void {
    this.isPlaying = false;
    localStorage.setItem('coffee_last_score', String(this.stats.score));
    const best = parseInt(localStorage.getItem('coffee_best_score') ?? '0', 10);
    if (this.stats.score > best) localStorage.setItem('coffee_best_score', String(this.stats.score));
    this.time.delayedCall(800, () => {
      EventBus.emit('game-over');
      this.scene.start('GameOver');
    });
  }

  private emitStats(): void {
    EventBus.emit('update-stats', { ...this.stats });
  }

  // ─── Machine placement ────────────────────────────────────────────────────────

  private placeMachine(col: number, row: number, type: MachineType): void {
    const id = `machine_${++this.machineCounter}`;
    const placed = this.grid.placeMachine(col, row, type, id);
    if (!placed) return;

    const machine = new Machine(id, type, col, row);
    this.machines.set(id, machine);
    this.renderMachine(machine);

    this.autoConnect(col, row);
  }

  /**
   * When any machine is placed at (col, row), create connections with neighbors:
   * - Left neighbor → this cell (if left is occupied)
   * - This cell → right neighbor (if right is occupied, OR this is a Conveyor/Source)
   * This means items always flow left→right automatically.
   */
  private autoConnect(col: number, row: number): void {
    const leftCol = col - 1;
    const rightCol = col + 1;

    // Connect LEFT neighbor → this cell
    if (this.grid.isValidPosition(leftCol, row) && !this.grid.isCellFree(leftCol, row)) {
      this.conveyorSystem.addConnection(
        { col: leftCol, row }, { col, row },
        ConveyorDirection.Right
      );
    }

    // Connect this cell → RIGHT neighbor (always for Conveyor/Source, or if right is occupied)
    const cellType = this.grid.getCell(col, row)?.machineType;
    const isPassthrough = cellType === MachineType.Conveyor || cellType === MachineType.Source;
    const rightOccupied = this.grid.isValidPosition(rightCol, row) && !this.grid.isCellFree(rightCol, row);

    if (isPassthrough || rightOccupied) {
      if (this.grid.isValidPosition(rightCol, row)) {
        this.conveyorSystem.addConnection(
          { col, row }, { col: rightCol, row },
          ConveyorDirection.Right
        );
      }
    }

    // Also tell the RIGHT neighbor to connect to ITS right (in case it was placed before this cell)
    if (rightOccupied) {
      const rightCell = this.grid.getCell(rightCol, row);
      const rightType = rightCell?.machineType;
      if (rightType === MachineType.Conveyor || rightType === MachineType.Source) {
        const rightRightCol = rightCol + 1;
        if (this.grid.isValidPosition(rightRightCol, row)) {
          this.conveyorSystem.addConnection(
            { col: rightCol, row }, { col: rightRightCol, row },
            ConveyorDirection.Right
          );
        }
      }
    }
  }

  private removeMachine(col: number, row: number): void {
    const cell = this.grid.getCell(col, row);
    if (!cell?.machineId) return;
    const id = cell.machineId;

    // Don't allow removing source machines
    const machine = this.machines.get(id);
    if (machine?.type === MachineType.Source) return;

    this.grid.removeMachine(col, row);
    this.machines.delete(id);

    const visual = this.machineVisuals.get(id);
    if (visual) {
      visual.body.destroy();
      visual.progressBar.destroy();
      visual.label.destroy();
      visual.indicator.destroy();
      this.machineVisuals.delete(id);
    }

    this.conveyorSystem.removeConnectionsAt(col, row);
  }

  private clearAllMachines(): void {
    for (const [, visual] of this.machineVisuals) {
      visual.body.destroy();
      visual.progressBar.destroy();
      visual.label.destroy();
      visual.indicator.destroy();
    }
    this.machineVisuals.clear();
    this.machines.clear();
    this.machineLayer.removeAll(true);

    // Clear customer visuals
    for (const v of this.customerVisuals.values()) {
      v.sprite.destroy();
      v.bubble.destroy();
      v.timerBar.destroy();
    }
    this.customerVisuals.clear();
  }

  // ─── Machine rendering ────────────────────────────────────────────────────────

  private renderMachine(machine: Machine): void {
    const { x, y } = this.grid.gridToWorld(machine.col, machine.row);
    const half = CELL_SIZE / 2 - 4;

    const body = this.add.graphics();
    const progressBar = this.add.graphics();
    const indicator = this.add.arc(x + half - 5, y - half + 5, 5, 0, 360, false, 0x00FF00);
    indicator.setDepth(6);

    // For Source machines, use item-specific emoji and name
    const displayEmoji = machine.sourceItemType
      ? ITEM_EMOJIS[machine.sourceItemType]
      : machine.emoji;
    const displayLabel = machine.sourceItemType
      ? ITEM_NAMES[machine.sourceItemType]
      : machine.label;

    const label = this.add.text(x, y + 10, displayEmoji + '\n' + displayLabel, {
      fontSize: '11px', color: '#FFFFFF', fontFamily: 'Arial', align: 'center',
    }).setOrigin(0.5).setDepth(6);

    this.drawMachineBody(body, machine, x, y, half);

    this.machineVisuals.set(machine.id, { body, progressBar, label, indicator });

    // Click to repair broken machine
    const zone = this.add.zone(x, y, CELL_SIZE - 2, CELL_SIZE - 2)
      .setInteractive()
      .setDepth(7);
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown()) return; // handled by scene
      if (machine.isBroken) machine.repair();
    });
  }

  private drawMachineBody(g: Phaser.GameObjects.Graphics, machine: Machine, x: number, y: number, half: number): void {
    g.clear();
    const isBroken = machine.isBroken;
    // For Source machines, use the item's color for better identification
    const baseColor = machine.sourceItemType ? ITEM_COLORS[machine.sourceItemType] : machine.color;
    const color = isBroken ? 0x555555 : baseColor;
    g.fillStyle(color, 1);
    g.fillRoundedRect(x - half, y - half, half * 2, half * 2, 6);
    g.lineStyle(2, isBroken ? 0xFF0000 : 0xFFFFFF, 0.3);
    g.strokeRoundedRect(x - half, y - half, half * 2, half * 2, 6);
    g.setDepth(4);
  }

  // ─── Customer visuals ─────────────────────────────────────────────────────────

  private spawnCustomerVisual(customer: Customer): void {
    const slotIndex = this.customerVisuals.size;
    const baseX = GRID_OFFSET_X + (GRID_COLS - 0.5) * CELL_SIZE + 20;
    const baseY = GRID_OFFSET_Y + slotIndex * 80 + 40;

    const sprite = this.add.text(baseX, baseY + 20, '🧑', { fontSize: '28px' })
      .setOrigin(0.5).setDepth(9);

    const drinkEmoji = customer.order.drinkType === 'Espresso' ? '☕' :
                       customer.order.drinkType === 'Latte' ? '🥛' : '☁️';
    const bubble = this.add.text(baseX, baseY - 12, drinkEmoji, { fontSize: '20px' })
      .setOrigin(0.5).setDepth(10);

    const timerBar = this.add.graphics().setDepth(9);
    this.drawTimerBar(timerBar, baseX, baseY + 40, 1);

    this.customerVisuals.set(customer.id, { sprite, bubble, timerBar });
  }

  private drawTimerBar(g: Phaser.GameObjects.Graphics, x: number, y: number, progress: number): void {
    g.clear();
    const width = 40;
    g.fillStyle(0x333333, 1);
    g.fillRect(x - width / 2, y, width, 5);
    const color = progress > 0.5 ? 0x4CAF50 : progress > 0.25 ? 0xFF9800 : 0xFF5722;
    g.fillStyle(color, 1);
    g.fillRect(x - width / 2, y, width * progress, 5);
  }

  private removeCustomerVisual(customerId: string): void {
    const visual = this.customerVisuals.get(customerId);
    if (!visual) return;
    visual.sprite.destroy();
    visual.bubble.destroy();
    visual.timerBar.destroy();
    this.customerVisuals.delete(customerId);
    // Reposition remaining customers
    this.repositionCustomers();
  }

  private repositionCustomers(): void {
    let i = 0;
    for (const [, visual] of this.customerVisuals) {
      const baseX = GRID_OFFSET_X + (GRID_COLS - 0.5) * CELL_SIZE + 20;
      const baseY = GRID_OFFSET_Y + i * 80 + 40;
      visual.sprite.setPosition(baseX, baseY + 20);
      visual.bubble.setPosition(baseX, baseY - 12);
      i++;
    }
  }

  private showFloatingText(col: number, row: number, text: string, color: string): void {
    const { x, y } = this.grid.gridToWorld(col, row);
    const t = this.add.text(x, y, text, {
      fontSize: '18px', color, fontFamily: 'Arial Black',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: t,
      y: y - 50,
      alpha: 0,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => t.destroy(),
    });
  }

  // ─── Destroy mode ─────────────────────────────────────────────────────────────

  private setDestroyMode(enabled: boolean): void {
    this.destroyMode = enabled;
    if (enabled) {
      this.selectedMachine = null;
      EventBus.emit('select-machine', null);
    }
    EventBus.emit('destroy-mode-changed', enabled);
  }

  // ─── Input handling ───────────────────────────────────────────────────────────

  private hoverGraphics!: Phaser.GameObjects.Graphics;
  private hoverDestroyText!: Phaser.GameObjects.Text;

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.hoverGraphics) {
      this.hoverGraphics = this.add.graphics().setDepth(15);
    }
    if (!this.hoverDestroyText) {
      this.hoverDestroyText = this.add.text(0, 0, '💥', { fontSize: '22px' })
        .setOrigin(0.5).setDepth(16).setVisible(false);
    }

    this.hoverGraphics.clear();
    this.hoverDestroyText.setVisible(false);

    const pos = this.grid.worldToGrid(pointer.x, pointer.y);
    if (!pos) return;

    const { x, y } = this.grid.gridToWorld(pos.col, pos.row);
    const half = CELL_SIZE / 2;

    if (this.destroyMode) {
      const hasBuilding = !this.grid.isCellFree(pos.col, pos.row);
      this.hoverGraphics.fillStyle(0xFF3300, hasBuilding ? 0.25 : 0.1);
      this.hoverGraphics.fillRect(x - half, y - half, half * 2, half * 2);
      this.hoverGraphics.lineStyle(2, 0xFF3300, 0.8);
      this.hoverGraphics.strokeRect(x - half, y - half, half * 2, half * 2);
      if (hasBuilding) {
        this.hoverDestroyText.setPosition(x, y).setVisible(true);
      }
    } else if (this.selectedMachine) {
      const isFree = this.grid.isCellFree(pos.col, pos.row);
      this.hoverGraphics.fillStyle(isFree ? 0xFFFFFF : 0xFF0000, 0.12);
      this.hoverGraphics.fillRect(x - half, y - half, half * 2, half * 2);
      this.hoverGraphics.lineStyle(2, isFree ? 0xFFFFFF : 0xFF0000, 0.5);
      this.hoverGraphics.strokeRect(x - half, y - half, half * 2, half * 2);
    }
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    const pos = this.grid.worldToGrid(pointer.x, pointer.y);
    if (!pos) return;

    // Right click always destroys
    if (pointer.rightButtonDown()) {
      this.removeMachine(pos.col, pos.row);
      return;
    }

    // Destroy mode: left click destroys
    if (this.destroyMode) {
      this.removeMachine(pos.col, pos.row);
      return;
    }

    if (!this.selectedMachine) return;
    if (!this.grid.isCellFree(pos.col, pos.row)) return;

    // Prevent placing in source/output columns (reserved)
    if (pos.col === 0) return;

    this.placeMachine(pos.col, pos.row, this.selectedMachine);
  }

  // ─── Game loop ────────────────────────────────────────────────────────────────

  update(_time: number, delta: number): void {
    if (!this.isPlaying) return;

    this.customerSystem?.update(delta);
    this.conveyorSystem.update(delta);

    // Update machines
    for (const machine of this.machines.values()) {
      if (machine.type === MachineType.Source || machine.type === MachineType.Conveyor) continue;

      machine.update(delta);

      const visual = this.machineVisuals.get(machine.id);
      if (!visual) continue;

      const { x, y } = this.grid.gridToWorld(machine.col, machine.row);
      const half = CELL_SIZE / 2 - 4;

      // Redraw body on state change
      this.drawMachineBody(visual.body, machine, x, y, half);

      // Progress bar
      visual.progressBar.clear();
      if (machine.state === MachineState.Processing) {
        const barW = (half * 2 - 4) * machine.processingProgress;
        visual.progressBar.fillStyle(0x4CAF50, 0.9);
        visual.progressBar.fillRect(x - half + 2, y + half - 8, barW, 5);
        visual.progressBar.setDepth(6);
      }

      // State indicator dot
      const indicatorColor =
        machine.isBroken ? 0xFF0000 :
        machine.state === MachineState.Processing ? 0xFFD700 :
        machine.state === MachineState.Blocked ? 0xFF5722 : 0x4CAF50;
      visual.indicator.setFillStyle(indicatorColor);

      // Try to push output downstream
      if (machine.outputBuffer.length > 0) {
        this.tryOutputMachine(machine);
      }
    }

    // Update customer timer bars
    if (this.customerSystem) {
      for (const customer of this.customerSystem.activeCustomers) {
        const visual = this.customerVisuals.get(customer.id);
        if (!visual) continue;
        const progress = this.customerSystem.getOrderProgress(customer);
        const baseX = visual.sprite.x;
        const baseY = visual.sprite.y - 20 + 40;
        this.drawTimerBar(visual.timerBar, baseX, baseY, progress);
      }
    }

    // Machine breakdown for level 4
    if (this.currentLevel?.hasMachineBreakdowns) {
      this.maybeBreakMachine();
    }
  }

  private breakdownTimer = 0;
  private maybeBreakMachine(): void {
    this.breakdownTimer += 16;
    if (this.breakdownTimer < 8000) return;
    this.breakdownTimer = 0;

    const activeMachines = [...this.machines.values()].filter(
      m => !m.isBroken && m.type !== MachineType.Source && m.type !== MachineType.Conveyor
    );
    if (activeMachines.length === 0) return;

    if (Math.random() < 0.3) {
      const target = activeMachines[Math.floor(Math.random() * activeMachines.length)];
      target.isBroken = true;
      const { x, y } = this.grid.gridToWorld(target.col, target.row);
      this.showFloatingText(target.col, target.row, '💥', '#FF5722');
      this.add.text(x, y - 5, '🔧 Cliquer!', {
        fontSize: '10px', color: '#FF9800', fontFamily: 'Arial'
      }).setOrigin(0.5).setDepth(20).setName(`repair_hint_${target.id}`);
    }
  }
}
