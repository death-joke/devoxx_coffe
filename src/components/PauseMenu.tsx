interface PauseMenuProps {
  onResume: () => void;
  onReplay: () => void;
  onMenu: () => void;
}

export function PauseMenu({ onResume, onReplay, onMenu }: PauseMenuProps) {
  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.title}>⏸ Pause</div>
        <div style={styles.buttons}>
          <button style={styles.primaryBtn} onClick={onResume}>▶ Reprendre</button>
          <button style={styles.secondaryBtn} onClick={onReplay}>🔄 Rejouer le niveau</button>
          <button style={styles.secondaryBtn} onClick={onMenu}>🏠 Menu principal</button>
        </div>
        <div style={styles.hint}>Appuie sur Echap pour reprendre</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 20,
  },
  card: {
    backgroundColor: '#1A0F0A',
    border: '2px solid #D2691E',
    borderRadius: 12,
    padding: '40px 56px',
    textAlign: 'center',
    fontFamily: 'Arial',
    minWidth: 280,
  },
  title: {
    color: '#D2691E',
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'Arial Black',
    marginBottom: 28,
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  primaryBtn: {
    padding: '12px 24px',
    backgroundColor: '#D2691E',
    border: 'none',
    borderRadius: 8,
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'Arial Black',
  },
  secondaryBtn: {
    padding: '10px 18px',
    backgroundColor: '#2C1810',
    border: '1px solid #4A2C1A',
    borderRadius: 8,
    color: '#CCCCCC',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'Arial',
  },
  hint: {
    color: '#4A2C1A',
    fontSize: 11,
    marginTop: 20,
    fontFamily: 'Arial',
  },
};
