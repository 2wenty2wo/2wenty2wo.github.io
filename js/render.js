import { state } from './state.js';
import { elements } from './dom-elements.js';
import {
  pxPerMm,
  hardwareImageFolders,
  findConnectorCategory,
  boltHeadMap,
  boltDriveMap,
} from './data.js';
import { loadHtml2Canvas, loadQrCodeLibrary } from './lazy-loaders.js';

const {
  labelSizeDisplay,
  printAreaDisplay,
  previewContainer,
  labelInner,
  hardwareImageDiv,
  textBlockDiv,
  line1Div,
  line2Div,
  line3Div,
  previewPlaceholder,
  previewStatusText,
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
  fuseValueSelect,
  fuseValueContainer,
  connectorCategorySelect,
  connectorCategoryContainer,
  notesInput,
  notesField,
  standardSelect,
  standardField,
  boltHeadSelect,
  boltDriveSelect,
  boltHeadField,
  boltDriveField,
  boltHeadMessage,
  boltDriveMessage,
  bearingTypeSelect,
  bearingOptionsContainer,
  componentCategoryContainer,
  componentCategoryRadios,
  componentMountContainer,
  componentMountRadios,
  customLine1Input,
  customLine1Field,
  threadSizeMessage,
  lengthMessage,
  fuseValueMessage,
  connectorCategoryMessage,
  connectorNotesMessage,
  bearingTypeMessage,
  componentCategoryMessage,
  componentMountMessage,
  customLine1Message,
  formStatusMessage,
} = elements;

// Derived from the hardware label spec: a 37 × 12 mm label yields a 33 × 10 mm
// printable area, implying 2 mm horizontal and 1 mm vertical safe margins per
// side.
const HORIZONTAL_SAFE_MARGIN_PER_SIDE_MM = 2;
const VERTICAL_SAFE_MARGIN_PER_SIDE_MM = 1;

function computePrintableDimension(dimensionMm, marginPerSideMm) {
  if (!Number.isFinite(dimensionMm)) {
    return 0;
  }
  const marginTotalMm = marginPerSideMm * 2;
  return Math.max(0, dimensionMm - marginTotalMm);
}

let qrRenderRequestId = 0;
let previewStatusFrameId = null;
let previewReadyState = false;

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

  const normalizedMessage = typeof message === 'string' ? message.trim() : '';
  if (!normalizedMessage) {
    return;
  }

  const setMessage = () => {
    previewStatusText.textContent = normalizedMessage;
    previewStatusFrameId = null;
  };

  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    previewStatusFrameId = window.requestAnimationFrame(setMessage);
  } else {
    setTimeout(setMessage, 0);
  }
}

function setMessageVisibility(messageElement, message, show) {
  if (!messageElement) {
    return;
  }
  const normalizedMessage = typeof message === 'string' ? message : '';
  const trimmedMessage = normalizedMessage.trim();
  const shouldShow = Boolean(show && trimmedMessage.length > 0);
  if (shouldShow) {
    messageElement.textContent = trimmedMessage;
    messageElement.classList.remove('d-none');
    messageElement.setAttribute('aria-hidden', 'false');
  } else {
    messageElement.textContent = '';
    messageElement.classList.add('d-none');
    messageElement.setAttribute('aria-hidden', 'true');
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
  const normalizedMessage = typeof message === 'string' ? message : '';
  const trimmedMessage = normalizedMessage.trim();
  const shouldShowMessage = !valid && trimmedMessage.length > 0;
  setMessageVisibility(messageElement, normalizedMessage, shouldShowMessage);
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
  const normalizedMessage = typeof message === 'string' ? message : '';
  const trimmedMessage = normalizedMessage.trim();
  const shouldShowMessage = !valid && trimmedMessage.length > 0;
  setMessageVisibility(messageElement, normalizedMessage, shouldShowMessage);
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

const boltSvgTrimCache = new Map();
let svgMeasurementContainer = null;

function ensureSvgMeasurementContainer() {
  if (typeof document === 'undefined') {
    return null;
  }
  if (!document.body) {
    return null;
  }
  if (svgMeasurementContainer && svgMeasurementContainer.isConnected) {
    return svgMeasurementContainer;
  }
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.width = '0';
  container.style.height = '0';
  container.style.overflow = 'hidden';
  container.style.visibility = 'hidden';
  container.style.pointerEvents = 'none';
  container.setAttribute('aria-hidden', 'true');
  document.body.appendChild(container);
  svgMeasurementContainer = container;
  return container;
}

function deriveTrimmedSvgMarkup(svgText) {
  if (!svgText || typeof svgText !== 'string') {
    return null;
  }
  if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') {
    return null;
  }
  let doc;
  try {
    const parser = new DOMParser();
    doc = parser.parseFromString(svgText, 'image/svg+xml');
  } catch {
    return null;
  }
  if (!doc) {
    return null;
  }
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    return null;
  }
  const svgElement = doc.documentElement;
  if (!svgElement || svgElement.nodeName.toLowerCase() !== 'svg') {
    return null;
  }
  const container = ensureSvgMeasurementContainer();
  if (!container) {
    return null;
  }
  const measuringSvg = svgElement.cloneNode(true);
  container.appendChild(measuringSvg);
  let bbox;
  try {
    bbox = measuringSvg.getBBox();
  } catch {
    container.removeChild(measuringSvg);
    return null;
  }
  container.removeChild(measuringSvg);
  if (
    !bbox ||
    !Number.isFinite(bbox.width) ||
    !Number.isFinite(bbox.height) ||
    bbox.width <= 0 ||
    bbox.height <= 0
  ) {
    return null;
  }
  const marginRatio = 0.02;
  const marginX = bbox.width * marginRatio;
  const marginY = bbox.height * marginRatio;
  const trimmedSvg = svgElement.cloneNode(true);
  trimmedSvg.removeAttribute('width');
  trimmedSvg.removeAttribute('height');
  trimmedSvg.setAttribute(
    'viewBox',
    `${bbox.x - marginX} ${bbox.y - marginY} ${bbox.width + marginX * 2} ${bbox.height + marginY * 2}`,
  );
  try {
    return new XMLSerializer().serializeToString(trimmedSvg);
  } catch {
    return null;
  }
}

