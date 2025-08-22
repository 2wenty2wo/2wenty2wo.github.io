// src/scenes/GameScene.js
// Renders a simple city, spawns the car, handles input, and updates physics.
import { GAME_CONFIG } from '../config.js';
import { PoliceCar } from '../objects/PoliceCar.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    const { width, height } = GAME_CONFIG.world;

    // Create a big render texture to draw a simple city roads
    const rt = this.make.renderTexture({ x: 0, y: 0, width, height, add: false });
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Background (grass/concrete)
    g.fillStyle(0x2a2f2a, 1); // dark green
    g.fillRect(0, 0, width, height);

    // Helper to draw a road strip with lane lines
    const drawRoad = (x, y, w, h) => {
      const asphalt = 0x303030;
      const shoulder = 0x1f1f1f;
      g.fillStyle(shoulder, 1);
      g.fillRect(x - 6, y - 6, w + 12, h + 12);
      g.fillStyle(asphalt, 1);
      g.fillRect(x, y, w, h);
      // Center dashed line
      g.lineStyle(4, 0xdddd66, 1);
      const isHorizontal = h < w;
      const length = isHorizontal ? w : h;
      const dash = 40, gap = 30;
      for (let i = 20; i < length; i += dash + gap) {
        if (isHorizontal) g.lineBetween(x + i, y + h/2, x + i + dash, y + h/2);
        else g.lineBetween(x + w/2, y + i, x + w/2, y + i + dash);
      }
    };

    // A small handmade network (not a perfect grid) — starter city feel
    const R = 180; // road width
    drawRoad(200, 400, width - 400, R);          // top avenue
    drawRoad(300, 1000, width - 1000, R);        // mid avenue
    drawRoad(600, 1600, width - 900, R);         // lower avenue
    drawRoad(200, 2300, width - 400, R);         // bottom avenue

    drawRoad(600, 200, R, height - 400);         // left spine
    drawRoad(1600, 300, R, height - 600);        // central spine
    drawRoad(2800, 600, R, height - 1000);       // right spine

    // A couple of diagonals for variety
    g.lineStyle(R, 0x303030, 1);
    g.strokePath();
    g.beginPath();
    g.moveTo(600, 1600); g.lineTo(1600, 1000); g.lineTo(width - 600, 1400);
    g.strokePath();

    rt.draw(g);
    this.add.image(0, 0, rt.texture.key, rt.frame.name).setOrigin(0);

    // Create the car
    this.car = new PoliceCar(this, 700, 1200);

    // Camera follow
    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.startFollow(this.car, true, 0.12, 0.12);
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
      L: Phaser.Input.Keyboard.KeyCodes.L,
      H: Phaser.Input.Keyboard.KeyCodes.H
    });

    this.keys.L.on('down', () => this.car.toggleLights());
    this.keys.H.on('down', () => this.car.toggleSiren());

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

    // Keep the car in-bounds of the world
    const w = GAME_CONFIG.world.width, h = GAME_CONFIG.world.height;
    this.car.x = Phaser.Math.Clamp(this.car.x, 40, w-40);
    this.car.y = Phaser.Math.Clamp(this.car.y, 40, h-40);
  }
}
