import { GameObjects, Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class MainMenu extends Scene
{
    background: GameObjects.Rectangle;
    title: GameObjects.Text;
    subtitle: GameObjects.Text;
    startButton: GameObjects.Text;
    bestScoreText: GameObjects.Text;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        const { width } = this.scale;
        const cx = width / 2;

        // Background
        this.cameras.main.setBackgroundColor(0x2C1810);

        // Decorative top bar
        const bar = this.add.rectangle(cx, 0, width, 8, 0xD2691E).setOrigin(0.5, 0);
        bar;

        // Title
        this.add.text(cx, 160, '☕', { fontSize: '80px' }).setOrigin(0.5);

        this.title = this.add.text(cx, 270, 'Coffee Factory', {
            fontFamily: 'Arial Black', fontSize: 52, color: '#D2691E',
            stroke: '#1A0F0A', strokeThickness: 8,
        }).setOrigin(0.5);

        this.subtitle = this.add.text(cx, 340, 'Build your perfect coffee chain!', {
            fontFamily: 'Arial', fontSize: 20, color: '#A0856E',
        }).setOrigin(0.5);

        // Best score
        const best = parseInt(localStorage.getItem('coffee_best_score') ?? '0', 10);
        this.bestScoreText = this.add.text(cx, 400, best > 0 ? `🏆 Meilleur score : ${best}` : '', {
            fontFamily: 'Arial', fontSize: 18, color: '#FFD700',
        }).setOrigin(0.5);

        // Start button
        this.startButton = this.add.text(cx, 500, '▶  JOUER', {
            fontFamily: 'Arial Black', fontSize: 32, color: '#FFFFFF',
            stroke: '#D2691E', strokeThickness: 4,
            backgroundColor: '#D2691E',
            padding: { x: 32, y: 14 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.startButton.on('pointerover', () => this.startButton.setStyle({ backgroundColor: '#A0522D' }));
        this.startButton.on('pointerout', () => this.startButton.setStyle({ backgroundColor: '#D2691E' }));
        this.startButton.on('pointerdown', () => this.changeScene());

        // Decorative steam particles (simple tweens)
        this.addSteamEffect(cx - 60, 230);
        this.addSteamEffect(cx, 220);
        this.addSteamEffect(cx + 60, 230);

        EventBus.emit('current-scene-ready', this);
    }

    private addSteamEffect(x: number, y: number): void
    {
        const steam = this.add.text(x, y, '~', {
            fontSize: '24px', color: '#FFFFFF', alpha: 0
        } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5);

        this.tweens.add({
            targets: steam,
            y: y - 40,
            alpha: { from: 0.5, to: 0 },
            duration: 1500 + Math.random() * 800,
            delay: Math.random() * 1000,
            repeat: -1,
            ease: 'Sine.easeOut',
        });
    }

    changeScene ()
    {
        EventBus.emit('start-game');
        this.scene.start('Game');
    }
}
