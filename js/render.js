import { state } from './state.js';
import { elements } from './dom-elements.js';
import {
  syncBoltDrivePicker,
  syncBoltHeadPicker,
  syncThreadSizePicker,
  syncFuseTypePicker,
  syncFuseValuePicker,
  syncSwitchTypePicker,
  syncComponentMountPicker,
  syncResistorValuePicker,
  syncCapacitorValuePicker,
  syncBearingTypePicker,
  syncWasherTypePicker,
  syncNutTypePicker,
  syncConnectorCategoryPicker,
  syncConnectorSeriesPicker,
} from './forms.js';
import {
  pxPerMm,
  hardwareImageFolders,
  hardwareImageExtensions,
  findConnectorCategory,
  connectorCategoryImageMap,
  getConnectorSeriesImage,
  hardwareTypeImageMap,
  switchTypeImageMap,
  boltHeadMap,
  boltDriveMap,
  nutTypeMap,
  washerTypeMap,
  screwTypeMap,
  electricalComponentTypes,
  componentImageMap,
  diodeValueLabelMap,
} from './data.js';
import {
  renderLabelSVG,
  loadSvgImage,
  canvasToBlob,
  layoutPresetTools,
} from './label/renderLabelSVG.js';

const {
  labelSizeDisplay,
  printAreaDisplay,
  previewViewport,
  previewContainer,
  previewPlaceholder,
  previewStatusText,
  labelPreviewImage,
  qrContentWrapper,
  qrContentInput,
  downloadButton,
  shareButton,
  printButton,
  threadSizeSelect,
  threadSizeContainer,
  lengthInput,
  lengthContainer,
  nutTypeSelect,
  nutTypeContainer,
  nutTypeMessage,
  washerTypeSelect,
  washerTypeContainer,
  washerTypeMessage,
  switchTypeSelect,
  switchTypeContainer,
  switchTypeMessage,
  fuseTypeSelect,
  fuseTypeContainer,
  fuseTypeMessage,
  fuseValueSelect,
  fuseValueContainer,
  connectorCategorySelect,
  connectorCategoryContainer,
  connectorCategoryMessage,
  connectorNotesMessage,
  notesInput,
  notesField,
  boltHeadSelect,
  boltDriveSelect,
  boltHeadField,
  boltDriveField,
  boltHeadMessage,
  boltDriveMessage,
  bearingTypeSelect,
  bearingOptionsContainer,
  bearingTypeMessage,
  componentCategoryContainer,
  componentCategoryRadios,
  componentCategoryMessage,
  componentMountContainer,
  componentMountSelect,
  componentMountMessage,
  resistorValueField,
  resistorValueSelect,
  resistorValueMessage,
  capacitorValueField,
  capacitorValueSelect,
  capacitorValueMessage,
  customLine1Input,
  customLine1Field,
  customLine1Message,
  threadSizeMessage,
  lengthMessage,
  fuseValueMessage,
} = elements;

const ELECTRICAL_COMPONENT_TYPES = new Set(electricalComponentTypes);

const HORIZONTAL_SAFE_MARGIN_PER_SIDE_MM = 2;
const VERTICAL_SAFE_MARGIN_PER_SIDE_MM = 1;
const MIN_TEXT_WIDTH_MM = 9;
const previewDimensions = {
  width: 0,
  height: 0,
};

let previewResizeObserver = null;
let previewReadyState = false;
let previewStatusFrameId = null;
let previewRenderRequestId = 0;

layoutPresetTools.subscribePresetChanges(() => {
  if (!previewContainer) {
    return;
  }
  updatePreview();
});

const fuseIllustrations = {
  Glass: {
    src: 'images/fuses/glass_fuse.svg',
    alt: 'Glass fuse illustration',
  },
  Ceramic: {
    src: 'images/fuses/ceramic_fuse.svg',
    alt: 'Ceramic fuse illustration',
  },
  Blade: {
    src: 'images/fuses/blade_fuse.svg',
    alt: 'Blade fuse illustration',
  },
};

function formatMillimeters(value) {
  if (!Number.isFinite(value)) {
    return '0';
  }
  const rounded = Math.round(value * 10) / 10;
  if (Math.abs(rounded - Math.round(rounded)) < 0.001) {
    return String(Math.round(rounded));
  }
  return rounded.toFixed(1);
}
function announcePreviewStatus(message) {
  if (!previewStatusText) {
    return;
  }
  if (previewStatusFrameId !== null) {
    if (typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
      window.cancelAnimationFrame(previewStatusFrameId);
    }
    previewStatusFrameId = null;
  }
  previewStatusText.textContent = '';
  const normalized = typeof message === 'string' ? message.trim() : '';
  if (!normalized) {
    return;
  }
  const update = () => {
    previewStatusText.textContent = normalized;
    previewStatusFrameId = null;
  };
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    previewStatusFrameId = window.requestAnimationFrame(update);
  } else {
    previewStatusFrameId = window.setTimeout(update, 0);
  }
}

