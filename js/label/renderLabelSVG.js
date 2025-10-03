import { loadQrCodeLibrary } from '../lazy-loaders.js';
import {
  defaultLayoutPresets,
  getActiveLayoutPreset,
  getPresetOverride,
  setPresetOverride,
  clearPresetOverrides,
  exportLayoutPresets,
  importLayoutPresets,
  subscribePresetChanges,
  notifyPresetListeners,
} from './layoutPresets.js';
import { ensureLayoutEditor } from './layoutEditor.js';

const SVG_XMLNS = 'http://www.w3.org/2000/svg';
const SVG_XLINK = 'http://www.w3.org/1999/xlink';
const LABEL_FONT_FAMILY = "'Barlow', 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const LABEL_BACKGROUND_COLOR = '#ffffff';
const LABEL_TEXT_COLOR = '#0f172a';
const FRAME_STROKE_COLOR = 'rgba(100,116,139,0.5)';
const MAX_FIT_ITERATIONS = 12;
const LETTER_SPACING_BASE_STEPS = [0, -0.1, -0.2, -0.3, -0.4];
const QR_SIDE_PX_MIN = 24;
const ICON_PADDING_MM = 0.4;
const MEDIA_TEXT_GAP_MM = 0.6;

const inlineImageCache = new Map();

const measureCanvas =
  typeof document !== 'undefined' ? document.createElement('canvas') : null;
const measureContext = measureCanvas ? measureCanvas.getContext('2d') : null;

const qrCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;

function clamp(value, min, max) {
  if (!Number.isFinite(value)) {
    return Number.isFinite(min) ? min : 0;
  }
  if (Number.isFinite(min) && value < min) {
    return min;
  }
  if (Number.isFinite(max) && value > max) {
    return max;
  }
  return value;
}

export function mmToPx(mm, pxPerMm) {
  if (!Number.isFinite(mm) || !Number.isFinite(pxPerMm)) {
    return 0;
  }
  return mm * pxPerMm;
}

function toFontPx(pt, pxPerMm) {
  const pointsPerInch = 72;
  const mmPerInch = 25.4;
  const dpi = pxPerMm * mmPerInch;
  return (pt / pointsPerInch) * dpi;
}

export function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return '0';
  }
  const rounded = Math.round(value * 1000) / 1000;
  if (Math.abs(rounded - Math.round(rounded)) < 1e-6) {
    return String(Math.round(rounded));
  }
  return rounded.toString();
}

