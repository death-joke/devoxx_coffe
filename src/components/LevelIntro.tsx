import { LevelConfig } from '../game/types/index';
import { MACHINE_CONFIGS } from '../game/types/constants';

interface LevelIntroProps {
  level: LevelConfig;
  onStart: () => void;
}

export function LevelIntro({ level, onStart }: LevelIntroProps) {
  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.levelBadge}>Niveau {level.id}</div>
        <h2 style={styles.title}>☕ {level.name}</h2>
        <p style={styles.description}>{level.description}</p>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>📋 Objectif</div>
          <p style={styles.info}>Servir <strong style={{ color: '#FFD700' }}>{level.clientCount} clients</strong></p>
          <p style={styles.info}>Boissons : <strong style={{ color: '#D2691E' }}>{level.availableDrinks.join(', ')}</strong></p>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>🔧 Machines disponibles</div>
          <div style={styles.machineList}>
            {level.availableMachines.map(type => (
              <span key={type} style={styles.machineChip}>
                {MACHINE_CONFIGS[type].emoji} {MACHINE_CONFIGS[type].label}
              </span>
            ))}
          </div>
        </div>

        {level.hasMachineBreakdowns && (
          <div style={styles.warning}>⚠️ Attention : pannes de machines possibles !</div>
        )}

        <button style={styles.startBtn} onClick={onStart}>
          C'est parti ! ▶
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  card: {
    backgroundColor: '#1A0F0A',
    border: '2px solid #D2691E',
    borderRadius: 12,
    padding: '32px 40px',
    maxWidth: 480,
    textAlign: 'center',
    fontFamily: 'Arial',
  },
  levelBadge: {
    display: 'inline-block',
    backgroundColor: '#D2691E',
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    padding: '3px 12px',
    borderRadius: 12,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  title: { color: '#D2691E', fontSize: 28, margin: '0 0 8px' },
  description: { color: '#A0856E', fontSize: 15, marginBottom: 20 },
  section: { marginBottom: 16, textAlign: 'left' },
  sectionTitle: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13, marginBottom: 6 },
  info: { color: '#CCCCCC', fontSize: 14, margin: '4px 0' },
  machineList: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  machineChip: {
    backgroundColor: '#2C1810', border: '1px solid #4A2C1A',
    borderRadius: 6, padding: '4px 10px',
    color: '#CCCCCC', fontSize: 12,
  },
  warning: {
    backgroundColor: '#3E1C00', border: '1px solid #FF5722',
    borderRadius: 6, padding: '8px 16px',
    color: '#FF5722', fontSize: 13, marginBottom: 16,
  },
  startBtn: {
    marginTop: 16,
    padding: '12px 40px',
    backgroundColor: '#D2691E',
    border: 'none', borderRadius: 8,
    color: '#FFF', fontSize: 18, fontWeight: 'bold',
    cursor: 'pointer', fontFamily: 'Arial Black',
  },
};
