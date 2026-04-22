import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class GameOver extends Scene
{
    constructor ()
    {
        super('GameOver');
    }

    create ()
    {
        const { width } = this.scale;
        const cx = width / 2;

        this.add.text(cx, 200, '😢', { fontSize: '80px' }).setOrigin(0.5);

        this.add.text(cx, 300, 'Game Over', {
            fontFamily: 'Arial Black', fontSize: 52, color: '#FF5722',
            stroke: '#1A0F0A', strokeThickness: 8,
        }).setOrigin(0.5);

        this.add.text(cx, 370, 'Trop de commandes ratées...', {
            fontFamily: 'Arial', fontSize: 22, color: '#A0856E',
        }).setOrigin(0.5);

        // Score display (filled by EventBus data)
        const finalScore = parseInt(localStorage.getItem('coffee_last_score') ?? '0', 10);
        this.add.text(cx, 430, `Score final : ${finalScore}`, {
            fontFamily: 'Arial Black', fontSize: 28, color: '#FFD700',
        }).setOrigin(0.5);

        // Retry button
        const retry = this.add.text(cx - 120, 520, '🔄  Rejouer', {
            fontFamily: 'Arial Black', fontSize: 22, color: '#FFFFFF',
            backgroundColor: '#D2691E', padding: { x: 20, y: 12 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        retry.on('pointerover', () => retry.setStyle({ backgroundColor: '#A0522D' }));
        retry.on('pointerout', () => retry.setStyle({ backgroundColor: '#D2691E' }));
        retry.on('pointerdown', () => {
            this.scene.start('Game', { autoStart: true });
        });

        // Main menu button
        const menu = this.add.text(cx + 120, 520, '🏠  Menu', {
            fontFamily: 'Arial Black', fontSize: 22, color: '#FFFFFF',
            backgroundColor: '#555555', padding: { x: 20, y: 12 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        menu.on('pointerover', () => menu.setStyle({ backgroundColor: '#333333' }));
        menu.on('pointerout', () => menu.setStyle({ backgroundColor: '#555555' }));
        menu.on('pointerdown', () => {
            EventBus.emit('go-to-menu');
            this.scene.start('MainMenu');
        });

        EventBus.emit('current-scene-ready', this);
    }
}
