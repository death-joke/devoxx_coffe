interface LevelSummaryProps {
  levelName: string;
  score: number;
  ordersServed: number;
  ordersFailed: number;
  totalOrders: number;
  isLastLevel: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onMenu: () => void;
}

function getStars(served: number, total: number): number {
  const ratio = served / total;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.6) return 2;
  return 1;
}

export function LevelSummary({
  levelName, score, ordersServed, ordersFailed, totalOrders,
  isLastLevel, onNextLevel, onReplay, onMenu,
}: LevelSummaryProps) {
  const stars = getStars(ordersServed, totalOrders);

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.badge}>Niveau terminé !</div>
        <h2 style={styles.title}>☕ {levelName}</h2>

        <div style={styles.stars}>
          {[1, 2, 3].map(s => (
            <span key={s} style={{ fontSize: 36, opacity: s <= stars ? 1 : 0.2 }}>⭐</span>
          ))}
        </div>

        <div style={styles.scoreBlock}>
          <span style={styles.scoreLabel}>Score</span>
          <span style={styles.scoreValue}>{score}</span>
        </div>

        <div style={styles.statsRow}>
          <div style={styles.stat}>
            <span style={styles.statEmoji}>✅</span>
            <span style={styles.statValue}>{ordersServed}</span>
            <span style={styles.statLabel}>Servis</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statEmoji}>❌</span>
            <span style={styles.statValue}>{ordersFailed}</span>
            <span style={styles.statLabel}>Ratés</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statEmoji}>📊</span>
            <span style={styles.statValue}>{Math.round((ordersServed / totalOrders) * 100)}%</span>
            <span style={styles.statLabel}>Efficacité</span>
          </div>
        </div>

        <div style={styles.buttons}>
          <button style={styles.secondaryBtn} onClick={onReplay}>🔄 Rejouer</button>
          <button style={styles.secondaryBtn} onClick={onMenu}>🏠 Menu</button>
          {!isLastLevel && (
            <button style={styles.primaryBtn} onClick={onNextLevel}>Niveau suivant ▶</button>
          )}
          {isLastLevel && (
            <button style={styles.primaryBtn} onClick={onMenu}>🏆 Fin du jeu !</button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  card: {
    backgroundColor: '#1A0F0A',
    border: '2px solid #D2691E',
    borderRadius: 12,
    padding: '32px 48px',
    maxWidth: 480,
    textAlign: 'center',
    fontFamily: 'Arial',
  },
  badge: {
    display: 'inline-block', backgroundColor: '#4CAF50',
    color: '#FFF', fontSize: 12, fontWeight: 'bold',
    padding: '3px 12px', borderRadius: 12, marginBottom: 12, textTransform: 'uppercase',
  },
  title: { color: '#D2691E', fontSize: 26, margin: '0 0 12px' },
  stars: { display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 16 },
  scoreBlock: { marginBottom: 20 },
  scoreLabel: { color: '#A0856E', fontSize: 13, display: 'block' },
  scoreValue: { color: '#FFD700', fontSize: 48, fontWeight: 'bold', fontFamily: 'Arial Black' },
  statsRow: { display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 28 },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  statEmoji: { fontSize: 22 },
  statValue: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#A0856E', fontSize: 11 },
  buttons: { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' },
  primaryBtn: {
    padding: '10px 24px', backgroundColor: '#D2691E',
    border: 'none', borderRadius: 8, color: '#FFF',
    fontSize: 16, fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Arial Black',
  },
  secondaryBtn: {
    padding: '10px 18px', backgroundColor: '#2C1810',
    border: '1px solid #4A2C1A', borderRadius: 8, color: '#CCCCCC',
    fontSize: 14, cursor: 'pointer', fontFamily: 'Arial',
  },
};
