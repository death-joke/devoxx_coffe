import { useRef, useState, useEffect } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { EventBus } from './game/EventBus';
import { GameStats, MachineType } from './game/types/index';
import { LEVELS } from './game/types/constants';
import { Toolbar } from './components/Toolbar';
import { HUD } from './components/HUD';
import { LevelIntro } from './components/LevelIntro';
import { LevelSummary } from './components/LevelSummary';
import { PrepBanner } from './components/PrepBanner';
import { PauseMenu } from './components/PauseMenu';
import { HowToPlay } from './components/HowToPlay';

type UIState = 'menu' | 'intro' | 'preparing' | 'playing' | 'paused' | 'summary' | 'gameover';

function App()
{
    const phaserRef = useRef<IRefPhaserGame | null>(null);
    const [uiState, setUiState] = useState<UIState>('menu');
    const uiStateRef = useRef<UIState>('menu');
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const [stats, setStats] = useState<GameStats>({
        score: 0, level: 1, ordersServed: 0, ordersFailed: 0, consecutiveFailed: 0,
    });
    const [summaryData, setSummaryData] = useState({ ordersServed: 0, ordersFailed: 0 });
    const [showHelp, setShowHelp] = useState(false);

    const currentLevel = LEVELS[currentLevelIndex];

    // Keep ref in sync so EventBus callbacks always see current value
    useEffect(() => { uiStateRef.current = uiState; }, [uiState]);

    useEffect(() => {
        EventBus.on('start-game', () => {
            setCurrentLevelIndex(0);
            setStats({ score: 0, level: 1, ordersServed: 0, ordersFailed: 0, consecutiveFailed: 0 });
            setUiState('intro');
        });

        EventBus.on('auto-level-started', () => {
            setCurrentLevelIndex(0);
            setStats({ score: 0, level: 1, ordersServed: 0, ordersFailed: 0, consecutiveFailed: 0 });
            setUiState('preparing');
        });

        EventBus.on('level-complete', (data: { ordersServed: number; ordersFailed: number }) => {
            setSummaryData(data);
            setUiState('summary');
        });

        EventBus.on('go-to-menu', () => {
            setUiState('menu');
        });

        EventBus.on('game-over', () => {
            setUiState('gameover');
        });

        EventBus.on('update-stats', (newStats: GameStats) => {
            setStats(newStats);
        });

        return () => {
            EventBus.removeListener('start-game');
            EventBus.removeListener('auto-level-started');
            EventBus.removeListener('go-to-menu');
            EventBus.removeListener('level-complete');
            EventBus.removeListener('game-over');
            EventBus.removeListener('update-stats');
        };
    }, []);

    // Window-level Escape handler — works even when the Phaser scene is paused
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            if (uiStateRef.current === 'playing') {
                setUiState('paused');
                EventBus.emit('pause-game');
            } else if (uiStateRef.current === 'paused') {
                setUiState('playing');
                EventBus.emit('resume-game');
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    const handleStartLevel = () => {
        setUiState('preparing');
        EventBus.emit('level-start', currentLevel);
    };

    const handleStartDay = () => {
        setUiState('playing');
        EventBus.emit('start-day');
    };

    const handleNextLevel = () => {
        const next = currentLevelIndex + 1;
        setCurrentLevelIndex(next);
        setStats(s => ({ ...s, level: next + 1 }));
        setUiState('intro');
    };

    const handleReplay = () => {
        EventBus.emit('resume-game');
        setStats(s => ({ ...s, ordersServed: 0, ordersFailed: 0, consecutiveFailed: 0 }));
        setUiState('intro');
    };

    const handleMenu = () => {
        if (phaserRef.current?.game) {
            phaserRef.current.game.scene.start('MainMenu');
        }
        EventBus.emit('resume-game');
        setUiState('menu');
    };

    const handleResume = () => {
        setUiState('playing');
        EventBus.emit('resume-game');
    };

    const handleTogglePause = () => {
        if (uiStateRef.current === 'playing') {
            setUiState('paused');
            EventBus.emit('pause-game');
        } else if (uiStateRef.current === 'paused') {
            setUiState('playing');
            EventBus.emit('resume-game');
        }
    };

    const availableMachines: MachineType[] = (uiState === 'playing' || uiState === 'preparing' || uiState === 'paused')
        ? currentLevel.availableMachines
        : [];

    return (
        <div id="app" style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#1A0F0A' }}>
            <HUD stats={stats} visible={uiState === 'playing' || uiState === 'preparing' || uiState === 'paused'} isPaused={uiState === 'paused'} onTogglePause={handleTogglePause} />

            <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
                <PhaserGame ref={phaserRef} currentActiveScene={() => {}} />

                {(uiState === 'playing' || uiState === 'preparing' || uiState === 'paused') && (
                    <Toolbar availableMachines={availableMachines} onHelp={() => setShowHelp(true)} />
                )}

                {showHelp && <HowToPlay onClose={() => setShowHelp(false)} />}

                {uiState === 'paused' && (
                    <PauseMenu
                        onResume={handleResume}
                        onReplay={handleReplay}
                        onMenu={handleMenu}
                    />
                )}

                {uiState === 'preparing' && (
                    <PrepBanner levelName={currentLevel.name} onStartDay={handleStartDay} />
                )}

                {uiState === 'intro' && (
                    <LevelIntro level={currentLevel} onStart={handleStartLevel} />
                )}

                {uiState === 'summary' && (
                    <LevelSummary
                        levelName={currentLevel.name}
                        score={stats.score}
                        ordersServed={summaryData.ordersServed}
                        ordersFailed={summaryData.ordersFailed}
                        totalOrders={currentLevel.clientCount}
                        isLastLevel={currentLevelIndex >= LEVELS.length - 1}
                        onNextLevel={handleNextLevel}
                        onReplay={handleReplay}
                        onMenu={handleMenu}
                    />
                )}
            </div>
        </div>
    );
}

export default App;
