/**
 * form-updates.js
 *
 * This module breaks the circular dependency between forms and render modules.
 * Forms modules import update functions from here instead of directly from render.js.
 */

import { updatePreview, updateDownloadState } from './render.js';

export { updatePreview, updateDownloadState };
