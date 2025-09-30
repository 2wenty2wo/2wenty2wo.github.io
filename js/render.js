import { state } from './state.js';
import { elements } from './dom-elements.js';
import {
  syncBoltDrivePicker,
  syncBoltHeadPicker,
  syncThreadSizePicker,
  syncFuseValuePicker,
  syncComponentMountPicker,
  syncResistorValuePicker,
  syncCapacitorValuePicker,
  syncBearingTypePicker,
} from './forms.js';
import {
  pxPerMm,
  hardwareImageFolders,
  hardwareImageExtensions,
  findConnectorCategory,
  boltHeadMap,
  boltDriveMap,
  nutTypeMap,
  screwTypeMap,
  electricalComponentTypes,
  componentImageMap,
  diodeValueLabelMap,
} from './data.js';
import { loadQrCodeLibrary } from './lazy-loaders.js';

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
  formStatusMessage,
} = elements;

const ELECTRICAL_COMPONENT_TYPES = new Set(electricalComponentTypes);

const HORIZONTAL_SAFE_MARGIN_PER_SIDE_MM = 2;
const VERTICAL_SAFE_MARGIN_PER_SIDE_MM = 1;
const MIN_TEXT_WIDTH_MM = 9;
const SVG_XMLNS = 'http://www.w3.org/2000/svg';
const LABEL_FONT_FAMILY = "'Barlow', 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const LABEL_BACKGROUND_COLOR = '#ffffff';
const LABEL_TEXT_COLOR = '#000000';
const FRAME_STROKE_COLOR = 'rgba(100, 116, 139, 0.6)';

const inlineImageCache = new Map();

const previewDimensions = {
  width: 0,
  height: 0,
};

let previewResizeObserver = null;
let previewReadyState = false;
let previewStatusFrameId = null;
let previewRenderRequestId = 0;

const textMeasurementCanvas =
  typeof document !== 'undefined' ? document.createElement('canvas') : null;
const textMeasurementContext = textMeasurementCanvas
  ? textMeasurementCanvas.getContext('2d')
  : null;

const qrCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;

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

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return '0';
  }
  const rounded = Math.round(value * 1000) / 1000;
  if (Math.abs(rounded - Math.round(rounded)) < 0.0001) {
    return String(Math.round(rounded));
  }
  return rounded.toString();
}

function escapeXml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function appendUniqueCandidate(list, value) {
  if (typeof value !== 'string') {
    return;
  }
  const trimmed = value.trim();
  if (!trimmed || list.includes(trimmed)) {
    return;
  }
  list.push(trimmed);
}

function resolveToAbsoluteUrl(src) {
  if (/^(data:|blob:)/i.test(src)) {
    return src;
  }
  if (/^(https?:|file:|\/\/)/i.test(src)) {
    return src;
  }

  const candidates = [];

  if (typeof document !== 'undefined') {
    appendUniqueCandidate(candidates, document.baseURI);
    if (document.location) {
      appendUniqueCandidate(candidates, document.location.href);
      appendUniqueCandidate(candidates, document.location.origin);
    }
  }
  if (typeof window !== 'undefined' && window.location) {
    appendUniqueCandidate(candidates, window.location.href);
    appendUniqueCandidate(candidates, window.location.origin);
  }

  for (const base of candidates) {
    try {
      const resolved = new URL(src, base).href;
      if (resolved) {
        return resolved;
      }
    } catch (error) {
      console.warn('Unable to resolve SVG image href, trying next base.', error);
    }
  }

  if (typeof window !== 'undefined' && window.location && window.location.href) {
    try {
      return new URL(src, window.location.href).href;
    } catch (error) {
      console.warn('Unable to resolve SVG image href with window href fallback.', error);
    }
  }

  return src;
}

function bufferToBase64(bytes) {
  if (typeof bytes === 'string') {
    return bytes;
  }
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode(...chunk);
    }
    return window.btoa(binary);
  }
  if (typeof globalThis !== 'undefined' && globalThis.Buffer) {
    return globalThis.Buffer.from(bytes).toString('base64');
  }
  throw new Error('Base64 encoding is not supported in this environment.');
}

