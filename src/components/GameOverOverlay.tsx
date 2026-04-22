import React, { useEffect, useState } from 'react';

interface GameOverOverlayProps {
  score: number;
  bestScore: number;
  onMenu: () => void;
  onReplay: () => void;
}

const COUNTDOWN_SECONDS = 5;

export function GameOverOverlay({ score, bestScore, onMenu, onReplay }: GameOverOverlayProps) {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (countdown <= 0) {
      onMenu();
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onMenu]);

  const isNewBest = score >= bestScore && score > 0;

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.emoji}>😢</div>

        <h2 style={styles.title}>Game Over</h2>
        <p style={styles.subtitle}>Trop de commandes ratées…</p>

        <div style={styles.scoreBox}>
          <div style={styles.scoreLabel}>Score final</div>
          <div style={styles.scoreValue}>{score}</div>
          {isNewBest && (
            <div style={styles.newBest}>🏆 Nouveau record !</div>
          )}
          {!isNewBest && bestScore > 0 && (
            <div style={styles.bestScore}>Meilleur : {bestScore}</div>
          )}
        </div>

        <div style={styles.countdown}>
          Retour au menu dans <strong>{countdown}s</strong>…
        </div>

        <div style={styles.buttons}>
          <button style={styles.replayBtn} onClick={onReplay}>
            🔄 Rejouer
          </button>
          <button style={styles.menuBtn} onClick={onMenu}>
            🏠 Menu
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 30,
  },
  card: {
    backgroundColor: '#1A0F0A',
    border: '2px solid #FF5722',
    borderRadius: 16,
    padding: '36px 48px',
    textAlign: 'center',
    fontFamily: 'Arial',
    maxWidth: 400,
    width: '90%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  emoji: { fontSize: 64 },
  title: {
    color: '#FF5722',
    fontSize: 42,
    margin: 0,
    fontFamily: 'Arial Black',
    textShadow: '0 0 20px #FF572255',
  },
  subtitle: {
    color: '#A0856E',
    fontSize: 16,
    margin: 0,
  },
  scoreBox: {
    backgroundColor: '#2C1810',
    border: '1px solid #4A2C1A',
    borderRadius: 10,
    padding: '16px 32px',
    marginTop: 4,
    width: '100%',
    boxSizing: 'border-box',
  },
  scoreLabel: {
    color: '#A0856E',
    fontSize: 13,
    fontFamily: 'Arial',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreValue: {
    color: '#FFD700',
    fontSize: 48,
    fontFamily: 'Arial Black',
    lineHeight: 1.1,
  },
  newBest: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  bestScore: {
    color: '#6B4F3A',
    fontSize: 13,
    marginTop: 4,
  },
  countdown: {
    color: '#6B4F3A',
    fontSize: 13,
    fontFamily: 'Arial',
  },
  buttons: {
    display: 'flex',
    gap: 12,
    marginTop: 4,
  },
  replayBtn: {
    padding: '10px 22px',
    backgroundColor: '#D2691E',
    border: 'none', borderRadius: 8,
    color: '#FFF', fontSize: 15, fontWeight: 'bold',
    cursor: 'pointer', fontFamily: 'Arial Black',
  },
  menuBtn: {
    padding: '10px 22px',
    backgroundColor: '#333',
    border: '1px solid #555', borderRadius: 8,
    color: '#CCC', fontSize: 15, fontWeight: 'bold',
    cursor: 'pointer', fontFamily: 'Arial Black',
  },
};
