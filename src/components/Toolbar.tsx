import { useState, useEffect, useRef } from 'react';
import { MachineType } from '../game/types/index';
import { MACHINE_CONFIGS } from '../game/types/constants';
import { EventBus } from '../game/EventBus';

interface ToolbarProps {
  availableMachines: MachineType[];
  onHelp?: () => void;
}

interface TooltipInfo {
  label: string;
  description: string;
  recipe?: string;
  x: number;
  y: number;
}

function getRecipeText(type: MachineType): string | undefined {
  const config = MACHINE_CONFIGS[type];
  const itemNames: Record<string, string> = {
    CoffeeBeans: 'Grains de café',
    GroundCoffee: 'Café moulu',
    Water: 'Eau',
    Espresso: 'Espresso',
    Milk: 'Lait',
    HotMilk: 'Lait chaud',
    Coffee: 'Café servi',
  };

  const recipeList = config.recipes ?? (config.recipe ? [config.recipe] : []);
  if (recipeList.length === 0) return undefined;

  return recipeList.map(r => {
    const inputs = r.inputs.map(i => itemNames[i] ?? i).join(' + ');
    const output = itemNames[r.output] ?? r.output;
    const dur = (r.durationMs / 1000).toFixed(0);
    return `${inputs} → ${output} (${dur}s)`;
  }).join('  |  ');
}

