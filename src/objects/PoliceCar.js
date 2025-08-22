// src/objects/PoliceCar.js
// A police car using Arcade physics with siren and light effects.
import { GAME_CONFIG } from '../config.js';

export class PoliceCar extends Phaser.Physics.Arcade.Sprite {
  /** @param {Phaser.Scene} scene */
  constructor(scene, x, y) {
    super(scene, x, y, 'police-off');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Start facing 'up'
    this.setRotation(0);
    this.setOrigin(0.5, 0.5);
    this.setScale(0.3);
    this.setDamping(true);
    this.setDrag(600);
    this.setMaxVelocity(GAME_CONFIG.car.maxSpeed);

    // Controls
    this.inputs = { throttle: 0, steer: 0, brake: 0, handbrake: 0 };

    // Lights & siren
    this.lightsOn = false;
    this.sirenOn = false; // tracks audio state
    this._lightTimer = 0;
    this._lightPhase = 0; // 0 = blue, 1 = red

    // Enable Lights2D and create light objects
    scene.lights.enable().setAmbientColor(0x555555);
    this.setPipeline('Light2D');

    const hlRadius = 90;      // was 180
    this.headlights = [
      scene.lights.addLight(x, y, hlRadius, 0xffffff, 0),
      scene.lights.addLight(x, y, hlRadius, 0xffffff, 0)
    ];

    const sirenRadius = 60;   // was 120
    this.sirenLights = [
      scene.lights.addLight(x, y, sirenRadius, 0x0066ff, 0), // blue
      scene.lights.addLight(x, y, sirenRadius, 0xff0000, 0)  // red
    ];
  }

  toggleLights(forceState = null) {
    this.lightsOn = forceState === null ? !this.lightsOn : !!forceState;
    if (this.lightsOn) {
      this.headlights.forEach(l => l.setIntensity(1));
      this._setSiren(true);
    } else {
      this.setTexture('police-off');
      this.headlights.forEach(l => l.setIntensity(0));
      this.sirenLights.forEach(l => l.setIntensity(0));
      this._setSiren(false);
    }
  }

  _setSiren(on) {
    const prev = this.sirenOn;
    this.sirenOn = !!on;
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
    const braking = this.inputs.brake > 0 || this.inputs.handbrake > 0;

    // Acceleration along current heading
    const forward = this.rotation + Math.PI / 2; // sprite points 'up'
    const forwardAccel = (t > 0 ? cfg.accel : (t < 0 ? -cfg.reverseAccel : 0));

    if (forwardAccel !== 0) {
      const vec = this.scene.physics.velocityFromRotation(forward, forwardAccel);
      this.body.setAcceleration(vec.x, vec.y);
    } else {
      this.body.setAcceleration(0, 0);
    }

    // Drag / braking
    if (braking) {
      this.setDrag(cfg.brakeStrength);
    } else {
      this.setDrag(600);
    }

    // Steering (scale with speed)
    const steerStrength = cfg.turnRate * Phaser.Math.Clamp(this.body.speed / cfg.maxSpeed, 0, 1);
    this.setAngularVelocity(Phaser.Math.RadToDeg(s * steerStrength));

    // Update light positions relative to car
    const cos = Math.cos(forward);
    const sin = Math.sin(forward);
    const frontOffset = 20;   // was 40
    const sideOffset = 7.5;   // was 15
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
        this.setTexture('police-blue');
        this.sirenLights[0].setIntensity(1);
        this.sirenLights[1].setIntensity(0);
      } else {
        this.setTexture('police-red');
        this.sirenLights[0].setIntensity(0);
        this.sirenLights[1].setIntensity(1);
      }
    } else {
      this.setTexture('police-off');
      this.sirenLights.forEach(l => l.setIntensity(0));
    }
  }
}
