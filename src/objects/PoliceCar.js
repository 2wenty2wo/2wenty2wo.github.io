// src/objects/PoliceCar.js
// A self-contained arcade car with manual physics integration and siren/lights logic.
import { GAME_CONFIG } from '../config.js';

export class PoliceCar extends Phaser.GameObjects.Container {
  /** @param {Phaser.Scene} scene */
  constructor(scene, x, y) {
    super(scene, x, y);

    this.sprite = scene.add.sprite(0, 0, 'police-off').setOrigin(0.5, 0.5);
    this.add(this.sprite);

    // Physics state (manual, not using Arcade bodies so we can control rotation/slide)
    this.heading = -Math.PI / 2; // face 'up'
    this.speed = 0;
    this.vel = new Phaser.Math.Vector2();

    // Controls
    this.inputs = { throttle: 0, steer: 0, brake: 0, handbrake: 0 };

    // Lights & siren
    this.lightsOn = false;
    this.sirenOn = false;
    this._lightTimer = 0;
    this._lightPhase = 0; // 0 = blue, 1 = red

    // Enable Lights2D and create light objects
    scene.lights.enable().setAmbientColor(0x555555);
    this.sprite.setPipeline('Light2D');

    const hlRadius = 180;
    this.headlights = [
      scene.lights.addLight(x, y, hlRadius, 0xffffff, 0),
      scene.lights.addLight(x, y, hlRadius, 0xffffff, 0)
    ];

    const sirenRadius = 120;
    this.sirenLights = [
      scene.lights.addLight(x, y, sirenRadius, 0x0066ff, 0), // blue
      scene.lights.addLight(x, y, sirenRadius, 0xff0000, 0)  // red
    ];

    // Make the sprite a bit smaller so car feels in scale
    this.sprite.setScale(0.6);

    scene.add.existing(this);
  }

  toggleLights(forceState = null) {
    this.lightsOn = forceState === null ? !this.lightsOn : !!forceState;
    if (this.lightsOn) {
      this.headlights.forEach(l => l.setIntensity(1));
    } else {
      this.sprite.setTexture('police-off');
      this.headlights.forEach(l => l.setIntensity(0));
      this.sirenLights.forEach(l => l.setIntensity(0));
    }
  }

  toggleSiren(forceState = null) {
    const prev = this.sirenOn;
    this.sirenOn = forceState === null ? !this.sirenOn : !!forceState;
    if (this.sirenOn && !prev) {
      this.scene.sound.stopByKey('siren');
      const s = this.scene.sound.add('siren', { loop: true, volume: 0.35 });
      s.play();
    } else if (!this.sirenOn && prev) {
      this.scene.sound.stopByKey('siren');
    }
  }

  setInputs({ throttle, steer, brake, handbrake }) {
    this.inputs.throttle = throttle;
    this.inputs.steer = steer;
    this.inputs.brake = brake;
    this.inputs.handbrake = handbrake;
  }

  update(dt) {
    const cfg = GAME_CONFIG.car;
    const t = this.inputs.throttle;
    const s = this.inputs.steer;
    const braking = this.inputs.brake > 0;

    // Longitudinal dynamics
    const forwardAccel = (t > 0 ? cfg.accel : (t < 0 ? -cfg.reverseAccel : 0));
    this.speed += forwardAccel * dt;

    // Braking / handbrake
    if (braking) {
      // Stronger decel when moving
      const sign = Math.sign(this.speed);
      this.speed -= sign * cfg.brakeStrength * dt;
      if (Math.sign(this.speed) != sign) this.speed = 0;
    }

    // Drag
    this.speed *= Math.pow(cfg.drag, dt);

    // Steering (scale with speed so it feels natural)
    const steerStrength = cfg.turnRate * (Phaser.Math.Clamp(Math.abs(this.speed) / cfg.maxSpeed, 0, 1));
    this.heading += s * steerStrength * dt;

    // Velocity aligns to heading with some lateral slip (grip)
    const desiredVel = new Phaser.Math.Vector2(Math.cos(this.heading), Math.sin(this.heading)).scale(this.speed);
    const lerp = cfg.grip + (this.inputs.handbrake ? cfg.handbrakeSlip : 0);
    this.vel.lerp(desiredVel, Phaser.Math.Clamp(lerp, 0, 1));

    // Position integrate
    this.x += this.vel.x * dt;
    this.y += this.vel.y * dt;

    // Clamp absolute max speed
    const spd = this.vel.length();
    if (spd > cfg.maxSpeed) {
      this.vel.scale(cfg.maxSpeed / spd);
      this.speed = Phaser.Math.Clamp(this.speed, -cfg.maxSpeed, cfg.maxSpeed);
    }

    // Apply rotation
    this.sprite.rotation = this.heading + Math.PI/2; // sprite points 'up'

    // Update light positions relative to car
    const cos = Math.cos(this.heading);
    const sin = Math.sin(this.heading);
    const frontOffset = 40;
    const sideOffset = 15;
    const hx = this.x + cos * frontOffset;
    const hy = this.y + sin * frontOffset;
    this.headlights[0].setPosition(hx - sin * sideOffset, hy + cos * sideOffset);
    this.headlights[1].setPosition(hx + sin * sideOffset, hy - cos * sideOffset);
    this.sirenLights[0].setPosition(this.x - sin * sideOffset, this.y + cos * sideOffset);
    this.sirenLights[1].setPosition(this.x + sin * sideOffset, this.y - cos * sideOffset);

    // Lights animation
    if (this.lightsOn) {
      this._lightTimer += dt;
      if (this._lightTimer >= 0.18) { // 180ms flash cadence
        this._lightTimer = 0;
        this._lightPhase = 1 - this._lightPhase;
      }
      if (this._lightPhase === 0) {
        this.sprite.setTexture('police-blue');
        this.sirenLights[0].setIntensity(1);
        this.sirenLights[1].setIntensity(0);
      } else {
        this.sprite.setTexture('police-red');
        this.sirenLights[0].setIntensity(0);
        this.sirenLights[1].setIntensity(1);
      }
    } else {
      this.sprite.setTexture('police-off');
      this.sirenLights.forEach(l => l.setIntensity(0));
    }
  }
}
