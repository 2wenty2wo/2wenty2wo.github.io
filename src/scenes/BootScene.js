// src/scenes/BootScene.js
// Preloads assets and hands off to the main game.
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    // Images
    this.load.image('police-off', 'assets/police-off.png');
    this.load.image('police-blue', 'assets/police-blue.png');
    this.load.image('police-red', 'assets/police-red.png');
    this.load.image('grass', 'assets/grass.jpg');
    this.load.image('road', 'assets/road.jpg');

    // Tilemap data
    this.load.json('roads_tileset', 'assets/roads_tileset.json');

    // Audio (optional for local file usage; only starts after user gesture)
    this.load.audio('siren', ['assets/audio/siren.mp3']);
    this.load.audio('bgm', ['assets/AUD_AP0356.mp3']);
  }
  create() {
    this.scene.start('Game');
    this.scene.launch('UI');
  }
}
