// src/scenes/UIScene.js
// Minimal on-screen controls for mobile + quick button for lights.
import { GAME_CONFIG } from '../config.js';
import { MUSIC_TRACKS } from '../music.js';

export class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  create() {
    const show = GAME_CONFIG.mobile.showControls;
    this.inputs = { throttle:0, steer:0, brake:0, handbrake:0 };

    const camHeight = this.cameras.main.height;
    this.speedUnit = 'mph';

    const toggleUnit = () => {
      this.speedUnit = this.speedUnit === 'mph' ? 'kph' : 'mph';
    };

    this.speedValueText = this.add.text(20, camHeight - 20, '0', {
      fontFamily: 'Arial',
      fontSize: '96px',
      fontStyle: 'italic',
      color: '#ffffff',
    })
      .setOrigin(0, 1)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', toggleUnit);

    this.speedUnitText = this.add.text(this.speedValueText.x + this.speedValueText.displayWidth + 10, camHeight - 20, 'mph', {
      fontFamily: 'Arial',
      fontSize: '32px',
      fontStyle: 'italic',
      color: '#ffffff',
    })
      .setOrigin(0, 1)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', toggleUnit);

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

    // Simple music player (bottom-right)
    const playlist = MUSIC_TRACKS.map(t => t.key);
    this.musicIndex = 0;
    let currentTrack;
    let playBtn;
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const bottom = height - 40;

    const trackText = this.add.text(width - 40, bottom - 40, '', { fontSize: 14, color: '#ffffff' })
      .setOrigin(1, 1)
      .setScrollFactor(0);

    const updateLabel = () => {
      trackText.setText(playlist[this.musicIndex]);
    };

    const playCurrent = () => {
      if (currentTrack) currentTrack.stop();
      const key = playlist[this.musicIndex];
      currentTrack = this.sound.add(key);
      currentTrack.play();
      currentTrack.once('complete', nextTrack);
      playBtn.setText('⏸');
      updateLabel();
    };

    const togglePlay = () => {
      if (!currentTrack) {
        playCurrent();
      } else if (currentTrack.isPlaying) {
        currentTrack.pause();
        playBtn.setText('▶');
      } else {
        currentTrack.resume();
        playBtn.setText('⏸');
      }
    };

    const nextTrack = () => {
      this.musicIndex = (this.musicIndex + 1) % playlist.length;
      playCurrent();
    };

    playBtn = makeBtn('▶', width - 100, bottom, togglePlay);
    makeBtn('⏭', width - 40, bottom, nextTrack);
    updateLabel();
    playCurrent();

    // Bridge to GameScene to call methods on the car
    const game = this.scene.get('Game');
    this.events.on('toggleLights', () => game.car.toggleLights());
  }

  update() {
    const speedPx = this.registry.get('carSpeed') || 0;
    const factor = this.speedUnit === 'mph' ? 0.1 : 0.16;
    const speed = Math.floor(speedPx * factor);
    this.speedValueText.setText(`${speed}`);
    this.speedUnitText.setText(this.speedUnit);
    this.speedUnitText.x = this.speedValueText.x + this.speedValueText.displayWidth + 10;
    this.speedUnitText.y = this.speedValueText.y;
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
