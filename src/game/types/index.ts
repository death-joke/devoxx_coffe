// ─── Item Types ───────────────────────────────────────────────────────────────

export enum ItemType {
  CoffeeBeans = 'CoffeeBeans',
  GroundCoffee = 'GroundCoffee',
  Water = 'Water',
  Espresso = 'Espresso',
  Milk = 'Milk',
  HotMilk = 'HotMilk',
  Coffee = 'Coffee', // final product
}

// ─── Machine Types ────────────────────────────────────────────────────────────

export enum MachineType {
  Grinder = 'Grinder',
  Brewer = 'Brewer',
  MilkSteamer = 'MilkSteamer',
  CupFiller = 'CupFiller',
  Conveyor = 'Conveyor',
  Source = 'Source',
  Output = 'Output',
}

// ─── Conveyor ─────────────────────────────────────────────────────────────────

export enum ConveyorDirection {
  Right = 'Right',
  Left = 'Left',
  Up = 'Up',
  Down = 'Down',
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

export interface GridPosition {
  col: number;
  row: number;
}

export interface GridCell {
  col: number;
  row: number;
  occupied: boolean;
  machineType?: MachineType;
  machineId?: string;
  conveyorDirection?: ConveyorDirection;
}

// ─── Machine state ────────────────────────────────────────────────────────────

export enum MachineState {
  Idle = 'Idle',
  Processing = 'Processing',
  Blocked = 'Blocked',
  Broken = 'Broken',
}

export interface Recipe {
  inputs: ItemType[];
  output: ItemType;
  durationMs: number;
}

export interface MachineConfig {
  type: MachineType;
  label: string;
  description: string;
  emoji: string;
  recipe?: Recipe;
  recipes?: Recipe[]; // alternative recipes (machine picks first matching)
  color: number;
}

// ─── Order / Customer ─────────────────────────────────────────────────────────

export enum DrinkType {
  Espresso = 'Espresso',
  Latte = 'Latte',
  Cappuccino = 'Cappuccino',
}

export interface Order {
  id: string;
  drinkType: DrinkType;
  requiredItem: ItemType;
  timeoutMs: number;
  startedAt: number;
}

export interface Customer {
  id: string;
  order: Order;
}

// ─── Level ────────────────────────────────────────────────────────────────────

export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  clientCount: number;
  availableMachines: MachineType[];
  availableDrinks: DrinkType[];
  clientSpawnIntervalMs: number;
  orderTimeoutMs: number;
  maxFailedOrders: number;
  hasMachineBreakdowns: boolean;
}

// ─── Game State (shared via EventBus) ─────────────────────────────────────────

export interface GameStats {
  score: number;
  level: number;
  ordersServed: number;
  ordersFailed: number;
  consecutiveFailed: number;
}
