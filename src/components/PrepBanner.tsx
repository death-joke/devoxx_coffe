interface PrepBannerProps {
  levelName: string;
  onStartDay: () => void;
}

export function PrepBanner({ levelName, onStartDay }: PrepBannerProps) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: '220px', // don't overlap the Toolbar
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      background: 'linear-gradient(90deg, rgba(27,94,32,0.95) 0%, rgba(20,60,20,0.95) 100%)',
      borderTop: '2px solid #4CAF50',
      gap: '16px',
      zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '28px' }}>🏗️</span>
        <div>
          <div style={{ color: '#A5D6A7', fontSize: '11px', fontFamily: 'Arial', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Phase de préparation — {levelName}
          </div>
          <div style={{ color: '#E8F5E9', fontSize: '13px', fontFamily: 'Arial', marginTop: '2px' }}>
            Construisez votre ligne de production avant l'ouverture du café
          </div>
        </div>
      </div>

      <button
        onClick={onStartDay}
        style={{
          padding: '12px 28px',
          background: 'linear-gradient(135deg, #FF6F00, #E65100)',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: 'bold',
          fontFamily: 'Arial',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(255,111,0,0.5)',
          transition: 'transform 0.1s, box-shadow 0.1s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 18px rgba(255,111,0,0.7)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(255,111,0,0.5)';
        }}
      >
        🚀 Lancer la journée
      </button>
    </div>
  );
}
