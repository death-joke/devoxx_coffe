import { MachineType, MachineConfig, ItemType, DrinkType, LevelConfig } from './index';

// ─── Machine configs ──────────────────────────────────────────────────────────

export const MACHINE_CONFIGS: Record<MachineType, MachineConfig> = {
  [MachineType.Grinder]: {
    type: MachineType.Grinder,
    label: 'Moulin à café',
    description: 'Broie les grains de café en café moulu. Indispensable en début de chaîne.',
    emoji: '⚙️',
    color: 0x8B4513,
    recipe: {
      inputs: [ItemType.CoffeeBeans],
      output: ItemType.GroundCoffee,
      durationMs: 2000,
    },
  },
  [MachineType.Brewer]: {
    type: MachineType.Brewer,
    label: 'Cafetière',
    description: 'Transforme le café moulu en espresso. L\'eau est intégrée à la machine.',
    emoji: '☕',
    color: 0x4A2C2A,
    recipe: {
      inputs: [ItemType.GroundCoffee],
      output: ItemType.Espresso,
      durationMs: 3000,
    },
  },
  [MachineType.MilkSteamer]: {
    type: MachineType.MilkSteamer,
    label: 'Vapeur à lait',
    description: 'Chauffe et émulsionne le lait. Nécessaire pour les lattes et cappuccinos.',
    emoji: '🥛',
    color: 0xBDB59A,
    recipe: {
      inputs: [ItemType.Milk],
      output: ItemType.HotMilk,
      durationMs: 2000,
    },
  },
  [MachineType.CupFiller]: {
    type: MachineType.CupFiller,
    label: 'Remplisseur de tasse',
    description: 'Verse l\'espresso dans une tasse (Espresso/Cappuccino) ou du lait chaud (Latte). Accepte les deux chaînes.',
    emoji: '🫙',
    color: 0xD2691E,
    recipes: [
      { inputs: [ItemType.Espresso], output: ItemType.Coffee, durationMs: 1000 },
      { inputs: [ItemType.HotMilk],  output: ItemType.Coffee, durationMs: 1000 },
    ],
  },
  [MachineType.Conveyor]: {
    type: MachineType.Conveyor,
    label: 'Tapis roulant',
    description: 'Transporte les ingrédients d\'une machine à l\'autre. Se connecte automatiquement vers la droite.',
    emoji: '➡️',
    color: 0x888888,
  },
  [MachineType.Source]: {
    type: MachineType.Source,
    label: 'Source',
    description: 'Génère automatiquement des grains de café (et du lait si disponible). Fixée en zone d\'entrée.',
    emoji: '📦',
    color: 0x228B22,
  },
  [MachineType.Output]: {
    type: MachineType.Output,
    label: 'Comptoir',
    description: 'Point de livraison des cafés aux clients.',
    emoji: '🏁',
    color: 0xFFD700,
  },
};

// ─── Item display (emoji, names, colors) ─────────────────────────────────────

export const ITEM_EMOJIS: Record<ItemType, string> = {
  [ItemType.CoffeeBeans]: '🫘',
  [ItemType.GroundCoffee]: '🟤',
  [ItemType.Water]: '💧',
  [ItemType.Espresso]: '☕',
  [ItemType.Milk]: '🥛',
  [ItemType.HotMilk]: '🫗',
  [ItemType.Coffee]: '🍵',
};

export const ITEM_NAMES: Record<ItemType, string> = {
  [ItemType.CoffeeBeans]: 'Grains',
  [ItemType.GroundCoffee]: 'Café moulu',
  [ItemType.Water]: 'Eau',
  [ItemType.Espresso]: 'Expresso',
  [ItemType.Milk]: 'Lait',
  [ItemType.HotMilk]: 'Lait chaud',
  [ItemType.Coffee]: 'Café',
};

export const ITEM_COLORS: Record<ItemType, number> = {
  [ItemType.CoffeeBeans]: 0x3E1C00,
  [ItemType.GroundCoffee]: 0x6B3A2A,
  [ItemType.Water]: 0x4FC3F7,
  [ItemType.Espresso]: 0x5D2E0C,
  [ItemType.Milk]: 0xFFFDE7,
  [ItemType.HotMilk]: 0xFFE0B2,
  [ItemType.Coffee]: 0xD7A86E,
};

// ─── Drink → required item mapping ───────────────────────────────────────────

export const DRINK_REQUIRED_ITEM: Record<DrinkType, ItemType> = {
  [DrinkType.Espresso]: ItemType.Coffee,
  [DrinkType.Latte]: ItemType.Coffee,
  [DrinkType.Cappuccino]: ItemType.Coffee,
};

// ─── Level definitions ────────────────────────────────────────────────────────

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Ouverture',
    description: 'Prépare tes premiers expressos ! Pose les machines et connecte-les.',
    clientCount: 5,
    availableMachines: [MachineType.Grinder, MachineType.Brewer, MachineType.CupFiller, MachineType.Conveyor],
    availableDrinks: [DrinkType.Espresso],
    clientSpawnIntervalMs: 8000,
    orderTimeoutMs: 20000,
    maxFailedOrders: 3,
    hasMachineBreakdowns: false,
  },
  {
    id: 2,
    name: 'Heure du Latte',
    description: 'Les clients veulent du lait ! Ajoute un steamer à ta chaîne.',
    clientCount: 8,
    availableMachines: [MachineType.Grinder, MachineType.Brewer, MachineType.MilkSteamer, MachineType.CupFiller, MachineType.Conveyor],
    availableDrinks: [DrinkType.Espresso, DrinkType.Latte],
    clientSpawnIntervalMs: 6000,
    orderTimeoutMs: 18000,
    maxFailedOrders: 3,
    hasMachineBreakdowns: false,
  },
  {
    id: 3,
    name: 'Rush Hour',
    description: 'Les clients arrivent en masse et veulent tout ! Optimise ton débit.',
    clientCount: 12,
    availableMachines: [MachineType.Grinder, MachineType.Brewer, MachineType.MilkSteamer, MachineType.CupFiller, MachineType.Conveyor],
    availableDrinks: [DrinkType.Espresso, DrinkType.Latte, DrinkType.Cappuccino],
    clientSpawnIntervalMs: 4000,
    orderTimeoutMs: 15000,
    maxFailedOrders: 3,
    hasMachineBreakdowns: false,
  },
  {
    id: 4,
    name: 'Chaos au Café',
    description: 'Les machines tombent en panne ! Répare-les vite tout en servant les clients.',
    clientCount: 15,
    availableMachines: [MachineType.Grinder, MachineType.Brewer, MachineType.MilkSteamer, MachineType.CupFiller, MachineType.Conveyor],
    availableDrinks: [DrinkType.Espresso, DrinkType.Latte, DrinkType.Cappuccino],
    clientSpawnIntervalMs: 3500,
    orderTimeoutMs: 14000,
    maxFailedOrders: 3,
    hasMachineBreakdowns: true,
  },
];

// ─── Grid dimensions ──────────────────────────────────────────────────────────

export const GRID_COLS = 12;
export const GRID_ROWS = 8;
export const CELL_SIZE = 64;
export const GRID_OFFSET_X = 80;
export const GRID_OFFSET_Y = 80;