export function Toolbar({ availableMachines, onHelp }: ToolbarProps) {
  const [selected, setSelected] = useState<MachineType | null>(null);
  const [destroyMode, setDestroyMode] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    EventBus.on('destroy-mode-changed', (enabled: boolean) => {
      setDestroyMode(enabled);
      if (enabled) setSelected(null);
    });
    // Sync deselect when Phaser clears selection
    EventBus.on('select-machine', (type: MachineType | null) => {
      if (type === null) setSelected(null);
    });

    return () => {
      EventBus.removeListener('destroy-mode-changed');
    };
  }, []);

  const handleSelect = (type: MachineType) => {
    const next = selected === type ? null : type;
    setSelected(next);
    setDestroyMode(false);
    EventBus.emit('select-machine', next);
  };

  const toggleDestroyMode = () => {
    const next = !destroyMode;
    setDestroyMode(next);
    EventBus.emit('destroy-mode-toggle', next);
    // Also tell Phaser via keyboard simulation — use EventBus directly
    EventBus.emit('set-destroy-mode', next);
    if (next) setSelected(null);
  };

  const showTooltip = (type: MachineType, e: React.MouseEvent) => {
    const config = MACHINE_CONFIGS[type];
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const toolbarRect = toolbarRef.current?.getBoundingClientRect();
    setTooltip({
      label: config.label,
      description: config.description,
      recipe: getRecipeText(type),
      x: rect.left - (toolbarRect?.left ?? 0) - 10,
      y: rect.top - (toolbarRect?.top ?? 0),
    });
  };

  return (
    <div ref={toolbarRef} style={styles.toolbar}>
      {/* Mode indicator */}
      <div style={destroyMode ? styles.modeDestroy : styles.modeConstruct}>
        {destroyMode ? '💥 Destruction' : '🔨 Construction'}
      </div>

      {/* Destroy mode button */}
      <button
        onClick={toggleDestroyMode}
        style={{ ...styles.modeBtn, ...(destroyMode ? styles.modeBtnActive : {}) }}
        title="Basculer en mode destruction (raccourci : R)"
      >
        {destroyMode ? '🔴 Détruire [R]' : '🔧 Détruire [R]'}
      </button>

      <div style={styles.separator} />
      <div style={styles.title}>🏭 Machines</div>

      {availableMachines.map((type) => {
        const config = MACHINE_CONFIGS[type];
        const isSelected = selected === type && !destroyMode;
        return (
          <button
            key={type}
            onClick={() => handleSelect(type)}
            onMouseEnter={(e) => showTooltip(type, e)}
            onMouseLeave={() => setTooltip(null)}
            style={{
              ...styles.btn,
              ...(isSelected ? styles.btnSelected : {}),
              ...(destroyMode ? styles.btnDimmed : {}),
            }}
          >
            <span style={styles.emoji}>{config.emoji}</span>
            <span style={styles.label}>{config.label}</span>
            {config.cost > 0 && <span style={styles.cost}>💰{config.cost}</span>}
          </button>
        );
      })}

      {selected && !destroyMode && (
        <button
          onClick={() => { setSelected(null); EventBus.emit('select-machine', null); }}
          style={styles.clearBtn}
        >
          ✕ Désélectionner
        </button>
      )}

      <div style={styles.hint}>Clic droit : supprimer</div>

      {onHelp && (
        <button onClick={onHelp} style={styles.helpBtn} title="Comment jouer ?">
          ❓ Aide
        </button>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div style={{ ...styles.tooltip, top: tooltip.y, right: '100%' }}>
          <strong style={styles.tooltipTitle}>{tooltip.label}</strong>
          <p style={styles.tooltipDesc}>{tooltip.description}</p>
          {tooltip.recipe && (
            <div style={styles.tooltipRecipe}>
              <span style={styles.tooltipRecipeLabel}>Recette :</span> {tooltip.recipe}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '10px 8px',
    backgroundColor: '#1A0F0A',
    borderLeft: '2px solid #D2691E',
    minWidth: 120,
    maxWidth: 120,
    overflowY: 'auto',
  },
  modeConstruct: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    color: '#FFFFFF',
    backgroundColor: '#D2691E',
    padding: '4px 6px',
    borderRadius: 5,
  },
  modeDestroy: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    color: '#FFFFFF',
    backgroundColor: '#C62828',
    padding: '4px 6px',
    borderRadius: 5,
    animation: 'pulse 1s infinite',
  },
  modeBtn: {
    padding: '5px 4px',
    backgroundColor: '#2C1810',
    border: '1px solid #4A2C1A',
    borderRadius: 5,
    cursor: 'pointer',
    color: '#CCCCCC',
    fontSize: 10,
    fontFamily: 'Arial',
    textAlign: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#7B1111',
    border: '1px solid #FF3300',
    color: '#FFFFFF',
  },
  separator: {
    height: 1,
    backgroundColor: '#4A2C1A',
    margin: '2px 0',
  },
  title: {
    color: '#D2691E',
    fontWeight: 'bold',
    fontSize: 12,
    fontFamily: 'Arial',
    textAlign: 'center',
  },
  btn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    padding: '7px 4px',
    backgroundColor: '#2C1810',
    border: '1px solid #4A2C1A',
    borderRadius: 6,
    cursor: 'pointer',
    color: '#FFFFFF',
    fontFamily: 'Arial',
    transition: 'all 0.15s',
  },
  btnSelected: {
    backgroundColor: '#D2691E',
    border: '1px solid #FF9800',
    boxShadow: '0 0 8px #D2691E88',
  },
  btnDimmed: {
    opacity: 0.45,
    cursor: 'default',
  },
  emoji: { fontSize: 20 },
  label: { fontSize: 9, color: '#CCCCCC', textAlign: 'center', lineHeight: 1.2 },
  cost: { fontSize: 9, color: '#FFD700', textAlign: 'center', marginTop: 2 },
  clearBtn: {
    padding: '5px 4px',
    backgroundColor: '#333',
    border: '1px solid #555',
    borderRadius: 5,
    cursor: 'pointer',
    color: '#CCCCCC',
    fontSize: 10,
    fontFamily: 'Arial',
  },
  hint: {
    color: '#6B4F3A',
    fontSize: 9,
    fontFamily: 'Arial',
    textAlign: 'center',
    marginTop: 4,
  },
  helpBtn: {
    padding: '6px 4px',
    backgroundColor: '#2C1810',
    border: '1px solid #D2691E',
    borderRadius: 5,
    cursor: 'pointer',
    color: '#D2691E',
    fontSize: 11,
    fontFamily: 'Arial',
    textAlign: 'center',
    marginTop: 4,
  },
  tooltip: {
    position: 'absolute',
    zIndex: 100,
    backgroundColor: '#1A0F0A',
    border: '1px solid #D2691E',
    borderRadius: 8,
    padding: '10px 12px',
    width: 200,
    boxShadow: '0 4px 16px rgba(0,0,0,0.7)',
    pointerEvents: 'none',
    marginRight: 6,
    transform: 'translateX(-100%)',
  },
  tooltipTitle: {
    display: 'block',
    color: '#D2691E',
    fontSize: 13,
    fontFamily: 'Arial Black',
    marginBottom: 5,
  },
  tooltipDesc: {
    color: '#CCCCCC',
    fontSize: 11,
    fontFamily: 'Arial',
    margin: '0 0 6px 0',
    lineHeight: 1.4,
  },
  tooltipRecipe: {
    color: '#A0856E',
    fontSize: 10,
    fontFamily: 'Arial',
    borderTop: '1px solid #4A2C1A',
    paddingTop: 5,
    lineHeight: 1.4,
  },
  tooltipRecipeLabel: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
};
