import { GameStats } from '../game/types/index';

interface HUDProps {
  stats: GameStats;
  visible: boolean;
  isPaused?: boolean;
  onTogglePause?: () => void;
}

export function HUD({ stats, visible, isPaused, onTogglePause }: HUDProps) {
  if (!visible) return null;

  return (
    <div style={styles.hud}>
      <div style={styles.block}>
        <span style={styles.label}>Niveau</span>
        <span style={styles.value}>{stats.level}</span>
      </div>
      <div style={styles.separator} />
      <div style={styles.block}>
        <span style={styles.label}>Score</span>
        <span style={{ ...styles.value, color: '#FFD700' }}>{stats.score}</span>
      </div>
      <div style={styles.separator} />
      <div style={styles.block}>
        <span style={styles.label}>✅ Servis</span>
        <span style={{ ...styles.value, color: '#4CAF50' }}>{stats.ordersServed}</span>
      </div>
      <div style={styles.separator} />
      <div style={styles.block}>
        <span style={styles.label}>❌ Ratés</span>
        <span style={{ ...styles.value, color: '#FF5722' }}>{stats.ordersFailed}</span>
      </div>
      {stats.budget >= 0 && (
        <>
          <div style={styles.separator} />
          <div style={styles.block}>
            <span style={styles.label}>💰 Budget</span>
            <span style={{ ...styles.value, color: stats.budget < 50 ? '#FF5722' : '#FFD700' }}>
              {stats.budget}
            </span>
          </div>
        </>
      )}
      <div style={{ flex: 1 }} />
      <button
        style={styles.pauseBtn}
        onClick={onTogglePause}
        title={isPaused ? 'Reprendre (Echap)' : 'Pause (Echap)'}
      >
        {isPaused ? '▶' : '⏸'}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  hud: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    backgroundColor: '#1A0F0A',
    borderBottom: '2px solid #D2691E',
    padding: '6px 16px',
    height: 44,
  },
  block: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 16px',
  },
  label: {
    color: '#A0856E',
    fontSize: 10,
    fontFamily: 'Arial',
    textTransform: 'uppercase',
  },
  value: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Arial Black',
  },
  separator: {
    width: 1,
    height: 30,
    backgroundColor: '#4A2C1A',
  },
  pauseBtn: {
    background: 'none',
    border: '1px solid #4A2C1A',
    borderRadius: 6,
    color: '#A0856E',
    fontSize: 18,
    cursor: 'pointer',
    padding: '2px 10px',
    fontFamily: 'Arial',
    lineHeight: 1,
  },
};
