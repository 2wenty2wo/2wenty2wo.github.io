// src/scenes/GameScene.js
// Renders a simple city, spawns the car, handles input, and updates physics.
import { GAME_CONFIG } from '../config.js';
import { PoliceCar } from '../objects/PoliceCar.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    const tileSize = 64;
    const cols = Math.ceil(GAME_CONFIG.world.width / tileSize);
    const rows = Math.ceil(GAME_CONFIG.world.height / tileSize);

    // Build a simple layout: 0 = grass, 1 = road
    const layout = Array.from({ length: rows }, () => Array(cols).fill(0));
    // Horizontal roads
    [5, 15, 23, 35].forEach(r => {
      if (r < rows) layout[r].fill(1);
    });
    // Vertical roads
    [10, 30, 50].forEach(c => {
      if (c < cols) {
        for (let r = 0; r < rows; r++) layout[r][c] = 1;
      }
    });

    const map = this.make.tilemap({ data: layout, tileWidth: tileSize, tileHeight: tileSize });
    const grassTiles = map.addTilesetImage('grass');
    const roadTiles = map.addTilesetImage('road');
    const layer = map.createLayer(0, [grassTiles, roadTiles], 0, 0);
    layer.setCollision(0); // grass is collidable
    this.map = map;
    this.mapLayer = layer;

    // Physics world bounds
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // Create the car at an intersection
    this.car = new PoliceCar(this, tileSize * 12, tileSize * 6);
    this.car.setCollideWorldBounds(true);
    this.physics.add.collider(this.car, this.mapLayer);

    // Camera follow
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.car, true, 0.12, 0.12);
    this.cameras.main.setZoom(1); // tweaked automatically by Resize handler

    // Background music
    if (this.cache.audio.exists('bgm')) {
      this.bgm = this.sound.add('bgm', { loop: true, volume: 0.5 });
      this.bgm.play();
      this.events.once('shutdown', () => this.bgm.stop());
    } else if (window.MIDIjs) {
      window.MIDIjs.play('assets/AUD_AP0356.mid');
      this.events.once('shutdown', () => window.MIDIjs.stop());
    }

    // Inputs
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up2: Phaser.Input.Keyboard.KeyCodes.UP,
      down2: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left2: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right2: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      L: Phaser.Input.Keyboard.KeyCodes.L
    });

    this.keys.L.on('down', () => this.car.toggleLights());

    // Listen to UI scene for virtual controls
    this.registry.set('mobileInputs', { throttle:0, steer:0, brake:0, handbrake:0 });

    // Resize fit for ultrawide / iPhone
    this.scale.on('resize', this.handleResize, this);
    this.handleResize({ width: this.scale.gameSize.width, height: this.scale.gameSize.height });
  }

  handleResize(gameSize) {
    const { width, height } = gameSize;
    // Adjust zoom so car is readable across devices
    const target = Math.min(width / 1100, height / 700);
    this.cameras.main.setZoom(Phaser.Math.Clamp(target, 0.6, 1.6));
  }

  update(time, delta) {
    const dt = delta / 1000;

    // Combine desktop keys + mobile inputs
    const m = this.registry.get('mobileInputs') || { throttle:0, steer:0, brake:0, handbrake:0 };
    const throttle = (this.keys.up.isDown || this.keys.up2.isDown ? 1 : 0) + (m.throttle > 0 ? m.throttle : 0);
    const reverse  = (this.keys.down.isDown || this.keys.down2.isDown ? 1 : 0);
    const steerLeft = (this.keys.left.isDown || this.keys.left2.isDown ? 1 : 0);
    const steerRight = (this.keys.right.isDown || this.keys.right2.isDown ? 1 : 0);

    const steer = (steerRight - steerLeft) + m.steer;
    const brake = (reverse > 0 ? 1 : 0) + (m.brake || 0);
    const handbrake = (this.keys.space.isDown ? 1 : 0) + (m.handbrake || 0);

    this.car.setInputs({
      throttle: throttle - reverse, // forward positive, reverse negative
      steer: Phaser.Math.Clamp(steer, -1, 1),
      brake: brake > 0 ? 1 : 0,
      handbrake: handbrake > 0 ? 1 : 0
    });

    this.car.update(dt);

    // Store current speed for the UI scene
    this.registry.set('carSpeed', this.car.body.speed);
  }
}
