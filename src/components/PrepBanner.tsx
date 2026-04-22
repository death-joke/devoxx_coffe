import { useState, useEffect, useRef } from 'react';

interface PrepBannerProps {
  levelName: string;
  prepTimeSecs?: number;
  budget?: number;
  onStartDay: () => void;
}

export function PrepBanner({ levelName, prepTimeSecs, budget, onStartDay }: PrepBannerProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(prepTimeSecs ?? null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!prepTimeSecs) return;
    setTimeLeft(prepTimeSecs);
    firedRef.current = false;

    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(id);
          if (!firedRef.current) {
            firedRef.current = true;
            onStartDay();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [prepTimeSecs]); // eslint-disable-line react-hooks/exhaustive-deps

  const urgency = timeLeft !== null
    ? timeLeft <= 10 ? 'red' : timeLeft <= 20 ? 'orange' : 'green'
    : 'green';

  const borderColor = urgency === 'red' ? '#FF5722' : urgency === 'orange' ? '#FF9800' : '#4CAF50';
  const bgStart = urgency === 'red' ? 'rgba(90,20,0,0.97)' : urgency === 'orange' ? 'rgba(80,40,0,0.97)' : 'rgba(27,94,32,0.95)';

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: '220px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 20px',
      background: `linear-gradient(90deg, ${bgStart} 0%, rgba(20,20,20,0.97) 100%)`,
      borderTop: `2px solid ${borderColor}`,
      gap: '12px',
      zIndex: 10,
      transition: 'background 0.5s, border-color 0.5s',
    }}>
      {/* Left: info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <span style={{ fontSize: '24px', flexShrink: 0 }}>🏗️</span>
        <div>
          <div style={{ color: '#A5D6A7', fontSize: '10px', fontFamily: 'Arial', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Préparation — {levelName}
          </div>
          <div style={{ color: '#E8F5E9', fontSize: '12px', fontFamily: 'Arial', marginTop: '1px' }}>
            Construisez votre ligne avant l'ouverture du café
          </div>
        </div>
      </div>

      {/* Center: timer */}
      {timeLeft !== null && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ color: '#999', fontSize: '9px', fontFamily: 'Arial', textTransform: 'uppercase', letterSpacing: '1px' }}>Temps restant</div>
          <div style={{
            color: urgency === 'red' ? '#FF5722' : urgency === 'orange' ? '#FF9800' : '#4CAF50',
            fontSize: '28px',
            fontWeight: 'bold',
            fontFamily: 'Arial Black',
            lineHeight: 1,
            animation: timeLeft <= 10 ? 'pulse 0.5s infinite' : undefined,
          }}>
            {timeLeft}s
          </div>
          {/* Progress bar */}
          <div style={{ width: 80, height: 4, background: '#333', borderRadius: 2, marginTop: 3 }}>
            <div style={{
              width: `${(timeLeft / (prepTimeSecs ?? 1)) * 100}%`,
              height: '100%',
              background: urgency === 'red' ? '#FF5722' : urgency === 'orange' ? '#FF9800' : '#4CAF50',
              borderRadius: 2,
              transition: 'width 1s linear, background 0.5s',
            }} />
          </div>
        </div>
      )}

      {/* Budget display */}
      {budget !== undefined && budget >= 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ color: '#999', fontSize: '9px', fontFamily: 'Arial', textTransform: 'uppercase', letterSpacing: '1px' }}>Budget</div>
          <div style={{ color: '#FFD700', fontSize: '20px', fontWeight: 'bold', fontFamily: 'Arial Black', lineHeight: 1 }}>
            💰 {budget}
          </div>
        </div>
      )}

      {/* Launch button */}
      <button
        onClick={onStartDay}
        style={{
          padding: '10px 22px',
          background: 'linear-gradient(135deg, #FF6F00, #E65100)',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          fontFamily: 'Arial',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(255,111,0,0.5)',
          flexShrink: 0,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
      >
        🚀 Lancer la journée
      </button>
    </div>
  );
}