export function escapeXml(value) {
  return (value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function measureTextWidth(text, fontSizePx, fontWeight, fontFamily, letterSpacingPx = 0) {
  if (!text) {
    return 0;
  }
  if (measureContext) {
    measureContext.font = `${fontWeight} ${fontSizePx}px ${fontFamily}`;
    const metrics = measureContext.measureText(text);
    let width = metrics.width || 0;
    if (letterSpacingPx) {
      width += Math.max(0, text.replace(/\s+$/g, '').length - 1) * letterSpacingPx;
    }
    return width;
  }
  const approx = text.length * fontSizePx * 0.6;
  return approx + Math.max(0, text.length - 1) * letterSpacingPx;
}

function applyEllipsis(text, fontSizePx, fontWeight, letterSpacingPx, maxWidthPx) {
  if (!text) {
    return '…';
  }
  const ellipsis = '…';
  let working = text.trimEnd();
  while (working.length > 0) {
    const candidate = `${working}${ellipsis}`;
    const width = measureTextWidth(candidate, fontSizePx, fontWeight, LABEL_FONT_FAMILY, letterSpacingPx);
    if (width <= maxWidthPx + 0.25) {
      return candidate;
    }
    working = working.slice(0, -1).trimEnd();
  }
  return ellipsis;
}

function buildLetterSpacingSteps(minSpacingPx) {
  const steps = [...LETTER_SPACING_BASE_STEPS];
  if (Number.isFinite(minSpacingPx) && minSpacingPx < steps[steps.length - 1]) {
    const target = Math.round(minSpacingPx * 100) / 100;
    if (!steps.includes(target)) {
      steps.push(target);
    }
  }
  const unique = Array.from(new Set(steps));
  unique.sort((a, b) => a - b);
  return unique.reverse();
}

function fitSingleLineText({ text, fontWeight = 800, minPt, maxPt, widthPx, pxPerMm, letterSpacingLimit = -0.3 }) {
  const normalized = (text || '').replace(/[\r\n\t]+/g, ' ').trim();
  if (!normalized) {
    return {
      fontSizePx: toFontPx(minPt, pxPerMm),
      letterSpacingPx: 0,
      text: '',
      ellipsisApplied: false,
      widthPx: 0,
    };
  }
  const minPx = toFontPx(minPt, pxPerMm);
  const maxPx = toFontPx(maxPt, pxPerMm);
  const letterSpacingSteps = buildLetterSpacingSteps(letterSpacingLimit);
  let best = null;

  letterSpacingSteps.forEach(spacingPx => {
    let low = minPx;
    let high = Math.max(minPx, maxPx);
    let bestSize = null;
    for (let i = 0; i < MAX_FIT_ITERATIONS && high - low > 0.2; i += 1) {
      const mid = (low + high) / 2;
      const width = measureTextWidth(normalized, mid, fontWeight, LABEL_FONT_FAMILY, spacingPx);
      if (width <= widthPx + 0.25) {
        bestSize = mid;
        low = mid;
      } else {
        high = mid;
      }
    }
    if (bestSize === null) {
      const widthAtMin = measureTextWidth(normalized, minPx, fontWeight, LABEL_FONT_FAMILY, spacingPx);
      if (widthAtMin <= widthPx + 0.25) {
        bestSize = minPx;
      }
    }
    let candidate = null;
    if (bestSize !== null) {
      candidate = {
        fontSizePx: bestSize,
        letterSpacingPx: spacingPx,
        text: normalized,
        ellipsisApplied: false,
        widthPx: measureTextWidth(normalized, bestSize, fontWeight, LABEL_FONT_FAMILY, spacingPx),
      };
    } else {
      const ellipsized = applyEllipsis(normalized, minPx, fontWeight, spacingPx, widthPx);
      candidate = {
        fontSizePx: minPx,
        letterSpacingPx: spacingPx,
        text: ellipsized,
        ellipsisApplied: true,
        widthPx: measureTextWidth(ellipsized, minPx, fontWeight, LABEL_FONT_FAMILY, spacingPx),
      };
    }
    if (!best) {
      best = candidate;
      return;
    }
    if (candidate.fontSizePx > best.fontSizePx + 0.2) {
      best = candidate;
      return;
    }
    if (Math.abs(candidate.fontSizePx - best.fontSizePx) <= 0.2) {
      const spacingComparison = Math.abs(candidate.letterSpacingPx) - Math.abs(best.letterSpacingPx);
      if (spacingComparison < -0.02) {
        best = candidate;
        return;
      }
      if (Math.abs(spacingComparison) <= 0.02) {
        if (candidate.ellipsisApplied !== best.ellipsisApplied) {
          best = candidate.ellipsisApplied ? best : candidate;
          return;
        }
      }
    }
  });

  return best || {
    fontSizePx: minPx,
    letterSpacingPx: 0,
    text: normalized,
    ellipsisApplied: false,
    widthPx: measureTextWidth(normalized, minPx, fontWeight, LABEL_FONT_FAMILY, 0),
  };
}

function wrapWords(text, fontSizePx, fontWeight, letterSpacingPx, widthPx) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [''];
  }
  const lines = [];
  let current = words[0];
  for (let i = 1; i < words.length; i += 1) {
    const candidate = `${current} ${words[i]}`;
    const width = measureTextWidth(candidate, fontSizePx, fontWeight, LABEL_FONT_FAMILY, letterSpacingPx);
    if (width <= widthPx + 0.25) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

function fitMultiLineText({
  lines,
  fontWeight = 600,
  minPt,
  maxPt,
  lineHeightPct,
  widthPx,
  heightPx,
  pxPerMm,
  allowEllipsis = true,
}) {
  const normalizedLines = Array.isArray(lines)
    ? lines
        .map(line => (line || '').replace(/[\r\n\t]+/g, ' ').trim())
        .filter(line => line.length > 0)
    : [];
  if (normalizedLines.length === 0) {
    const minPx = toFontPx(minPt, pxPerMm);
    return {
      fontSizePx: minPx,
      letterSpacingPx: 0,
      lines: [],
      lineHeightPx: minPx * (lineHeightPct / 100),
      ellipsisApplied: false,
    };
  }
  const minPx = toFontPx(minPt, pxPerMm);
  const maxPx = toFontPx(maxPt, pxPerMm);
  const letterSpacingSteps = buildLetterSpacingSteps(-0.2);
  let best = null;

  letterSpacingSteps.forEach(letterSpacingPx => {
    let low = minPx;
    let high = Math.max(minPx, maxPx);
    let candidate = null;
    for (let i = 0; i < MAX_FIT_ITERATIONS && high - low > 0.2; i += 1) {
      const mid = (low + high) / 2;
      const layout = layoutLines(normalizedLines, mid, fontWeight, letterSpacingPx, widthPx, lineHeightPct);
      const fitsHeight = layout.totalHeightPx <= heightPx + 0.25;
      if (layout.fitsWidth && fitsHeight) {
        candidate = { ...layout, fontSizePx: mid, letterSpacingPx };
        low = mid;
      } else {
        high = mid;
      }
    }
    if (!candidate) {
      const layout = layoutLines(normalizedLines, minPx, fontWeight, letterSpacingPx, widthPx, lineHeightPct);
      candidate = { ...layout, fontSizePx: minPx, letterSpacingPx };
      if (!layout.fitsWidth && allowEllipsis) {
        const lastIndex = layout.lines.length - 1;
        if (lastIndex >= 0) {
          const ellipsized = applyEllipsis(
            layout.lines[lastIndex],
            minPx,
            fontWeight,
            letterSpacingPx,
            widthPx,
          );
          layout.lines[lastIndex] = ellipsized;
          layout.ellipsisApplied = true;
          layout.widths[lastIndex] = measureTextWidth(
            ellipsized,
            minPx,
            fontWeight,
            LABEL_FONT_FAMILY,
            letterSpacingPx,
          );
        }
      }
    }
    if (!best) {
      best = candidate;
      return;
    }
    if (candidate.fontSizePx > best.fontSizePx + 0.2) {
      best = candidate;
      return;
    }
    if (Math.abs(candidate.fontSizePx - best.fontSizePx) <= 0.2) {
      const spacingComparison = Math.abs(candidate.letterSpacingPx) - Math.abs(best.letterSpacingPx);
      if (spacingComparison < -0.02) {
        best = candidate;
      }
    }
  });

  const lineHeightPx = best.fontSizePx * (lineHeightPct / 100);
  return { ...best, lineHeightPx };
}

function layoutLines(lines, fontSizePx, fontWeight, letterSpacingPx, widthPx, lineHeightPct) {
  const layoutLinesArray = [];
  const widths = [];
  const lineHeightPx = fontSizePx * (lineHeightPct / 100);
  lines.forEach(line => {
    const measurements = wrapWords(line, fontSizePx, fontWeight, letterSpacingPx, widthPx);
    measurements.forEach(entry => {
      layoutLinesArray.push(entry);
      widths.push(measureTextWidth(entry, fontSizePx, fontWeight, LABEL_FONT_FAMILY, letterSpacingPx));
    });
  });
  const totalHeightPx = layoutLinesArray.length * lineHeightPx;
  const fitsWidth = widths.every(width => width <= widthPx + 0.25);
  return {
    lines: layoutLinesArray,
    widths,
    totalHeightPx,
    fitsWidth,
    ellipsisApplied: false,
  };
}

export function fitTextToBox(options) {
  return fitMultiLineText(options);
}

function resolveMediaItems(hardwareInfo) {
  if (!hardwareInfo) {
    return [];
  }
  if (hardwareInfo.type === 'custom-image') {
    if (hardwareInfo.hasImage && hardwareInfo.src) {
      return [
        {
          kind: 'image',
          href: hardwareInfo.src,
          alt: hardwareInfo.alt || 'Custom image',
        },
      ];
    }
    return [];
  }
  if (hardwareInfo.type === 'custom-icon') {
    if (hardwareInfo.iconSvgData) {
      return [
        {
          kind: 'image',
          href: hardwareInfo.iconSvgData,
          alt: hardwareInfo.iconLabel || hardwareInfo.iconName || 'Custom icon',
        },
      ];
    }
    if (hardwareInfo.hasIcon && hardwareInfo.iconUnicode) {
      return [
        {
          kind: 'glyph',
          unicode: hardwareInfo.iconUnicode,
          style: hardwareInfo.iconStyle || 'solid',
          alt: hardwareInfo.iconLabel || 'Custom icon',
        },
      ];
    }
    return [];
  }
  if (hardwareInfo.type === 'photo' || hardwareInfo.type === 'fuse-illustration') {
    if (!hardwareInfo.src) {
      return [];
    }
    return [
      {
        kind: 'image',
        href: hardwareInfo.src,
        alt: hardwareInfo.alt || 'Reference illustration',
      },
    ];
  }
  if (hardwareInfo.images && Array.isArray(hardwareInfo.images)) {
    return hardwareInfo.images
      .filter(image => image && image.src)
      .map((image, index) => ({
        kind: 'image',
        href: image.src,
        alt: image.alt || `Reference ${index + 1}`,
      }));
  }
  if (hardwareInfo.src) {
    return [
      {
        kind: 'image',
        href: hardwareInfo.src,
        alt: hardwareInfo.alt || 'Reference illustration',
      },
    ];
  }
  return [];
}

function computeMediaZoneWidth({
  contentWidthPx,
  preset,
  iconCount,
  pxPerMm,
}) {
  if (!iconCount) {
    return 0;
  }
  const percent = preset.media_zone_width_pct || 0;
  const minPercent = Number.isFinite(preset.media_zone_width_pct_min)
    ? preset.media_zone_width_pct_min
    : percent;
  const maxPercent = Number.isFinite(preset.media_zone_width_pct_max)
    ? preset.media_zone_width_pct_max
    : percent;
  const minWidthPx = (minPercent / 100) * contentWidthPx;
  const maxWidthPx = (maxPercent / 100) * contentWidthPx;
  const baseWidthPx = clamp((percent / 100) * contentWidthPx, minWidthPx, maxWidthPx);
  const iconPaddingPx = mmToPx(ICON_PADDING_MM, pxPerMm) * 2;
  const availableHeightRatio = iconCount > 1 && preset.icon_layout === 'row' ? 0.5 : 1;
  let widthPx = baseWidthPx;
  const iconMinPx = mmToPx(preset.icon_min_mm || 0, pxPerMm);
  for (let i = 0; i < 4; i += 1) {
    const innerWidthPx = Math.max(0, widthPx - iconPaddingPx);
    let candidateSize = innerWidthPx;
    if (preset.icon_layout === 'row' && iconCount > 1) {
      const gapPx = mmToPx(preset.icon_gap_mm || 0, pxPerMm);
      candidateSize = (innerWidthPx - gapPx * (iconCount - 1)) / iconCount;
    }
    if (preset.icon_layout === 'column' && iconCount > 1) {
      candidateSize = innerWidthPx * availableHeightRatio;
    }
    if (candidateSize >= iconMinPx - 0.5) {
      break;
    }
    const expanded = widthPx * 1.08;
    if (expanded <= maxWidthPx) {
      widthPx = expanded;
    } else {
      widthPx = maxWidthPx;
      break;
    }
  }
  return clamp(widthPx, minWidthPx, maxWidthPx);
}

async function resolveSvgImageHref(href) {
  if (!href) {
    return '';
  }
  if (href.startsWith('data:') || href.startsWith('blob:') || href.startsWith('http')) {
    return href;
  }
  if (inlineImageCache.has(href)) {
    return inlineImageCache.get(href);
  }
  if (typeof fetch !== 'function') {
    return href;
  }
  try {
    const response = await fetch(href);
    if (!response.ok) {
      return href;
    }
    const blob = await response.blob();
    const reader = new FileReader();
    const result = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    inlineImageCache.set(href, result);
    return result;
  } catch (error) {
    console.warn('Unable to inline media asset.', error);
    return href;
  }
}

async function generateQrImage(content, sizePx, qrGenerator) {
  if (!qrCanvas) {
    return null;
  }
  const generator = qrGenerator || (await loadQrCodeLibrary());
  if (!generator) {
    return null;
  }
  const canvas = qrCanvas;
  canvas.width = sizePx;
  canvas.height = sizePx;
  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }
  context.clearRect(0, 0, sizePx, sizePx);
  await generator.toCanvas(canvas, content, { width: sizePx, margin: 0 });
  return {
    dataUrl: canvas.toDataURL('image/png'),
    sizePx,
  };
}

function computeTextZones({ textRect, preset, pxPerMm }) {
  const textPreset = preset.text_zone || {};
  const gapPx = mmToPx(textPreset.gap_mm || 0, pxPerMm);
  const usableHeight = Math.max(0, textRect.height - gapPx);
  const mainHeight = clamp(
    ((textPreset.top_pct || 60) / 100) * usableHeight,
    usableHeight * 0.35,
    usableHeight,
  );
  const subHeight = Math.max(0, usableHeight - mainHeight);
  return {
    main: {
      x: textRect.x,
      y: textRect.y,
      width: textRect.width,
      height: mainHeight,
    },
    sub: {
      x: textRect.x,
      y: textRect.y + mainHeight + gapPx,
      width: textRect.width,
      height: subHeight,
    },
    gapPx,
  };
}

function buildSubtitleCandidates(textLines, preset) {
  const line2 = (textLines.line2 || '').trim();
  const line3 = (textLines.line3 || '').trim();
  const candidates = [];
  if (line2 || line3) {
    candidates.push(
      [line2, line3].filter(line => line && line.length > 0),
    );
    const textPreset = preset.text_zone || {};
    if (textPreset.compact_join_subtitles && line2 && line3) {
      const separator = textPreset.compact_separator || ' \u00b7 ';
      candidates.push([`${line2}${separator}${line3}`]);
    }
  }
  return candidates.filter(candidate => candidate.length > 0);
}

function layoutText({ textLines, textRect, preset, pxPerMm, qrBounds }) {
  const mainText = (textLines.line1 || '').trim();
  const textPreset = preset.text_zone || {};
  const zones = computeTextZones({ textRect, preset, pxPerMm });
  const mainFit = fitSingleLineText({
    text: mainText,
    fontWeight: 800,
    minPt: textPreset.main?.min_pt ?? 8,
    maxPt: textPreset.main?.max_pt ?? 16,
    widthPx: Math.max(0, zones.main.width - (qrBounds ? qrBounds.width : 0)),
    pxPerMm,
    letterSpacingLimit: textPreset.main?.letter_spacing_adj || -0.3,
  });
  const mainBaseline = zones.main.y + mainFit.fontSizePx;
  const mainX = zones.main.x;

  const subtitleCandidates = buildSubtitleCandidates(textLines, preset);
  let subtitleFit = {
    lines: [],
    fontSizePx: toFontPx(textPreset.sub?.min_pt ?? 7, pxPerMm),
    letterSpacingPx: 0,
    lineHeightPx:
      toFontPx(textPreset.sub?.min_pt ?? 7, pxPerMm) * ((textPreset.sub?.line_height_pct ?? 110) / 100),
    ellipsisApplied: false,
  };
  if (subtitleCandidates.length > 0) {
    const fits = subtitleCandidates.map(candidate =>
      fitMultiLineText({
        lines: candidate,
        fontWeight: 600,
        minPt: textPreset.sub?.min_pt ?? 7,
        maxPt: textPreset.sub?.max_pt ?? 11,
        lineHeightPct: textPreset.sub?.line_height_pct ?? 115,
        widthPx: zones.sub.width - (qrBounds ? qrBounds.width : 0),
        heightPx: zones.sub.height,
        pxPerMm,
      }),
    );
    fits.sort((a, b) => {
      if (b.fontSizePx - a.fontSizePx > 0.2) {
        return b.fontSizePx - a.fontSizePx;
      }
      if (a.ellipsisApplied !== b.ellipsisApplied) {
        return a.ellipsisApplied ? 1 : -1;
      }
      return a.lines.length - b.lines.length;
    });
    subtitleFit = fits[0];
  }

  return {
    main: {
      text: mainFit.text,
      fontSizePx: mainFit.fontSizePx,
      letterSpacingPx: mainFit.letterSpacingPx,
      baseline: mainBaseline,
      x: mainX,
    },
    sub: subtitleFit,
    zones,
  };
}

function computeQrLayout({
  qrContent,
  preset,
  textRect,
  pxPerMm,
  qrGenerator,
}) {
  const content = typeof qrContent === 'string' ? qrContent.trim() : '';
  if (!content) {
    return null;
  }
  const qrSideMm = preset.qr.side_mm || 8;
  const qrMarginMm = preset.qr.margin_mm || 0.6;
  const qrSidePx = Math.max(QR_SIDE_PX_MIN, Math.round(mmToPx(qrSideMm, pxPerMm)));
  const qrMarginPx = mmToPx(qrMarginMm, pxPerMm);
  const pct = Number.isFinite(preset.qr.max_pct_of_text_zone_width)
    ? preset.qr.max_pct_of_text_zone_width
    : 100;
  const maxWidthByPct = (pct / 100) * textRect.width;
  const finalSidePx = Math.min(qrSidePx, maxWidthByPct);
  if (finalSidePx < QR_SIDE_PX_MIN * 0.65) {
    return null;
  }
  const layout = {
    x: textRect.x + textRect.width - finalSidePx - qrMarginPx,
    y: textRect.y + qrMarginPx,
    sizePx: finalSidePx,
    marginPx: qrMarginPx,
  };
  return {
    layout,
    generator: qrGenerator,
    content,
  };
}

async function renderQrElement(qrPlan) {
  if (!qrPlan) {
    return null;
  }
  const qr = await generateQrImage(qrPlan.content, Math.round(qrPlan.layout.sizePx), qrPlan.generator);
  if (!qr) {
    return null;
  }
  return {
    x: qrPlan.layout.x,
    y: qrPlan.layout.y,
    size: qr.sizePx,
    href: qr.dataUrl,
  };
}

function layoutIcons({
  mediaItems,
  rect,
  preset,
  pxPerMm,
}) {
  if (!mediaItems || mediaItems.length === 0 || rect.width <= 0 || rect.height <= 0) {
    return [];
  }
  const paddingPx = mmToPx(ICON_PADDING_MM, pxPerMm);
  const gapPx = mmToPx(preset.icon_gap_mm || 0, pxPerMm);
  const items = [];
  const count = mediaItems.length;
  const innerWidth = Math.max(0, rect.width - paddingPx * 2);
  const innerHeight = Math.max(0, rect.height - paddingPx * 2);
  if (count === 1 || preset.icon_layout === 'column') {
    const slotHeight =
      count <= 1
        ? innerHeight
        : (innerHeight - gapPx * (count - 1)) / count;
    let cursorY = rect.y + paddingPx;
    mediaItems.forEach(item => {
      const size = Math.min(innerWidth, slotHeight);
      const x = rect.x + (rect.width - size) / 2;
      const y = cursorY + (slotHeight - size) / 2;
      items.push({ ...item, x, y, width: size, height: size });
      cursorY += slotHeight + gapPx;
    });
    return items;
  }
  // row layout
  const slotWidth = (innerWidth - gapPx * (count - 1)) / count;
  let cursorX = rect.x + paddingPx;
  mediaItems.forEach(item => {
    const size = Math.min(slotWidth, innerHeight);
    const x = cursorX + (slotWidth - size) / 2;
    const y = rect.y + (rect.height - size) / 2;
    items.push({ ...item, x, y, width: size, height: size });
    cursorX += slotWidth + gapPx;
  });
  return items;
}

function resolvePrintableRect(geometry, pxPerMm) {
  const labelWidthPx = Math.round(mmToPx(geometry.labelWidthMm, pxPerMm));
  const labelHeightPx = Math.round(mmToPx(geometry.labelHeightMm, pxPerMm));
  const printableWidthPx = Math.round(mmToPx(geometry.printableWidthMm, pxPerMm));
  const printableHeightPx = Math.round(mmToPx(geometry.printableHeightMm, pxPerMm));
  const offsetX = Math.round(mmToPx(geometry.marginX || 0, pxPerMm));
  const offsetY = Math.round(mmToPx(geometry.marginY || 0, pxPerMm));
  return {
    labelWidthPx,
    labelHeightPx,
    printable: {
      x: offsetX,
      y: offsetY,
      width: printableWidthPx,
      height: printableHeightPx,
    },
  };
}

function computeContentRect(printableRect, preset, pxPerMm) {
  const paddingPx = mmToPx(preset.padding_mm || 0, pxPerMm);
  return {
    x: printableRect.x + paddingPx,
    y: printableRect.y + paddingPx,
    width: Math.max(0, printableRect.width - paddingPx * 2),
    height: Math.max(0, printableRect.height - paddingPx * 2),
    paddingPx,
  };
}

function ensureTextFits({
  preset,
  mediaZoneWidthPx,
  contentRect,
  minTextWidthMm,
  pxPerMm,
  mediaPresent,
  textLines,
}) {
  const minTextWidthPx = mmToPx(minTextWidthMm || 9, pxPerMm);
  const textGapPx = mediaPresent ? mmToPx(MEDIA_TEXT_GAP_MM, pxPerMm) : 0;
  let mediaWidthPx = mediaPresent ? mediaZoneWidthPx : 0;
  for (let i = 0; i < 4; i += 1) {
    const textWidth = Math.max(0, contentRect.width - mediaWidthPx - textGapPx);
    if (textWidth >= minTextWidthPx - 0.5) {
      break;
    }
    mediaWidthPx = Math.max(0, mediaWidthPx - (contentRect.width * 0.06));
  }
  const textRect = {
    x: mediaWidthPx > 0 ? contentRect.x + mediaWidthPx + textGapPx : contentRect.x,
    y: contentRect.y,
    width: Math.max(0, contentRect.width - mediaWidthPx - (mediaWidthPx > 0 ? textGapPx : 0)),
    height: contentRect.height,
  };

  let mainFit = fitSingleLineText({
    text: textLines.line1,
    fontWeight: 800,
    minPt: preset.text_zone.main.min_pt,
    maxPt: preset.text_zone.main.max_pt,
    widthPx: textRect.width,
    pxPerMm,
    letterSpacingLimit: preset.text_zone.main.letter_spacing_adj || -0.3,
  });
  if (mainFit.fontSizePx <= toFontPx(preset.text_zone.main.min_pt, pxPerMm) + 0.2) {
    for (let i = 0; i < 4 && mediaWidthPx > 0; i += 1) {
      mediaWidthPx = Math.max(0, mediaWidthPx - contentRect.width * 0.04);
      textRect.x = mediaWidthPx > 0 ? contentRect.x + mediaWidthPx + textGapPx : contentRect.x;
      textRect.width = Math.max(
        minTextWidthPx,
        contentRect.width - mediaWidthPx - (mediaWidthPx > 0 ? textGapPx : 0),
      );
      mainFit = fitSingleLineText({
        text: textLines.line1,
        fontWeight: 800,
        minPt: preset.text_zone.main.min_pt,
        maxPt: preset.text_zone.main.max_pt,
        widthPx: textRect.width,
        pxPerMm,
        letterSpacingLimit: preset.text_zone.main.letter_spacing_adj || -0.3,
      });
      if (mainFit.fontSizePx > toFontPx(preset.text_zone.main.min_pt, pxPerMm) + 0.2) {
        break;
      }
    }
  }
  return { mediaWidthPx, textRect };
}

function buildDebugOverlays({
  printableRect,
  contentRect,
  mediaRect,
  textRect,
  textZones,
  qr,
}) {
  const overlays = [];
  overlays.push(
    `<rect x="${formatNumber(printableRect.x)}" y="${formatNumber(printableRect.y)}" width="${formatNumber(printableRect.width)}" height="${formatNumber(printableRect.height)}" fill="none" stroke="rgba(34,197,94,0.6)" stroke-dasharray="6 4" stroke-width="1" vector-effect="non-scaling-stroke" />`,
  );
  overlays.push(
    `<rect x="${formatNumber(contentRect.x)}" y="${formatNumber(contentRect.y)}" width="${formatNumber(contentRect.width)}" height="${formatNumber(contentRect.height)}" fill="rgba(59,130,246,0.08)" stroke="rgba(59,130,246,0.7)" stroke-width="1" vector-effect="non-scaling-stroke" />`,
  );
  if (mediaRect.width > 0 && mediaRect.height > 0) {
    overlays.push(
      `<rect x="${formatNumber(mediaRect.x)}" y="${formatNumber(mediaRect.y)}" width="${formatNumber(mediaRect.width)}" height="${formatNumber(mediaRect.height)}" fill="rgba(249,115,22,0.08)" stroke="rgba(249,115,22,0.7)" stroke-width="1" vector-effect="non-scaling-stroke" />`,
    );
  }
  overlays.push(
    `<rect x="${formatNumber(textRect.x)}" y="${formatNumber(textRect.y)}" width="${formatNumber(textRect.width)}" height="${formatNumber(textRect.height)}" fill="rgba(139,92,246,0.08)" stroke="rgba(139,92,246,0.7)" stroke-width="1" vector-effect="non-scaling-stroke" />`,
  );
  overlays.push(
    `<rect x="${formatNumber(textZones.main.x)}" y="${formatNumber(textZones.main.y)}" width="${formatNumber(textZones.main.width)}" height="${formatNumber(textZones.main.height)}" fill="none" stroke="rgba(59,130,246,0.7)" stroke-dasharray="4 3" stroke-width="1" vector-effect="non-scaling-stroke" />`,
  );
  overlays.push(
    `<rect x="${formatNumber(textZones.sub.x)}" y="${formatNumber(textZones.sub.y)}" width="${formatNumber(textZones.sub.width)}" height="${formatNumber(textZones.sub.height)}" fill="none" stroke="rgba(59,130,246,0.5)" stroke-dasharray="4 3" stroke-width="1" vector-effect="non-scaling-stroke" />`,
  );
  if (qr) {
    overlays.push(
      `<rect x="${formatNumber(qr.x)}" y="${formatNumber(qr.y)}" width="${formatNumber(qr.size)}" height="${formatNumber(qr.size)}" fill="none" stroke="rgba(239,68,68,0.7)" stroke-dasharray="4 3" stroke-width="1" vector-effect="non-scaling-stroke" />`,
    );
  }
  return overlays.join('');
}

async function renderMediaElements(mediaElements) {
  const parts = [];
  for (const element of mediaElements) {
    if (element.kind === 'image') {
      const href = await resolveSvgImageHref(element.href);
      const escapedHref = escapeXml(href);
      const title = element.alt ? `<title>${escapeXml(element.alt)}</title>` : '';
      parts.push(
        `<image x="${formatNumber(element.x)}" y="${formatNumber(element.y)}" width="${formatNumber(element.width)}" height="${formatNumber(element.height)}" href="${escapedHref}" ${`xmlns:xlink="${SVG_XLINK}"`} xlink:href="${escapedHref}">${title}</image>`,
      );
    } else if (element.kind === 'glyph') {
      const fontFamily = element.style === 'brands' ? 'Font Awesome 6 Brands' : 'Font Awesome 6 Free';
      const fontWeight = element.style === 'regular' ? 400 : element.style === 'solid' ? 900 : 400;
      const glyph = element.unicode ? `&#x${element.unicode};` : '';
      const title = element.alt ? `<title>${escapeXml(element.alt)}</title>` : '';
      const centerX = element.x + element.width / 2;
      const centerY = element.y + element.height / 2;
      const fontSize = element.height * 0.85;
      parts.push(
        `<g>${title}<text x="${formatNumber(centerX)}" y="${formatNumber(centerY)}" font-family=${JSON.stringify(fontFamily)} font-weight="${fontWeight}" font-size="${formatNumber(fontSize)}" text-anchor="middle" dominant-baseline="middle" fill="${LABEL_TEXT_COLOR}">${glyph}</text></g>`,
      );
    }
  }
  return parts.join('');
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
  if (!geometry || !Number.isFinite(pxPerMm)) {
    throw new Error('Invalid geometry or pxPerMm for label rendering.');
  }
  const { labelWidthPx, labelHeightPx, printable } = resolvePrintableRect(geometry, pxPerMm);
  const preset = getActiveLayoutPreset(geometry.printableHeightMm || geometry.labelHeightMm);
  const contentRect = computeContentRect(printable, preset, pxPerMm);
  const mediaItems = resolveMediaItems(hardwareInfo);
  let mediaWidthPx = computeMediaZoneWidth({
    contentWidthPx: contentRect.width,
    preset,
    iconCount: mediaItems.length,
    pxPerMm,
  });
  const { mediaWidthPx: adjustedMediaWidth, textRect } = ensureTextFits({
    preset,
    mediaZoneWidthPx: mediaWidthPx,
    contentRect,
    minTextWidthMm,
    pxPerMm,
    mediaPresent: mediaItems.length > 0,
    textLines,
  });
  mediaWidthPx = adjustedMediaWidth;

  const qrPlan = computeQrLayout({
    qrContent,
    preset,
    textRect,
    pxPerMm,
    qrGenerator,
  });
  let qrElement = null;
  if (qrPlan) {
    qrElement = await renderQrElement(qrPlan);
    if (qrElement) {
      textRect.width = Math.max(0, textRect.width - (qrElement.size + mmToPx(preset.qr.margin_mm || 0.5, pxPerMm)));
    }
  }

  const textLayout = layoutText({ textLines, textRect, preset, pxPerMm, qrBounds: qrElement });
  const mediaRect = {
    x: mediaWidthPx > 0 ? contentRect.x : contentRect.x,
    y: contentRect.y,
    width: mediaWidthPx,
    height: contentRect.height,
  };
  const mediaElements = layoutIcons({
    mediaItems,
    rect: mediaRect,
    preset,
    pxPerMm,
  });

  const svgParts = [];
  svgParts.push(
    `<svg xmlns="${SVG_XMLNS}" xmlns:xlink="${SVG_XLINK}" width="${labelWidthPx}" height="${labelHeightPx}" viewBox="0 0 ${labelWidthPx} ${labelHeightPx}">`,
  );
  const strokeWidth = formatNumber(mmToPx(0.25, pxPerMm));
  svgParts.push(
    `<rect x="0" y="0" width="${labelWidthPx}" height="${labelHeightPx}" fill="${LABEL_BACKGROUND_COLOR}" stroke="${FRAME_STROKE_COLOR}" stroke-width="${strokeWidth}" vector-effect="non-scaling-stroke" />`,
  );

  svgParts.push(await renderMediaElements(mediaElements));

  if (textLayout.main.text) {
    svgParts.push(
      `<text x="${formatNumber(textLayout.main.x)}" y="${formatNumber(textLayout.main.baseline)}" font-family=${JSON.stringify(LABEL_FONT_FAMILY)} font-weight="800" font-size="${formatNumber(textLayout.main.fontSizePx)}" letter-spacing="${formatNumber(textLayout.main.letterSpacingPx)}" fill="${LABEL_TEXT_COLOR}">${escapeXml(textLayout.main.text)}</text>`,
    );
  }
  if (textLayout.sub && textLayout.sub.lines) {
    let baseline = textLayout.zones.sub.y + textLayout.sub.fontSizePx;
    textLayout.sub.lines.forEach(line => {
      svgParts.push(
        `<text x="${formatNumber(textLayout.zones.sub.x)}" y="${formatNumber(baseline)}" font-family=${JSON.stringify(LABEL_FONT_FAMILY)} font-weight="600" font-size="${formatNumber(textLayout.sub.fontSizePx)}" letter-spacing="${formatNumber(textLayout.sub.letterSpacingPx || 0)}" fill="${LABEL_TEXT_COLOR}">${escapeXml(line)}</text>`,
      );
      baseline += textLayout.sub.lineHeightPx;
    });
  }

  if (qrElement) {
    const qrHref = escapeXml(qrElement.href);
    svgParts.push(
      `<image x="${formatNumber(qrElement.x)}" y="${formatNumber(qrElement.y)}" width="${formatNumber(qrElement.size)}" height="${formatNumber(qrElement.size)}" href="${qrHref}" xlink:href="${qrHref}" />`,
    );
  }

  const editorState = ensureLayoutEditor({
    geometry,
    preset,
    textLines,
    hardwareInfo,
    qrContent,
  });
  if (editorState && editorState.active) {
    svgParts.push(
      `<g class="layout-overlays" fill="none">${buildDebugOverlays({
        printableRect: printable,
        contentRect,
        mediaRect,
        textRect,
        textZones: textLayout.zones,
        qr: qrElement,
      })}</g>`,
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

export const layoutPresetTools = {
  defaultLayoutPresets,
  getPresetOverride,
  setPresetOverride,
  clearPresetOverrides,
  exportLayoutPresets,
  importLayoutPresets,
  subscribePresetChanges,
  notifyPresetListeners,
};