function fetchTrimmedSvgMarkup(src) {
  if (!src) {
    return null;
  }
  const cached = boltSvgTrimCache.get(src);
  if (cached) {
    return cached;
  }
  if (typeof fetch !== 'function') {
    const fallback = Promise.resolve(null);
    boltSvgTrimCache.set(src, fallback);
    return fallback;
  }
  const promise = fetch(src)
    .then(response => {
      if (!response || !response.ok) {
        return null;
      }
      return response.text();
    })
    .then(svgText => {
      if (!svgText) {
        return null;
      }
      return deriveTrimmedSvgMarkup(svgText);
    })
    .catch(() => null);
  boltSvgTrimCache.set(src, promise);
  return promise;
}

function revokeTrimmedSvgObjectUrl(img) {
  if (!img || !img.dataset) {
    return;
  }
  const { trimmedSvgObjectUrl } = img.dataset;
  if (
    trimmedSvgObjectUrl &&
    typeof URL !== 'undefined' &&
    typeof URL.revokeObjectURL === 'function'
  ) {
    try {
      URL.revokeObjectURL(trimmedSvgObjectUrl);
    } catch {
      // Ignore failures to revoke object URLs; they will be cleaned up by the browser.
    }
  }
  delete img.dataset.trimmedSvgObjectUrl;
  delete img.dataset.trimmedSvgSource;
}

function clearHardwareImageContent() {
  if (!hardwareImageDiv) {
    return;
  }
  const existingImages = hardwareImageDiv.querySelectorAll('img');
  existingImages.forEach(image => {
    revokeTrimmedSvgObjectUrl(image);
  });
  hardwareImageDiv.innerHTML = '';
}

function applyTrimmedSvgToImage(img, originalSrc) {
  if (!img || typeof originalSrc !== 'string' || !originalSrc) {
    return;
  }
  if (img.dataset.trimmedSvgSource === originalSrc && img.dataset.trimmedSvgObjectUrl) {
    return;
  }
  const normalizedSrc = originalSrc.toLowerCase();
  if (!normalizedSrc.endsWith('.svg')) {
    return;
  }
  const promise = fetchTrimmedSvgMarkup(originalSrc);
  if (!promise || typeof promise.then !== 'function') {
    return;
  }
  promise.then(trimmedMarkup => {
    if (!trimmedMarkup) {
      return;
    }
    if (!img.isConnected) {
      return;
    }
    if (img.dataset.trimmedSvgSource === originalSrc && img.dataset.trimmedSvgObjectUrl) {
      return;
    }
    if (
      typeof Blob === 'undefined' ||
      typeof URL === 'undefined' ||
      typeof URL.createObjectURL !== 'function'
    ) {
      return;
    }
    try {
      const blob = new Blob([trimmedMarkup], { type: 'image/svg+xml' });
      const objectUrl = URL.createObjectURL(blob);
      if (img.dataset.trimmedSvgObjectUrl) {
        revokeTrimmedSvgObjectUrl(img);
      }
      img.dataset.trimmedSvgSource = originalSrc;
      img.dataset.trimmedSvgObjectUrl = objectUrl;
      img.src = objectUrl;
    } catch {
      // Silently ignore failures to construct the trimmed image.
    }
  });
}

