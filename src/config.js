// src/config.js
// Centralized config so we can tweak physics & UI easily.
export const GAME_CONFIG = {
  world: {
    width: 4000,        // World size in pixels (large enough for camera follow on ultrawide)
    height: 3000
  },
  car: {
    // "Realistic‑ish" top-down car physics model (arcade but grounded)
    maxSpeed: 800,      // px/s
    accel: 900,         // px/s^2
    reverseAccel: 600,  // px/s^2
    drag: 0.98,         // per second (applied every frame)
    brakeStrength: 1600,// px/s^2
    turnRate: 2.8,      // radians/sec at full steer, scales with speed
    grip: 0.06,         // how quickly velocity aligns to heading (lateral friction)
    handbrakeSlip: 0.3  // extra slip when holding Space or the brake button
  },
  mobile: {
    showControls: true
  }
};
