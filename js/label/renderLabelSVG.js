import { loadQrCodeLibrary } from '../lazy-loaders.js';

const SVG_XMLNS = 'http://www.w3.org/2000/svg';
const LABEL_BACKGROUND_COLOR = '#ffffff';
const LABEL_TEXT_COLOR = '#000000';
const FRAME_STROKE_COLOR = 'rgba(100, 116, 139, 0.6)';
const LABEL_FONT_FAMILY = "'Barlow', 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

const MIN_FONT_SIZE_PT = 8.25;
const LINE_HEIGHT_RATIO = 1.12;
const LETTER_SPACING_STEPS = [0, -0.15, -0.3, -0.45, -0.6];
const MAX_FIT_ITERATIONS = 14;

const inlineImageCache = new Map();

const textMeasurementCanvas =
  typeof document !== 'undefined' ? document.createElement('canvas') : null;
const textMeasurementContext = textMeasurementCanvas
  ? textMeasurementCanvas.getContext('2d')
  : null;

const qrCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;

export function mmToPx(mm, pxPerMm) {
  if (!Number.isFinite(mm) || !Number.isFinite(pxPerMm)) {
    return 0;
  }
  return mm * pxPerMm;
}

export function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return '0';
  }
  const rounded = Math.round(value * 1000) / 1000;
  if (Math.abs(rounded - Math.round(rounded)) < 0.0001) {
    return String(Math.round(rounded));
  }
  return rounded.toString();
}

export function escapeXml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toFontPx(pt, pxPerMm) {
  const pointsPerInch = 72;
  const mmPerInch = 25.4;
  const dpi = pxPerMm * mmPerInch;
  return (pt / pointsPerInch) * dpi;
}

function measureTextWidth(text, fontSizePx, fontWeight, fontFamily, letterSpacingPx) {
  if (!text) {
    return 0;
  }
  let width = 0;
  if (textMeasurementContext) {
    textMeasurementContext.font = `${fontWeight} ${fontSizePx}px ${fontFamily}`;
    const metrics = textMeasurementContext.measureText(text);
    width = metrics.width || 0;
  } else {
    width = text.length * fontSizePx * 0.6;
  }
  if (letterSpacingPx) {
    const normalized = text.replace(/\s+$/g, '');
    width += Math.max(0, normalized.length - 1) * letterSpacingPx;
  }
  return width;
}

function applyEllipsis(line, fontSizePx, fontWeight, fontFamily, letterSpacingPx, maxWidth) {
  if (!line) {
    return '…';
  }
  const ellipsis = '…';
  let trimmed = line.trimEnd();
  while (trimmed.length > 0) {
    const candidate = `${trimmed}${ellipsis}`;
    const width = measureTextWidth(candidate, fontSizePx, fontWeight, fontFamily, letterSpacingPx);
    if (width <= maxWidth + 0.25) {
      return candidate;
    }
    trimmed = trimmed.slice(0, -1).trimEnd();
  }
  return ellipsis;
}