async function blobToDataUrl(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const base64 = bufferToBase64(bytes);
  const mimeType = blob.type || 'application/octet-stream';
  return `data:${mimeType};base64,${base64}`;
}

function shouldInlineUrl(url) {
  if (/^data:/i.test(url)) {
    return false;
  }
  if (typeof window === 'undefined' || !window.location) {
    return false;
  }
  try {
    const parsed = new URL(url, window.location.href);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'file:') {
      if (parsed.origin === 'null') {
        return true;
      }
      return parsed.origin === window.location.origin;
    }
  } catch (error) {
    console.warn('Unable to inspect URL for inlining.', error);
  }
  return false;
}

async function resolveSvgImageHref(src) {
  if (!src) {
    return '';
  }

  const absolute = resolveToAbsoluteUrl(src);
  if (!shouldInlineUrl(absolute)) {
    return absolute;
  }

  if (inlineImageCache.has(absolute)) {
    return inlineImageCache.get(absolute);
  }

  if (typeof fetch !== 'function') {
    inlineImageCache.set(absolute, absolute);
    return absolute;
  }

  try {
    const response = await fetch(absolute, { cache: 'force-cache' });
    if (!response.ok) {
      throw new Error(`Unexpected response status ${response.status}`);
    }
    const blob = await response.blob();
    const dataUrl = await blobToDataUrl(blob);
    inlineImageCache.set(absolute, dataUrl);
    return dataUrl;
  } catch (error) {
    console.warn('Unable to inline SVG image asset, using absolute URL instead.', error);
    inlineImageCache.set(absolute, absolute);
    return absolute;
  }
}

