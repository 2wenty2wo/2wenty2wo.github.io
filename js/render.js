import { state } from './state.js';
import { elements } from './dom-elements.js';
import { syncBoltDrivePicker, syncThreadSizePicker, syncFuseValuePicker } from './forms.js';
import {
  pxPerMm,
  hardwareImageFolders,
  findConnectorCategory,
  boltHeadMap,
  boltDriveMap,
  nutTypeMap,
} from './data.js';
import { loadQrCodeLibrary } from './lazy-loaders.js';

const {
  labelSizeDisplay,
  printAreaDisplay,
  previewViewport,
  previewContainer,
  previewPlaceholder,
  previewStatusText,
  labelSvg,
  labelFrame,
  printableGroup,
  printableForeignObject,
  labelInner,
  hardwareImageDiv,
  textBlockDiv,
  line1Div,
  line2Div,
  line3Div,
  qrCanvas,
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
  componentMountRadios,
  componentMountMessage,
  customLine1Input,
  customLine1Field,
  customLine1Message,
  threadSizeMessage,
  lengthMessage,
  fuseValueMessage,
  formStatusMessage,
} = elements;

const HORIZONTAL_SAFE_MARGIN_PER_SIDE_MM = 2;
const VERTICAL_SAFE_MARGIN_PER_SIDE_MM = 1;
const MIN_TEXT_WIDTH_MM = 9;
const SVG_XMLNS = 'http://www.w3.org/2000/svg';

const previewDimensions = {
  width: 0,
  height: 0,
};

let previewResizeObserver = null;
let previewReadyState = false;
let previewStatusFrameId = null;
let qrRenderRequestId = 0;

const fuseIllustrations = {
  Glass: {
    src: 'images/fuses/glass_fuse.svg',
    alt: 'Glass fuse illustration',
  },
  Blade: {
    src: 'images/fuses/blade_fuse.svg',
    alt: 'Blade fuse illustration',
  },
};

function mmToPx(mm) {
  return Number.isFinite(mm) ? mm * pxPerMm : 0;
}

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