function wrapSegment({
  segment,
  fontSizePx,
  fontWeight,
  fontFamily,
  letterSpacingPx,
  maxWidth,
}) {
  const words = segment.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [''];
  }
  const lines = [];
  let current = words[0];
  for (let i = 1; i < words.length; i += 1) {
    const candidate = `${current} ${words[i]}`;
    const width = measureTextWidth(candidate, fontSizePx, fontWeight, fontFamily, letterSpacingPx);
    if (width <= maxWidth + 0.25) {
      current = candidate;
    } else if (measureTextWidth(words[i], fontSizePx, fontWeight, fontFamily, letterSpacingPx) <= maxWidth + 0.25) {
      lines.push(current);
      current = words[i];
    } else {
      // Fallback to character wrapping
      const chars = words[i].split('');
      let chunk = '';
      chars.forEach(char => {
        const candidateChunk = chunk ? `${chunk}${char}` : char;
        const chunkWidth = measureTextWidth(
          candidateChunk,
          fontSizePx,
          fontWeight,
          fontFamily,
          letterSpacingPx,
        );
        if (chunkWidth <= maxWidth + 0.25) {
          chunk = candidateChunk;
        } else {
          if (chunk) {
            lines.push(chunk);
          }
          chunk = char;
        }
      });
      if (chunk) {
        if (measureTextWidth(chunk, fontSizePx, fontWeight, fontFamily, letterSpacingPx) > maxWidth + 0.25) {
          // Force tiny segments if nothing fits
          const forcedChars = chunk.split('');
          forcedChars.forEach(singleChar => {
            lines.push(singleChar);
          });
          chunk = '';
        }
        if (chunk) {
          lines.push(chunk);
        }
      }
      current = '';
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

function layoutText({
  text,
  fontSizePx,
  fontWeight,
  fontFamily,
  letterSpacingPx,
  boxWidthPx,
  boxHeightPx,
  lineClamp,
}) {
  const normalized = (text || '').replace(/[\r\t]+/g, ' ').replace(/\s+\n/g, '\n').trim();
  if (!normalized) {
    return { lines: [], lineWidths: [], totalHeightPx: 0, ellipsisApplied: false };
  }
  const segments = normalized.split(/\n/);
  const lines = [];
  segments.forEach(segment => {
    const trimmed = segment.trim();
    if (!trimmed) {
      lines.push('');
      return;
    }
    if (measureTextWidth(trimmed, fontSizePx, fontWeight, fontFamily, letterSpacingPx) <= boxWidthPx + 0.25) {
      lines.push(trimmed);
      return;
    }
    wrapSegment({
      segment: trimmed,
      fontSizePx,
      fontWeight,
      fontFamily,
      letterSpacingPx,
      maxWidth: boxWidthPx,
    }).forEach(line => {
      lines.push(line.trimEnd());
    });
  });

  let ellipsisApplied = false;
  const clamp = Number.isFinite(lineClamp) && lineClamp > 0 ? Math.floor(lineClamp) : null;
  if (clamp && lines.length > clamp) {
    const retained = lines.slice(0, clamp);
    const lastIndex = retained.length - 1;
    retained[lastIndex] = applyEllipsis(
      retained[lastIndex],
      fontSizePx,
      fontWeight,
      fontFamily,
      letterSpacingPx,
      boxWidthPx,
    );
    ellipsisApplied = true;
    const widths = retained.map(line =>
      measureTextWidth(line, fontSizePx, fontWeight, fontFamily, letterSpacingPx),
    );
    return {
      lines: retained,
      lineWidths: widths,
      totalHeightPx: retained.length * fontSizePx * LINE_HEIGHT_RATIO,
      ellipsisApplied,
    };
  }

  const lineHeightPx = fontSizePx * LINE_HEIGHT_RATIO;
  const totalHeightPx = lines.length * lineHeightPx;
  const fitsHeight = totalHeightPx <= boxHeightPx + 0.25;
  const lineWidths = lines.map(line =>
    measureTextWidth(line, fontSizePx, fontWeight, fontFamily, letterSpacingPx),
  );
  return {
    lines,
    lineWidths,
    totalHeightPx,
    ellipsisApplied,
    fits: fitsHeight,
  };
}

export function fitTextToBox({
  text,
  fontFamily = LABEL_FONT_FAMILY,
  fontWeight = 400,
  maxFontSizePx,
  minFontSizePx,
  boxWidthPx,
  boxHeightPx,
  lineClamp,
}) {
  const safeWidth = Math.max(0, boxWidthPx || 0);
  const safeHeight = Math.max(0, boxHeightPx || 0);
  const minSize = Math.max(minFontSizePx || 0, 1);
  const sizeUpperBound = Math.max(minSize, maxFontSizePx || minSize);
  const candidates = [];

  LETTER_SPACING_STEPS.forEach(letterSpacingPx => {
    let low = minSize;
    let high = sizeUpperBound;
    let best = null;
    for (let i = 0; i < MAX_FIT_ITERATIONS && high - low > 0.2; i += 1) {
      const mid = (low + high) / 2;
      const layout = layoutText({
        text,
        fontSizePx: mid,
        fontWeight,
        fontFamily,
        letterSpacingPx,
        boxWidthPx: safeWidth,
        boxHeightPx: safeHeight,
        lineClamp,
      });
      const fitsWidth = layout.lines.every(line =>
        measureTextWidth(line, mid, fontWeight, fontFamily, letterSpacingPx) <= safeWidth + 0.25,
      );
      if (layout.lines.length === 0) {
        best = {
          fontSizePx: minSize,
          lines: [],
          lineWidths: [],
          letterSpacingPx,
          ellipsisApplied: false,
          totalHeightPx: 0,
        };
        break;
      }
      if (fitsWidth && layout.fits !== false && layout.totalHeightPx <= safeHeight + 0.25) {
        best = {
          fontSizePx: mid,
          lines: layout.lines,
          lineWidths: layout.lineWidths,
          letterSpacingPx,
          ellipsisApplied: layout.ellipsisApplied || false,
          totalHeightPx: layout.totalHeightPx,
        };
        low = mid;
      } else {
        high = mid;
      }
    }
    if (!best) {
      const fallbackLayout = layoutText({
        text,
        fontSizePx: minSize,
        fontWeight,
        fontFamily,
        letterSpacingPx,
        boxWidthPx: safeWidth,
        boxHeightPx: safeHeight,
        lineClamp,
      });
      best = {
        fontSizePx: minSize,
        lines: fallbackLayout.lines,
        lineWidths: fallbackLayout.lineWidths,
        letterSpacingPx,
        ellipsisApplied: fallbackLayout.ellipsisApplied || false,
        totalHeightPx: fallbackLayout.totalHeightPx,
      };
    }
    candidates.push(best);
  });

  candidates.sort((a, b) => {
    if (a.lines.length === 0 && b.lines.length > 0) {
      return 1;
    }
    if (b.lines.length === 0 && a.lines.length > 0) {
      return -1;
    }
    if (Math.abs(b.fontSizePx - a.fontSizePx) > 0.25) {
      return b.fontSizePx - a.fontSizePx;
    }
    if (a.ellipsisApplied !== b.ellipsisApplied) {
      return a.ellipsisApplied ? 1 : -1;
    }
    return a.totalHeightPx - b.totalHeightPx;
  });

  const chosen = candidates[0] || {
    fontSizePx: minSize,
    lines: [],
    lineWidths: [],
    letterSpacingPx: 0,
    ellipsisApplied: false,
    totalHeightPx: 0,
  };
  const lineHeightPx = chosen.fontSizePx * LINE_HEIGHT_RATIO;
  return {
    fontSizePx: chosen.fontSizePx,
    lines: chosen.lines,
    lineWidths: chosen.lineWidths,
    letterSpacingPx: chosen.letterSpacingPx,
    ellipsisApplied: chosen.ellipsisApplied,
    totalHeightPx: chosen.totalHeightPx,
    lineHeightPx,
  };
}

async function resolveSvgImageHref(href) {
  if (!href) {
    return '';
  }
  const normalized = href.trim();
  if (!normalized) {
    return '';
  }
  if (/^(data:|blob:)/i.test(normalized)) {
    return normalized;
  }
  if (inlineImageCache.has(normalized)) {
    return inlineImageCache.get(normalized);
  }
  if (typeof fetch !== 'function') {
    inlineImageCache.set(normalized, normalized);
    return normalized;
  }
  try {
    const response = await fetch(normalized, { cache: 'force-cache' });
    if (!response.ok) {
      throw new Error(`Unexpected response status ${response.status}`);
    }
    const blob = await response.blob();
    const reader = new FileReader();
    const dataUrlPromise = new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('Unable to convert image.'));
    });
    reader.readAsDataURL(blob);
    const dataUrl = await dataUrlPromise;
    inlineImageCache.set(normalized, dataUrl);
    return dataUrl;
  } catch (error) {
    console.warn('Unable to inline SVG image asset, using absolute URL instead.', error);
    inlineImageCache.set(normalized, normalized);
    return normalized;
  }
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

