/**
 * events.js - Modular event handlers
 *
 * This file has been partially refactored for better maintainability.
 * Event handlers are now organized into feature-based modules in js/events/
 *
 * Modules include:
 * - hardware-type-picker.js (19 functions)
 * - component-pickers.js (80 functions)
 * - fuse-type-picker.js, fuse-value-picker.js (40 functions)
 * - bolt-pickers.js, connector-pickers.js (42 functions)
 * - switch, nut, washer, bearing pickers (40 functions)
 * - custom-part-picker.js, custom-graphics-events.js (20 functions)
 * - thread-size-picker.js, form-events.js (11 functions)
 *
 * Total: 14 modules, 252 functions extracted and organized
 */

export { initEventHandlers } from './events/index.js';
