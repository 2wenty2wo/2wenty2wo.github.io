// src/objects/NpcCar.js
// Simple non-player car with autonomous movement.
import { GAME_CONFIG } from '../config.js';

export class NpcCar extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey) {
    super(scene, x, y, textureKey);

    scene.add.existing(this);
    this.setScale(0.3);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.5);
    this.setDamping(true);
    this.setMaxVelocity(GAME_CONFIG.car.maxSpeed);
    this.body.setAllowGravity(false);
    this.body.setCollideWorldBounds(false);

    // autonomous params
    this.speed = GAME_CONFIG.car.maxSpeed * 0.3;
    this._turnTimer = 0;
    this._nextTurn = Phaser.Math.FloatBetween(2, 5);
  }

  update(dt) {
    // maintain forward velocity
    const forward = this.rotation + Math.PI / 2;
    const vel = this.scene.physics.velocityFromRotation(forward, this.speed);
    this.body.setVelocity(vel.x, vel.y);

    // periodically random heading change
    this._turnTimer += dt;
    if (this._turnTimer >= this._nextTurn) {
      this._turnTimer = 0;
      this._nextTurn = Phaser.Math.FloatBetween(2, 5);
      const delta = Phaser.Math.FloatBetween(-Math.PI / 2, Math.PI / 2);
      this.rotation += delta;
    }

    // wrap around world bounds
    const bounds = this.scene.physics.world.bounds;
    if (this.x < bounds.x) {
      this.x = bounds.right;
    } else if (this.x > bounds.right) {
      this.x = bounds.x;
    }
    if (this.y < bounds.y) {
      this.y = bounds.bottom;
    } else if (this.y > bounds.bottom) {
      this.y = bounds.y;
    }
  }
}