function applyPreviewScale() {
  if (!previewContainer) {
    return;
  }
  const viewport = previewViewport || previewContainer.parentElement;
  if (!viewport) {
    return;
  }
  const { width, height } = previewDimensions;
  if (!(width > 0) || !(height > 0)) {
    viewport.classList.remove('label-preview-viewport--scaled');
    viewport.style.removeProperty('height');
    previewContainer.style.removeProperty('transform');
    previewContainer.style.removeProperty('transform-origin');
    previewContainer.style.removeProperty('position');
    previewContainer.style.removeProperty('left');
    previewContainer.style.removeProperty('top');
    previewContainer.style.removeProperty('margin');
    return;
  }
  const availableWidth = viewport.clientWidth || viewport.getBoundingClientRect().width;
  if (!(availableWidth > 0)) {
    return;
  }
  const scale = Math.min(1, availableWidth / width);
  if (scale < 0.999) {
    const scaledHeight = Math.max(1, Math.round(height * scale));
    viewport.classList.add('label-preview-viewport--scaled');
    viewport.style.height = `${scaledHeight}px`;
    previewContainer.style.transformOrigin = 'top center';
    previewContainer.style.transform = `translateX(-50%) scale(${scale})`;
    previewContainer.style.position = 'absolute';
    previewContainer.style.left = '50%';
    previewContainer.style.top = '0';
    previewContainer.style.margin = '0';
  } else {
    viewport.classList.remove('label-preview-viewport--scaled');
    viewport.style.removeProperty('height');
    previewContainer.style.removeProperty('transform');
    previewContainer.style.removeProperty('transform-origin');
    previewContainer.style.removeProperty('position');
    previewContainer.style.removeProperty('left');
    previewContainer.style.removeProperty('top');
    previewContainer.style.removeProperty('margin');
  }
}

function setupPreviewResizeHandling() {
  if (!previewContainer) {
    return;
  }
  const viewport = previewViewport || previewContainer.parentElement;
  if (!viewport) {
    return;
  }
  if (typeof ResizeObserver !== 'undefined') {
    if (previewResizeObserver) {
      previewResizeObserver.disconnect();
    }
    previewResizeObserver = new ResizeObserver(() => {
      applyPreviewScale();
    });
    previewResizeObserver.observe(viewport);
  } else if (typeof window !== 'undefined') {
    window.addEventListener('resize', applyPreviewScale);
  }
}

setupPreviewResizeHandling();

function getLabelGeometry() {
  const widthMm = Number.isFinite(state.widthMm) ? Math.max(0, state.widthMm) : 0;
  const heightMm = Number.isFinite(state.heightMm) ? Math.max(0, state.heightMm) : 0;
  const printableWidthMm = Math.max(0, widthMm - HORIZONTAL_SAFE_MARGIN_PER_SIDE_MM * 2);
  const printableHeightMm = Math.max(0, heightMm - VERTICAL_SAFE_MARGIN_PER_SIDE_MM * 2);
  const marginX = Math.max(0, (widthMm - printableWidthMm) / 2);
  const marginY = Math.max(0, (heightMm - printableHeightMm) / 2);
  return {
    labelWidthMm: widthMm,
    labelHeightMm: heightMm,
    printableWidthMm,
    printableHeightMm,
    marginX,
    marginY,
  };
}

function setMessageVisibility(element, message, show) {
  if (!element) {
    return;
  }
  const normalized = typeof message === 'string' ? message.trim() : '';
  if (show && normalized) {
    element.textContent = normalized;
    element.classList.remove('d-none');
    element.setAttribute('aria-hidden', 'false');
  } else {
    element.textContent = '';
    element.classList.add('d-none');
    element.setAttribute('aria-hidden', 'true');
  }
}

function updateInputFieldState({ input, container, messageElement, valid, message }) {
  if (input) {
    if (valid) {
      input.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
    } else {
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
    }
  }
  if (container) {
    container.classList.toggle('field-invalid', !valid);
  }
  const normalized = typeof message === 'string' ? message : '';
  const shouldShow = !valid && normalized.trim().length > 0;
  setMessageVisibility(messageElement, normalized, shouldShow);
}

function updateRadioGroupFeedback({ radios, container, messageElement, valid, message }) {
  if (Array.isArray(radios)) {
    radios.forEach(radio => {
      if (!radio) {
        return;
      }
      if (valid) {
        radio.removeAttribute('aria-invalid');
      } else {
        radio.setAttribute('aria-invalid', 'true');
      }
    });
  }
  if (container) {
    container.classList.toggle('field-invalid', !valid);
  }
  const normalized = typeof message === 'string' ? message : '';
  const shouldShow = !valid && normalized.trim().length > 0;
  setMessageVisibility(messageElement, normalized, shouldShow);
}

export function isLabelReady() {
  if (state.hardwareType === 'Fuse') {
    return Boolean(state.fuseType && state.fuseValue);
  }
  if (state.hardwareType === 'Connector') {
    return Boolean(state.connectorCategory);
  }
  if (state.hardwareType === 'Custom') {
    return Boolean(state.customLine1 && state.customLine1.trim());
  }
  if (state.hardwareType === 'Bearing') {
    return Boolean(state.bearingType);
  }
  if (ELECTRICAL_COMPONENT_TYPES.has(state.hardwareType)) {
    const category = state.componentCategory || state.hardwareType;
    const requiresResistorValue = category === 'Resistor';
    const requiresCapacitorValue = category === 'Capacitor';
    if (requiresResistorValue) {
      return Boolean(state.componentCategory && state.componentMount && state.resistorValue);
    }
    if (requiresCapacitorValue) {
      return Boolean(state.componentCategory && state.componentMount && state.capacitorValue);
    }
    return Boolean(state.componentCategory && state.componentMount);
  }
  if (state.hardwareType === 'Bolt' || state.hardwareType === 'Screw') {
    const hasThread = Boolean(state.threadSize);
    const hasLength = Boolean(state.length);
    const detailsRequired = Boolean(state.showImage || state.showStandard);
    const hasHead = Boolean(state.boltHead);
    const hasDrive = Boolean(state.boltDrive);
    const detailsSatisfied = !detailsRequired || (hasHead && hasDrive);
    return Boolean(hasThread && hasLength && detailsSatisfied);
  }
  if (state.hardwareType === 'Washer') {
    const hasThread = Boolean(state.threadSize);
    const hasType = Boolean(state.washerType);
    return Boolean(hasThread && hasType);
  }
  if (state.hardwareType === 'Nut') {
    const hasThread = Boolean(state.threadSize);
    const hasType = Boolean(state.nutType);
    return Boolean(hasThread && hasType);
  }
  if (state.hardwareType === 'Threaded Heat Insert') {
    return Boolean(state.threadSize && state.length);
  }
  if (state.hardwareType === 'Switch') {
    return Boolean(state.switchType);
  }
  return Boolean(state.threadSize);
}

