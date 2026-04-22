import { Scene } from 'phaser';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        // No boot assets needed - game uses procedural graphics
    }

    create ()
    {
        this.scene.start('Preloader');
    }
}