function createSvgDataUrl(svgMarkup) {
  const encoded = encodeURIComponent(svgMarkup)
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

function measureTextWidth(text, fontSize, fontWeight = 400, fontStyle = 'normal') {
  if (!text) {
    return 0;
  }
  if (textMeasurementContext) {
    textMeasurementContext.font = `${fontStyle} ${fontWeight} ${fontSize}px ${LABEL_FONT_FAMILY}`;
    const metrics = textMeasurementContext.measureText(text);
    return metrics.width || 0;
  }
  return text.length * fontSize * 0.6;
}

function fitTextSize({
  text,
  maxWidth,
  maxHeight,
  minSize,
  startSize,
  fontWeight = 400,
  fontStyle = 'normal',
}) {
  if (!text) {
    return { fontSize: minSize, width: 0 };
  }
  const safeMin = Math.max(1, minSize || 1);
  let size = Math.max(safeMin, startSize || safeMin);
  if (Number.isFinite(maxHeight) && maxHeight > 0) {
    size = Math.min(size, maxHeight);
  }
  let width = measureTextWidth(text, size, fontWeight, fontStyle);
  let iterations = 0;
  while (iterations < 50 && size > safeMin && width > maxWidth) {
    size = Math.max(safeMin, size - 0.5);
    width = measureTextWidth(text, size, fontWeight, fontStyle);
    iterations += 1;
  }
  return { fontSize: size, width };
}

function layoutTextLines(lines, box, options = {}) {
  const { x, y, width, height } = box;
  const { centerAlign = false } = options;
  const result = [];
  if (!(width > 0) || !(height > 0)) {
    return result;
  }
  const items = [
    { text: lines.line1, weight: 800, minSize: 6, startRatio: 0.45 },
    { text: lines.line2, weight: 600, minSize: 5, startRatio: 0.22 },
    { text: lines.line3, weight: 600, minSize: 5, startRatio: 0.22 },
  ];
  const prepared = [];
  items.forEach((item, index) => {
    const value = (item.text || '').trim();
    if (!value) {
      return;
    }
    const startSize = Math.min(Math.max(height * item.startRatio, item.minSize), width);
    const fitted = fitTextSize({
      text: value,
      maxWidth: width,
      maxHeight: height,
      minSize: item.minSize,
      startSize,
      fontWeight: item.weight,
    });
    prepared.push({
      text: value,
      fontSize: fitted.fontSize,
      fontWeight: item.weight,
      fontStyle: 'normal',
      width: fitted.width,
      index,
    });
  });
  if (prepared.length === 0) {
    return result;
  }
  const gaps = [];
  for (let i = 0; i < prepared.length - 1; i += 1) {
    const current = prepared[i];
    const next = prepared[i + 1];
    gaps.push(Math.round(Math.min(current.fontSize, next.fontSize) * 0.2));
  }
  const totalTextHeight = prepared.reduce((sum, item) => sum + item.fontSize, 0);
  const totalGapHeight = gaps.reduce((sum, gap) => sum + gap, 0);
  const availableHeight = Math.max(0, height - totalTextHeight - totalGapHeight);
  const startY = y + availableHeight / 2;
  let baseline = startY;
  prepared.forEach((item, index) => {
    baseline += item.fontSize;
    const offset = centerAlign ? Math.max(0, (width - item.width) / 2) : 0;
    result.push({
      text: item.text,
      fontSize: item.fontSize,
      fontWeight: item.fontWeight,
      fontStyle: item.fontStyle,
      x: x + offset,
      baseline: baseline,
      width: item.width,
    });
    const gap = gaps[index] || 0;
    baseline += gap;
  });
  return result;
}

function layoutHardware(imageInfo, options) {
  const { x, y, height, maxWidth, gap } = options;
  if (!imageInfo || !(height > 0) || !(maxWidth > 0)) {
    return { width: 0, elements: [] };
  }

  const elements = [];
  let usedWidth = 0;
  const safeGap = Math.max(0, gap || 0);

  if (imageInfo.type === 'custom') {
    const targetWidth = Math.min(maxWidth, Math.max(height * 0.75, Math.min(height, maxWidth)));
    if (!(targetWidth > 0)) {
      return { width: 0, elements: [] };
    }
    const top = y + (height - height) / 2;
    if (imageInfo.hasImage && imageInfo.src) {
      elements.push({
        type: 'image',
        href: imageInfo.src,
        x,
        y: top,
        width: targetWidth,
        height,
        title: imageInfo.alt || 'Custom image',
      });
    } else {
      elements.push({
        type: 'placeholder',
        x,
        y: top,
        width: targetWidth,
        height,
        label: 'Add image',
      });
    }
    usedWidth = targetWidth;
    return { width: usedWidth, elements };
  }

  if (imageInfo.type === 'bolt' || imageInfo.type === 'screw') {
    const images = Array.isArray(imageInfo.images)
      ? imageInfo.images.filter(img => img && img.src)
      : [];
    if (images.length === 0) {
      return { width: 0, elements: [] };
    }
    const minWidth = Math.min(maxWidth, height);
    const maxWidthEstimate = Math.min(maxWidth, height * 2);
    const effectiveWidth = Math.max(minWidth, maxWidthEstimate);
    const groupGap = Math.max(4, Math.round(safeGap * 1.1));
    const totalGap = groupGap * Math.max(images.length - 1, 0);
    const slotWidth = Math.max(1, (effectiveWidth - totalGap) / images.length);
    let cursorX = x;
    images.forEach(image => {
      elements.push({
        type: 'image',
        href: image.src,
        x: cursorX,
        y,
        width: slotWidth,
        height,
        title: image.alt || 'Hardware reference',
      });
      cursorX += slotWidth + groupGap;
    });
    const calculatedWidth = cursorX - x - groupGap;
    usedWidth = Math.min(effectiveWidth, Math.min(maxWidth, calculatedWidth));
    return { width: usedWidth, elements };
  }

  if (imageInfo.type === 'fuse-illustration') {
    const width = Math.max(Math.min(maxWidth, height * 1.15), height * 0.85);
    const limitedWidth = Math.min(width, maxWidth);
    const top = y + (height - height) / 2;
    elements.push({
      type: 'image',
      href: imageInfo.src,
      x,
      y: top,
      width: limitedWidth,
      height,
      title: imageInfo.alt || 'Fuse illustration',
    });
    usedWidth = limitedWidth;
    return { width: usedWidth, elements };
  }

  if (imageInfo.type === 'photo') {
    const minWidth = height * 0.8;
    const maxWidthEstimate = height * 1.2;
    const chosenWidth = Math.max(minWidth, Math.min(maxWidthEstimate, maxWidth));
    const top = y + (height - height) / 2;
    elements.push({
      type: 'image',
      href: imageInfo.src,
      x,
      y: top,
      width: chosenWidth,
      height,
      title: imageInfo.alt || 'Hardware illustration',
    });
    usedWidth = chosenWidth;
    return { width: usedWidth, elements };
  }

  return { width: 0, elements: [] };
}

async function generateQrImage(content, sizePx) {
  if (!qrCanvas || !(sizePx > 0) || !content) {
    return null;
  }
  const size = Math.max(1, Math.round(sizePx));
  qrCanvas.width = size;
  qrCanvas.height = size;
  const qrLib = await loadQrCodeLibrary();
  const renderFn = qrLib && typeof qrLib.toCanvas === 'function' ? qrLib.toCanvas : null;
  if (!renderFn) {
    throw new Error('QR code renderer unavailable');
  }
  await renderFn.call(qrLib, qrCanvas, content, {
    width: size,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#00000000',
    },
  });
  return { dataUrl: qrCanvas.toDataURL('image/png'), sizePx: size };
}