function computeMediaZoneWidth({
  printableWidthPx,
  printableHeightPx,
  printableWidthMm,
  contentWidthPx,
  minTextWidthPx,
  hasMedia,
  stackIcons,
}) {
  if (!hasMedia) {
    return 0;
  }
  if (!(contentWidthPx > 0) || contentWidthPx <= minTextWidthPx) {
    return 0;
  }
  const aspect = printableHeightPx > 0 ? printableHeightPx / Math.max(printableWidthPx, 1) : 0;
  const basePercent = 0.28 + aspect * 0.12;
  const clampedPercent = Math.min(0.36, Math.max(0.24, basePercent));
  let zoneWidth = contentWidthPx * clampedPercent;
  if (stackIcons) {
    zoneWidth = Math.max(zoneWidth, contentWidthPx * 0.32);
  }
  if (stackIcons && Number.isFinite(printableWidthMm) && printableWidthMm > 0 && printableWidthMm < 45) {
    zoneWidth = Math.max(zoneWidth, contentWidthPx * 0.34);
  }
  const maxAllowed = contentWidthPx - minTextWidthPx;
  if (maxAllowed <= 0) {
    return 0;
  }
  return Math.min(zoneWidth, maxAllowed);
}

function layoutMediaZone({
  hardwareInfo,
  rect,
  stackIcons,
  paddingPx,
  gapPx,
}) {
  if (!hardwareInfo || rect.width <= 0 || rect.height <= 0) {
    return { width: 0, elements: [] };
  }
  const elements = [];
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  const paddedWidth = Math.max(0, rect.width - paddingPx * 2);
  const paddedHeight = Math.max(0, rect.height - paddingPx * 2);

  if (hardwareInfo.type === 'custom-image') {
    if (hardwareInfo.hasImage && hardwareInfo.src) {
      elements.push({
        type: 'image',
        href: hardwareInfo.src,
        x: rect.x + paddingPx,
        y: rect.y + paddingPx,
        width: paddedWidth,
        height: paddedHeight,
        title: hardwareInfo.alt || 'Custom image',
      });
      return { width: rect.width, elements };
    }
    elements.push({
      type: 'placeholder',
      x: rect.x + paddingPx / 2,
      y: rect.y + paddingPx / 2,
      width: Math.max(0, rect.width - paddingPx),
      height: Math.max(0, rect.height - paddingPx),
      label: 'Add image',
    });
    return { width: rect.width, elements };
  }

  if (hardwareInfo.type === 'custom-icon') {
    const iconLabel = hardwareInfo.iconLabel || hardwareInfo.iconName || 'Custom icon';
    const hasSvg = typeof hardwareInfo.iconSvgData === 'string' && hardwareInfo.iconSvgData.trim().length > 0;
    if (hasSvg) {
      elements.push({
        type: 'image',
        href: hardwareInfo.iconSvgData,
        x: rect.x + paddingPx,
        y: rect.y + paddingPx,
        width: paddedWidth,
        height: paddedHeight,
        title: iconLabel,
      });
      return { width: rect.width, elements };
    }
    if (hardwareInfo.hasIcon && hardwareInfo.iconUnicode) {
      const iconSize = Math.min(paddedWidth, paddedHeight);
      elements.push({
        type: 'icon',
        unicode: hardwareInfo.iconUnicode,
        style: hardwareInfo.iconStyle || 'solid',
        label: iconLabel,
        x: centerX,
        y: centerY,
        size: iconSize,
      });
      return { width: rect.width, elements };
    }
    elements.push({
      type: 'placeholder',
      x: rect.x + paddingPx / 2,
      y: rect.y + paddingPx / 2,
      width: Math.max(0, rect.width - paddingPx),
      height: Math.max(0, rect.height - paddingPx),
      label: 'Choose icon',
    });
    return { width: rect.width, elements };
  }

  const stackedCandidates = new Set(['bolt', 'screw']);
  if (stackedCandidates.has(hardwareInfo.type)) {
    const images = Array.isArray(hardwareInfo.images)
      ? hardwareInfo.images.filter(image => image && image.src)
      : [];
    if (images.length === 0) {
      return { width: 0, elements: [] };
    }
    if (stackIcons && images.length >= 2) {
      const slotHeight = (rect.height - gapPx * (images.length - 1)) / images.length;
      const iconSize = Math.min(slotHeight - paddingPx * 2, rect.width - paddingPx * 2);
      let cursorY = rect.y;
      images.forEach(image => {
        const size = Math.max(1, iconSize);
        const offsetX = centerX - size / 2;
        const offsetY = cursorY + (slotHeight - size) / 2;
        elements.push({
          type: 'image',
          href: image.src,
          x: offsetX,
          y: offsetY,
          width: size,
          height: size,
          title: image.alt || 'Hardware reference',
        });
        cursorY += slotHeight + gapPx;
      });
      return { width: rect.width, elements };
    }
    const slotWidth = (rect.width - gapPx * (images.length - 1)) / images.length;
    const iconSize = Math.min(slotWidth - paddingPx * 2, rect.height - paddingPx * 2);
    let cursorX = rect.x;
    images.forEach(image => {
      const size = Math.max(1, iconSize);
      const offsetX = cursorX + (slotWidth - size) / 2;
      const offsetY = centerY - size / 2;
      elements.push({
        type: 'image',
        href: image.src,
        x: offsetX,
        y: offsetY,
        width: size,
        height: size,
        title: image.alt || 'Hardware reference',
      });
      cursorX += slotWidth + gapPx;
    });
    return { width: rect.width, elements };
  }

  if (hardwareInfo.type === 'photo' || hardwareInfo.type === 'fuse-illustration') {
    if (!hardwareInfo.src) {
      return { width: 0, elements: [] };
    }
    const width = rect.width - paddingPx * 2;
    const height = rect.height - paddingPx * 2;
    const size = Math.max(1, Math.min(width, height));
    elements.push({
      type: 'image',
      href: hardwareInfo.src,
      x: centerX - size / 2,
      y: centerY - size / 2,
      width: size,
      height: size,
      title: hardwareInfo.alt || 'Hardware illustration',
    });
    return { width: rect.width, elements };
  }

  return { width: 0, elements: [] };
}

