import React from 'react';

interface HowToPlayProps {
  onClose: () => void;
}

export function HowToPlay({ onClose }: HowToPlayProps) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>❓ Comment jouer</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.scrollArea}>
          <Section icon="🎯" title="Objectif">
            Servir les clients qui arrivent à droite avant que leur minuterie ne se vide.
            Trop de commandes ratées = <span style={styles.danger}>Game Over</span> !
          </Section>

          <Section icon="🏭" title="Chaîne de production">
            <div style={styles.chain}>
              <ChainStep emoji="🫘" label="Grains de café" />
              <Arrow />
              <ChainStep emoji="⚙️" label="Moulin" />
              <Arrow />
              <ChainStep emoji="🟤" label="Café moulu" />
              <Arrow />
              <ChainStep emoji="☕" label="Cafetière" />
              <Arrow />
              <ChainStep emoji="☕" label="Expresso" />
              <Arrow />
              <ChainStep emoji="🫙" label="Remplisseur" />
              <Arrow />
              <ChainStep emoji="🍵" label="Café servi" />
            </div>
            <div style={styles.chainMilk}>
              <ChainStep emoji="🥛" label="Lait" />
              <Arrow />
              <ChainStep emoji="🥛" label="Vapeur à lait" />
              <Arrow />
              <ChainStep emoji="🫗" label="Lait chaud" />
              <Arrow />
              <ChainStep emoji="🫙" label="Remplisseur" />
              <Arrow />
              <ChainStep emoji="🍵" label="Café servi" />
            </div>
          </Section>

          <Section icon="🔧" title="Placer des machines">
            <Row>Sélectionner une machine dans la barre à droite, puis <strong>clic gauche</strong> sur une case de la grille.</Row>
            <Row>Les convoyeurs <strong>➡️</strong> relient les machines automatiquement de gauche à droite.</Row>
          </Section>

          <Section icon="💥" title="Détruire une machine">
            <Row><strong>Clic droit</strong> sur une machine pour la supprimer.</Row>
            <Row>Ou activer le mode <strong>🔴 Destruction</strong> (bouton en haut de la toolbar ou touche <kbd style={styles.kbd}>R</kbd>).</Row>
          </Section>

          <Section icon="👥" title="Les clients">
            <Row>Chaque client affiche sa commande et une <strong>barre de temps</strong>.</Row>
            <Row>Le café arrive automatiquement au <strong>Comptoir</strong> (colonne de droite).</Row>
            <Row>Un client servi = <span style={styles.success}>+points</span>. Un client perdu = <span style={styles.danger}>échec</span>.</Row>
          </Section>

          <Section icon="▶️" title="Lancer la journée">
            <Row>Pendant la <strong>phase de préparation</strong>, place tes machines.</Row>
            <Row>Clique sur <strong>"Lancer la journée"</strong> pour que les clients commencent à arriver.</Row>
          </Section>
        </div>

        <button style={styles.startBtn} onClick={onClose}>
          C'est compris ! ✓
        </button>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>{icon} {title}</div>
      <div style={styles.sectionBody}>{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <p style={styles.row}>• {children}</p>;
}

function ChainStep({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div style={styles.chainStep}>
      <span style={styles.chainEmoji}>{emoji}</span>
      <span style={styles.chainLabel}>{label}</span>
    </div>
  );
}

function Arrow() {
  return <span style={styles.arrow}>→</span>;
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 20,
  },
  card: {
    backgroundColor: '#1A0F0A',
    border: '2px solid #D2691E',
    borderRadius: 14,
    padding: '24px 28px',
    width: 560,
    maxWidth: '90vw',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    fontFamily: 'Arial',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#D2691E',
    fontSize: 22,
    margin: 0,
    fontFamily: 'Arial Black',
  },
  closeBtn: {
    background: 'transparent',
    border: '1px solid #4A2C1A',
    color: '#CCCCCC',
    borderRadius: 6,
    padding: '4px 10px',
    cursor: 'pointer',
    fontSize: 14,
  },
  scrollArea: {
    overflowY: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    paddingRight: 4,
  },
  section: {
    backgroundColor: '#2C1810',
    borderRadius: 8,
    padding: '10px 14px',
    border: '1px solid #4A2C1A',
  },
  sectionTitle: {
    color: '#FF9800',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 6,
    fontFamily: 'Arial Black',
  },
  sectionBody: {
    color: '#CCCCCC',
    fontSize: 13,
  },
  row: {
    margin: '4px 0',
    lineHeight: 1.5,
  },
  chain: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  chainMilk: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  chainStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#1A0F0A',
    border: '1px solid #4A2C1A',
    borderRadius: 6,
    padding: '4px 6px',
    minWidth: 52,
  },
  chainEmoji: { fontSize: 16 },
  chainLabel: { fontSize: 9, color: '#A0856E', textAlign: 'center', lineHeight: 1.2, marginTop: 2 },
  arrow: {
    color: '#D2691E',
    fontSize: 16,
    fontWeight: 'bold',
  },
  kbd: {
    backgroundColor: '#3A2010',
    border: '1px solid #6B3A2A',
    borderRadius: 4,
    padding: '1px 6px',
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#FFFFFF',
  },
  success: { color: '#4CAF50', fontWeight: 'bold' },
  danger: { color: '#FF5722', fontWeight: 'bold' },
  startBtn: {
    padding: '10px 32px',
    backgroundColor: '#D2691E',
    border: 'none',
    borderRadius: 8,
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'Arial Black',
    alignSelf: 'center',
    marginTop: 4,
  },
};
