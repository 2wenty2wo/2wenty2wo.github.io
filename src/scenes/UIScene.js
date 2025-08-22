// src/scenes/UIScene.js
// Minimal on-screen controls for mobile + quick button for lights.
import { GAME_CONFIG } from '../config.js';

export class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  create() {
    const show = GAME_CONFIG.mobile.showControls;
    this.inputs = { throttle:0, steer:0, brake:0, handbrake:0 };

    // Virtual controls only on touch devices (or when explicitly enabled)
    const isTouch = this.sys.game.device.input.touch;
    if (show && isTouch) {
      this.createButtons();
    }

    // Toggle button for lights (also visible on desktop for convenience)
    const makeBtn = (label, x, y, cb) => {
      const btn = this.add.text(x, y, label, { fontSize: 18, fontFamily: 'system-ui, -apple-system, sans-serif', padding:{x:10,y:6}, backgroundColor: '#222', color:'#fff' })
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true })
        .setDepth(10);
      btn.setOrigin(0.5);
      btn.on('pointerdown', cb);
      return btn;
    };
    this.lightBtn = makeBtn('Lights (L)', 120, 40, () => this.events.emit('toggleLights'));

    // Bridge to GameScene to call methods on the car
    const game = this.scene.get('Game');
    this.events.on('toggleLights', () => game.car.toggleLights());
  }

  createButtons() {
    const W = this.scale.width, H = this.scale.height;

    const circle = (x, y, r, label) => {
      const g = this.add.graphics().setScrollFactor(0).setDepth(9);
      g.fillStyle(0x000000, 0.28).fillCircle(x, y, r).lineStyle(2, 0xffffff, 0.25).strokeCircle(x, y, r);
      const t = this.add.text(x, y, label, { fontSize: 18, color:'#fff' }).setOrigin(0.5).setScrollFactor(0).setDepth(10);
      const zone = this.add.zone(x, y, r*2, r*2).setOrigin(0.5).setScrollFactor(0).setInteractive();
      return { g, t, zone, x, y, r };
    };

    const left = circle(110, H-110, 70, '◀');
    const right = circle(230, H-110, 70, '▶');
    const accel = circle(W-110, H-160, 80, '▲');
    const brake = circle(W-110, H-60, 60, '■');

    const press = (target, on, off) => {
      target.on('pointerdown', () => { on(); target.setData('down', true); });
      target.on('pointerup', () => { off(); target.setData('down', false); });
      target.on('pointerout', () => { if (target.getData('down')) { off(); target.setData('down', false);} });
      target.on('pointercancel', () => { off(); target.setData('down', false); });
    };

    press(left.zone, () => this.inputs.steer = -1, () => this.inputs.steer = (this.inputs.steer>0?1:0));
    press(right.zone, () => this.inputs.steer = 1, () => this.inputs.steer = (this.inputs.steer<0?-1:0));
    press(accel.zone, () => this.inputs.throttle = 1, () => this.inputs.throttle = 0);
    press(brake.zone, () => { this.inputs.brake = 1; this.inputs.handbrake = 1; }, () => { this.inputs.brake = 0; this.inputs.handbrake = 0; });

    this.time.addEvent({ delay: 33, loop: true, callback: () => {
      this.registry.set('mobileInputs', this.inputs);
    }});
  }
}
