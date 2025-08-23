// src/scenes/BootScene.js
// Preloads assets and hands off to the main game.
import { MUSIC_TRACKS } from '../music.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    // Images
    this.load.image('police-off', 'assets/police-off.png');
    this.load.image('police-blue', 'assets/police-blue.png');
    this.load.image('police-red', 'assets/police-red.png');
    this.load.image('taxi', 'assets/taxi.png');
    this.load.image('gti', 'assets/gti.png');
    this.load.image('road', 'assets/road.jpg');

    // Audio (optional for local file usage; only starts after user gesture)
    this.load.audio('siren', ['assets/audio/siren.mp3']);
    MUSIC_TRACKS.forEach(t => this.load.audio(t.key, [t.file]));
  }
  create() {
    this.scene.start('Game');
    this.scene.launch('UI');
  }
}