function applyValidationFeedback() {
  const hardwareType = state.hardwareType;
  const requiresThread =
    hardwareType === 'Bolt' ||
    hardwareType === 'Screw' ||
    hardwareType === 'Nut' ||
    hardwareType === 'Washer' ||
    hardwareType === 'Threaded Heat Insert';

  if (requiresThread) {
    const valid = Boolean(state.threadSize);
    updateInputFieldState({
      input: threadSizeSelect,
      container: threadSizeContainer,
      messageElement: threadSizeMessage,
      valid,
    });
    syncThreadSizePicker({ isValid: valid });
  } else {
    updateInputFieldState({
      input: threadSizeSelect,
      container: threadSizeContainer,
      messageElement: threadSizeMessage,
      valid: true,
    });
    syncThreadSizePicker({ isValid: true });
  }

  const requiresLength =
    hardwareType === 'Bolt' ||
    hardwareType === 'Screw' ||
    hardwareType === 'Threaded Heat Insert';
  if (requiresLength) {
    const valid = Boolean(state.length);
    updateInputFieldState({
      input: lengthInput,
      container: lengthContainer,
      messageElement: lengthMessage,
      valid,
    });
  } else {
    updateInputFieldState({
      input: lengthInput,
      container: lengthContainer,
      messageElement: lengthMessage,
      valid: true,
    });
  }

  if (hardwareType === 'Fuse') {
    const typeValid = Boolean(state.fuseType);
    updateInputFieldState({
      input: fuseTypeSelect,
      container: fuseTypeContainer,
      messageElement: fuseTypeMessage,
      valid: typeValid,
    });
    syncFuseTypePicker({ isValid: typeValid });
    const valueValid = Boolean(state.fuseValue);
    updateInputFieldState({
      input: fuseValueSelect,
      container: fuseValueContainer,
      messageElement: fuseValueMessage,
      valid: valueValid,
    });
    syncFuseValuePicker({ isValid: valueValid });
    updateInputFieldState({
      input: switchTypeSelect,
      container: switchTypeContainer,
      messageElement: switchTypeMessage,
      valid: true,
      message: '',
    });
    syncSwitchTypePicker({ isValid: true });
  } else {
    updateInputFieldState({
      input: fuseTypeSelect,
      container: fuseTypeContainer,
      messageElement: fuseTypeMessage,
      valid: true,
    });
    syncFuseTypePicker({ isValid: true });

    updateInputFieldState({
      input: fuseValueSelect,
      container: fuseValueContainer,
      messageElement: fuseValueMessage,
      valid: true,
    });
    syncFuseValuePicker({ isValid: true });
    if (hardwareType === 'Switch') {
      const switchValid = Boolean(state.switchType);
      updateInputFieldState({
        input: switchTypeSelect,
        container: switchTypeContainer,
        messageElement: switchTypeMessage,
        valid: switchValid,
        message: switchValid ? '' : 'Select a switch type',
      });
      syncSwitchTypePicker({ isValid: switchValid });
    } else {
      updateInputFieldState({
        input: switchTypeSelect,
        container: switchTypeContainer,
        messageElement: switchTypeMessage,
        valid: true,
        message: '',
      });
      syncSwitchTypePicker({ isValid: true });
    }
  }

  if (
    (hardwareType === 'Bolt' || hardwareType === 'Screw') &&
    (state.showImage || state.showStandard)
  ) {
    const headValid = Boolean(state.boltHead);
    const driveValid = Boolean(state.boltDrive);
    updateInputFieldState({
      input: boltHeadSelect,
      container: boltHeadField,
      messageElement: boltHeadMessage,
      valid: headValid,
    });
    updateInputFieldState({
      input: boltDriveSelect,
      container: boltDriveField,
      messageElement: boltDriveMessage,
      valid: driveValid,
    });
    syncBoltHeadPicker({ isValid: headValid });
    syncBoltDrivePicker({ isValid: driveValid });
  } else {
    updateInputFieldState({
      input: boltHeadSelect,
      container: boltHeadField,
      messageElement: boltHeadMessage,
      valid: true,
    });
    updateInputFieldState({
      input: boltDriveSelect,
      container: boltDriveField,
      messageElement: boltDriveMessage,
      valid: true,
    });
    syncBoltHeadPicker({ isValid: true });
    syncBoltDrivePicker({ isValid: true });
  }

  if (hardwareType === 'Washer') {
    const typeValid = Boolean(state.washerType);
    updateInputFieldState({
      input: washerTypeSelect,
      container: washerTypeContainer,
      messageElement: washerTypeMessage,
      valid: typeValid,
    });
    syncWasherTypePicker({ isValid: typeValid });
  } else {
    updateInputFieldState({
      input: washerTypeSelect,
      container: washerTypeContainer,
      messageElement: washerTypeMessage,
      valid: true,
    });
    syncWasherTypePicker({ isValid: true });
  }

  if (hardwareType === 'Nut') {
    const typeValid = Boolean(state.nutType);
    updateInputFieldState({
      input: nutTypeSelect,
      container: nutTypeContainer,
      messageElement: nutTypeMessage,
      valid: typeValid,
    });
    syncNutTypePicker({ isValid: typeValid });
  } else {
    updateInputFieldState({
      input: nutTypeSelect,
      container: nutTypeContainer,
      messageElement: nutTypeMessage,
      valid: true,
    });
    syncNutTypePicker({ isValid: true });
  }

  if (hardwareType === 'Connector') {
    const categoryValid = Boolean(state.connectorCategory);
    updateInputFieldState({
      input: connectorCategorySelect,
      container: connectorCategoryContainer,
      messageElement: connectorCategoryMessage,
      valid: categoryValid,
    });
    syncConnectorCategoryPicker({ isValid: categoryValid });
    updateInputFieldState({
      input: notesInput,
      container: notesField,
      messageElement: connectorNotesMessage,
      valid: true,
    });
    syncConnectorSeriesPicker({ isValid: true });
  } else {
    updateInputFieldState({
      input: connectorCategorySelect,
      container: connectorCategoryContainer,
      messageElement: connectorCategoryMessage,
      valid: true,
    });
    syncConnectorCategoryPicker({ isValid: true });
    syncConnectorSeriesPicker({ isValid: true });
    updateInputFieldState({
      input: notesInput,
      container: notesField,
      messageElement: connectorNotesMessage,
      valid: true,
    });
  }

  if (hardwareType === 'Bearing') {
    const valid = Boolean(state.bearingType);
    updateInputFieldState({
      input: bearingTypeSelect,
      container: bearingOptionsContainer,
      messageElement: bearingTypeMessage,
      valid,
    });
    syncBearingTypePicker({ isValid: valid });
  } else {
    updateInputFieldState({
      input: bearingTypeSelect,
      container: bearingOptionsContainer,
      messageElement: bearingTypeMessage,
      valid: true,
    });
    syncBearingTypePicker({ isValid: true });
  }

  if (ELECTRICAL_COMPONENT_TYPES.has(hardwareType)) {
    updateRadioGroupFeedback({
      radios: componentCategoryRadios,
      container: componentCategoryContainer,
      messageElement: componentCategoryMessage,
      valid: true,
    });
    const mountValid = Boolean(state.componentMount);
    updateInputFieldState({
      input: componentMountSelect,
      container: componentMountContainer,
      messageElement: componentMountMessage,
      valid: mountValid,
      message: mountValid ? '' : 'Choose a mounting style',
    });
    syncComponentMountPicker({ isValid: mountValid });

    const category = (state.componentCategory || state.hardwareType || '').trim();
    const requiresResistorValue = category === 'Resistor';
    const requiresCapacitorValue = category === 'Capacitor';
    const resistorValid = !requiresResistorValue || Boolean(state.resistorValue);
    const capacitorValid = !requiresCapacitorValue || Boolean(state.capacitorValue);
    updateInputFieldState({
      input: resistorValueSelect,
      container: resistorValueField,
      messageElement: resistorValueMessage,
      valid: resistorValid,
      message: '',
    });
    updateInputFieldState({
      input: capacitorValueSelect,
      container: capacitorValueField,
      messageElement: capacitorValueMessage,
      valid: capacitorValid,
      message: '',
    });
    syncResistorValuePicker({ isValid: resistorValid });
    syncCapacitorValuePicker({ isValid: capacitorValid });
  } else {
    updateRadioGroupFeedback({
      radios: componentCategoryRadios,
      container: componentCategoryContainer,
      messageElement: componentCategoryMessage,
      valid: true,
    });
    updateInputFieldState({
      input: componentMountSelect,
      container: componentMountContainer,
      messageElement: componentMountMessage,
      valid: true,
      message: '',
    });
    syncComponentMountPicker({ isValid: true });
    updateInputFieldState({
      input: resistorValueSelect,
      container: resistorValueField,
      messageElement: resistorValueMessage,
      valid: true,
      message: '',
    });
    updateInputFieldState({
      input: capacitorValueSelect,
      container: capacitorValueField,
      messageElement: capacitorValueMessage,
      valid: true,
      message: '',
    });
    syncResistorValuePicker({ isValid: true });
    syncCapacitorValuePicker({ isValid: true });
  }

  if (hardwareType === 'Custom') {
    const title = (state.customLine1 || '').trim();
    const valid = title.length > 0;
    updateInputFieldState({
      input: customLine1Input,
      container: customLine1Field,
      messageElement: customLine1Message,
      valid,
    });
  } else {
    updateInputFieldState({
      input: customLine1Input,
      container: customLine1Field,
      messageElement: customLine1Message,
      valid: true,
    });
  }

}

