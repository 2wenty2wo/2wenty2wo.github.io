import { state } from './state.js';
import { elements } from './dom-elements.js';
import { initTheme } from './theme.js';
import { initCollapsibleSections } from './collapsible-sections.js';
import {
  populateFuseValues,
  populateFuseTypePicker,
  populateConnectorCategories,
  populateBearingOptions,
  populateHardwareTypePicker,
  populateSwitchTypePicker,
  populateComponentMountPicker,
  populateResistorValues,
  populateCapacitorValues,
  populateDiodeValues,
  populateMosfetChannels,
  populateMosfetParts,
  populatePotentiometerValues,
  populatePotentiometerTapers,
  populateWasherTypeOptions,
  populateCustomPartPicker,
  updateCustomImageUi,
  ensureCustomIconAsset,
  onHardwareTypeChange,
  setBoltDriveSelection,
  setBoltHeadSelection,
  setNutTypeSelection,
  setWasherTypeSelection,
  setSwitchTypeSelection,
  setBearingTypeSelection,
  setFuseTypeSelection,
  setThreadSizeSelection,
  setFuseValueSelection,
  setConnectorCategorySelection,
  setConnectorSeriesSelection,
  setComponentMountSelection,
  setResistorValueSelection,
  setCapacitorValueSelection,
  setDiodeValueSelection,
  setMosfetChannelSelection,
  setMosfetPartSelection,
  setPotentiometerValueSelection,
  setPotentiometerTaperSelection,
  syncConnectorSeriesPicker,
  updateComponentValueUi,
  setCustomPartSelection,
} from './forms.js';
import {
  updateDownloadState,
  updateQrContentVisibility,
  updateTextOptionsVisibility,
  updatePreview,
} from './render.js';
import { initEventHandlers } from './events.js';
import { hydrateStateFromUrl } from './url-state.js';
import { setRandomDevelopmentWarning } from './warning-message.js';
export { expandAllCollapsibleSections, collapseAllCollapsibleSections } from './collapsible-sections.js';

function applyStateToControls() {
  const {
    systemTypeRadios,
    glassSizeSelect,
    glassSpeedSelect,
    lengthInput,
    notesInput,
    customLine1Input,
    customLine2Input,
    standardSelect,
    textToggle,
    textMainToggle,
    textInfoToggle,
    imageToggle,
    qrcodeToggle,
    qrContentInput,
    widthRange,
    widthValueSpan,
    heightRadios,
    nutTypeSelect,
    washerTypeSelect,
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
  if (glassSpeedSelect) {
    glassSpeedSelect.value = state.glassSpeed || '';
  }

  setConnectorCategorySelection(state.connectorCategory || '', { triggerUpdate: false });
  setThreadSizeSelection(state.threadSize || '', { triggerUpdate: false });
  if (nutTypeSelect) {
    nutTypeSelect.value = state.nutType || '';
  }
  if (washerTypeSelect) {
    washerTypeSelect.value = state.washerType || '';
  }
  setBearingTypeSelection(state.bearingType || '', { triggerUpdate: false });
  setComponentMountSelection(state.componentMount || 'Through-Hole', { triggerUpdate: false });
  setResistorValueSelection(state.resistorValue || '', { triggerUpdate: false });
  setCapacitorValueSelection(state.capacitorValue || '', { triggerUpdate: false });
  setDiodeValueSelection(state.diodeValue || '', { triggerUpdate: false });
  setMosfetChannelSelection(state.mosfetChannel || '', { triggerUpdate: false });
  setMosfetPartSelection(state.mosfetPart || '', { triggerUpdate: false });
  setPotentiometerValueSelection(state.potentiometerValue || '', { triggerUpdate: false });
  setPotentiometerTaperSelection(state.potentiometerTaper || '', { triggerUpdate: false });
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
  if (state.hardwareType === 'Connector') {
    setConnectorSeriesSelection(state.standardCode || '', { triggerUpdate: false });
  } else {
    syncConnectorSeriesPicker({ isValid: true });
  }
  setBoltHeadSelection(state.boltHead || '', { triggerUpdate: false });
  setBoltDriveSelection(state.boltDrive || '', { triggerUpdate: false });
  setNutTypeSelection(state.nutType || '', { triggerUpdate: false });
  setWasherTypeSelection(state.washerType || '', { triggerUpdate: false });
  setSwitchTypeSelection(state.switchType || '', { triggerUpdate: false });
  setCustomPartSelection(state.customPartId || '', { triggerUpdate: false });
  if (textToggle) {
    textToggle.checked = state.showText;
    textToggle.setAttribute('aria-expanded', state.showText ? 'true' : 'false');
  }
  if (textMainToggle) {
    textMainToggle.checked = state.showTextMain;
  }
  if (textInfoToggle) {
    textInfoToggle.checked = state.showTextInfo;
  }
  if (imageToggle) {
    imageToggle.checked = state.showImage;
  }
  if (qrcodeToggle) {
    qrcodeToggle.checked = state.showQr;
    qrcodeToggle.setAttribute('aria-expanded', state.showQr ? 'true' : 'false');
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
  initCollapsibleSections();
  setRandomDevelopmentWarning(elements.developmentWarningMessage);
  hydrateStateFromUrl();
  populateFuseValues();
  populateFuseTypePicker();
  populateConnectorCategories();
  populateBearingOptions();
  populateHardwareTypePicker();
  populateComponentMountPicker();
  populateResistorValues();
  populateCapacitorValues();
  populateDiodeValues();
  populateMosfetChannels();
  populateMosfetParts();
  populatePotentiometerValues();
  populatePotentiometerTapers();
  populateWasherTypeOptions();
  populateSwitchTypePicker();
  populateCustomPartPicker();
  updateCustomImageUi();
  ensureCustomIconAsset();
  onHardwareTypeChange();
  applyStateToControls();
  initEventHandlers();
  updateDownloadState();
  updateTextOptionsVisibility({ animate: false });
  updateQrContentVisibility({ animate: false });
  updatePreview();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { init };
