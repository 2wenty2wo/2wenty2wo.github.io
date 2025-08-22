// src/main.js
// Game bootstrap + scenes registration.
// We delay game creation until the user hits the Start button (so audio can play).
import { GAME_CONFIG } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';

function createGame() {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#0b0b0b',
    scale: {
      mode: Phaser.Scale.RESIZE, // fill parent; good for ultrawide + phones
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: { pixelArt: false, antialias: true },
    physics: { default: 'arcade' },
    audio: { disableWebAudio: false },
    plugins: {
      scene: [{ key: 'LightsPlugin', plugin: Phaser.Plugins.LightsPlugin, mapping: 'lights' }]
    },
    scene: [BootScene, GameScene, UIScene]
  });
}

window.__GAME_START__ = () => {
  // Only create once
  if (!window.__game) window.__game = createGame();
};
