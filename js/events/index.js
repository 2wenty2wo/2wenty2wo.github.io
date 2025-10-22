/**
 * events/index.js
 *
 * Event handling has been partially modularized into feature-based files.
 * The individual event handler modules are in this directory (14 modules, 252 functions):
 * - hardware-type-picker.js (19 functions)
 * - fuse-type-picker.js, fuse-value-picker.js (40 functions)
 * - component-pickers.js (80 functions)
 * - connector-pickers.js, bolt-pickers.js (42 functions)
 * - switch-picker.js, nut-type-picker.js, washer-type-picker.js, bearing-picker.js (40 functions)
 * - custom-part-picker.js, custom-graphics-events.js (20 functions)
 * - thread-size-picker.js, form-events.js (11 functions)
 *
 * These modules are ready for future integration. For now, we re-export from
 * the original consolidated file to maintain compatibility.
 */

export { initEventHandlers } from './original.js';