function scaleFitToHeight(fit, targetHeight) {
  if (!fit || !(targetHeight > 0) || !(fit.totalHeightPx > 0)) {
    return fit;
  }
  if (fit.totalHeightPx <= targetHeight + 0.5) {
    return fit;
  }
  const scale = targetHeight / fit.totalHeightPx;
  if (!(scale > 0)) {
    return fit;
  }
  const scaledLineWidths = Array.isArray(fit.lineWidths)
    ? fit.lineWidths.map(width => width * scale)
    : fit.lineWidths;
  return {
    ...fit,
    fontSizePx: fit.fontSizePx * scale,
    lineHeightPx: fit.lineHeightPx * scale,
    totalHeightPx: fit.totalHeightPx * scale,
    lineWidths: scaledLineWidths,
    letterSpacingPx: (fit.letterSpacingPx || 0) * scale,
  };
}

function layoutTextBlocks({
  textLines,
  textRect,
  pxPerMm,
  minFontSizePx,
}) {
  const mainLine = (textLines.line1 || '').trim();
  const subtitleLines = [textLines.line2, textLines.line3]
    .map(line => (line || '').trim())
    .filter(line => line.length > 0);
  if (!mainLine && subtitleLines.length === 0) {
    return { blocks: [], main: null, subtitles: [] };
  }

  if (!mainLine && subtitleLines.length > 0) {
    const subtitleText = subtitleLines.join('\n');
    const subtitleMinSize = Math.max(minFontSizePx * 0.72, 7);
    const subtitleFit = fitTextToBox({
      text: subtitleText,
      fontWeight: 600,
      maxFontSizePx: Math.max(textRect.height, Math.min(textRect.width, textRect.height * 1.2)),
      minFontSizePx: subtitleMinSize,
      boxWidthPx: textRect.width,
      boxHeightPx: Math.max(textRect.height, subtitleMinSize * LINE_HEIGHT_RATIO),
      lineClamp: 3,
    });
    const adjusted = scaleFitToHeight(subtitleFit, textRect.height);
    const top = textRect.y + Math.max(0, (textRect.height - adjusted.totalHeightPx) / 2);
    return { blocks: [{ fit: adjusted, top }], main: null, subtitles: [adjusted] };
  }

  const subtitleCount = subtitleLines.length;
  const gapCandidatePx = subtitleCount > 0
    ? Math.min(
        Math.max(textRect.height * 0.07, mmToPx(0.6, pxPerMm)),
        Math.max(textRect.height * 0.1, mmToPx(1.4, pxPerMm)),
      )
    : 0;
  let gapPx = subtitleCount > 0 ? Math.max(textRect.height * 0.05, gapCandidatePx) : 0;
  if (subtitleCount > 0) {
    const minCombinedHeight = minFontSizePx * LINE_HEIGHT_RATIO * (1 + subtitleCount);
    if (textRect.height - gapPx < minCombinedHeight) {
      gapPx = Math.max(0, textRect.height - minCombinedHeight);
    }
  }
  const usableHeight = Math.max(0, textRect.height - gapPx);

  const maxFontSizeEstimate = Math.max(textRect.height, textRect.width);
  let minMainHeight;
  let maxMainHeight;
  if (subtitleCount > 0) {
    const minMainCandidate = Math.max(minFontSizePx * LINE_HEIGHT_RATIO * 1.05, usableHeight * 0.33);
    const maxMainCandidate = Math.max(minMainCandidate, usableHeight * 0.6);
    minMainHeight = Math.min(usableHeight, minMainCandidate);
    maxMainHeight = Math.min(usableHeight, Math.max(minMainHeight, maxMainCandidate));
  } else {
    minMainHeight = usableHeight;
    maxMainHeight = usableHeight;
  }

  let mainHeight = subtitleCount > 0
    ? Math.min(maxMainHeight, Math.max(minMainHeight, usableHeight * 0.48))
    : usableHeight;

  let chosenLayout = null;

  for (let iteration = 0; iteration < 8; iteration += 1) {
    mainHeight = Math.max(minMainHeight, Math.min(maxMainHeight, mainHeight));
    const subtitleHeight = subtitleCount > 0 ? Math.max(0, usableHeight - mainHeight) : 0;

    const mainFit = fitTextToBox({
      text: mainLine,
      fontWeight: 800,
      maxFontSizePx: Math.max(12, Math.min(mainHeight, maxFontSizeEstimate)),
      minFontSizePx: minFontSizePx,
      boxWidthPx: textRect.width,
      boxHeightPx: Math.max(mainHeight, minFontSizePx * LINE_HEIGHT_RATIO),
      lineClamp: 1,
    });

    let subtitleFit = null;
    if (subtitleCount > 0) {
      const subtitleText = subtitleLines.join('\n');
      const subtitleMinSize = Math.max(minFontSizePx * 0.72, 7);
      subtitleFit = fitTextToBox({
        text: subtitleText,
        fontWeight: 600,
        maxFontSizePx: Math.max(subtitleHeight, Math.min(textRect.width, usableHeight)),
        minFontSizePx: subtitleMinSize,
        boxWidthPx: textRect.width,
        boxHeightPx: Math.max(subtitleHeight, subtitleMinSize * LINE_HEIGHT_RATIO),
        lineClamp: 3,
      });
    }

    const mainOverflow = mainFit.totalHeightPx > mainHeight + 0.5;
    const subtitleOverflow = subtitleFit ? subtitleFit.totalHeightPx > subtitleHeight + 0.5 : false;
    const subtitleEllipsis = subtitleFit ? subtitleFit.ellipsisApplied : false;

    if (subtitleCount > 0 && (subtitleOverflow || subtitleEllipsis) && mainHeight > minMainHeight + 0.5) {
      mainHeight = Math.max(minMainHeight, mainHeight - Math.max(4, textRect.height * 0.04));
      continue;
    }

    if ((mainOverflow || mainFit.ellipsisApplied) && mainHeight < maxMainHeight - 0.5) {
      mainHeight = Math.min(maxMainHeight, mainHeight + Math.max(4, textRect.height * 0.04));
      continue;
    }

    chosenLayout = { mainFit, subtitleFit, mainHeight, subtitleHeight, gapPx };
    break;
  }

  if (!chosenLayout) {
    const fallbackMain = fitTextToBox({
      text: mainLine,
      fontWeight: 800,
      maxFontSizePx: Math.max(12, Math.min(usableHeight, maxFontSizeEstimate)),
      minFontSizePx: minFontSizePx,
      boxWidthPx: textRect.width,
      boxHeightPx: Math.max(usableHeight, minFontSizePx * LINE_HEIGHT_RATIO),
      lineClamp: 1,
    });
    const fallbackSubtitle = subtitleCount > 0
      ? fitTextToBox({
          text: subtitleLines.join('\n'),
          fontWeight: 600,
          maxFontSizePx: Math.max(usableHeight * 0.5, Math.min(textRect.width, usableHeight)),
          minFontSizePx: Math.max(minFontSizePx * 0.72, 7),
          boxWidthPx: textRect.width,
          boxHeightPx: Math.max(usableHeight * 0.5, minFontSizePx * LINE_HEIGHT_RATIO),
          lineClamp: 3,
        })
      : null;
    chosenLayout = {
      mainFit: fallbackMain,
      subtitleFit: fallbackSubtitle,
      mainHeight: subtitleCount > 0 ? Math.min(usableHeight, Math.max(usableHeight * 0.55, fallbackMain.totalHeightPx)) : usableHeight,
      subtitleHeight: subtitleCount > 0 ? Math.max(0, usableHeight - Math.min(usableHeight, Math.max(usableHeight * 0.55, fallbackMain.totalHeightPx))) : 0,
      gapPx,
    };
  }

  const blocks = [];
  const adjustedMain = scaleFitToHeight(
    chosenLayout.mainFit,
    Math.max(chosenLayout.mainHeight, minFontSizePx * LINE_HEIGHT_RATIO),
  );
  const mainTop = textRect.y + Math.max(0, (chosenLayout.mainHeight - adjustedMain.totalHeightPx) / 2);
  blocks.push({ fit: adjustedMain, top: mainTop });

  let subtitleFits = [];
  if (chosenLayout.subtitleFit) {
    const adjustedSubtitle = scaleFitToHeight(chosenLayout.subtitleFit, chosenLayout.subtitleHeight);
    const subtitleZoneTop = textRect.y + chosenLayout.mainHeight + gapPx;
    const subtitleTop = subtitleZoneTop + Math.max(0, (chosenLayout.subtitleHeight - adjustedSubtitle.totalHeightPx) / 2);
    blocks.push({ fit: adjustedSubtitle, top: subtitleTop });
    subtitleFits = [adjustedSubtitle];
  }

  return { blocks, main: adjustedMain, subtitles: subtitleFits };
}

