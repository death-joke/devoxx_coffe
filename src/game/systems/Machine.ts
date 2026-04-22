import { ItemType, MachineType, MachineState, Recipe, ConveyorDirection } from '../types/index';
import { MACHINE_CONFIGS } from '../types/constants';

export interface MachineOutput {
  item: ItemType;
  machineId: string;
}

export class Machine {
  readonly id: string;
  readonly type: MachineType;
  readonly col: number;
  readonly row: number;

  state: MachineState = MachineState.Idle;
  inputBuffer: ItemType[] = [];
  outputBuffer: ItemType[] = [];
  processingProgress: number = 0; // 0-1
  private processingTimer: number = 0;
  private recipes: Recipe[];
  private activeRecipe: Recipe | null = null;
  conveyorDirection: ConveyorDirection | null = null;

  isBroken: boolean = false;
  sourceItemType?: ItemType;

  private onOutputCallbacks: Array<(output: MachineOutput) => void> = [];

  constructor(id: string, type: MachineType, col: number, row: number) {
    this.id = id;
    this.type = type;
    this.col = col;
    this.row = row;
    const cfg = MACHINE_CONFIGS[type];
    if (cfg.recipes) {
      this.recipes = cfg.recipes;
    } else if (cfg.recipe) {
      this.recipes = [cfg.recipe];
    } else {
      this.recipes = [];
    }
  }

  get label(): string { return MACHINE_CONFIGS[this.type].label; }
  get emoji(): string { return MACHINE_CONFIGS[this.type].emoji; }
  get color(): number { return MACHINE_CONFIGS[this.type].color; }
  get hasOutput(): boolean { return this.outputBuffer.length > 0; }

  /** True if this machine's recipes can ever use the given item type. */
  acceptsItem(item: ItemType): boolean {
    return this.recipes.some(r => r.inputs.includes(item));
  }

  /** Returns the first recipe whose inputs are all present in the buffer. */
  private findMatchingRecipe(): Recipe | null {
    for (const recipe of this.recipes) {
      const needed = [...recipe.inputs];
      for (const item of this.inputBuffer) {
        const idx = needed.indexOf(item);
        if (idx !== -1) needed.splice(idx, 1);
      }
      if (needed.length === 0) return recipe;
    }
    return null;
  }

  receiveItem(item: ItemType): boolean {
    if (this.recipes.length === 0) return false;
    // Accept item if any recipe uses it and buffer isn't full for that recipe
    const acceptedByAny = this.recipes.some(r => r.inputs.includes(item));
    if (!acceptedByAny) return false;
    // Don't overflow the buffer beyond the largest recipe's input count
    const maxInputs = Math.max(...this.recipes.map(r => r.inputs.length));
    if (this.inputBuffer.length >= maxInputs) return false;
    this.inputBuffer.push(item);
    return true;
  }

  canProcess(): boolean {
    if (this.recipes.length === 0) return false;
    if (this.isBroken) return false;
    if (this.state === MachineState.Processing) return false;
    if (this.outputBuffer.length > 0) return false;
    return this.findMatchingRecipe() !== null;
  }

  update(deltaMs: number): MachineOutput | null {
    if (this.isBroken || this.recipes.length === 0) return null;

    if (this.state === MachineState.Processing && this.activeRecipe) {
      this.processingTimer += deltaMs;
      this.processingProgress = Math.min(this.processingTimer / this.activeRecipe.durationMs, 1);

      if (this.processingTimer >= this.activeRecipe.durationMs) {
        this.processingProgress = 1;
        this.processingTimer = 0;
        this.state = MachineState.Idle;

        // Consume inputs for the active recipe
        for (const needed of this.activeRecipe.inputs) {
          const idx = this.inputBuffer.indexOf(needed);
          if (idx !== -1) this.inputBuffer.splice(idx, 1);
        }

        const produced = this.activeRecipe.output;
        this.activeRecipe = null;
        this.outputBuffer.push(produced);
        const output: MachineOutput = { item: produced, machineId: this.id };
        this.onOutputCallbacks.forEach(cb => cb(output));
        return output;
      }
    } else if (this.canProcess()) {
      this.activeRecipe = this.findMatchingRecipe();
      this.state = MachineState.Processing;
      this.processingProgress = 0;
      this.processingTimer = 0;
    } else {
      this.state = this.outputBuffer.length > 0 ? MachineState.Blocked : MachineState.Idle;
      this.processingProgress = 0;
    }

    return null;
  }

  collectOutput(): ItemType | null {
    if (this.outputBuffer.length === 0) return null;
    this.state = MachineState.Idle;
    return this.outputBuffer.shift() ?? null;
  }

  onOutput(cb: (output: MachineOutput) => void): void {
    this.onOutputCallbacks.push(cb);
  }

  repair(): void {
    this.isBroken = false;
    this.state = MachineState.Idle;
    this.activeRecipe = null;
  }

  reset(): void {
    this.state = MachineState.Idle;
    this.inputBuffer = [];
    this.outputBuffer = [];
    this.processingProgress = 0;
    this.processingTimer = 0;
    this.isBroken = false;
    this.activeRecipe = null;
  }
}
