import { state } from './state.js';
import { elements } from './dom-elements.js';
import { initTheme } from './theme.js';
import {
  populateFuseValues,
  populateConnectorCategories,
  populateBearingOptions,
  updateCustomImageUi,
  onHardwareTypeChange
} from './forms.js';
import { updateDownloadState, updateQrContentVisibility, updatePreview } from './render.js';
import { initEventHandlers } from './events.js';

function init() {
  initTheme();
  populateFuseValues();
  populateConnectorCategories();
  populateBearingOptions();
  updateCustomImageUi();
  onHardwareTypeChange();
  initEventHandlers();
  updateDownloadState();
  if (elements.widthValueSpan) {
    elements.widthValueSpan.textContent = state.widthMm;
  }
  updateQrContentVisibility();
  updatePreview();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { init };