export async function renderLabelSVG({
  geometry,
  pxPerMm,
  textLines,
  hardwareInfo,
  qrContent,
  minTextWidthMm = 9,
  qrGenerator,
}) {
  const labelWidthPx = Math.max(1, Math.round(geometry.labelWidthMm * pxPerMm));
  const labelHeightPx = Math.max(1, Math.round(geometry.labelHeightMm * pxPerMm));
  const printableWidthPx = Math.max(0, Math.round(geometry.printableWidthMm * pxPerMm));
  const printableHeightPx = Math.max(0, Math.round(geometry.printableHeightMm * pxPerMm));
  const marginXPx = Math.max(0, Math.round(geometry.marginX * pxPerMm));
  const marginYPx = Math.max(0, Math.round(geometry.marginY * pxPerMm));

  const paddingLeftPx = Math.round(mmToPx(1.2, pxPerMm));
  const paddingRightPx = Math.round(mmToPx(1.2, pxPerMm));
  const paddingTopPx = Math.round(mmToPx(1, pxPerMm));
  const paddingBottomPx = Math.round(mmToPx(1, pxPerMm));
  const gapPx = Math.round(mmToPx(0.8, pxPerMm));

  const contentRect = {
    x: marginXPx + paddingLeftPx,
    y: marginYPx + paddingTopPx,
    width: Math.max(0, printableWidthPx - paddingLeftPx - paddingRightPx),
    height: Math.max(0, printableHeightPx - paddingTopPx - paddingBottomPx),
  };

  const minTextWidthPx = Math.max(Math.round(mmToPx(minTextWidthMm, pxPerMm)), Math.round(contentRect.height * 0.75));
  const labelHeightMm = geometry.labelHeightMm || 0;
  const stackIcons = Boolean(
    hardwareInfo &&
      Array.isArray(hardwareInfo.images) &&
      hardwareInfo.images.length >= 2 &&
      (labelHeightMm >= 18 || contentRect.height / Math.max(contentRect.width, 1) > 1.2),
  );

  const mediaZoneWidthPx = computeMediaZoneWidth({
    printableWidthPx,
    printableHeightPx,
    printableWidthMm: geometry.printableWidthMm,
    contentWidthPx: contentRect.width,
    minTextWidthPx,
    hasMedia: Boolean(hardwareInfo),
    stackIcons,
  });

  const mediaRect = {
    x: contentRect.x,
    y: contentRect.y,
    width: mediaZoneWidthPx,
    height: contentRect.height,
  };

  const textRect = {
    x: mediaZoneWidthPx > 0 ? contentRect.x + mediaZoneWidthPx + gapPx : contentRect.x,
    y: contentRect.y,
    width: Math.max(0, contentRect.width - mediaZoneWidthPx - (mediaZoneWidthPx > 0 ? gapPx : 0)),
    height: contentRect.height,
  };

  let qrLayout = null;
  const qrText = typeof qrContent === 'string' ? qrContent.trim() : '';
  let textWidthForContent = textRect.width;
  if (qrText) {
    const qrMaxWidth = Math.max(0, textRect.width * 0.38);
    const qrMaxHeight = textRect.height;
    const maxQr = Math.min(qrMaxWidth, qrMaxHeight);
    const qrMin = mmToPx(4, pxPerMm);
    const textReserve = Math.max(minTextWidthPx, textRect.width * 0.6);
    const allowedWidth = Math.max(0, textRect.width - textReserve);
    const qrCandidate = Math.min(maxQr, allowedWidth);
    if (qrCandidate >= qrMin) {
      const qrSize = Math.round(qrCandidate);
      textWidthForContent = Math.max(minTextWidthPx, textRect.width - qrSize - gapPx);
      const generator = typeof qrGenerator === 'function' ? qrGenerator : generateQrImage;
      const qrImage = await generator(qrText, qrSize);
      if (qrImage) {
        qrLayout = {
          x: textRect.x + textWidthForContent + gapPx,
          y: textRect.y + (textRect.height - qrSize) / 2,
          size: qrImage.sizePx,
          dataUrl: qrImage.dataUrl,
        };
      }
    }
  }

  const textLayoutRect = {
    x: textRect.x,
    y: textRect.y,
    width: textWidthForContent,
    height: textRect.height,
  };

  const minFontSizePx = toFontPx(MIN_FONT_SIZE_PT, pxPerMm);
  const textLayout = layoutTextBlocks({
    textLines,
    textRect: textLayoutRect,
    pxPerMm,
    minFontSizePx,
  });

  const mediaLayout = layoutMediaZone({
    hardwareInfo,
    rect: mediaRect,
    stackIcons,
    paddingPx: Math.round(mmToPx(0.6, pxPerMm)),
    gapPx: Math.round(mmToPx(1, pxPerMm)),
  });

  const svgParts = [];
  svgParts.push(
    `<svg xmlns="${SVG_XMLNS}" xmlns:xlink="http://www.w3.org/1999/xlink" width="${labelWidthPx}" height="${labelHeightPx}" viewBox="0 0 ${labelWidthPx} ${labelHeightPx}">`,
  );
  const strokeWidth = formatNumber(mmToPx(0.25, pxPerMm));
  svgParts.push(
    `<rect x="0" y="0" width="${labelWidthPx}" height="${labelHeightPx}" fill="${LABEL_BACKGROUND_COLOR}" stroke="${FRAME_STROKE_COLOR}" stroke-width="${strokeWidth}" vector-effect="non-scaling-stroke" />`,
  );

  for (const element of mediaLayout.elements) {
    if (element.type === 'image') {
      const href = await resolveSvgImageHref(element.href);
      const escapedHref = escapeXml(href);
      const title = element.title ? `<title>${escapeXml(element.title)}</title>` : '';
      svgParts.push(
        `<image x="${formatNumber(element.x)}" y="${formatNumber(element.y)}" width="${formatNumber(element.width)}" height="${formatNumber(element.height)}" href="${escapedHref}" xlink:href="${escapedHref}">${title}</image>`,
      );
    } else if (element.type === 'placeholder') {
      const radius = Math.round(Math.min(element.width, element.height) * 0.12);
      svgParts.push(
        `<rect x="${formatNumber(element.x)}" y="${formatNumber(element.y)}" width="${formatNumber(element.width)}" height="${formatNumber(element.height)}" fill="rgba(255,255,255,0.55)" stroke="rgba(15,23,42,0.25)" stroke-width="1" rx="${radius}" ry="${radius}" />`,
      );
      const placeholderFont = Math.max(12, Math.round(Math.min(element.width, element.height) * 0.22));
      const centerX = element.x + element.width / 2;
      const centerY = element.y + element.height / 2 + placeholderFont * 0.35;
      svgParts.push(
        `<text x="${formatNumber(centerX)}" y="${formatNumber(centerY)}" font-size="${placeholderFont}" font-weight="700" text-anchor="middle" fill="${LABEL_TEXT_COLOR}" font-family=${JSON.stringify(LABEL_FONT_FAMILY)}>${escapeXml(element.label || 'Add image')}</text>`,
      );
    } else if (element.type === 'icon') {
      const fontFamily =
        element.style === 'brands' ? 'Font Awesome 6 Brands' : 'Font Awesome 6 Free';
      const fontWeight = element.style === 'regular' ? 400 : element.style === 'solid' ? 900 : 400;
      const glyph = element.unicode ? `&#x${element.unicode};` : '';
      const title = element.label ? `<title>${escapeXml(element.label)}</title>` : '';
      svgParts.push(
        `<g>${title}<text x="${formatNumber(element.x)}" y="${formatNumber(element.y)}" font-family=${JSON.stringify(fontFamily)} font-weight="${fontWeight}" font-size="${formatNumber(element.size)}" text-anchor="middle" dominant-baseline="middle" fill="${LABEL_TEXT_COLOR}">${glyph}</text></g>`,
      );
    }
  }

  const centerAlign = mediaRect.width > 0 || Boolean(qrLayout);
  textLayout.blocks.forEach(block => {
    const { fit, top } = block;
    let baseline = top + fit.fontSizePx;
    fit.lines.forEach((line, index) => {
      const lineWidth = Array.isArray(fit.lineWidths) ? fit.lineWidths[index] || 0 : 0;
      const offset = centerAlign ? Math.max(0, (textLayoutRect.width - lineWidth) / 2) : 0;
      const x = textLayoutRect.x + offset;
      const letterSpacing = fit.letterSpacingPx || 0;
      const weight = fit === textLayout.main ? 800 : 600;
      svgParts.push(
        `<text x="${formatNumber(x)}" y="${formatNumber(baseline)}" font-family=${JSON.stringify(LABEL_FONT_FAMILY)} font-weight="${weight}" font-size="${formatNumber(fit.fontSizePx)}" letter-spacing="${formatNumber(letterSpacing)}" fill="${LABEL_TEXT_COLOR}">${escapeXml(line)}</text>`,
      );
      baseline += fit.lineHeightPx;
    });
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

export function createSvgDataUrl(svgMarkup) {
  const encoded = encodeURIComponent(svgMarkup)
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

export function loadSvgImage(svgMarkup, widthPx, heightPx) {
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

export function canvasToBlob(canvas, type = 'image/png', quality) {
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
  const binary = typeof atob === 'function' ? atob(base64) : '';
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    buffer[i] = binary.charCodeAt(i);
  }
  const mimeType = dataUrl.split(';')[0].split(':')[1] || type;
  return Promise.resolve(new Blob([buffer], { type: mimeType }));
}

