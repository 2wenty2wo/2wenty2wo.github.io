import { state } from './state.js';
import { elements } from './dom-elements.js';
import { initTheme } from './theme.js';
import {
  populateFuseValues,
  populateFuseTypePicker,
  populateConnectorCategories,
  populateBearingOptions,
  populateHardwareTypePicker,
  populateComponentMountPicker,
  populateResistorValues,
  updateCustomImageUi,
  onHardwareTypeChange,
  setBoltDriveSelection,
  setBoltHeadSelection,
  setNutTypeSelection,
  setFuseTypeSelection,
  setThreadSizeSelection,
  setFuseValueSelection,
  setComponentMountSelection,
  setResistorValueSelection,
  updateComponentValueUi,
} from './forms.js';
import { updateDownloadState, updateQrContentVisibility, updatePreview } from './render.js';
import { initEventHandlers } from './events.js';
import { hydrateStateFromUrl } from './url-state.js';

function applyStateToControls() {
  const {
    systemTypeRadios,
    glassSizeSelect,
    glassSlowBlowCheckbox,
    glassFastBlowCheckbox,
    lengthInput,
    notesInput,
    customLine1Input,
    customLine2Input,
    standardSelect,
    standardToggle,
    imageToggle,
    qrcodeToggle,
    qrContentInput,
    widthRange,
    widthValueSpan,
    heightRadios,
    connectorCategorySelect,
    nutTypeSelect,
    bearingTypeSelect,
  } = elements;

  if (Array.isArray(systemTypeRadios)) {
    systemTypeRadios.forEach(radio => {
      radio.checked = radio.value === state.systemType;
    });
  }
  setFuseTypeSelection(state.fuseType || 'Glass', { triggerUpdate: false });
  setFuseValueSelection(state.fuseValue || '', { triggerUpdate: false });
  if (glassSizeSelect) {
    glassSizeSelect.value = state.glassSize || '';
  }
  if (glassSlowBlowCheckbox) {
    glassSlowBlowCheckbox.checked = state.glassSpeed.startsWith('Slow');
  }
  if (glassFastBlowCheckbox) {
    glassFastBlowCheckbox.checked = state.glassSpeed.startsWith('Fast');
  }

  if (connectorCategorySelect) {
    connectorCategorySelect.value = state.connectorCategory || '';
  }
  setThreadSizeSelection(state.threadSize || '', { triggerUpdate: false });
  if (nutTypeSelect) {
    nutTypeSelect.value = state.nutType || '';
  }
  if (bearingTypeSelect) {
    bearingTypeSelect.value = state.bearingType || '';
  }
  setComponentMountSelection(state.componentMount || 'Through-Hole', { triggerUpdate: false });
  setResistorValueSelection(state.resistorValue || '', { triggerUpdate: false });
  updateComponentValueUi({ resetIfHidden: false });

  if (lengthInput) {
    lengthInput.value = state.length || '';
  }
  if (notesInput) {
    notesInput.value = state.notes || '';
  }
  if (customLine1Input) {
    customLine1Input.value = state.customLine1 || '';
  }
  if (customLine2Input) {
    customLine2Input.value = state.customLine2 || '';
  }
  if (standardSelect) {
    standardSelect.value = state.standardCode || '';
  }
  setBoltHeadSelection(state.boltHead || '', { triggerUpdate: false });
  setBoltDriveSelection(state.boltDrive || '', { triggerUpdate: false });
  setNutTypeSelection(state.nutType || '', { triggerUpdate: false });
  if (standardToggle) {
    standardToggle.checked = state.showStandard;
  }
  if (imageToggle) {
    imageToggle.checked = state.showImage;
  }
  if (qrcodeToggle) {
    qrcodeToggle.checked = state.showQr;
  }
  if (qrContentInput) {
    qrContentInput.value = state.qrContent || '';
  }
  if (widthRange) {
    widthRange.value = String(state.widthMm);
  }
  if (widthValueSpan) {
    widthValueSpan.textContent = state.widthMm;
  }
  if (Array.isArray(heightRadios)) {
    heightRadios.forEach(radio => {
      radio.checked = Number.parseInt(radio.value, 10) === state.heightMm;
    });
  }
}

function init() {
  initTheme();
  hydrateStateFromUrl();
  populateFuseValues();
  populateFuseTypePicker();
  populateConnectorCategories();
  populateBearingOptions();
  populateHardwareTypePicker();
  populateComponentMountPicker();
  populateResistorValues();
  updateCustomImageUi();
  onHardwareTypeChange();
  applyStateToControls();
  initEventHandlers();
  updateDownloadState();
  updateQrContentVisibility();
  updatePreview();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { init };
