// src/scenes/GameScene.js
// Renders a simple city, spawns the car, handles input, and updates physics.
import { GAME_CONFIG } from '../config.js';
import { PoliceCar } from '../objects/PoliceCar.js';
import { NpcCar } from '../objects/NpcCar.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    // Background road tiles
    this.bg = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'road')
      .setOrigin(0)
      .setScrollFactor(0);

    // Create the car at a seed-based road intersection
    const tileSize = 64;
    const sx = ((10 - GAME_CONFIG.world.seed + 20) % 20) * tileSize + tileSize / 2;
    const sy = ((5  - GAME_CONFIG.world.seed + 20) % 20) * tileSize + tileSize / 2;
    this.car = new PoliceCar(this, sx, sy);
    this.car.setDepth(1);
    // Allow the car to leave the world bounds without collision
    this.car.body.setCollideWorldBounds(false);

    // NPC cars
    this.npcCars = [];
    this.npcCars.push(new NpcCar(this, sx + 200, sy, 'taxi'));
    this.npcCars.push(new NpcCar(this, sx - 200, sy, 'gti'));
    for (const car of this.npcCars) {
      car.setDepth(1);
      car.body.setCollideWorldBounds(false);
    }

    // Camera follow with very large bounds
    const bound = 1e6;
    this.cameras.main.setBounds(-bound, -bound, bound * 2, bound * 2);
    this.physics.world.setBounds(-bound, -bound, bound * 2, bound * 2);
    this.cameras.main.startFollow(this.car, true, 1, 1);
    this.cameras.main.centerOn(this.car.x, this.car.y);
    this.cameras.main.setZoom(1); // tweaked automatically by Resize handler

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
    const forward = (this.keys.up.isDown || this.keys.up2.isDown ? 1 : 0);
    const back = (this.keys.down.isDown || this.keys.down2.isDown ? 1 : 0);
    const steerLeft = (this.keys.left.isDown || this.keys.left2.isDown ? 1 : 0);
    const steerRight = (this.keys.right.isDown || this.keys.right2.isDown ? 1 : 0);

    const steer = (steerRight - steerLeft) + m.steer;
    const handbrake = (this.keys.space.isDown ? 1 : 0) + (m.handbrake || 0);

    const speedThreshold = 10;
    let throttle = forward + (m.throttle > 0 ? m.throttle : 0);
    let brake = (m.brake || 0);

    if (back) {
      if (this.car.body.speed > speedThreshold) {
        brake += 1;
      } else {
        throttle -= 1;
      }
    }

    this.car.setInputs({
      throttle,
      steer: Phaser.Math.Clamp(steer, -1, 1),
      brake: brake > 0 ? 1 : 0,
      handbrake: handbrake > 0 ? 1 : 0
    });

    this.car.update(dt);
    for (const car of this.npcCars) {
      car.update(dt);
    }

    // Scroll background with camera
    this.bg.tilePositionX = this.cameras.main.scrollX;
    this.bg.tilePositionY = this.cameras.main.scrollY;

    // Store current speed for the UI scene
    this.registry.set('carSpeed', this.car.body.speed);
  }
}