function applyValidationFeedback(disabled) {
  const requirements = [];
  const hardwareType = state.hardwareType;
  const hardwareLabel = typeof hardwareType === 'string' ? hardwareType.toLowerCase() : '';

  const needsThreadSize = !['Fuse', 'Connector', 'Custom', 'Bearing', 'Component'].includes(
    hardwareType,
  );
  const threadValid = !needsThreadSize || Boolean(state.threadSize);
  updateInputFieldState({
    input: threadSizeSelect,
    container: threadSizeContainer,
    messageElement: threadSizeMessage,
    valid: threadValid,
  });
  if (!threadValid) {
    requirements.push('select a thread size');
  }

  const needsLength = hardwareType === 'Bolt' || hardwareType === 'Screw';
  const lengthValue = Number.parseFloat(state.length);
  const lengthValid = !needsLength || (Number.isFinite(lengthValue) && lengthValue > 0);
  updateInputFieldState({
    input: lengthInput,
    container: lengthContainer,
    messageElement: lengthMessage,
    valid: lengthValid,
  });
  if (!lengthValid) {
    const lengthDescription = hardwareLabel ? `${hardwareLabel} length` : 'length';
    requirements.push(`enter the ${lengthDescription}`);
  }

  if (hardwareType === 'Bolt') {
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
    updateInputFieldState({
      input: null,
      container: standardField,
      messageElement: null,
      valid: headValid && driveValid,
    });
    updateInputFieldState({
      input: standardSelect,
      container: null,
      messageElement: null,
      valid: true,
    });
    if (!headValid) {
      requirements.push('choose a head style');
    }
    if (!driveValid) {
      requirements.push('choose a drive style');
    }
  } else {
    const standardRequired =
      hardwareType === 'Screw' && Boolean(standardSelect) && Boolean(standardField);
    const needsStandard =
      standardRequired && Boolean(hardwareImageFolders[hardwareType]) && !standardSelect.disabled;
    const standardValid = !needsStandard || Boolean(state.standardCode);
    updateInputFieldState({
      input: standardSelect,
      container: standardField,
      messageElement: null,
      valid: standardValid,
    });
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
    if (!standardValid) {
      requirements.push('choose a hardware standard');
    }
  }

  const needsFuseValue = hardwareType === 'Fuse';
  const fuseValid = !needsFuseValue || Boolean(state.fuseValue);
  updateInputFieldState({
    input: fuseValueSelect,
    container: fuseValueContainer,
    messageElement: fuseValueMessage,
    valid: fuseValid,
  });
  if (!fuseValid) {
    requirements.push('choose a fuse value');
  }

  const isConnector = hardwareType === 'Connector';
  const connectorCategoryValid = !isConnector || Boolean(state.connectorCategory);
  updateInputFieldState({
    input: connectorCategorySelect,
    container: connectorCategoryContainer,
    messageElement: connectorCategoryMessage,
    valid: connectorCategoryValid,
  });
  if (!connectorCategoryValid) {
    requirements.push('choose a connector category');
  }

  const connectorNotesValid = true;
  updateInputFieldState({
    input: notesInput,
    container: notesField,
    messageElement: connectorNotesMessage,
    valid: connectorNotesValid,
  });

  const needsBearingSelection = hardwareType === 'Bearing';
  const bearingValid = !needsBearingSelection || Boolean(state.bearingType);
  updateInputFieldState({
    input: bearingTypeSelect,
    container: bearingOptionsContainer,
    messageElement: bearingTypeMessage,
    valid: bearingValid,
  });
  if (!bearingValid) {
    requirements.push('select a bearing');
  }

  const needsComponentSelection = hardwareType === 'Component';
  const componentCategoryValid = !needsComponentSelection || Boolean(state.componentCategory);
  updateRadioGroupFeedback({
    radios: componentCategoryRadios,
    container: componentCategoryContainer,
    messageElement: componentCategoryMessage,
    valid: componentCategoryValid,
  });
  if (!componentCategoryValid) {
    requirements.push('choose a component type');
  }

  const componentMountValid = !needsComponentSelection || Boolean(state.componentMount);
  updateRadioGroupFeedback({
    radios: componentMountRadios,
    container: componentMountContainer,
    messageElement: componentMountMessage,
    valid: componentMountValid,
  });
  if (!componentMountValid) {
    requirements.push('choose a mounting style');
  }

  const needsCustomTitle = hardwareType === 'Custom';
  const customTitle = (state.customLine1 || '').trim();
  const customTitleValid = !needsCustomTitle || customTitle.length > 0;
  updateInputFieldState({
    input: customLine1Input,
    container: customLine1Field,
    messageElement: customLine1Message,
    valid: customTitleValid,
  });
  if (!customTitleValid) {
    requirements.push('add a custom label title');
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

function normalizeStandardCode(code) {
  return (code || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getHardwareImageInfo() {
  const catalogKey = state.hardwareType;
  if (!catalogKey) {
    return null;
  }
  if (catalogKey === 'Bolt') {
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
    const altPieces = [];
    if (headEntry.label) {
      altPieces.push(headEntry.label);
    }
    if (driveEntry.label) {
      altPieces.push(driveEntry.label);
    }
    const altBase = altPieces.length > 0 ? altPieces.join(' — ') : 'Bolt';
    return {
      type: 'boltSvg',
      headSrc: `images/bolts/head/${headImage}.svg`,
      driveSrc: `images/bolts/drive/${driveImage}.svg`,
      headAlt: `${altBase} — head view`,
      driveAlt: `${altBase} — drive view`,
    };
  }
  const code = (state.standardCode || '').trim();
  const standardName = (state.standard || '').trim();
  const folder = hardwareImageFolders[catalogKey];
  if (!folder) {
    return null;
  }
  if (!code) {
    return null;
  }
  const filename = normalizeStandardCode(code);
  if (!filename) {
    return null;
  }
  const altPieces = [];
  if (code) {
    altPieces.push(code);
  }
  if (standardName && standardName.toLowerCase() !== code.toLowerCase()) {
    altPieces.push(standardName);
  }
  const src = `images/${folder}/${filename}.png`;
  const altBase = altPieces.length > 0 ? altPieces.join(' — ') : '';
  return {
    type: 'photo',
    src,
    alt: altBase ? `${altBase} reference illustration` : 'Hardware reference illustration',
  };
}

function applyTextFitting(primaryFontSize, secondaryFontSize) {
  if (!textBlockDiv || !line1Div) {
    return;
  }

  line1Div.style.fontSize = primaryFontSize + 'px';
  if (line2Div) {
    line2Div.style.fontSize = secondaryFontSize + 'px';
  }
  if (line3Div) {
    line3Div.style.fontSize = secondaryFontSize + 'px';
  }

  const availableWidth = textBlockDiv.clientWidth;
  const availableHeight = labelInner ? labelInner.clientHeight : textBlockDiv.clientHeight;
  if (availableWidth <= 0 || availableHeight <= 0) {
    return;
  }

  const absolutePrimaryMin = 4;
  const absoluteSecondaryMin = 3.5;
  const lineStates = [];

  lineStates.push({
    element: line1Div,
    size: primaryFontSize,
    minSize: Math.max(absolutePrimaryMin, Math.min(primaryFontSize, 6)),
  });

  const secondaryLines = [line2Div, line3Div].filter(
    element =>
      element &&
      element.style.display !== 'none' &&
      element.textContent &&
      element.textContent.trim(),
  );

  secondaryLines.forEach(element => {
    lineStates.push({
      element,
      size: secondaryFontSize,
      minSize: Math.max(absoluteSecondaryMin, Math.min(secondaryFontSize, 5)),
    });
  });

  const tolerance = 0.5;
  let iterations = 0;
  const maxIterations = 200;
  while (iterations < maxIterations) {
    let adjusted = false;

    lineStates.forEach(state => {
      if (state.element.scrollWidth - tolerance > availableWidth && state.size > state.minSize) {
        state.size = Math.max(state.minSize, state.size - 0.5);
        state.element.style.fontSize = state.size + 'px';
        adjusted = true;
      }
    });

    if (textBlockDiv.scrollHeight - tolerance > availableHeight) {
      const reducible = lineStates.filter(state => state.size > state.minSize);
      if (reducible.length > 0) {
        const largest = reducible.reduce((prev, current) =>
          current.size > prev.size ? current : prev,
        );
        largest.size = Math.max(largest.minSize, largest.size - 0.5);
        largest.element.style.fontSize = largest.size + 'px';
        adjusted = true;
      }
    }

    if (!adjusted) {
      break;
    }

    iterations += 1;
  }
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
    return Boolean(state.threadSize && state.length && state.boltHead && state.boltDrive);
  }
  if (state.hardwareType === 'Screw') {
    return Boolean(state.threadSize && state.length && state.standardCode);
  }
  return Boolean(state.threadSize);
}

export function updateDownloadState() {
  const ready = isLabelReady();
  const disabled = !ready;
  if (downloadButton) {
    downloadButton.disabled = disabled;
    const downloadActionLabel = 'Download label as a PNG image';
    downloadButton.setAttribute('aria-label', downloadActionLabel);
    downloadButton.title = disabled
      ? 'Complete the label details to enable downloading.'
      : downloadActionLabel;
  }
  if (printButton) {
    printButton.disabled = disabled;
    const printActionLabel = 'Open a print-ready preview of the label';
    printButton.setAttribute('aria-label', printActionLabel);
    printButton.title = disabled
      ? 'Complete the label details to enable printing.'
      : printActionLabel;
  }
  if (shareButton) {
    shareButton.disabled = disabled;
    const shareActionLabel = 'Share a link to this label';
    shareButton.setAttribute('aria-label', shareActionLabel);
    shareButton.title = disabled
      ? 'Complete the label details to enable sharing.'
      : shareActionLabel;
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

export function updatePreview() {
  if (!previewContainer || !labelInner || !labelSizeDisplay || !printAreaDisplay) {
    return;
  }
  const width = state.widthMm;
  const height = state.heightMm;
  const printableWidth = computePrintableDimension(width, HORIZONTAL_SAFE_MARGIN_PER_SIDE_MM);
  const printableHeight = computePrintableDimension(height, VERTICAL_SAFE_MARGIN_PER_SIDE_MM);
  labelSizeDisplay.innerHTML = `${width}&nbsp;mm ×&nbsp;${height}&nbsp;mm (label size)`;
  printAreaDisplay.innerHTML = `${printableWidth}&nbsp;mm ×&nbsp;${printableHeight}&nbsp;mm (printable area)`;
  const safeWidthMm = Number.isFinite(width) && width > 0 ? width : 1;
  const safeHeightMm = Number.isFinite(height) && height > 0 ? height : 1;
  document.documentElement.style.setProperty('--label-width-mm', `${safeWidthMm}mm`);
  document.documentElement.style.setProperty('--label-height-mm', `${safeHeightMm}mm`);
  const pxWidth = width * pxPerMm;
  const pxHeight = height * pxPerMm;
  previewContainer.style.width = pxWidth + 'px';
  previewContainer.style.height = pxHeight + 'px';
  const innerWidthPx = pxWidth;
  const innerHeightPx = pxHeight;
  labelInner.style.width = innerWidthPx + 'px';
  labelInner.style.height = innerHeightPx + 'px';
  labelInner.style.left = '0px';
  labelInner.style.top = '0px';
  const readyForPreview = isLabelReady();

  if (!readyForPreview) {
    if (previewPlaceholder) {
      previewPlaceholder.style.display = 'flex';
      previewPlaceholder.setAttribute('aria-hidden', 'false');
    }
    labelInner.style.display = 'none';
    labelInner.classList.remove('has-hardware-image');
    hardwareImageDiv.style.display = 'none';
    clearHardwareImageContent();
    hardwareImageDiv.style.removeProperty('max-width');
    hardwareImageDiv.style.removeProperty('flex-basis');
    hardwareImageDiv.style.removeProperty('flex-shrink');
    hardwareImageDiv.style.removeProperty('min-height');
    line1Div.textContent = '';
    line2Div.textContent = '';
    line2Div.style.display = 'none';
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
      qrCanvas.style.removeProperty('margin-right');
      qrCanvas.style.removeProperty('margin-left');
    }
    labelInner.style.removeProperty('--label-padding-inline-start');
    labelInner.style.removeProperty('--label-padding-inline-end');
    labelInner.style.removeProperty('--label-gap');
    labelInner.style.removeProperty('--label-padding-y');
    labelInner.style.removeProperty('--label-padding-x');
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
  const mmToPx = mm => Math.max(0, Math.round(mm * pxPerMm));
  const widthMm = Number.isFinite(width) ? width : 0;
  const heightMm = Number.isFinite(height) ? height : 0;
  const longestEdgeMm = Math.max(widthMm, heightMm, 0);
  const baseScale = Math.sqrt(Math.max(longestEdgeMm, 1) / 40);
  const paddingScale = Math.max(1, Math.min(baseScale, 1.35));
  const verticalScale = Math.max(1, Math.min(baseScale, 1.2));
  const gapScale = Math.max(1, Math.min(baseScale, 1.15));
  let horizontalPaddingBaselineMm = 1.5;
  let minHorizontalPaddingMm = 1.2;
  if (heightMm <= 12) {
    const normalizedHeight = Math.max(0, Math.min(heightMm, 12));
    const heightRatio = normalizedHeight / 12;
    const minBaselineMm = 1.0;
    const maxBaselineMm = 1.35;
    horizontalPaddingBaselineMm = minBaselineMm + (maxBaselineMm - minBaselineMm) * heightRatio;
    minHorizontalPaddingMm = 0.9;
  }
  const basePaddingX = Math.max(
    mmToPx(horizontalPaddingBaselineMm * paddingScale),
    mmToPx(minHorizontalPaddingMm),
  );
  const basePaddingY = Math.max(mmToPx(1.0 * verticalScale), mmToPx(0.8));
  const baseGap = Math.max(mmToPx(0.8 * gapScale), mmToPx(0.6));
  let paddingLeftPx = basePaddingX;
  let paddingRightPx = basePaddingX;
  let paddingY = basePaddingY;
  let gapPx = baseGap;
  let hardwareWidthPx = 0;
  let hardwareVisible = false;

  if (state.showImage) {
    if (state.hardwareType === 'Custom') {
      const targetSize = Math.max(0, innerHeightPx);
      const displaySize = Math.max(32, targetSize);
      hardwareImageDiv.style.display = 'flex';
      hardwareImageDiv.style.maxWidth = displaySize + 'px';
      hardwareImageDiv.style.flexBasis = displaySize + 'px';
      hardwareImageDiv.style.flexShrink = '0';
      hardwareImageDiv.style.minHeight = displaySize + 'px';
      clearHardwareImageContent();
      hardwareWidthPx = displaySize;
      hardwareVisible = true;
      if (state.customImageData) {
        const img = document.createElement('img');
        img.src = state.customImageData;
        img.alt = state.customImageName || 'Custom image';
        img.className = 'custom-image-preview';
        img.style.maxHeight = displaySize + 'px';
        img.style.maxWidth = displaySize + 'px';
        hardwareImageDiv.appendChild(img);
      } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'custom-image-placeholder';
        placeholder.textContent = 'Add image';
        placeholder.style.height = displaySize + 'px';
        hardwareImageDiv.appendChild(placeholder);
      }
    } else {
      const renderFallbackIcon = () => {
        hardwareImageDiv.style.display = 'none';
        clearHardwareImageContent();
        hardwareImageDiv.style.removeProperty('max-width');
        hardwareImageDiv.style.removeProperty('flex-basis');
        hardwareImageDiv.style.removeProperty('flex-shrink');
        hardwareImageDiv.style.removeProperty('min-height');
        hardwareWidthPx = 0;
        hardwareVisible = false;
      };

      const photoInfo = getHardwareImageInfo();
      if (photoInfo && innerHeightPx > 0 && innerWidthPx > 0) {
        let maxWidthForPhoto = Math.max(0, Math.min(innerHeightPx, innerWidthPx * 0.45));
        if (photoInfo.type === 'boltSvg') {
          const boltPreferredWidth = Math.max(0, Math.min(innerHeightPx * 1.4, innerWidthPx * 0.6));
          maxWidthForPhoto = Math.max(maxWidthForPhoto, boltPreferredWidth);
        } else {
          const photoPreferredWidth = Math.max(
            0,
            Math.min(innerHeightPx * 1.2, innerWidthPx * 0.5),
          );
          maxWidthForPhoto = Math.max(maxWidthForPhoto, photoPreferredWidth);
        }
        if (maxWidthForPhoto > 0) {
          hardwareImageDiv.style.display = 'flex';
          hardwareImageDiv.style.maxWidth = maxWidthForPhoto + 'px';
          hardwareImageDiv.style.flexBasis = maxWidthForPhoto + 'px';
          hardwareImageDiv.style.flexShrink = '0';
          hardwareImageDiv.style.removeProperty('min-height');
          clearHardwareImageContent();
          hardwareWidthPx = maxWidthForPhoto;
          hardwareVisible = true;

          if (photoInfo.type === 'boltSvg') {
            let fallbackTriggered = false;
            const handleMissingAsset = () => {
              if (fallbackTriggered) {
                return;
              }
              fallbackTriggered = true;
              renderFallbackIcon();
            };
            const boltGroup = document.createElement('div');
            boltGroup.className = 'bolt-image-group';
            boltGroup.style.maxHeight = innerHeightPx + 'px';
            boltGroup.style.height = innerHeightPx + 'px';
            hardwareImageDiv.appendChild(boltGroup);
            const boltImages = [
              {
                src: photoInfo.driveSrc,
                alt: photoInfo.driveAlt,
                className: 'hardware-photo bolt-drive-view',
              },
              {
                src: photoInfo.headSrc,
                alt: photoInfo.headAlt,
                className: 'hardware-photo bolt-head-view',
              },
            ];
            let maxWidthPerImage = Math.floor(maxWidthForPhoto / boltImages.length);
            if (!Number.isFinite(maxWidthPerImage) || maxWidthPerImage <= 0) {
              maxWidthPerImage = maxWidthForPhoto;
            }
            boltImages.forEach(imageInfo => {
              if (fallbackTriggered) {
                return;
              }
              if (!imageInfo.src) {
                handleMissingAsset();
                return;
              }
              const boltImg = document.createElement('img');
              boltImg.src = imageInfo.src;
              boltImg.alt = imageInfo.alt;
              boltImg.className = imageInfo.className;
              boltImg.decoding = 'async';
              boltImg.loading = 'lazy';
              boltImg.style.maxHeight = innerHeightPx + 'px';
              boltImg.style.height = innerHeightPx + 'px';
              boltImg.style.maxWidth = maxWidthPerImage + 'px';
              boltImg.addEventListener('error', handleMissingAsset);
              boltGroup.appendChild(boltImg);
              applyTrimmedSvgToImage(boltImg, imageInfo.src);
            });
          } else {
            const img = document.createElement('img');
            img.src = photoInfo.src;
            img.alt = photoInfo.alt;
            img.className = 'hardware-photo';
            img.decoding = 'async';
            img.loading = 'lazy';
            img.style.maxHeight = innerHeightPx + 'px';
            img.style.maxWidth = maxWidthForPhoto + 'px';
            hardwareImageDiv.appendChild(img);
          }
        } else {
          hardwareImageDiv.style.display = 'none';
          clearHardwareImageContent();
          hardwareImageDiv.style.removeProperty('max-width');
          hardwareImageDiv.style.removeProperty('flex-basis');
          hardwareImageDiv.style.removeProperty('flex-shrink');
          hardwareImageDiv.style.removeProperty('min-height');
          hardwareWidthPx = 0;
          hardwareVisible = false;
        }
      } else {
        renderFallbackIcon();
      }
    }
  } else {
    hardwareImageDiv.style.display = 'none';
    clearHardwareImageContent();
    hardwareImageDiv.style.removeProperty('max-width');
    hardwareImageDiv.style.removeProperty('flex-basis');
    hardwareImageDiv.style.removeProperty('flex-shrink');
    hardwareImageDiv.style.removeProperty('min-height');
    hardwareWidthPx = 0;
    hardwareVisible = false;
  }

  if (labelInner) {
    labelInner.classList.toggle('has-hardware-image', hardwareVisible);
  }

  if (state.hardwareType === 'Custom') {
    const topLine = (state.customLine1 || '').trim();
    const bottomLine = (state.customLine2 || '').trim();
    line1Div.textContent = topLine || 'Custom Label';
    line2Div.textContent = bottomLine;
    line2Div.style.display = bottomLine ? 'block' : 'none';
    if (line3Div) {
      line3Div.textContent = '';
      line3Div.style.display = 'none';
    }
  } else {
    let line1 = '';
    let connectorLine2Parts = null;
    let line2 = '';
    let line3 = '';
    if (state.hardwareType === 'Fuse') {
      const fuseParts = [];
      const fuseLabel = state.fuseType ? `${state.fuseType} Fuse` : 'Fuse';
      fuseParts.push(fuseLabel);
      if (state.fuseValue) {
        fuseParts.push(`${state.fuseValue} A`);
      }
      line1 = fuseParts.filter(Boolean).join(' — ');
    } else if (state.hardwareType === 'Connector') {
      const category = findConnectorCategory(state.connectorCategory);
      const categoryLabel = category ? category.label : '';
      const seriesLabel = state.showStandard && state.standard ? state.standard : '';
      const standardCode = (state.standardCode || '').trim();
      const noteText = state.notes;
      const isPreInsulatedCrimp = state.connectorCategory === 'pre-insulated-crimp';
      let connectorColour = '';
      if (isPreInsulatedCrimp && standardCode) {
        const firstToken = standardCode.split(/\s+/)[0] || '';
        connectorColour = firstToken.replace(/[\s,;]+$/g, '');
      }
      if (seriesLabel) {
        line1 = seriesLabel;
      } else if (categoryLabel) {
        line1 = categoryLabel;
      } else if (noteText) {
        line1 = noteText;
      }
      connectorLine2Parts = [];
      if (seriesLabel) {
        if (isPreInsulatedCrimp && connectorColour) {
          connectorLine2Parts.push(connectorColour);
        } else if (categoryLabel && seriesLabel !== categoryLabel) {
          connectorLine2Parts.push(categoryLabel);
        }
      } else if (categoryLabel && line1 !== categoryLabel) {
        connectorLine2Parts.push(categoryLabel);
      }
      if (noteText && line1 !== noteText) {
        connectorLine2Parts.push(noteText);
      }
    } else if (state.hardwareType === 'Bearing') {
      if (state.bearingType) {
        line1 = state.bearingType;
      }
    } else if (state.hardwareType === 'Component') {
      const componentParts = [];
      if (state.componentCategory) {
        componentParts.push(state.componentCategory);
      }
      if (state.componentMount) {
        componentParts.push(state.componentMount);
      }
      line1 = componentParts.join(' — ');
    } else if (state.hardwareType === 'Bolt') {
      if (state.threadSize) {
        line1 = state.threadSize;
      }
      if (state.length) {
        line1 += line1 ? ` × ${state.length}` : state.length;
      }
      const headEntry = boltHeadMap.get((state.boltHead || '').trim());
      const driveEntry = boltDriveMap.get((state.boltDrive || '').trim());
      const headLabel = headEntry ? headEntry.label : '';
      const driveLabel = driveEntry ? driveEntry.label : '';
      const showHead = state.showStandard && headLabel;
      const showDrive = state.showStandard && driveLabel;
      if (showHead) {
        line2 = headLabel;
      }
      if (showDrive) {
        line3 = driveLabel;
      }
      if (state.notes) {
        if (line3) {
          line3 += ` • ${state.notes}`;
        } else if (line2) {
          line3 = state.notes;
        } else {
          line2 = state.notes;
        }
      }
    } else {
      if (state.threadSize) {
        line1 = state.threadSize;
      }
      if (state.hardwareType === 'Screw' && state.length) {
        line1 += line1 ? ` × ${state.length}` : state.length;
      }
    }
    const fallbackLabel = state.hardwareType === 'Fuse' ? 'Fuse' : state.hardwareType;
    line1Div.textContent = line1 || fallbackLabel;
    if (state.hardwareType === 'Fuse') {
      const fuseDetails = [];
      if (state.showStandard && state.standard) {
        fuseDetails.push(state.standard);
      }
      if (state.fuseType === 'Glass') {
        if (state.glassSize) {
          fuseDetails.push(state.glassSize);
        }
        if (state.glassSpeed) {
          fuseDetails.push(state.glassSpeed);
        }
      }
      if (state.notes) {
        fuseDetails.push(state.notes);
      }
      line2 = fuseDetails.join(' • ');
    } else if (state.hardwareType === 'Connector') {
      if (connectorLine2Parts && connectorLine2Parts.length > 0) {
        line2 = connectorLine2Parts.join(' • ');
      }
    } else if (state.hardwareType === 'Bearing') {
      const bearingDetails = [];
      if (state.showStandard && state.bearingDetails) {
        bearingDetails.push(state.bearingDetails);
      }
      if (state.notes) {
        bearingDetails.push(state.notes);
      }
      line2 = bearingDetails.join(' • ');
    } else if (state.hardwareType === 'Component') {
      if (state.notes) {
        line2 = state.notes;
      }
    } else if (state.hardwareType !== 'Bolt') {
      if (state.showStandard && state.standard) {
        line2 = state.standard;
      }
      if (state.notes) {
        line2 += line2 ? ` • ${state.notes}` : state.notes;
      }
    }
    line2Div.textContent = line2;
    line2Div.style.display = line2 ? 'block' : 'none';
    if (line3Div) {
      line3Div.textContent = line3;
      line3Div.style.display = line3 ? 'block' : 'none';
    }
  }

  const primaryFontSize = Math.max(8, Math.floor(innerHeightPx * 0.45));
  const secondaryFontSize = Math.max(6, Math.floor(innerHeightPx * 0.2));
  const qrContent = state.qrContent ? state.qrContent.trim() : '';
  let qrVisible = false;
  let qrEstimatedSizePx = 0;
  let desiredQrEdgeClearancePx = 0;

  if (state.showQr && qrContent && qrCanvas) {
    const qrSafetyMarginPx = Math.max(2, Math.round(mmToPx(0.5)));
    const maxQrExtentPx = Math.max(0, Math.floor(innerHeightPx - qrSafetyMarginPx * 2));
    qrEstimatedSizePx = Math.max(1, maxQrExtentPx);
    const minimumEdgeClearancePx = Math.max(mmToPx(1), 1);
    desiredQrEdgeClearancePx = Math.max(mmToPx(1.2), minimumEdgeClearancePx);
    qrCanvas.width = qrEstimatedSizePx;
    qrCanvas.height = qrEstimatedSizePx;
    qrCanvas.style.width = qrEstimatedSizePx + 'px';
    qrCanvas.style.height = qrEstimatedSizePx + 'px';
    qrCanvas.style.display = 'block';
    qrCanvas.style.removeProperty('right');
    qrCanvas.style.removeProperty('top');
    qrCanvas.style.removeProperty('transform');
    qrCanvas.style.marginLeft = '0px';
    const ctx = qrCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
    }

    const requestId = ++qrRenderRequestId;
    loadQrCodeLibrary()
      .then(qrCodeLib => {
        if (qrRenderRequestId !== requestId) {
          return;
        }
        const latestContent = state.qrContent ? state.qrContent.trim() : '';
        if (!state.showQr || !latestContent || !qrCanvas) {
          return;
        }
        const renderFn =
          qrCodeLib && typeof qrCodeLib.toCanvas === 'function' ? qrCodeLib.toCanvas : null;
        if (!renderFn) {
          throw new Error('QR code library is missing the toCanvas function.');
        }
        try {
          const qrMarginModules = 1;
          let moduleCount = null;
          const createFn =
            qrCodeLib && typeof qrCodeLib.create === 'function' ? qrCodeLib.create : null;
          if (createFn) {
            try {
              const qrMatrix = createFn.call(qrCodeLib, latestContent);
              if (qrMatrix && qrMatrix.modules && Number.isFinite(qrMatrix.modules.size)) {
                moduleCount = Math.max(0, qrMatrix.modules.size);
              }
            } catch (creationError) {
              console.error('QR code matrix generation failed', creationError);
            }
          }

          const totalModules =
            moduleCount && moduleCount > 0 ? moduleCount + qrMarginModules * 2 : null;
          let modulePixelSize = 0;
          let qrPixelSize = qrEstimatedSizePx;
          if (totalModules && totalModules > 0) {
            modulePixelSize = Math.max(1, Math.floor(maxQrExtentPx / totalModules));
            qrPixelSize = Math.max(1, modulePixelSize * totalModules);
          }

          if (qrPixelSize > 0) {
            qrCanvas.width = qrPixelSize;
            qrCanvas.height = qrPixelSize;
            qrCanvas.style.width = qrPixelSize + 'px';
            qrCanvas.style.height = qrPixelSize + 'px';
          }

          const renderOptions = {
            margin: qrMarginModules,
            color: {
              dark: '#000',
              light: '#00000000',
            },
          };

          if (modulePixelSize > 0 && totalModules && totalModules > 0) {
            renderOptions.scale = modulePixelSize;
          } else {
            renderOptions.width = qrPixelSize;
          }

          renderFn.call(qrCodeLib, qrCanvas, latestContent, renderOptions);
        } catch (err) {
          console.error('QR code generation failed', err);
        }
      })
      .catch(err => {
        if (qrRenderRequestId === requestId && qrCanvas) {
          const qrContext = qrCanvas.getContext('2d');
          if (qrContext) {
            qrContext.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
          }
          qrCanvas.style.display = 'none';
          qrCanvas.style.removeProperty('margin-right');
          qrCanvas.style.removeProperty('margin-left');
        }
        console.error('QR code library failed to load', err);
      });
    qrVisible = true;
  } else if (qrCanvas) {
    const ctx = qrCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
    }
    qrCanvas.style.display = 'none';
    qrCanvas.style.removeProperty('margin-right');
    qrCanvas.style.removeProperty('margin-left');
  }

  const itemsCount = 1 + (hardwareVisible ? 1 : 0) + (qrVisible ? 1 : 0);
  const gapCount = Math.max(0, itemsCount - 1);
  gapPx = Math.max(0, gapPx);
  const minGapPx = gapCount > 0 ? Math.max(mmToPx(0.35), 1) : 0;
  const minPaddingBaseMm = heightMm <= 12 ? 0.7 : 0.9;
  const minPaddingBasePx = Math.max(mmToPx(minPaddingBaseMm), 2);
  const minPaddingLeftPx = Math.max(2, Math.min(paddingLeftPx, minPaddingBasePx));
  const minPaddingRightTargetPx = qrVisible
    ? Math.max(minPaddingBasePx, desiredQrEdgeClearancePx)
    : minPaddingBasePx;
  const minPaddingRightPx = Math.max(2, Math.min(paddingRightPx, minPaddingRightTargetPx));
  const minTextWidthPx = Math.max(mmToPx(10), Math.floor(innerHeightPx * 1.45));

  const computeAvailableTextWidth = () => {
    const effectiveRightPadding = qrVisible
      ? Math.max(paddingRightPx, desiredQrEdgeClearancePx)
      : paddingRightPx;
    const qrWidthContribution = qrVisible ? qrEstimatedSizePx : 0;
    return (
      innerWidthPx -
      (paddingLeftPx +
        effectiveRightPadding +
        gapPx * gapCount +
        hardwareWidthPx +
        qrWidthContribution)
    );
  };

  let availableTextWidth = computeAvailableTextWidth();
  let adjustmentIterations = 0;
  const maxAdjustmentIterations = 80;
  while (
    availableTextWidth < minTextWidthPx &&
    adjustmentIterations < maxAdjustmentIterations &&
    (gapPx > minGapPx || paddingLeftPx > minPaddingLeftPx || paddingRightPx > minPaddingRightPx)
  ) {
    if (gapPx > minGapPx) {
      gapPx = Math.max(minGapPx, gapPx - 1);
    } else if (paddingLeftPx >= paddingRightPx && paddingLeftPx > minPaddingLeftPx) {
      paddingLeftPx = Math.max(minPaddingLeftPx, paddingLeftPx - 1);
    } else if (paddingRightPx > minPaddingRightPx) {
      paddingRightPx = Math.max(minPaddingRightPx, paddingRightPx - 1);
    } else if (paddingLeftPx > minPaddingLeftPx) {
      paddingLeftPx = Math.max(minPaddingLeftPx, paddingLeftPx - 1);
    } else {
      break;
    }
    availableTextWidth = computeAvailableTextWidth();
    adjustmentIterations += 1;
  }

  if (qrCanvas) {
    if (qrVisible) {
      const marginRightPx = Math.max(0, desiredQrEdgeClearancePx - paddingRightPx);
      qrCanvas.style.marginRight = marginRightPx + 'px';
      qrCanvas.style.marginLeft = '0px';
    } else {
      qrCanvas.style.marginRight = '0px';
      qrCanvas.style.marginLeft = '0px';
    }
  }

  const averagePaddingX = Math.round((paddingLeftPx + paddingRightPx) / 2);
  labelInner.style.setProperty('--label-padding-x', `${averagePaddingX}px`);
  labelInner.style.setProperty('--label-padding-y', `${paddingY}px`);
  labelInner.style.setProperty('--label-padding-inline-start', `${paddingLeftPx}px`);
  labelInner.style.setProperty('--label-padding-inline-end', `${paddingRightPx}px`);
  labelInner.style.setProperty('--label-gap', `${gapPx}px`);

  applyTextFitting(primaryFontSize, secondaryFontSize);
  previewReadyState = true;
  announcePreviewStatus('Preview updated.');
}

export async function renderLabelCanvas() {
  if (!previewContainer || !labelInner) {
    throw new Error('Label preview is not available.');
  }

  const labelWidthMm = state.widthMm;
  const labelHeightMm = state.heightMm;
  const exportDpi = 300;
  const pixelsPerMmAtExportDpi = exportDpi / 25.4;
  const scale = pixelsPerMmAtExportDpi / pxPerMm;

  const containerWidth = previewContainer.offsetWidth || previewContainer.clientWidth;
  const containerHeight = previewContainer.offsetHeight || previewContainer.clientHeight;
  if (!containerWidth || !containerHeight) {
    throw new Error('Label preview has no measurable size.');
  }

  const html2canvas = await loadHtml2Canvas();
  const canvas = await html2canvas(previewContainer, {
    backgroundColor: null,
    scale,
    width: containerWidth,
    height: containerHeight,
    scrollX: 0,
    scrollY: 0,
  });

  const containerRect = previewContainer.getBoundingClientRect();
  const innerRect = labelInner.getBoundingClientRect();
  const ratioX = canvas.width / containerWidth;
  const ratioY = canvas.height / containerHeight;
  const cropX = Math.max(0, Math.floor((innerRect.left - containerRect.left) * ratioX));
  const cropY = Math.max(0, Math.floor((innerRect.top - containerRect.top) * ratioY));
  const cropWidth = Math.max(1, Math.ceil(innerRect.width * ratioX));
  const cropHeight = Math.max(1, Math.ceil(innerRect.height * ratioY));
  const sourceWidth = Math.min(cropWidth, canvas.width - cropX);
  const sourceHeight = Math.min(cropHeight, canvas.height - cropY);

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error('Computed label dimensions are invalid.');
  }

  const outputCanvas = document.createElement('canvas');
  const targetWidthPx = Math.max(1, Math.round(labelWidthMm * pixelsPerMmAtExportDpi));
  const targetHeightPx = Math.max(1, Math.round(labelHeightMm * pixelsPerMmAtExportDpi));
  outputCanvas.width = targetWidthPx;
  outputCanvas.height = targetHeightPx;
  const ctx = outputCanvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(
      canvas,
      cropX,
      cropY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      outputCanvas.width,
      outputCanvas.height,
    );
  }
  return outputCanvas;
}

export async function renderLabelBlob(type = 'image/png', quality) {
  const canvas = await renderLabelCanvas();
  if (typeof canvas.toBlob === 'function') {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(blob);
            return;
          }
          reject(new Error('Unable to convert canvas to blob.'));
        },
        type,
        quality,
      );
    });
  }

  const dataUrl = canvas.toDataURL(type, quality);
  const byteString = atob(dataUrl.split(',')[1] || '');
  const mimeType = dataUrl.split(';')[0].split(':')[1] || type;
  const buffer = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i += 1) {
    buffer[i] = byteString.charCodeAt(i);
  }
  return new Blob([buffer], { type: mimeType });
}