async function buildLabelSvg() {
  await ensureFontsReady();

  const geometry = getLabelGeometry();
  const labelWidthPx = Math.max(1, Math.round(geometry.labelWidthMm * pxPerMm));
  const labelHeightPx = Math.max(1, Math.round(geometry.labelHeightMm * pxPerMm));
  const printableWidthPx = Math.max(0, Math.round(geometry.printableWidthMm * pxPerMm));
  const printableHeightPx = Math.max(0, Math.round(geometry.printableHeightMm * pxPerMm));
  const marginXPx = Math.max(0, Math.round(geometry.marginX * pxPerMm));
  const marginYPx = Math.max(0, Math.round(geometry.marginY * pxPerMm));

  const paddingBaseX = Math.round(mmToPx(1.2));
  const paddingBaseY = Math.round(mmToPx(1));
  const gapBase = Math.round(mmToPx(0.7));

  const paddingLeftPx = paddingBaseX;
  const paddingRightPx = paddingBaseX;
  const paddingTopPx = paddingBaseY;
  const paddingBottomPx = paddingBaseY;

  const contentXStart = marginXPx + paddingLeftPx;
  const contentYStart = marginYPx + paddingTopPx;
  const contentWidthPx = Math.max(0, printableWidthPx - paddingLeftPx - paddingRightPx);
  const contentHeightPx = Math.max(0, printableHeightPx - paddingTopPx - paddingBottomPx);
  const minTextWidthPx = Math.max(Math.round(mmToPx(MIN_TEXT_WIDTH_MM)), Math.floor(contentHeightPx * 1.1));

  const hardwareInfo = resolveHardwareImageInfo();
  const hardwareLayout = layoutHardware(hardwareInfo, {
    x: contentXStart,
    y: contentYStart,
    height: contentHeightPx,
    maxWidth: Math.max(0, contentWidthPx - minTextWidthPx),
    gap: gapBase,
  });

  let textStartX = contentXStart;
  if (hardwareLayout.width > 0) {
    textStartX += hardwareLayout.width + gapBase;
  }

  const textAreaRightLimit = marginXPx + printableWidthPx - paddingRightPx;
  let availableForText = Math.max(0, textAreaRightLimit - textStartX);

  const qrContent = state.showQr && state.qrContent ? state.qrContent.trim() : '';
  let qrSizePx = 0;
  if (qrContent && availableForText > minTextWidthPx) {
    const qrLimitPx = Math.max(0, availableForText - minTextWidthPx);
    const qrMaxHeight = contentHeightPx;
    const candidate = Math.min(qrLimitPx, qrMaxHeight);
    if (candidate >= Math.round(mmToPx(4))) {
      qrSizePx = Math.max(1, Math.round(candidate));
      availableForText = Math.max(0, availableForText - qrSizePx - gapBase);
    }
  }

  const textWidthPx = Math.max(minTextWidthPx, availableForText);
  const textBox = {
    x: textStartX,
    y: contentYStart,
    width: textWidthPx,
    height: contentHeightPx,
  };
  const lines = buildTextLines();
  const textLayout = layoutTextLines(lines, textBox, {
    centerAlign: hardwareLayout.width > 0 || qrSizePx > 0,
  });

  let qrLayout = null;
  if (qrSizePx > 0 && qrContent) {
    const qrX = textStartX + textWidthPx + gapBase;
    const qrY = contentYStart + (contentHeightPx - qrSizePx) / 2;
    const qrImage = await generateQrImage(qrContent, qrSizePx);
    if (qrImage) {
      qrLayout = {
        x: qrX,
        y: qrY,
        size: qrImage.sizePx,
        dataUrl: qrImage.dataUrl,
      };
    }
  }

  const svgParts = [];
  svgParts.push(
    `<svg xmlns="${SVG_XMLNS}" xmlns:xlink="http://www.w3.org/1999/xlink" width="${labelWidthPx}" height="${labelHeightPx}" viewBox="0 0 ${labelWidthPx} ${labelHeightPx}">`,
  );
  const strokeWidth = formatNumber(mmToPx(0.25));
  svgParts.push(
    `<rect x="0" y="0" width="${labelWidthPx}" height="${labelHeightPx}" fill="${LABEL_BACKGROUND_COLOR}" stroke="${FRAME_STROKE_COLOR}" stroke-width="${strokeWidth}" vector-effect="non-scaling-stroke" />`,
  );

  for (const element of hardwareLayout.elements) {
    if (element.type === 'image') {
      const resolvedHref = await resolveSvgImageHref(element.href);
      const escapedHref = escapeXml(resolvedHref);
      svgParts.push(
        `<image x="${formatNumber(element.x)}" y="${formatNumber(element.y)}" width="${formatNumber(element.width)}" height="${formatNumber(element.height)}" href="${escapedHref}" xlink:href="${escapedHref}">` +
          (element.title ? `<title>${escapeXml(element.title)}</title>` : '') +
          '</image>',
      );
    } else if (element.type === 'placeholder') {
      const radius = Math.round(element.height * 0.08);
      svgParts.push(
        `<rect x="${formatNumber(element.x)}" y="${formatNumber(element.y)}" width="${formatNumber(element.width)}" height="${formatNumber(element.height)}" fill="rgba(255,255,255,0.55)" stroke="rgba(15,23,42,0.25)" stroke-width="1" rx="${radius}" ry="${radius}" />`,
      );
      const placeholderFont = Math.max(10, Math.round(element.height * 0.22));
      const centerX = element.x + element.width / 2;
      const centerY = element.y + element.height / 2 + placeholderFont * 0.35;
      svgParts.push(
        `<text x="${formatNumber(centerX)}" y="${formatNumber(centerY)}" font-size="${placeholderFont}" font-weight="700" text-anchor="middle" fill="${LABEL_TEXT_COLOR}" font-family=${JSON.stringify(
          LABEL_FONT_FAMILY,
        )}>${escapeXml(element.label || 'Add image')}</text>`,
      );
    }
  }

  textLayout.forEach(line => {
    svgParts.push(
      `<text x="${formatNumber(line.x)}" y="${formatNumber(line.baseline)}" font-family=${JSON.stringify(
        LABEL_FONT_FAMILY,
      )} font-weight="${line.fontWeight}" font-size="${formatNumber(line.fontSize)}" fill="${LABEL_TEXT_COLOR}">${escapeXml(
        line.text,
      )}</text>`,
    );
  });

  if (qrLayout) {
    const escapedQrHref = escapeXml(qrLayout.dataUrl);
    svgParts.push(
      `<image x="${formatNumber(qrLayout.x)}" y="${formatNumber(qrLayout.y)}" width="${formatNumber(qrLayout.size)}" height="${formatNumber(qrLayout.size)}" href="${escapedQrHref}" xlink:href="${escapedQrHref}" />`,
    );
  }

  svgParts.push('</svg>');

  return {
    svgMarkup: svgParts.join(''),
    widthPx: labelWidthPx,
    heightPx: labelHeightPx,
    printableWidthMm: geometry.printableWidthMm,
    printableHeightMm: geometry.printableHeightMm,
  };
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
  if (state.hardwareType === 'Nut') {
    const hasThread = Boolean(state.threadSize);
    const detailsRequired = Boolean(state.showImage || state.showStandard);
    const hasType = Boolean(state.nutType);
    const detailsSatisfied = !detailsRequired || hasType;
    return Boolean(hasThread && detailsSatisfied);
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
    if (!headValid) {
      requirements.push(hardwareType === 'Screw' ? 'choose a screw type' : 'select a head style');
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
    syncBoltHeadPicker({ isValid: true });
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
    syncBearingTypePicker({ isValid: valid });
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
    if (!mountValid) {
      requirements.push('choose a mounting style');
    }

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
    if (requiresResistorValue && !resistorValid) {
      requirements.push('select a resistor value');
    }
    if (requiresCapacitorValue && !capacitorValid) {
      requirements.push('select a capacitor value');
    }
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

  buildLabelSvg()
    .then(result => {
      if (previewRenderRequestId !== requestId) {
        return;
      }
      const { svgMarkup, widthPx, heightPx } = result;
      const dataUrl = createSvgDataUrl(svgMarkup);
      labelPreviewImage.src = dataUrl;
      labelPreviewImage.style.display = 'block';
      labelPreviewImage.style.width = `${widthPx}px`;
      labelPreviewImage.style.height = `${heightPx}px`;
      labelPreviewImage.setAttribute('aria-hidden', 'false');
      previewReadyState = true;
      announcePreviewStatus('Preview updated.');
    })
    .catch(error => {
      if (previewRenderRequestId !== requestId) {
        return;
      }
      console.error('Unable to render label preview.', error);
      hidePreviewContent();
      previewReadyState = false;
      announcePreviewStatus('Preview unavailable.');
    });
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

function loadSvgImage(svgMarkup, widthPx, heightPx) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Unable to rasterize SVG.'));
    img.src = createSvgDataUrl(svgMarkup);
    img.width = widthPx;
    img.height = heightPx;
  });
}

export async function renderLabelPng() {
  const { svgMarkup, widthPx, heightPx, printableWidthMm, printableHeightMm } =
    await buildLabelSvg();
  const canvas = document.createElement('canvas');
  const devicePixelRatio = typeof window !== 'undefined' && window.devicePixelRatio
    ? window.devicePixelRatio
    : 1;
  const scaledWidth = Math.max(1, Math.round(widthPx * devicePixelRatio));
  const scaledHeight = Math.max(1, Math.round(heightPx * devicePixelRatio));
  canvas.width = scaledWidth;
  canvas.height = scaledHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to obtain a 2D canvas context for export.');
  }
  if (devicePixelRatio !== 1) {
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
  const img = await loadSvgImage(svgMarkup, widthPx, heightPx);
  ctx.clearRect(0, 0, widthPx, heightPx);
  ctx.drawImage(img, 0, 0, widthPx, heightPx);
  const blob = await canvasToBlob(canvas, 'image/png');
  return {
    blob,
    widthPx,
    heightPx,
    printableWidthMm,
    printableHeightMm,
    svgMarkup,
  };
}

export async function renderLabelSvgMarkup() {
  const { svgMarkup } = await buildLabelSvg();
  return svgMarkup;
}