function applySvgGeometryElements({ frame, group, foreignObject }, geometry) {
  if (!geometry) {
    return;
  }
  const formatNumber = value => {
    if (!Number.isFinite(value)) {
      return '0';
    }
    const rounded = Math.round(value * 1000) / 1000;
    return String(rounded);
  };
  const toPx = value => (Number.isFinite(value) ? value * pxPerMm : 0);
  const {
    labelWidthMm,
    labelHeightMm,
    printableWidthMm,
    printableHeightMm,
    marginX,
    marginY,
  } = geometry;
  const labelWidthPx = toPx(labelWidthMm);
  const labelHeightPx = toPx(labelHeightMm);
  const printableWidthPx = toPx(printableWidthMm);
  const printableHeightPx = toPx(printableHeightMm);
  const marginXPx = toPx(marginX);
  const marginYPx = toPx(marginY);
  const frameStrokeWidthPx = toPx(0.25);
  if (frame) {
    frame.setAttribute('x', '0');
    frame.setAttribute('y', '0');
    frame.setAttribute('width', formatNumber(labelWidthPx));
    frame.setAttribute('height', formatNumber(labelHeightPx));
    frame.setAttribute('stroke-width', formatNumber(frameStrokeWidthPx));
  }
  if (group) {
    group.setAttribute('transform', `translate(${formatNumber(marginXPx)} ${formatNumber(marginYPx)})`);
  }
  if (foreignObject) {
    foreignObject.setAttribute('x', '0');
    foreignObject.setAttribute('y', '0');
    foreignObject.setAttribute('width', formatNumber(printableWidthPx));
    foreignObject.setAttribute('height', formatNumber(printableHeightPx));
  }
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

function formatRequirementSummary(requirements) {
  if (!Array.isArray(requirements) || requirements.length === 0) {
    return '';
  }
  if (requirements.length === 1) {
    return requirements[0];
  }
  const allButLast = requirements.slice(0, -1);
  const last = requirements[requirements.length - 1];
  return `${allButLast.join(', ')} and ${last}`;
}
export function isLabelReady() {
  if (state.hardwareType === 'Fuse') {
    return Boolean(state.fuseValue);
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
  if (state.hardwareType === 'Component') {
    return Boolean(state.componentCategory && state.componentMount);
  }
  if (state.hardwareType === 'Bolt') {
    const hasThread = Boolean(state.threadSize);
    const hasLength = Boolean(state.length);
    const detailsRequired = Boolean(state.showImage || state.showStandard);
    const hasHead = Boolean(state.boltHead);
    const hasDrive = Boolean(state.boltDrive);
    const detailsSatisfied = !detailsRequired || (hasHead && hasDrive);
    return Boolean(hasThread && hasLength && detailsSatisfied);
  }
  if (state.hardwareType === 'Nut') {
    const hasThread = Boolean(state.threadSize);
    const detailsRequired = Boolean(state.showImage || state.showStandard);
    const hasType = Boolean(state.nutType);
    const detailsSatisfied = !detailsRequired || hasType;
    return Boolean(hasThread && detailsSatisfied);
  }
  if (state.hardwareType === 'Screw') {
    return Boolean(state.threadSize && state.length && state.standardCode);
  }
  if (state.hardwareType === 'Threaded Heat Insert') {
    return Boolean(state.threadSize && state.length);
  }
  return Boolean(state.threadSize);
}

function applyValidationFeedback(disabled) {
  const requirements = [];
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
    if (!valid) {
      requirements.push('select a size');
    }
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
    if (!valid) {
      requirements.push('add a length');
    }
  } else {
    updateInputFieldState({
      input: lengthInput,
      container: lengthContainer,
      messageElement: lengthMessage,
      valid: true,
    });
  }

  if (hardwareType === 'Fuse') {
    const valid = Boolean(state.fuseValue);
    updateInputFieldState({
      input: fuseValueSelect,
      container: fuseValueContainer,
      messageElement: fuseValueMessage,
      valid,
    });
    syncFuseValuePicker({ isValid: valid });
    if (!valid) {
      requirements.push('choose a fuse value');
    }
  } else {
    updateInputFieldState({
      input: fuseValueSelect,
      container: fuseValueContainer,
      messageElement: fuseValueMessage,
      valid: true,
    });
    syncFuseValuePicker({ isValid: true });
  }

  if (hardwareType === 'Bolt' && (state.showImage || state.showStandard)) {
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
    syncBoltDrivePicker({ isValid: driveValid });
    if (!headValid) {
      requirements.push('select a head style');
    }
    if (!driveValid) {
      requirements.push('select a drive style');
    }
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
    syncBoltDrivePicker({ isValid: true });
  }

  if (hardwareType === 'Nut' && (state.showImage || state.showStandard)) {
    const typeValid = Boolean(state.nutType);
    updateInputFieldState({
      input: nutTypeSelect,
      container: nutTypeContainer,
      messageElement: nutTypeMessage,
      valid: typeValid,
    });
    if (!typeValid) {
      requirements.push('choose a nut type');
    }
  } else {
    updateInputFieldState({
      input: nutTypeSelect,
      container: nutTypeContainer,
      messageElement: nutTypeMessage,
      valid: true,
    });
  }

  if (hardwareType === 'Connector') {
    const categoryValid = Boolean(state.connectorCategory);
    updateInputFieldState({
      input: connectorCategorySelect,
      container: connectorCategoryContainer,
      messageElement: connectorCategoryMessage,
      valid: categoryValid,
    });
    updateInputFieldState({
      input: notesInput,
      container: notesField,
      messageElement: connectorNotesMessage,
      valid: true,
    });
    if (!categoryValid) {
      requirements.push('choose a connector category');
    }
  } else {
    updateInputFieldState({
      input: connectorCategorySelect,
      container: connectorCategoryContainer,
      messageElement: connectorCategoryMessage,
      valid: true,
    });
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
    if (!valid) {
      requirements.push('select a bearing');
    }
  } else {
    updateInputFieldState({
      input: bearingTypeSelect,
      container: bearingOptionsContainer,
      messageElement: bearingTypeMessage,
      valid: true,
    });
  }

  if (hardwareType === 'Component') {
    const categoryValid = Boolean(state.componentCategory);
    const mountValid = Boolean(state.componentMount);
    updateRadioGroupFeedback({
      radios: componentCategoryRadios,
      container: componentCategoryContainer,
      messageElement: componentCategoryMessage,
      valid: categoryValid,
    });
    updateRadioGroupFeedback({
      radios: componentMountRadios,
      container: componentMountContainer,
      messageElement: componentMountMessage,
      valid: mountValid,
    });
    if (!categoryValid) {
      requirements.push('choose a component type');
    }
    if (!mountValid) {
      requirements.push('choose a mounting style');
    }
  } else {
    updateRadioGroupFeedback({
      radios: componentCategoryRadios,
      container: componentCategoryContainer,
      messageElement: componentCategoryMessage,
      valid: true,
    });
    updateRadioGroupFeedback({
      radios: componentMountRadios,
      container: componentMountContainer,
      messageElement: componentMountMessage,
      valid: true,
    });
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
    if (!valid) {
      requirements.push('add a custom label title');
    }
  } else {
    updateInputFieldState({
      input: customLine1Input,
      container: customLine1Field,
      messageElement: customLine1Message,
      valid: true,
    });
  }

  if (formStatusMessage) {
    if (disabled) {
      const summary =
        requirements.length > 0
          ? formatRequirementSummary(requirements)
          : 'complete the required fields';
      formStatusMessage.textContent = `To enable Download and Print, ${summary}.`;
      formStatusMessage.classList.remove('d-none');
    } else {
      formStatusMessage.textContent = '';
      formStatusMessage.classList.add('d-none');
    }
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
  applyValidationFeedback(disabled);
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
    const hasImage = Boolean(state.customImageData);
    return {
      type: 'custom',
      hasImage,
      src: state.customImageData || '',
      alt: state.customImageName || 'Custom image',
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
    src: `images/${folder}/${filename}.png`,
    alt,
  };
}

function clearHardwareImageContent() {
  if (hardwareImageDiv) {
    hardwareImageDiv.innerHTML = '';
  }
}

function renderHardwareImage(imageInfo, innerHeightPx, contentWidthPx, gapPx) {
  if (!hardwareImageDiv) {
    return 0;
  }
  clearHardwareImageContent();
  if (!imageInfo || !(innerHeightPx > 0) || !(contentWidthPx > 0)) {
    hardwareImageDiv.style.display = 'none';
    hardwareImageDiv.style.removeProperty('flex-basis');
    hardwareImageDiv.style.removeProperty('max-width');
    hardwareImageDiv.style.removeProperty('width');
    hardwareImageDiv.style.removeProperty('min-height');
    return 0;
  }

  hardwareImageDiv.style.display = 'flex';
  hardwareImageDiv.style.flexShrink = '0';
  hardwareImageDiv.style.minHeight = `${innerHeightPx}px`;

  let usedWidthPx = 0;

  if (imageInfo.type === 'custom') {
    const targetWidth = Math.min(contentWidthPx, innerHeightPx);
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.width = `${targetWidth}px`;
    wrapper.style.height = `${innerHeightPx}px`;
    if (imageInfo.hasImage) {
      const img = document.createElement('img');
      img.src = imageInfo.src;
      img.alt = imageInfo.alt || 'Custom image';
      img.className = 'custom-image-preview';
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.decoding = 'async';
      img.loading = 'lazy';
      wrapper.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'custom-image-placeholder';
      placeholder.textContent = 'Add image';
      wrapper.appendChild(placeholder);
    }
    hardwareImageDiv.appendChild(wrapper);
    usedWidthPx = targetWidth;
  } else if (imageInfo.type === 'bolt') {
    const images = Array.isArray(imageInfo.images) ? imageInfo.images.filter(item => item && item.src) : [];
    if (images.length === 0) {
      hardwareImageDiv.style.display = 'none';
      hardwareImageDiv.style.removeProperty('flex-basis');
      hardwareImageDiv.style.removeProperty('max-width');
      hardwareImageDiv.style.removeProperty('width');
      return 0;
    }
    const maxWidth = Math.max(Math.min(contentWidthPx, innerHeightPx * 2), innerHeightPx);
    const group = document.createElement('div');
    group.className = 'bolt-image-group';
    group.style.height = `${innerHeightPx}px`;
    group.style.maxHeight = `${innerHeightPx}px`;
    const groupGap = Math.max(4, Math.round(gapPx * 1.1));
    group.style.gap = `${groupGap}px`;
    const gapTotal = groupGap * Math.max(images.length - 1, 0);
    const slotWidth = Math.max(1, Math.floor((maxWidth - gapTotal) / images.length));
    images.forEach((info, index) => {
      const img = document.createElement('img');
      img.src = info.src;
      img.alt = info.alt || 'Bolt reference';
      img.className = index === 0 ? 'hardware-photo bolt-drive-view' : 'hardware-photo bolt-head-view';
      img.style.maxHeight = `${innerHeightPx}px`;
      img.style.maxWidth = `${slotWidth}px`;
      img.decoding = 'async';
      img.loading = 'lazy';
      group.appendChild(img);
    });
    hardwareImageDiv.appendChild(group);
    usedWidthPx = maxWidth;
  } else if (imageInfo.type === 'fuse-illustration') {
    const maxWidth = Math.max(Math.min(contentWidthPx, innerHeightPx * 1.15), Math.round(innerHeightPx * 0.85));
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.width = `${maxWidth}px`;
    wrapper.style.height = `${innerHeightPx}px`;

    const img = document.createElement('img');
    img.src = imageInfo.src;
    img.alt = imageInfo.alt || 'Fuse illustration';
    img.className = 'hardware-illustration';
    img.style.maxHeight = '100%';
    img.style.maxWidth = '100%';
    img.decoding = 'async';
    img.loading = 'lazy';

    wrapper.appendChild(img);
    hardwareImageDiv.appendChild(wrapper);
    usedWidthPx = maxWidth;
  } else {
    const maxWidth = Math.max(Math.min(contentWidthPx, innerHeightPx * 1.2), innerHeightPx * 0.8);
    const img = document.createElement('img');
    img.src = imageInfo.src;
    img.alt = imageInfo.alt || 'Hardware reference illustration';
    img.className = 'hardware-photo';
    img.style.maxHeight = `${innerHeightPx}px`;
    img.style.maxWidth = `${maxWidth}px`;
    img.decoding = 'async';
    img.loading = 'lazy';
    hardwareImageDiv.appendChild(img);
    usedWidthPx = maxWidth;
  }

  hardwareImageDiv.style.flexBasis = `${usedWidthPx}px`;
  hardwareImageDiv.style.maxWidth = `${usedWidthPx}px`;
  hardwareImageDiv.style.width = `${usedWidthPx}px`;
  return usedWidthPx;
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

  if (state.hardwareType === 'Component') {
    const parts = [];
    if (state.componentCategory) {
      parts.push(state.componentCategory);
    }
    if (state.componentMount) {
      parts.push(state.componentMount);
    }
    const line1 = parts.join(' — ') || 'Component';
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

  if (state.hardwareType === 'Screw') {
    const pieces = [];
    if (state.threadSize) {
      pieces.push(state.threadSize);
    }
    if (state.length) {
      pieces.push(`× ${state.length}`);
    }
    const line1 = pieces.join(' ') || 'Screw';
    const line2Parts = [];
    if (state.standard) {
      line2Parts.push(state.standard);
    }
    if (state.notes) {
      line2Parts.push(state.notes);
    }
    return { line1, line2: line2Parts.join(' • '), line3: '' };
  }

  const line1 = state.threadSize || state.hardwareType || 'Label';
  const line2 = state.standard ? state.standard : state.notes || '';
  return { line1, line2, line3: '' };
}
function fitText(element, maxWidth, maxHeight, minSize, startSize) {
  if (!element || !(maxWidth > 0) || !(maxHeight > 0)) {
    return;
  }
  let size = Math.max(minSize, startSize);
  element.style.fontSize = `${size}px`;
  let iterations = 0;
  while (
    iterations < 40 &&
    size > minSize &&
    (element.scrollWidth > maxWidth || element.scrollHeight > maxHeight)
  ) {
    size -= 0.5;
    element.style.fontSize = `${size}px`;
    iterations += 1;
  }
}

function renderQrCode(content, sizePx) {
  if (!qrCanvas) {
    return 0;
  }
  const ctx = qrCanvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
  }
  if (!content || !(sizePx > 0)) {
    qrCanvas.style.display = 'none';
    qrCanvas.style.removeProperty('margin-left');
    qrCanvas.style.removeProperty('margin-right');
    return 0;
  }
  const size = Math.max(1, Math.round(sizePx));
  qrCanvas.width = size;
  qrCanvas.height = size;
  qrCanvas.style.width = `${size}px`;
  qrCanvas.style.height = `${size}px`;
  qrCanvas.style.display = 'block';
  const requestId = ++qrRenderRequestId;
  loadQrCodeLibrary()
    .then(qrLib => {
      if (qrRenderRequestId !== requestId) {
        return;
      }
      const renderFn = qrLib && typeof qrLib.toCanvas === 'function' ? qrLib.toCanvas : null;
      if (!renderFn) {
        throw new Error('QR code renderer unavailable');
      }
      const options = {
        width: size,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#00000000',
        },
      };
      renderFn.call(qrLib, qrCanvas, content, options);
    })
    .catch(error => {
      if (qrRenderRequestId === requestId && qrCanvas) {
        const canvasContext = qrCanvas.getContext('2d');
        if (canvasContext) {
          canvasContext.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
        }
        qrCanvas.style.display = 'none';
      }
      console.error('QR code generation failed', error);
    });
  return size;
}

function hidePreviewContent() {
  if (!labelInner) {
    return;
  }
  labelInner.style.display = 'none';
  labelInner.classList.remove('has-hardware-image');
  if (hardwareImageDiv) {
    hardwareImageDiv.style.display = 'none';
    clearHardwareImageContent();
    hardwareImageDiv.style.removeProperty('flex-basis');
    hardwareImageDiv.style.removeProperty('max-width');
    hardwareImageDiv.style.removeProperty('width');
    hardwareImageDiv.style.removeProperty('min-height');
  }
  if (line1Div) {
    line1Div.textContent = '';
  }
  if (line2Div) {
    line2Div.textContent = '';
    line2Div.style.display = 'none';
  }
  if (line3Div) {
    line3Div.textContent = '';
    line3Div.style.display = 'none';
  }
  if (qrCanvas) {
    const ctx = qrCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
    }
    qrCanvas.style.display = 'none';
    qrCanvas.style.removeProperty('margin-left');
    qrCanvas.style.removeProperty('margin-right');
  }
  labelInner.style.removeProperty('--label-padding-inline-start');
  labelInner.style.removeProperty('--label-padding-inline-end');
  labelInner.style.removeProperty('--label-padding-x');
  labelInner.style.removeProperty('--label-padding-y');
  labelInner.style.removeProperty('--label-gap');
}
export function updatePreview() {
  if (
    !previewContainer ||
    !labelInner ||
    !labelSvg ||
    !labelFrame ||
    !printableGroup ||
    !printableForeignObject ||
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
  document.documentElement.style.setProperty('--label-width-mm', `${safeWidthMm}mm`);
  document.documentElement.style.setProperty('--label-height-mm', `${safeHeightMm}mm`);

  const labelWidthPx = Math.max(1, Math.round(labelWidthMm * pxPerMm));
  const labelHeightPx = Math.max(1, Math.round(labelHeightMm * pxPerMm));
  previewContainer.style.width = `${labelWidthPx}px`;
  previewContainer.style.height = `${labelHeightPx}px`;
  previewDimensions.width = labelWidthPx;
  previewDimensions.height = labelHeightPx;
  applyPreviewScale();

  labelSvg.setAttribute('viewBox', `0 0 ${labelWidthPx} ${labelHeightPx}`);
  labelSvg.style.width = `${labelWidthPx}px`;
  labelSvg.style.height = `${labelHeightPx}px`;
  applySvgGeometryElements(
    { frame: labelFrame, group: printableGroup, foreignObject: printableForeignObject },
    geometry,
  );

  const innerWidthPx = Math.max(1, Math.round(printableWidthMm * pxPerMm));
  const innerHeightPx = Math.max(1, Math.round(printableHeightMm * pxPerMm));
  labelInner.style.width = `${innerWidthPx}px`;
  labelInner.style.height = `${innerHeightPx}px`;

  const printableValid = printableWidthMm > 0 && printableHeightMm > 0;
  const ready = printableValid && isLabelReady();
  labelSvg.setAttribute('aria-hidden', ready ? 'false' : 'true');

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

  labelInner.style.display = 'flex';

  const paddingBaseX = Math.round(mmToPx(1.2));
  const paddingBaseY = Math.round(mmToPx(1));
  const gapBase = Math.round(mmToPx(0.7));
  let paddingLeftPx = paddingBaseX;
  let paddingRightPx = paddingBaseX;
  const paddingTopPx = paddingBaseY;
  const paddingBottomPx = paddingBaseY;

  const minTextWidthPx = Math.max(Math.round(mmToPx(MIN_TEXT_WIDTH_MM)), Math.floor(innerHeightPx * 1.1));
  const availableContentWidthPx = Math.max(0, innerWidthPx - paddingLeftPx - paddingRightPx);
  const hardwareInfo = resolveHardwareImageInfo();
  const gapPx = gapBase;
  const hardwareLimitPx = Math.max(0, availableContentWidthPx - minTextWidthPx);
  const hardwareWidthPx = renderHardwareImage(hardwareInfo, innerHeightPx, hardwareLimitPx, gapPx);
  const hardwareVisible = hardwareWidthPx > 0;

  let remainingWidthPx = availableContentWidthPx - hardwareWidthPx;
  if (hardwareWidthPx > 0) {
    remainingWidthPx = Math.max(0, remainingWidthPx - gapPx);
  }

  const qrContent = state.showQr && state.qrContent ? state.qrContent.trim() : '';
  let qrWidthPx = 0;
  if (qrContent && remainingWidthPx > minTextWidthPx) {
    const qrLimitPx = Math.max(0, remainingWidthPx - minTextWidthPx);
    const qrMaxHeight = Math.max(0, innerHeightPx - paddingTopPx - paddingBottomPx);
    const candidate = Math.min(qrLimitPx, qrMaxHeight);
    if (candidate >= Math.round(mmToPx(4))) {
      qrWidthPx = renderQrCode(qrContent, candidate);
      if (qrWidthPx > 0) {
        qrCanvas.style.marginLeft = `${gapPx}px`;
        qrCanvas.style.marginRight = '0px';
        remainingWidthPx = Math.max(0, remainingWidthPx - qrWidthPx - gapPx);
      }
    } else {
      renderQrCode('', 0);
    }
  } else {
    renderQrCode('', 0);
  }

  const textWidthPx = Math.max(minTextWidthPx, remainingWidthPx);
  if (textBlockDiv) {
    textBlockDiv.style.maxWidth = `${textWidthPx}px`;
  }

  const lines = buildTextLines();
  if (line1Div) {
    line1Div.textContent = lines.line1 || '';
  }
  if (line2Div) {
    line2Div.textContent = lines.line2 || '';
    line2Div.style.display = lines.line2 ? 'block' : 'none';
  }
  if (line3Div) {
    line3Div.textContent = lines.line3 || '';
    line3Div.style.display = lines.line3 ? 'block' : 'none';
  }

  const primaryStartSize = Math.min(Math.max(innerHeightPx * 0.45, 8), textWidthPx);
  fitText(line1Div, textWidthPx, innerHeightPx, 6, primaryStartSize);
  const secondaryStartSize = Math.min(Math.max(innerHeightPx * 0.22, 5), textWidthPx);
  fitText(line2Div, textWidthPx, innerHeightPx, 5, secondaryStartSize);
  fitText(line3Div, textWidthPx, innerHeightPx, 5, secondaryStartSize);

  labelInner.style.setProperty('--label-padding-inline-start', `${paddingLeftPx}px`);
  labelInner.style.setProperty('--label-padding-inline-end', `${paddingRightPx}px`);
  labelInner.style.setProperty('--label-padding-x', `${Math.round((paddingLeftPx + paddingRightPx) / 2)}px`);
  labelInner.style.setProperty('--label-padding-y', `${paddingBaseY}px`);
  labelInner.style.setProperty('--label-gap', `${gapPx}px`);

  labelInner.classList.toggle('has-hardware-image', hardwareVisible);

  previewReadyState = true;
  announcePreviewStatus('Preview updated.');
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

function getPreviewScale() {
  if (!previewContainer || !previewDimensions.width) {
    return 1;
  }
  const rect = previewContainer.getBoundingClientRect();
  if (!(rect.width > 0)) {
    return 1;
  }
  const scale = rect.width / previewDimensions.width;
  return scale > 0 ? scale : 1;
}

function captureLayoutFromDom() {
  if (!labelInner || labelInner.style.display === 'none') {
    throw new Error('Label preview is not available.');
  }

  const geometry = getLabelGeometry();
  const labelWidthPx = Math.max(1, Math.round(geometry.labelWidthMm * pxPerMm));
  const labelHeightPx = Math.max(1, Math.round(geometry.labelHeightMm * pxPerMm));
  const printableWidthPx = Math.max(1, Math.round(geometry.printableWidthMm * pxPerMm));
  const printableHeightPx = Math.max(1, Math.round(geometry.printableHeightMm * pxPerMm));
  const marginXPx = Math.max(0, Math.round(geometry.marginX * pxPerMm));
  const marginYPx = Math.max(0, Math.round(geometry.marginY * pxPerMm));

  const scale = getPreviewScale();
  const convert = value => Math.round(value / (scale || 1));

  const labelRect = labelSvg ? labelSvg.getBoundingClientRect() : labelInner.getBoundingClientRect();

  const backgroundStyle = window.getComputedStyle(labelInner);
  const backgroundColor = backgroundStyle.backgroundColor || '#ffffff';
  const defaultTextColor = backgroundStyle.color || '#000000';

  const hardwareImages = [];
  if (hardwareImageDiv) {
    const images = hardwareImageDiv.querySelectorAll('img');
    images.forEach(img => {
      const rect = img.getBoundingClientRect();
      hardwareImages.push({
        src: img.currentSrc || img.src,
        xPx: convert(rect.left - labelRect.left),
        yPx: convert(rect.top - labelRect.top),
        widthPx: convert(rect.width),
        heightPx: convert(rect.height),
      });
    });
  }

  const collectTextLine = element => {
    if (!element) {
      return null;
    }
    const text = element.textContent ? element.textContent.trim() : '';
    if (!text) {
      return null;
    }
    if (element.offsetParent === null) {
      return null;
    }
    const styles = window.getComputedStyle(element);
    const fontSize = Number.parseFloat(styles.fontSize);
    if (!(fontSize > 0)) {
      return null;
    }
    const rect = element.getBoundingClientRect();
    const topPx = convert(rect.top - labelRect.top);
    const xPx = convert(rect.left - labelRect.left);
    return {
      text,
      fontSizePx: fontSize,
      fontStyle: styles.fontStyle || 'normal',
      fontWeight: styles.fontWeight || '400',
      fontFamily: styles.fontFamily || 'sans-serif',
      color: styles.color || defaultTextColor,
      xPx,
      baselinePx: Math.round(topPx + fontSize),
    };
  };

  const textLines = [
    collectTextLine(line1Div),
    collectTextLine(line2Div),
    collectTextLine(line3Div),
  ].filter(Boolean);

  let qr = null;
  if (qrCanvas && qrCanvas.style.display !== 'none') {
    try {
      const rect = qrCanvas.getBoundingClientRect();
      qr = {
        widthPx: convert(rect.width),
        heightPx: convert(rect.height),
        xPx: convert(rect.left - labelRect.left),
        yPx: convert(rect.top - labelRect.top),
        dataUrl: qrCanvas.toDataURL('image/png'),
      };
    } catch (error) {
      console.warn('Unable to capture QR code for export.', error);
      qr = null;
    }
  }

  return {
    geometry,
    labelWidthPx,
    labelHeightPx,
    printableWidthPx,
    printableHeightPx,
    marginXPx,
    marginYPx,
    backgroundColor,
    defaultTextColor,
    hardwareImages,
    textLines,
    qr,
  };
}
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image failed to load.'));
    img.src = src;
  });
}

