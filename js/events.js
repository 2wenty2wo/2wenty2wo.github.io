/**
 * Event Handlers
 *
 * This module has been split into smaller, manageable modules in the js/events/ directory.
 * See js/events/ for the individual modules:
 * - hardware-type-picker.js - Complex hardware type picker dialog
 * - fuse-pickers.js - Fuse type, value, glass speed, glass size, thread size pickers
 * - component-pickers.js - Electronic component pickers
 * - fastener-pickers.js - Bolt, nut, washer pickers
 * - connector-pickers.js - Connector and switch pickers
 * - custom-pickers.js - Custom icon and part pickers
 * - document-handlers.js - Document-level event handlers
 * - init.js - Event handler initialization
 * - index.js - Barrel export
 */

export { initEventHandlers } from './events/index.js';