export function updateDownloadState() {
  const ready = isLabelReady();
  const disabled = !ready;
  if (downloadButton) {
    downloadButton.disabled = disabled;
    const label = 'Download label as a PNG image';
    downloadButton.setAttribute('aria-label', label);
    downloadButton.title = disabled
      ? 'Complete the label details to enable downloading.'
      : label;
  }
  if (printButton) {
    printButton.disabled = disabled;
    const label = 'Open a print-ready preview of the label';
    printButton.setAttribute('aria-label', label);
    printButton.title = disabled
      ? 'Complete the label details to enable printing.'
      : label;
  }
  if (shareButton) {
    shareButton.disabled = disabled;
    const label = 'Share a link to this label';
    shareButton.setAttribute('aria-label', label);
    shareButton.title = disabled
      ? 'Complete the label details to enable sharing.'
      : label;
  }
  applyValidationFeedback();
}

export function updateQrContentVisibility(options = {}) {
  if (!qrContentWrapper || !qrContentInput) {
    return;
  }
  const { focus = false } = options;
  if (state.showQr) {
    qrContentWrapper.classList.remove('d-none');
    qrContentInput.disabled = false;
    qrContentInput.value = state.qrContent;
    if (focus) {
      qrContentInput.focus();
    }
  } else {
    qrContentWrapper.classList.add('d-none');
    qrContentInput.disabled = true;
  }
}
function normalizeStandardCode(code) {
  return (code || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function resolveHardwareImageInfo() {
  if (!state.showImage) {
    return null;
  }
  if (state.hardwareType === 'Custom') {
    const source = state.customGraphicSource === 'icon' ? 'icon' : 'image';
    if (source === 'icon') {
      const hasIcon = Boolean(
        state.customIconName && (state.customIconSvgData || state.customIconUnicode),
      );
      return {
        type: 'custom-icon',
        hasIcon,
        iconName: state.customIconName || '',
        iconUnicode: state.customIconUnicode || '',
        iconStyle: state.customIconStyle || 'solid',
        iconLabel: state.customIconLabel || state.customIconName || 'Custom icon',
        iconSvgData: state.customIconSvgData || '',
      };
    }
    const hasImage = Boolean(state.customImageData);
    return {
      type: 'custom-image',
      hasImage,
      src: state.customImageData || '',
      alt: state.customImageName || 'Custom image',
    };
  }
  if (ELECTRICAL_COMPONENT_TYPES.has(state.hardwareType)) {
    const categoryKey = (state.componentCategory || state.hardwareType || '').trim();
    const mount = (state.componentMount || '').trim();
    const imageGroup =
      componentImageMap[categoryKey] || componentImageMap[state.hardwareType] || null;
    if (!imageGroup) {
      return null;
    }
    let imageSrc = '';
    if (mount && imageGroup[mount]) {
      imageSrc = imageGroup[mount];
    }
    if (!imageSrc && mount) {
      const normalizedMount = mount.toLowerCase();
      imageSrc =
        imageGroup[normalizedMount] ||
        imageGroup[normalizedMount.replace(/\s+/g, '')] ||
        imageGroup[normalizedMount.replace(/[-\s]+/g, '_')];
    }
    if (!imageSrc) {
      imageSrc =
        imageGroup.default || imageGroup['Through-Hole'] || imageGroup['through-hole'] || '';
    }
    if (!imageSrc) {
      return null;
    }
    const altParts = [];
    if (categoryKey) {
      altParts.push(categoryKey);
    }
    if (mount) {
      altParts.push(`${mount} mounting`);
    }
    const alt =
      altParts.length > 0
        ? `${altParts.join(' — ')} illustration`
        : 'Component illustration';
    return {
      type: 'photo',
      src: imageSrc,
      alt,
    };
  }
  if (state.hardwareType === 'Switch') {
    const switchId = (state.switchType || '').trim();
    const imageSrc = switchTypeImageMap.get(switchId) || hardwareTypeImageMap.Switch || '';
    if (!imageSrc) {
      return null;
    }
    const altLabel = switchId || 'Switch';
    return {
      type: 'photo',
      src: imageSrc,
      alt: `${altLabel} illustration`,
    };
  }
  if (state.hardwareType === 'Connector') {
    const categoryId = (state.connectorCategory || '').trim();
    const category = findConnectorCategory(categoryId);
    const seriesCode = (state.standardCode || '').trim();
    let imageSrc = '';
    let altParts = [];

    if (seriesCode) {
      imageSrc = getConnectorSeriesImage(categoryId, seriesCode) || '';
      if (seriesCode) {
        altParts.push(seriesCode);
      }
      if (category && Array.isArray(category.series)) {
        const seriesEntry = category.series.find(entry => entry.code === seriesCode);
        if (seriesEntry && seriesEntry.name) {
          altParts.push(seriesEntry.name);
        }
      }
    }

    if (!imageSrc && category) {
      imageSrc = connectorCategoryImageMap[category.id] || '';
      if (category.label) {
        altParts.push(category.label);
      }
    }

    if (!imageSrc) {
      imageSrc = hardwareTypeImageMap.Connector || '';
    }

    if (!imageSrc) {
      return null;
    }

    if (altParts.length === 0) {
      altParts.push('Connector');
    }

    return {
      type: 'photo',
      src: imageSrc,
      alt: `${altParts.join(' — ')} illustration`,
    };
  }
  if (state.hardwareType === 'Bolt') {
    const headId = (state.boltHead || '').trim();
    const driveId = (state.boltDrive || '').trim();
    if (!headId || !driveId) {
      return null;
    }
    const headEntry = boltHeadMap.get(headId);
    const driveEntry = boltDriveMap.get(driveId);
    if (!headEntry || !driveEntry) {
      return null;
    }
    const headImage = (headEntry.image || '').trim();
    const driveImage = (driveEntry.image || '').trim();
    if (!headImage || !driveImage) {
      return null;
    }
    return {
      type: 'bolt',
      images: [
        {
          src: `images/bolts/drive/${driveImage}.svg`,
          alt: driveEntry.label ? `${driveEntry.label} — drive view` : 'Bolt drive view',
        },
        {
          src: `images/bolts/head/${headImage}.svg`,
          alt: headEntry.label ? `${headEntry.label} — head view` : 'Bolt head view',
        },
      ],
    };
  }
  if (state.hardwareType === 'Screw') {
    const typeId = (state.boltHead || '').trim();
    const driveId = (state.boltDrive || '').trim();
    if (!typeId || !driveId) {
      return null;
    }
    const typeEntry = screwTypeMap.get(typeId);
    const driveEntry = boltDriveMap.get(driveId);
    if (!typeEntry || !driveEntry) {
      return null;
    }
    const typeImage = (typeEntry.image || '').trim();
    const driveImage = (driveEntry.image || '').trim();
    if (!typeImage || !driveImage) {
      return null;
    }
    return {
      type: 'screw',
      images: [
        {
          src: `images/bolts/drive/${driveImage}.svg`,
          alt: driveEntry.label ? `${driveEntry.label} — drive view` : 'Screw drive view',
        },
        {
          src: `images/screws/${typeImage}.svg`,
          alt: typeEntry.label ? `${typeEntry.label} — type view` : 'Screw type view',
        },
      ],
    };
  }
  if (state.hardwareType === 'Fuse') {
    const fuseType = (state.fuseType || '').trim();
    const illustration = fuseIllustrations[fuseType] || fuseIllustrations.Glass;
    if (!illustration) {
      return null;
    }
    return {
      type: 'fuse-illustration',
      src: illustration.src,
      alt: illustration.alt,
    };
  }
  if (state.hardwareType === 'Threaded Heat Insert') {
    return {
      type: 'photo',
      src: 'images/threaded_heat_insert/heat_insert.svg',
      alt: 'Threaded heat insert reference illustration',
    };
  }
  if (state.hardwareType === 'Bearing') {
    const bearingCode = (state.bearingType || '').trim();
    const bearingDescription = (state.bearingDetails || '').trim();
    const altParts = [];
    if (bearingCode) {
      altParts.push(bearingCode);
    }
    if (bearingDescription && bearingDescription.toLowerCase() !== bearingCode.toLowerCase()) {
      altParts.push(bearingDescription);
    }
    const altText =
      altParts.length > 0
        ? `${altParts.join(' — ')} bearing illustration`
        : 'Bearing reference illustration';
    return {
      type: 'photo',
      src: 'images/bearings/bearing.svg',
      alt: altText,
    };
  }
  if (state.hardwareType === 'Washer') {
    const typeId = (state.washerType || '').trim();
    const typeEntry = washerTypeMap.get(typeId);
    if (!typeEntry) {
      return null;
    }
    const image = (typeEntry.image || '').trim();
    if (!image) {
      return null;
    }
    const label = typeEntry.label || '';
    return {
      type: 'photo',
      src: `images/washers/${image}.svg`,
      alt: label ? `${label} reference illustration` : 'Washer reference illustration',
    };
  }
  if (state.hardwareType === 'Nut') {
    const typeId = (state.nutType || '').trim();
    const typeEntry = nutTypeMap.get(typeId);
    if (!typeEntry) {
      return null;
    }
    const image = (typeEntry.image || '').trim();
    if (!image) {
      return null;
    }
    const label = typeEntry.label || '';
    return {
      type: 'photo',
      src: `images/nuts/${image}.svg`,
      alt: label ? `${label} reference illustration` : 'Nut reference illustration',
    };
  }
  const folder = hardwareImageFolders[state.hardwareType];
  if (!folder) {
    return null;
  }
  const code = (state.standardCode || '').trim();
  if (!code) {
    return null;
  }
  const filename = normalizeStandardCode(code);
  if (!filename) {
    return null;
  }
  const extensionEntry = hardwareImageExtensions[state.hardwareType];
  const extension = typeof extensionEntry === 'string' && extensionEntry.trim() ? extensionEntry : 'png';
  const standardName = (state.standard || '').trim();
  const altPieces = [];
  if (code) {
    altPieces.push(code);
  }
  if (standardName && standardName.toLowerCase() !== code.toLowerCase()) {
    altPieces.push(standardName);
  }
  const alt = altPieces.length > 0
    ? `${altPieces.join(' — ')} reference illustration`
    : 'Hardware reference illustration';
  return {
    type: 'photo',
    src: `images/${folder}/${filename}.${extension}`,
    alt,
  };
}

function buildConnectorLines() {
  const category = findConnectorCategory(state.connectorCategory);
  const categoryLabel = category ? category.label : '';
  const seriesLabel = state.showStandard && state.standard ? state.standard : '';
  const standardCode = (state.standardCode || '').trim();
  const noteText = state.notes || '';
  const isPreInsulated = state.connectorCategory === 'pre-insulated-crimp';
  let line1 = '';
  const line2Parts = [];

  if (seriesLabel) {
    line1 = seriesLabel;
  } else if (categoryLabel) {
    line1 = categoryLabel;
  } else if (noteText) {
    line1 = noteText;
  }

  if (seriesLabel) {
    if (isPreInsulated && standardCode) {
      const colour = standardCode.split(/\s+/)[0] || '';
      if (colour) {
        line2Parts.push(colour);
      }
      if (categoryLabel && colour.toLowerCase() !== categoryLabel.toLowerCase()) {
        line2Parts.push(categoryLabel);
      }
    } else if (categoryLabel && seriesLabel.toLowerCase() !== categoryLabel.toLowerCase()) {
      line2Parts.push(categoryLabel);
    }
  } else if (categoryLabel && line1.toLowerCase() !== categoryLabel.toLowerCase()) {
    line2Parts.push(categoryLabel);
  }

  if (noteText && line1.toLowerCase() !== noteText.toLowerCase()) {
    line2Parts.push(noteText);
  }

  return { line1, line2: line2Parts.join(' • '), line3: '' };
}

function buildTextLines() {
  if (state.hardwareType === 'Custom') {
    const line1 = (state.customLine1 || '').trim() || 'Custom Label';
    const line2 = (state.customLine2 || '').trim();
    return { line1, line2, line3: '' };
  }

  if (state.hardwareType === 'Fuse') {
    const valueLabel = state.fuseValue ? `${state.fuseValue} A` : 'Fuse';
    const typeLabel = state.fuseType ? `${state.fuseType} Fuse` : 'Fuse';
    const typeParts = [typeLabel];
    if (state.glassSize) {
      typeParts.push(state.glassSize);
    }
    const line2 = typeParts.filter(Boolean).join(' — ');
    const line3Parts = [];
    if (state.glassSpeed) {
      line3Parts.push(state.glassSpeed);
    }
    if (state.notes) {
      line3Parts.push(state.notes);
    }
    const line3 = line3Parts.join(' • ');
    return { line1: valueLabel, line2, line3 };
  }

  if (state.hardwareType === 'Connector') {
    return buildConnectorLines();
  }

  if (state.hardwareType === 'Bearing') {
    const line1 = state.bearingType || 'Bearing';
    const line2 = state.showStandard && state.bearingDetails ? state.bearingDetails : '';
    const line3 = state.notes || '';
    return { line1, line2, line3 };
  }

  if (state.hardwareType === 'Switch') {
    const line1 = state.switchType || 'Switch';
    const line2 = state.notes || '';
    return { line1, line2, line3: '' };
  }

  if (ELECTRICAL_COMPONENT_TYPES.has(state.hardwareType)) {
    const category = state.componentCategory || state.hardwareType || 'Component';
    if (category === 'Resistor') {
      const line1 = state.resistorValue || 'Resistor';
      const line2 = 'Resistor';
      const line3Parts = [];
      if (state.componentMount) {
        line3Parts.push(state.componentMount);
      }
      if (state.notes) {
        line3Parts.push(state.notes);
      }
      return { line1, line2, line3: line3Parts.join(' — ') };
    }
    if (category === 'Capacitor') {
      const line1 = state.capacitorValue || 'Capacitor';
      const line2 = 'Capacitor';
      const line3Parts = [];
      if (state.componentMount) {
        line3Parts.push(state.componentMount);
      }
      if (state.notes) {
        line3Parts.push(state.notes);
      }
      return { line1, line2, line3: line3Parts.join(' — ') };
    }
    if (category === 'Diode') {
      const selectedDiodeId = state.diodeValue || '';
      const line1 = selectedDiodeId || 'Diode';
      const diodeLabel = selectedDiodeId ? diodeValueLabelMap[selectedDiodeId] : '';
      let line2 = 'Diode';
      if (diodeLabel) {
        if (diodeLabel.startsWith(`${selectedDiodeId} `)) {
          const typeLabel = diodeLabel.slice(selectedDiodeId.length).trim();
          line2 = typeLabel || diodeLabel;
        } else {
          line2 = diodeLabel;
        }
      }
      const line3Parts = [];
      if (state.componentMount) {
        line3Parts.push(state.componentMount);
      }
      if (state.notes) {
        line3Parts.push(state.notes);
      }
      return { line1, line2, line3: line3Parts.join(' — ') };
    }
    const parts = [];
    if (state.componentCategory) {
      parts.push(state.componentCategory);
    }
    if (state.componentMount) {
      parts.push(state.componentMount);
    }
    const fallbackLabel = state.hardwareType || 'Component';
    const line1 = parts.join(' — ') || fallbackLabel;
    const line2 = state.notes || '';
    return { line1, line2, line3: '' };
  }

  if (state.hardwareType === 'Bolt') {
    const pieces = [];
    if (state.threadSize) {
      pieces.push(state.threadSize);
    }
    if (state.length) {
      pieces.push(`× ${state.length}`);
    }
    const headEntry = boltHeadMap.get((state.boltHead || '').trim());
    const driveEntry = boltDriveMap.get((state.boltDrive || '').trim());
    const headLabel = headEntry ? headEntry.label : '';
    const driveLabel = driveEntry ? driveEntry.label : '';
    const line2 = state.showStandard && headLabel ? headLabel : '';
    const line3 = state.showStandard && driveLabel ? driveLabel : '';
    return { line1: pieces.join(' ') || 'Bolt', line2, line3 };
  }

  if (state.hardwareType === 'Nut') {
    const line1 = state.threadSize || 'Nut';
    const typeEntry = nutTypeMap.get((state.nutType || '').trim());
    const typeLabel = typeEntry ? typeEntry.label : '';
    const notes = state.notes || '';
    const showType = Boolean(state.showStandard && typeLabel);
    const line2 = showType ? typeLabel : notes;
    const line3 = showType ? notes : '';
    return { line1, line2, line3 };
  }

  if (state.hardwareType === 'Washer') {
    const line1 = state.threadSize || 'Washer';
    const typeEntry = washerTypeMap.get((state.washerType || '').trim());
    const typeLabel = typeEntry ? typeEntry.label : '';
    const notes = state.notes || '';
    const line2 = typeLabel;
    const line3 = notes;
    return { line1, line2, line3 };
  }

  if (state.hardwareType === 'Screw') {
    const pieces = [];
    if (state.threadSize) {
      pieces.push(state.threadSize);
    }
    if (state.length) {
      pieces.push(`× ${state.length}`);
    }
    const typeEntry = screwTypeMap.get((state.boltHead || '').trim());
    const driveEntry = boltDriveMap.get((state.boltDrive || '').trim());
    const typeLabel = typeEntry ? typeEntry.label : '';
    const driveLabel = driveEntry ? driveEntry.label : '';
    const notes = state.notes || '';
    const showDetails = Boolean(state.showStandard);
    let line2 = '';
    let line3 = '';
    if (showDetails) {
      if (typeLabel) {
        line2 = typeLabel;
      }
      if (driveLabel) {
        line3 = driveLabel;
      }
      if (notes) {
        if (!line2) {
          line2 = notes;
        } else if (!line3) {
          line3 = notes;
        }
      }
    } else {
      line2 = notes;
    }
    return { line1: pieces.join(' ') || 'Screw', line2, line3 };
  }

  const line1 = state.threadSize || state.hardwareType || 'Label';
  const line2 = state.standard ? state.standard : state.notes || '';
  return { line1, line2, line3: '' };
}
function hidePreviewContent() {
  if (!labelPreviewImage) {
    return;
  }
  labelPreviewImage.style.display = 'none';
  labelPreviewImage.setAttribute('aria-hidden', 'true');
  labelPreviewImage.removeAttribute('src');
  labelPreviewImage.style.removeProperty('width');
  labelPreviewImage.style.removeProperty('height');
}
export function updatePreview() {
  if (
    !previewContainer ||
    !labelPreviewImage ||
    !labelSizeDisplay ||
    !printAreaDisplay
  ) {
    return;
  }

  const geometry = getLabelGeometry();
  const { labelWidthMm, labelHeightMm, printableWidthMm, printableHeightMm } = geometry;

  labelSizeDisplay.textContent = `${formatMillimeters(labelWidthMm)} × ${formatMillimeters(
    labelHeightMm,
  )} mm (label size)`;
  printAreaDisplay.textContent = `${formatMillimeters(printableWidthMm)} × ${formatMillimeters(
    printableHeightMm,
  )} mm (printable area)`;

  const safeWidthMm = labelWidthMm > 0 ? labelWidthMm : 1;
  const safeHeightMm = labelHeightMm > 0 ? labelHeightMm : 1;
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--label-width-mm', `${safeWidthMm}mm`);
    document.documentElement.style.setProperty('--label-height-mm', `${safeHeightMm}mm`);
  }

  const labelWidthPx = Math.max(1, Math.round(labelWidthMm * pxPerMm));
  const labelHeightPx = Math.max(1, Math.round(labelHeightMm * pxPerMm));
  previewContainer.style.width = `${labelWidthPx}px`;
  previewContainer.style.height = `${labelHeightPx}px`;
  previewDimensions.width = labelWidthPx;
  previewDimensions.height = labelHeightPx;
  applyPreviewScale();

  const printableValid = printableWidthMm > 0 && printableHeightMm > 0;
  const ready = printableValid && isLabelReady();

  if (!ready) {
    if (previewPlaceholder) {
      previewPlaceholder.style.display = 'flex';
      previewPlaceholder.setAttribute('aria-hidden', 'false');
    }
    hidePreviewContent();
    if (previewReadyState) {
      announcePreviewStatus('Preview cleared.');
    } else {
      announcePreviewStatus('');
    }
    previewReadyState = false;
    return;
  }

  if (previewPlaceholder) {
    previewPlaceholder.style.display = 'none';
    previewPlaceholder.setAttribute('aria-hidden', 'true');
  }

  const requestId = ++previewRenderRequestId;
  announcePreviewStatus('Rendering preview…');
  previewReadyState = false;

  (async () => {
    try {
      const result = await renderLabelSvgForState(geometry);
      if (previewRenderRequestId !== requestId) {
        return;
      }
      const scale = getRasterScale();
      const canvas = await rasterizeSvgToCanvas(result.svgMarkup, result.widthPx, result.heightPx, scale);
      if (previewRenderRequestId !== requestId) {
        return;
      }
      const dataUrl = canvas.toDataURL('image/png');
      labelPreviewImage.src = dataUrl;
      labelPreviewImage.style.display = 'block';
      labelPreviewImage.style.width = `${result.widthPx}px`;
      labelPreviewImage.style.height = `${result.heightPx}px`;
      labelPreviewImage.setAttribute('aria-hidden', 'false');
      previewReadyState = true;
      announcePreviewStatus('Preview updated.');
    } catch (error) {
      if (previewRenderRequestId !== requestId) {
        return;
      }
      console.error('Unable to render label preview.', error);
      hidePreviewContent();
      previewReadyState = false;
      announcePreviewStatus('Preview unavailable.');
    }
  })();
}
async function ensureFontsReady() {
  if (typeof document === 'undefined' || !document.fonts || !document.fonts.ready) {
    return;
  }
  try {
    await document.fonts.ready;
  } catch (error) {
    console.warn('Unable to verify font readiness before export.', error);
  }
}

async function renderLabelSvgForState(geometryOverride) {
  await ensureFontsReady();
  const geometry = geometryOverride || getLabelGeometry();
  const textLines = buildTextLines();
  const hardwareInfo = resolveHardwareImageInfo();
  const qrContent = state.showQr && state.qrContent ? state.qrContent.trim() : '';
  return renderLabelSVG({
    geometry,
    pxPerMm,
    textLines,
    hardwareInfo,
    qrContent,
    minTextWidthMm: MIN_TEXT_WIDTH_MM,
  });
}

function getRasterScale() {
  if (typeof window !== 'undefined' && window.devicePixelRatio) {
    const ratio = Number(window.devicePixelRatio);
    if (Number.isFinite(ratio) && ratio > 0) {
      return ratio;
    }
  }
  return 1;
}

async function rasterizeSvgToCanvas(svgMarkup, widthPx, heightPx, scale) {
  const canvas = document.createElement('canvas');
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const scaledWidth = Math.max(1, Math.round(widthPx * safeScale));
  const scaledHeight = Math.max(1, Math.round(heightPx * safeScale));
  canvas.width = scaledWidth;
  canvas.height = scaledHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to obtain a 2D canvas context for export.');
  }
  if (safeScale !== 1) {
    ctx.setTransform(safeScale, 0, 0, safeScale, 0, 0);
  }
  const img = await loadSvgImage(svgMarkup, widthPx, heightPx);
  ctx.clearRect(0, 0, widthPx, heightPx);
  ctx.drawImage(img, 0, 0, widthPx, heightPx);
  return canvas;
}

export async function renderLabelPng() {
  const result = await renderLabelSvgForState();
  const scale = getRasterScale();
  const canvas = await rasterizeSvgToCanvas(result.svgMarkup, result.widthPx, result.heightPx, scale);
  const blob = await canvasToBlob(canvas, 'image/png');
  return {
    blob,
    widthPx: result.widthPx,
    heightPx: result.heightPx,
    printableWidthMm: result.printableWidthMm,
    printableHeightMm: result.printableHeightMm,
    svgMarkup: result.svgMarkup,
  };
}

export async function renderLabelSvgMarkup() {
  const { svgMarkup } = await renderLabelSvgForState();
  return svgMarkup;
}