async function renderLayoutToCanvas(layout) {
  const totalWidthPx = Math.max(1, Math.round(layout.labelWidthPx));
  const totalHeightPx = Math.max(1, Math.round(layout.labelHeightPx));
  const canvas = document.createElement('canvas');
  canvas.width = totalWidthPx;
  canvas.height = totalHeightPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to obtain a 2D canvas context for export.');
  }
  ctx.clearRect(0, 0, totalWidthPx, totalHeightPx);
  ctx.fillStyle = layout.backgroundColor || '#ffffff';
  ctx.fillRect(0, 0, totalWidthPx, totalHeightPx);

  for (const image of layout.hardwareImages) {
    if (!image.src) {
      continue;
    }
    try {
      const img = await loadImage(image.src);
      ctx.drawImage(
        img,
        image.xPx,
        image.yPx,
        Math.max(1, Math.round(image.widthPx)),
        Math.max(1, Math.round(image.heightPx)),
      );
    } catch (error) {
      console.warn('Hardware image could not be rendered for export.', error);
    }
  }

  ctx.textBaseline = 'alphabetic';
  for (const line of layout.textLines) {
    const fontParts = [line.fontStyle, line.fontWeight, `${line.fontSizePx}px`, line.fontFamily];
    ctx.font = fontParts.filter(Boolean).join(' ');
    ctx.fillStyle = line.color || layout.defaultTextColor;
    ctx.fillText(line.text, line.xPx, line.baselinePx);
  }

  if (layout.qr && layout.qr.dataUrl) {
    try {
      const qrImg = await loadImage(layout.qr.dataUrl);
      ctx.drawImage(
        qrImg,
        layout.qr.xPx,
        layout.qr.yPx,
        Math.max(1, Math.round(layout.qr.widthPx)),
        Math.max(1, Math.round(layout.qr.heightPx)),
      );
    } catch (error) {
      console.warn('QR code could not be rendered for export.', error);
    }
  }

  return canvas;
}

