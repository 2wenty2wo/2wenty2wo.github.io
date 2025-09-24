import { state } from './state.js';
import { elements } from './dom-elements.js';
import {
  pxPerMm,
  hardwareImageFolders,
  findConnectorCategory,
  boltHeadMap,
  boltDriveMap,
} from './data.js';
import { loadQrCodeLibrary } from './lazy-loaders.js';

const {
  labelSizeDisplay,
  printAreaDisplay,
  previewViewport,
  previewContainer,
  labelInner,
  labelSvg,
  labelFrame,
  printableGroup,
  printableForeignObject,
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

const previewDimensions = {
  width: 0,
  height: 0,
};

let previewResizeObserver = null;

function applyPreviewScale() {
  if (!previewContainer) {
    return;
  }

  const viewport = previewViewport || (previewContainer ? previewContainer.parentElement : null);
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
  const isScaled = scale < 0.999;

  if (isScaled) {
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

// Derived from the hardware label spec: a 37 × 12 mm label yields a 33 × 10 mm
// printable area, implying 2 mm horizontal and 1 mm vertical safe margins per
// side.
const HORIZONTAL_SAFE_MARGIN_PER_SIDE_MM = 2;
const VERTICAL_SAFE_MARGIN_PER_SIDE_MM = 1;

const SVG_XMLNS = 'http://www.w3.org/2000/svg';
function computePrintableDimension(dimensionMm, marginPerSideMm) {
  if (!Number.isFinite(dimensionMm)) {
    return 0;
  }
  const marginTotalMm = marginPerSideMm * 2;
  return Math.max(0, dimensionMm - marginTotalMm);
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

function getLabelGeometry() {
  const rawWidth = Number.isFinite(state.widthMm) ? state.widthMm : 0;
  const rawHeight = Number.isFinite(state.heightMm) ? state.heightMm : 0;
  const labelWidthMm = Math.max(0, rawWidth);
  const labelHeightMm = Math.max(0, rawHeight);
  const printableWidthMm = computePrintableDimension(
    labelWidthMm,
    HORIZONTAL_SAFE_MARGIN_PER_SIDE_MM,
  );
  const printableHeightMm = computePrintableDimension(
    labelHeightMm,
    VERTICAL_SAFE_MARGIN_PER_SIDE_MM,
  );
  const marginX = Math.max(0, (labelWidthMm - printableWidthMm) / 2);
  const marginY = Math.max(0, (labelHeightMm - printableHeightMm) / 2);
  return {
    labelWidthMm,
    labelHeightMm,
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

  const convertToPx = value => {
    if (!Number.isFinite(value)) {
      return 0;
    }
    return value * pxPerMm;
  };

  const { labelWidthMm, labelHeightMm, printableWidthMm, printableHeightMm, marginX, marginY } =
    geometry;

  const labelWidthPx = convertToPx(labelWidthMm);
  const labelHeightPx = convertToPx(labelHeightMm);
  const printableWidthPx = convertToPx(printableWidthMm);
  const printableHeightPx = convertToPx(printableHeightMm);
  const marginXPx = convertToPx(marginX);
  const marginYPx = convertToPx(marginY);
  const frameStrokeWidthPx = convertToPx(0.25);

  if (frame) {
    frame.setAttribute('x', '0');
    frame.setAttribute('y', '0');
    frame.setAttribute('width', formatNumber(labelWidthPx));
    frame.setAttribute('height', formatNumber(labelHeightPx));
    frame.setAttribute('stroke-width', formatNumber(frameStrokeWidthPx));
  }

  if (group) {
    group.setAttribute(
      'transform',
      `translate(${formatNumber(marginXPx)} ${formatNumber(marginYPx)})`,
    );
  }

  if (foreignObject) {
    foreignObject.setAttribute('x', '0');
    foreignObject.setAttribute('y', '0');
    foreignObject.setAttribute('width', formatNumber(printableWidthPx));
    foreignObject.setAttribute('height', formatNumber(printableHeightPx));
  }
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

function parseSvgDimension(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const match = trimmed.match(/[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/);
  if (!match) {
    return null;
  }
  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
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
  const viewBoxAttribute = svgElement.getAttribute('viewBox');
  let originalBounds = null;
  if (typeof viewBoxAttribute === 'string' && viewBoxAttribute.trim()) {
    const parts = viewBoxAttribute
      .replace(/,/g, ' ')
      .trim()
      .split(/\s+/)
      .map(Number.parseFloat)
      .filter(Number.isFinite);
    if (parts.length >= 4) {
      const [vx, vy, vWidth, vHeight] = parts;
      if (Number.isFinite(vWidth) && Number.isFinite(vHeight) && vWidth > 0 && vHeight > 0) {
        originalBounds = {
          x: Number.isFinite(vx) ? vx : 0,
          y: Number.isFinite(vy) ? vy : 0,
          width: vWidth,
          height: vHeight,
        };
      }
    }
  }
  if (!originalBounds) {
    const widthAttr = parseSvgDimension(svgElement.getAttribute('width'));
    const heightAttr = parseSvgDimension(svgElement.getAttribute('height'));
    if (
      Number.isFinite(widthAttr) &&
      Number.isFinite(heightAttr) &&
      widthAttr > 0 &&
      heightAttr > 0
    ) {
      originalBounds = { x: 0, y: 0, width: widthAttr, height: heightAttr };
    }
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
  const marginRatio = 0.03;
  const preserveWhitespaceFraction = 0.85;
  let marginX = bbox.width * marginRatio;
  let marginY = bbox.height * marginRatio;
  if (originalBounds) {
    const extraWidth = originalBounds.width - bbox.width;
    const extraHeight = originalBounds.height - bbox.height;
    if (Number.isFinite(extraWidth) && extraWidth > 0) {
      const desiredExtraWidth = (extraWidth * preserveWhitespaceFraction) / 2;
      marginX = Math.max(marginX, desiredExtraWidth);
      const maxMarginX = extraWidth / 2;
      if (Number.isFinite(maxMarginX) && maxMarginX >= 0) {
        marginX = Math.min(marginX, maxMarginX);
      }
    }
    if (Number.isFinite(extraHeight) && extraHeight > 0) {
      const desiredExtraHeight = (extraHeight * preserveWhitespaceFraction) / 2;
      marginY = Math.max(marginY, desiredExtraHeight);
      const maxMarginY = extraHeight / 2;
      if (Number.isFinite(maxMarginY) && maxMarginY >= 0) {
        marginY = Math.min(marginY, maxMarginY);
      }
    }
  }
  marginX = Number.isFinite(marginX) && marginX > 0 ? marginX : 0;
  marginY = Number.isFinite(marginY) && marginY > 0 ? marginY : 0;
  let minX = bbox.x - marginX;
  let minY = bbox.y - marginY;
  let maxX = bbox.x + bbox.width + marginX;
  let maxY = bbox.y + bbox.height + marginY;
  if (originalBounds) {
    const originalMaxX = originalBounds.x + originalBounds.width;
    const originalMaxY = originalBounds.y + originalBounds.height;
    if (Number.isFinite(originalBounds.x) && minX < originalBounds.x) {
      const overshoot = originalBounds.x - minX;
      minX += overshoot;
      maxX += overshoot;
    }
    if (Number.isFinite(originalBounds.y) && minY < originalBounds.y) {
      const overshoot = originalBounds.y - minY;
      minY += overshoot;
      maxY += overshoot;
    }
    if (Number.isFinite(originalMaxX) && maxX > originalMaxX) {
      const overshoot = maxX - originalMaxX;
      minX -= overshoot;
      maxX -= overshoot;
    }
    if (Number.isFinite(originalMaxY) && maxY > originalMaxY) {
      const overshoot = maxY - originalMaxY;
      minY -= overshoot;
      maxY -= overshoot;
    }
    if (Number.isFinite(originalBounds.x)) {
      minX = Math.max(minX, originalBounds.x);
    }
    if (Number.isFinite(originalBounds.y)) {
      minY = Math.max(minY, originalBounds.y);
    }
    if (Number.isFinite(originalMaxX)) {
      maxX = Math.min(maxX, originalMaxX);
    }
    if (Number.isFinite(originalMaxY)) {
      maxY = Math.min(maxY, originalMaxY);
    }
    const distributeWhitespaceEvenly = (min, max, originalMin, originalMax) => {
      if (
        !Number.isFinite(min) ||
        !Number.isFinite(max) ||
        !Number.isFinite(originalMin) ||
        !Number.isFinite(originalMax)
      ) {
        return { min, max };
      }
      const trimmedSize = max - min;
      const availableSize = originalMax - originalMin;
      if (
        !Number.isFinite(trimmedSize) ||
        !Number.isFinite(availableSize) ||
        trimmedSize <= 0 ||
        availableSize <= 0 ||
        trimmedSize > availableSize
      ) {
        return { min, max };
      }
      const totalWhitespace = min - originalMin + (originalMax - max);
      if (!Number.isFinite(totalWhitespace) || totalWhitespace < 0) {
        return { min, max };
      }
      const halfWhitespace = totalWhitespace / 2;
      let alignedMin = originalMin + halfWhitespace;
      let alignedMax = alignedMin + trimmedSize;
      const maxStart = originalMax - trimmedSize;
      if (!Number.isFinite(alignedMin) || !Number.isFinite(alignedMax)) {
        return { min, max };
      }
      if (alignedMin < originalMin) {
        alignedMin = originalMin;
        alignedMax = alignedMin + trimmedSize;
      } else if (alignedMin > maxStart) {
        alignedMin = maxStart;
        alignedMax = alignedMin + trimmedSize;
      }
      if (alignedMax > originalMax) {
        alignedMax = originalMax;
        alignedMin = alignedMax - trimmedSize;
      }
      if (alignedMin < originalMin) {
        alignedMin = originalMin;
      }
      if (alignedMax > originalMax) {
        alignedMax = originalMax;
      }
      if (alignedMax - alignedMin !== trimmedSize) {
        alignedMax = alignedMin + trimmedSize;
      }
      return { min: alignedMin, max: alignedMax };
    };

    const alignedX = distributeWhitespaceEvenly(minX, maxX, originalBounds.x, originalMaxX);
    minX = alignedX.min;
    maxX = alignedX.max;

    const alignedY = distributeWhitespaceEvenly(minY, maxY, originalBounds.y, originalMaxY);
    minY = alignedY.min;
    maxY = alignedY.max;
  }
  const trimmedWidth = maxX - minX;
  const trimmedHeight = maxY - minY;
  if (
    !Number.isFinite(trimmedWidth) ||
    !Number.isFinite(trimmedHeight) ||
    trimmedWidth <= 0 ||
    trimmedHeight <= 0
  ) {
    return null;
  }
  const trimmedSvg = svgElement.cloneNode(true);
  trimmedSvg.removeAttribute('width');
  trimmedSvg.removeAttribute('height');
  trimmedSvg.setAttribute('viewBox', `${minX} ${minY} ${trimmedWidth} ${trimmedHeight}`);
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

function setExplicitWidthFromAspectRatio(img, targetHeightPx, maxWidthPx) {
  if (!img || !Number.isFinite(targetHeightPx) || targetHeightPx <= 0) {
    return;
  }

  const applyDimensions = () => {
    if (!img || !img.isConnected) {
      return;
    }

    const { naturalWidth, naturalHeight } = img;
    if (!Number.isFinite(naturalWidth) || !Number.isFinite(naturalHeight)) {
      return;
    }
    if (naturalWidth <= 0 || naturalHeight <= 0) {
      return;
    }

    const heightScale = targetHeightPx / naturalHeight;
    if (!Number.isFinite(heightScale) || heightScale <= 0) {
      return;
    }

    let scale = heightScale;
    if (Number.isFinite(maxWidthPx) && maxWidthPx > 0) {
      const widthScale = maxWidthPx / naturalWidth;
      if (Number.isFinite(widthScale) && widthScale > 0) {
        scale = Math.min(scale, widthScale);
      }
    }

    const scaledWidth = naturalWidth * scale;
    const scaledHeight = naturalHeight * scale;
    if (
      !Number.isFinite(scaledWidth) ||
      !Number.isFinite(scaledHeight) ||
      scaledWidth <= 0 ||
      scaledHeight <= 0
    ) {
      return;
    }

    img.style.width = scaledWidth + 'px';
    img.style.height = scaledHeight + 'px';
  };

  img.addEventListener('load', applyDimensions);
  if (img.complete) {
    applyDimensions();
  }
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
    try {
      const encodedSvg = encodeURIComponent(trimmedMarkup);
      const dataUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
      img.dataset.trimmedSvgSource = originalSrc;
      img.dataset.trimmedSvgObjectUrl = '';
      img.src = dataUrl;
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
    const boltDetailsRequired = Boolean(state.showImage || state.showStandard);
    const hasHead = Boolean(state.boltHead);
    const hasDrive = Boolean(state.boltDrive);
    const headValid = !boltDetailsRequired || hasHead;
    const driveValid = !boltDetailsRequired || hasDrive;
    const standardValid = !boltDetailsRequired || (hasHead && hasDrive);
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
      valid: standardValid,
    });
    updateInputFieldState({
      input: standardSelect,
      container: null,
      messageElement: null,
      valid: true,
    });
    if (boltDetailsRequired && !hasHead) {
      requirements.push('choose a head style');
    }
    if (boltDetailsRequired && !hasDrive) {
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
    const hasThread = Boolean(state.threadSize);
    const hasLength = Boolean(state.length);
    const detailsRequired = Boolean(state.showImage || state.showStandard);
    const hasHead = Boolean(state.boltHead);
    const hasDrive = Boolean(state.boltDrive);
    const detailsSatisfied = !detailsRequired || (hasHead && hasDrive);
    return Boolean(hasThread && hasLength && detailsSatisfied);
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
  if (
    !previewContainer ||
    !labelInner ||
    !labelSizeDisplay ||
    !printAreaDisplay ||
    !labelSvg ||
    !labelFrame ||
    !printableGroup ||
    !printableForeignObject
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
  previewContainer.style.width = labelWidthPx + 'px';
  previewContainer.style.height = labelHeightPx + 'px';
  previewDimensions.width = labelWidthPx;
  previewDimensions.height = labelHeightPx;
  applyPreviewScale();

  labelSvg.setAttribute('viewBox', `0 0 ${labelWidthPx} ${labelHeightPx}`);
  labelSvg.style.width = labelWidthPx + 'px';
  labelSvg.style.height = labelHeightPx + 'px';
  applySvgGeometryElements(
    { frame: labelFrame, group: printableGroup, foreignObject: printableForeignObject },
    geometry,
  );

  const innerWidthPx = Math.max(1, Math.round(printableWidthMm * pxPerMm));
  const innerHeightPx = Math.max(1, Math.round(printableHeightMm * pxPerMm));
  labelInner.style.width = innerWidthPx + 'px';
  labelInner.style.height = innerHeightPx + 'px';

  const printableValid = printableWidthMm > 0 && printableHeightMm > 0;
  const readyForPreview = printableValid && isLabelReady();
  labelSvg.setAttribute('aria-hidden', readyForPreview ? 'false' : 'true');

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
  const widthMm = labelWidthMm;
  const heightMm = labelHeightMm;
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
          const boltPreferredWidth = Math.max(0, Math.min(innerHeightPx * 2.4, innerWidthPx * 0.7));
          maxWidthForPhoto = Math.max(maxWidthForPhoto, boltPreferredWidth);
        } else {
          const photoPreferredWidth = Math.max(
            0,
            Math.min(innerHeightPx * 1.2, innerWidthPx * 0.5),
          );
          maxWidthForPhoto = Math.max(maxWidthForPhoto, photoPreferredWidth);
        }
        maxWidthForPhoto = Math.min(maxWidthForPhoto, innerWidthPx);
        if (maxWidthForPhoto > 0) {
          hardwareImageDiv.style.display = 'flex';
          hardwareImageDiv.style.flexShrink = '0';
          hardwareImageDiv.style.removeProperty('min-height');
          clearHardwareImageContent();
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
            const innerHeightValue = innerHeightPx + 'px';
            boltGroup.style.maxHeight = innerHeightValue;
            boltGroup.style.height = innerHeightValue;
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
            const boltImageCount = Math.max(1, boltImages.length);
            let gapBetweenImagesPx = 0;
            if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
              try {
                const computedStyle = window.getComputedStyle(boltGroup);
                const gapCandidates = [
                  Number.parseFloat(computedStyle.columnGap),
                  Number.parseFloat(computedStyle.gap),
                  Number.parseFloat(computedStyle.rowGap),
                ];
                for (const candidate of gapCandidates) {
                  if (Number.isFinite(candidate) && candidate >= 0) {
                    gapBetweenImagesPx = candidate;
                    break;
                  }
                }
              } catch {
                gapBetweenImagesPx = 0;
              }
            }
            if (!Number.isFinite(gapBetweenImagesPx) || gapBetweenImagesPx < 0) {
              gapBetweenImagesPx = 0;
            }
            let effectiveGapPx = gapBetweenImagesPx;
            const gapCount = Math.max(0, boltImageCount - 1);
            if (effectiveGapPx > 0 && effectiveGapPx * gapCount >= maxWidthForPhoto) {
              effectiveGapPx = 0;
            }
            const totalGapPx = effectiveGapPx * gapCount;
            const gapValue = effectiveGapPx + 'px';
            boltGroup.style.columnGap = gapValue;
            boltGroup.style.rowGap = gapValue;
            boltGroup.style.gap = gapValue;
            const idealBoltWidth = Math.max(0, innerHeightPx * boltImageCount + totalGapPx);
            let boltAvailableWidth = Math.max(maxWidthForPhoto, idealBoltWidth);
            boltAvailableWidth = Math.min(boltAvailableWidth, innerWidthPx);
            const minimumBoltWidth = Math.max(totalGapPx + boltImageCount, 1);
            boltAvailableWidth = Math.max(boltAvailableWidth, minimumBoltWidth);
            let maxWidthPerImage = Math.floor((boltAvailableWidth - totalGapPx) / boltImageCount);
            if (!Number.isFinite(maxWidthPerImage) || maxWidthPerImage <= 0) {
              maxWidthPerImage = Math.floor(boltAvailableWidth / boltImageCount);
            }
            if (!Number.isFinite(maxWidthPerImage) || maxWidthPerImage <= 0) {
              maxWidthPerImage = Math.floor(maxWidthForPhoto / boltImageCount);
            }
            if (!Number.isFinite(maxWidthPerImage) || maxWidthPerImage <= 0) {
              maxWidthPerImage = Math.floor(innerHeightPx);
            }
            if (!Number.isFinite(maxWidthPerImage) || maxWidthPerImage <= 0) {
              maxWidthPerImage = Math.floor(maxWidthForPhoto);
            }
            if (!Number.isFinite(maxWidthPerImage) || maxWidthPerImage <= 0) {
              maxWidthPerImage = Math.max(1, Math.floor(innerHeightPx / 2));
            }
            maxWidthPerImage = Math.max(1, maxWidthPerImage);
            const boltContainerWidth = Math.max(0, maxWidthPerImage * boltImageCount + totalGapPx);
            const boltContainerWidthValue = boltContainerWidth + 'px';
            hardwareImageDiv.style.maxWidth = boltContainerWidthValue;
            hardwareImageDiv.style.flexBasis = boltContainerWidthValue;
            hardwareWidthPx = boltContainerWidth;
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
              const maxHeightValue = innerHeightPx + 'px';
              boltImg.style.maxHeight = maxHeightValue;
              boltImg.style.maxWidth = maxWidthPerImage + 'px';
              boltImg.addEventListener('error', handleMissingAsset);
              boltGroup.appendChild(boltImg);
              setExplicitWidthFromAspectRatio(boltImg, innerHeightPx, maxWidthPerImage);
              applyTrimmedSvgToImage(boltImg, imageInfo.src);
            });
          } else {
            const img = document.createElement('img');
            img.src = photoInfo.src;
            img.alt = photoInfo.alt;
            img.className = 'hardware-photo';
            img.decoding = 'async';
            img.loading = 'lazy';
            const maxHeightValue = innerHeightPx + 'px';
            img.style.maxHeight = maxHeightValue;
            img.style.maxWidth = maxWidthForPhoto + 'px';
            setExplicitWidthFromAspectRatio(img, innerHeightPx, maxWidthForPhoto);
            hardwareImageDiv.appendChild(img);
            const maxWidthValue = maxWidthForPhoto + 'px';
            hardwareImageDiv.style.maxWidth = maxWidthValue;
            hardwareImageDiv.style.flexBasis = maxWidthValue;
            hardwareWidthPx = maxWidthForPhoto;
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
    const qrSizeValue = qrEstimatedSizePx + 'px';
    qrCanvas.style.width = qrSizeValue;
    qrCanvas.style.height = qrSizeValue;
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
            const qrPixelSizeValue = qrPixelSize + 'px';
            qrCanvas.style.width = qrPixelSizeValue;
            qrCanvas.style.height = qrPixelSizeValue;
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
  const minTextWidthPx = Math.max(mmToPx(9), Math.floor(innerHeightPx * 1.2));

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
  labelInner.style.setProperty('--label-padding-x', averagePaddingX + 'px');
  labelInner.style.setProperty('--label-padding-y', paddingY + 'px');
  labelInner.style.setProperty('--label-padding-inline-start', paddingLeftPx + 'px');
  labelInner.style.setProperty('--label-padding-inline-end', paddingRightPx + 'px');
  labelInner.style.setProperty('--label-gap', gapPx + 'px');

  applyTextFitting(primaryFontSize, secondaryFontSize);
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

function canvasToBlob(canvas, type = 'image/png', quality) {
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
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    buffer[i] = binary.charCodeAt(i);
  }
  const mimeType = dataUrl.split(';')[0].split(':')[1] || type;
  return Promise.resolve(new Blob([buffer], { type: mimeType }));
}

function captureLayoutFromDom() {
  if (!labelInner || labelInner.style.display === 'none') {
    throw new Error('Label preview is not available.');
  }
  const geometry = getLabelGeometry();
  const { printableWidthMm, printableHeightMm } = geometry;
  const innerWidthPx = Math.max(1, Math.round(printableWidthMm * pxPerMm));
  const innerHeightPx = Math.max(1, Math.round(printableHeightMm * pxPerMm));
  const labelWidthPx = Math.max(1, Math.round(geometry.labelWidthMm * pxPerMm));
  const labelHeightPx = Math.max(1, Math.round(geometry.labelHeightMm * pxPerMm));
  const marginXPx = Math.max(0, Math.round(geometry.marginX * pxPerMm));
  const marginYPx = Math.max(0, Math.round(geometry.marginY * pxPerMm));
  const computedInnerStyle = window.getComputedStyle(labelInner);
  const parsePx = value => {
    if (!value) {
      return 0;
    }
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const convert = value => Math.max(0, parsePx(value));
  const paddingLeftPx = convert(computedInnerStyle.paddingLeft);
  const paddingRightPx = convert(computedInnerStyle.paddingRight);
  const paddingTopPx = convert(computedInnerStyle.paddingTop);
  const paddingBottomPx = convert(computedInnerStyle.paddingBottom);
  const gapPx = convert(computedInnerStyle.gap);
  const backgroundColor = computedInnerStyle.backgroundColor || '#ffffff';
  const defaultTextColor = computedInnerStyle.color || '#000000';
  const defaultFontFamily = computedInnerStyle.fontFamily || 'sans-serif';

  const hardwareImages = [];
  if (hardwareImageDiv && hardwareImageDiv.offsetParent !== null) {
    const baseX = hardwareImageDiv.offsetLeft;
    const baseY = hardwareImageDiv.offsetTop;
    const hardwareChildren = hardwareImageDiv.querySelectorAll('img');
    hardwareChildren.forEach(img => {
      if (!img.src) {
        return;
      }
      const width = img.offsetWidth;
      const height = img.offsetHeight;
      if (!(width > 0 && height > 0)) {
        return;
      }
      hardwareImages.push({
        src: img.currentSrc || img.src,
        xPx: convert(baseX + img.offsetLeft),
        yPx: convert(baseY + img.offsetTop),
        widthPx: convert(width),
        heightPx: convert(height),
      });
    });
  }

  const textBlockOffsetLeft = textBlockDiv ? textBlockDiv.offsetLeft : 0;
  const textBlockOffsetTop = textBlockDiv ? textBlockDiv.offsetTop : 0;

  const collectTextLine = lineElement => {
    if (!lineElement) {
      return null;
    }
    const textContent = lineElement.textContent || '';
    if (!textContent.trim()) {
      return null;
    }
    if (lineElement.offsetParent === null) {
      return null;
    }
    const styles = window.getComputedStyle(lineElement);
    const fontSizeValue = parsePx(styles.fontSize);
    if (!(fontSizeValue > 0)) {
      return null;
    }
    const fontStyle = styles.fontStyle || 'normal';
    const fontWeight = styles.fontWeight || '400';
    const fontFamily = styles.fontFamily || defaultFontFamily;
    const color = styles.color || defaultTextColor;
    const fontSizePx = Math.max(0, fontSizeValue);
    const baseY = convert(textBlockOffsetTop + lineElement.offsetTop) + fontSizePx;
    const x = convert(textBlockOffsetLeft + lineElement.offsetLeft);
    return {
      text: textContent.trim(),
      fontSizePx,
      fontStyle,
      fontWeight,
      fontFamily,
      color,
      xPx: x,
      baselinePx: baseY,
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
      qr = {
        widthPx: convert(qrCanvas.offsetWidth),
        heightPx: convert(qrCanvas.offsetHeight),
        xPx: convert(qrCanvas.offsetLeft),
        yPx: convert(qrCanvas.offsetTop),
        dataUrl: qrCanvas.toDataURL('image/png'),
      };
    } catch (error) {
      console.warn('Unable to capture QR code for export.', error);
      qr = null;
    }
  }

  return {
    geometry,
    innerWidthPx,
    innerHeightPx,
    labelWidthPx,
    labelHeightPx,
    marginXPx,
    marginYPx,
    paddingLeftPx,
    paddingRightPx,
    paddingTopPx,
    paddingBottomPx,
    gapPx,
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
  const totalWidthPx = Math.max(
    1,
    Math.round(Number.isFinite(layout.labelWidthPx) ? layout.labelWidthPx : layout.innerWidthPx),
  );
  const totalHeightPx = Math.max(
    1,
    Math.round(Number.isFinite(layout.labelHeightPx) ? layout.labelHeightPx : layout.innerHeightPx),
  );
  const offsetXPx = Number.isFinite(layout.marginXPx) ? Math.round(layout.marginXPx) : 0;
  const offsetYPx = Number.isFinite(layout.marginYPx) ? Math.round(layout.marginYPx) : 0;
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
    try {
      const img = await loadImage(image.src);
      ctx.drawImage(
        img,
        image.xPx + offsetXPx,
        image.yPx + offsetYPx,
        image.widthPx,
        image.heightPx,
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
    ctx.fillText(line.text, line.xPx + offsetXPx, line.baselinePx + offsetYPx);
  }

  if (layout.qr && layout.qr.dataUrl) {
    try {
      const qrImg = await loadImage(layout.qr.dataUrl);
      ctx.drawImage(
        qrImg,
        layout.qr.xPx + offsetXPx,
        layout.qr.yPx + offsetYPx,
        layout.qr.widthPx,
        layout.qr.heightPx,
      );
    } catch (error) {
      console.warn('QR code could not be rendered for export.', error);
    }
  }

  return canvas;
}

export async function renderLabelPng() {
  updatePreview();
  await ensureFontsReady();
  const layout = captureLayoutFromDom();
  const canvas = await renderLayoutToCanvas(layout);
  const blob = await canvasToBlob(canvas, 'image/png');
  const exportWidthPx = Math.max(
    1,
    Math.round(Number.isFinite(layout.labelWidthPx) ? layout.labelWidthPx : layout.innerWidthPx),
  );
  const exportHeightPx = Math.max(
    1,
    Math.round(Number.isFinite(layout.labelHeightPx) ? layout.labelHeightPx : layout.innerHeightPx),
  );
  return {
    blob,
    widthPx: exportWidthPx,
    heightPx: exportHeightPx,
    printableWidthMm: layout.geometry.printableWidthMm,
    printableHeightMm: layout.geometry.printableHeightMm,
    svgMarkup: null,
  };
}

export async function renderLabelSvgMarkup() {
  updatePreview();
  await ensureFontsReady();
  const layout = captureLayoutFromDom();
  // Generate a minimal SVG representation without foreignObject using the captured layout.
  const widthPx = Math.max(
    1,
    Math.round(Number.isFinite(layout.labelWidthPx) ? layout.labelWidthPx : layout.innerWidthPx),
  );
  const heightPx = Math.max(
    1,
    Math.round(Number.isFinite(layout.labelHeightPx) ? layout.labelHeightPx : layout.innerHeightPx),
  );
  const offsetXPx = Number.isFinite(layout.marginXPx) ? Math.round(layout.marginXPx) : 0;
  const offsetYPx = Number.isFinite(layout.marginYPx) ? Math.round(layout.marginYPx) : 0;
  const svgParts = [
    `<svg xmlns="${SVG_XMLNS}" viewBox="0 0 ${widthPx} ${heightPx}" width="${widthPx}" height="${heightPx}">`,
    `<rect x="0" y="0" width="${widthPx}" height="${heightPx}" fill="${layout.backgroundColor}" />`,
  ];
  layout.hardwareImages.forEach(image => {
    if (!image.src) {
      return;
    }
    svgParts.push(
      `<image x="${image.xPx + offsetXPx}" y="${image.yPx + offsetYPx}" width="${image.widthPx}" height="${image.heightPx}" href="${image.src}" />`,
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
    svgParts.push(
      `<text x="${line.xPx + offsetXPx}" y="${line.baselinePx + offsetYPx}" fill="${line.color}" ${fontAttributes.join(' ')}>${line.text.replace(/&/g, '&amp;')}</text>`,
    );
  });
  if (layout.qr && layout.qr.dataUrl) {
    svgParts.push(
      `<image x="${layout.qr.xPx + offsetXPx}" y="${layout.qr.yPx + offsetYPx}" width="${layout.qr.widthPx}" height="${layout.qr.heightPx}" href="${layout.qr.dataUrl}" />`,
    );
  }
  svgParts.push('</svg>');
  return svgParts.join('');
}