function canvasToBlob(canvas, type = 'image/png', quality) {
  if (typeof canvas.toBlob === 'function') {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Unable to convert canvas to blob.'));
        }
      }, type, quality);
    });
  }
  const dataUrl = canvas.toDataURL(type, quality);
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    buffer[i] = binary.charCodeAt(i);
  }
  const mimeType = dataUrl.split(';')[0].split(':')[1] || type;
  return Promise.resolve(new Blob([buffer], { type: mimeType }));
}

export async function renderLabelPng() {
  updatePreview();
  await ensureFontsReady();
  const layout = captureLayoutFromDom();
  const canvas = await renderLayoutToCanvas(layout);
  const blob = await canvasToBlob(canvas, 'image/png');
  return {
    blob,
    widthPx: layout.labelWidthPx,
    heightPx: layout.labelHeightPx,
    printableWidthMm: layout.geometry.printableWidthMm,
    printableHeightMm: layout.geometry.printableHeightMm,
    svgMarkup: null,
  };
}

export async function renderLabelSvgMarkup() {
  updatePreview();
  await ensureFontsReady();
  const layout = captureLayoutFromDom();
  const widthPx = Math.max(1, Math.round(layout.labelWidthPx));
  const heightPx = Math.max(1, Math.round(layout.labelHeightPx));
  const svgParts = [
    `<svg xmlns="${SVG_XMLNS}" viewBox="0 0 ${widthPx} ${heightPx}" width="${widthPx}" height="${heightPx}">`,
    `<rect x="0" y="0" width="${widthPx}" height="${heightPx}" fill="${layout.backgroundColor}" />`,
  ];
  layout.hardwareImages.forEach(image => {
    if (!image.src) {
      return;
    }
    svgParts.push(
      `<image x="${image.xPx}" y="${image.yPx}" width="${Math.max(
        1,
        Math.round(image.widthPx),
      )}" height="${Math.max(1, Math.round(image.heightPx))}" href="${image.src}" />`,
    );
  });
  layout.textLines.forEach(line => {
    const fontAttributes = [`font-family="${line.fontFamily.replace(/"/g, '&quot;')}"`];
    if (line.fontStyle) {
      fontAttributes.push(`font-style="${line.fontStyle}"`);
    }
    if (line.fontWeight) {
      fontAttributes.push(`font-weight="${line.fontWeight}"`);
    }
    fontAttributes.push(`font-size="${line.fontSizePx}"`);
    const safeText = line.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    svgParts.push(
      `<text x="${line.xPx}" y="${line.baselinePx}" fill="${line.color}" ${fontAttributes.join(
        ' ',
      )}>${safeText}</text>`,
    );
  });
  if (layout.qr && layout.qr.dataUrl) {
    svgParts.push(
      `<image x="${layout.qr.xPx}" y="${layout.qr.yPx}" width="${Math.max(
        1,
        Math.round(layout.qr.widthPx),
      )}" height="${Math.max(1, Math.round(layout.qr.heightPx))}" href="${layout.qr.dataUrl}" />`,
    );
  }
  svgParts.push('</svg>');
  return svgParts.join('');
}
