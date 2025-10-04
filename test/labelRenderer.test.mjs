import test from 'node:test';
import assert from 'node:assert/strict';

import { renderLabelSVG, fitTextToBox, mmToPx, layoutText } from '../js/label/renderLabelSVG.js';
import {
  setPresetOverride,
  clearPresetOverrides,
  getActiveLayoutPreset,
} from '../js/label/layoutPresets.js';

const pxPerMm = 300 / 25.4;

function extractImages(svgMarkup) {
  const matches = [...svgMarkup.matchAll(/<image[^>]+x="([^"]+)"[^>]+y="([^"]+)"[^>]+width="([^"]+)"[^>]+height="([^"]+)"[^>]*href="([^"]+)"/g)];
  return matches.map(match => ({
    x: Number(match[1]),
    y: Number(match[2]),
    width: Number(match[3]),
    height: Number(match[4]),
    href: match[5],
  }));
}

function getPresetMainFontWeight(heightMm) {
  const preset = getActiveLayoutPreset(heightMm);
  const stored = preset.text_zone?.main?.font_weight ?? 800;
  return Math.max(700, stored);
}

function findMainTextElements(svgMarkup, fontWeight) {
  const pattern = new RegExp(`<text[^>]*font-weight="${fontWeight}"[^>]*>([^<]+)<\\/text>`, 'g');
  return [...svgMarkup.matchAll(pattern)];
}

function extractTextElements(svgMarkup) {
  const pattern = /<text[^>]*font-weight="(\d+)"[^>]*>([^<]*)<\/text>/g;
  return [...svgMarkup.matchAll(pattern)].map(([, weight, text]) => ({
    fontWeight: Number(weight),
    text,
  }));
}

test('37×12 mm labels keep bolt icons side-by-side', async () => {
  const geometry = {
    labelWidthMm: 37,
    labelHeightMm: 12,
    printableWidthMm: 33,
    printableHeightMm: 10,
    marginX: 2,
    marginY: 1,
  };
  const hardwareInfo = {
    type: 'bolt',
    images: [
      { src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>', alt: 'drive' },
      { src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>', alt: 'head' },
    ],
  };
  const textLines = { line1: 'M2 × 10', line2: 'Socket Cap', line3: 'Phillips' };
  const result = await renderLabelSVG({ geometry, pxPerMm, textLines, hardwareInfo, qrContent: '' });
  const images = extractImages(result.svgMarkup);
  assert.equal(images.length, 2, 'expected two media images');
  const [left, right] = images;
  assert.ok(Math.abs(left.y - right.y) < 1.5, 'icons should align horizontally');
  assert.ok(right.x > left.x + left.width - 1, 'icons should be side-by-side');
  assert.ok(left.width > 30 && right.width > 30, 'icons should retain visual size');
});

test('37×24 mm labels stack bolt icons vertically', async () => {
  const geometry = {
    labelWidthMm: 37,
    labelHeightMm: 24,
    printableWidthMm: 33,
    printableHeightMm: 22,
    marginX: 2,
    marginY: 1,
  };
  const hardwareInfo = {
    type: 'bolt',
    images: [
      { src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>', alt: 'drive' },
      { src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>', alt: 'head' },
    ],
  };
  const textLines = { line1: 'M2 × 10', line2: 'Socket Cap', line3: 'Phillips' };
  const result = await renderLabelSVG({ geometry, pxPerMm, textLines, hardwareInfo, qrContent: '' });
  const images = extractImages(result.svgMarkup);
  assert.equal(images.length, 2, 'expected stacked media images');
  const [top, bottom] = images;
  assert.ok(Math.abs(top.x - bottom.x) < 2, 'stacked icons share horizontal center');
  assert.ok(bottom.y > top.y + top.height - 1, 'icons should be stacked vertically');
  assert.ok(top.height > 80 && bottom.height > 80, 'stacked icons should scale up');
});

test('37×18 mm labels stack bolt icons vertically with balanced spacing', async () => {
  const geometry = {
    labelWidthMm: 37,
    labelHeightMm: 18,
    printableWidthMm: 33,
    printableHeightMm: 16,
    marginX: 2,
    marginY: 1,
  };
  const hardwareInfo = {
    type: 'bolt',
    images: [
      { src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>', alt: 'drive' },
      { src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>', alt: 'head' },
    ],
  };
  const textLines = { line1: 'M2 × 10', line2: 'Socket Cap', line3: 'Phillips' };
  const result = await renderLabelSVG({ geometry, pxPerMm, textLines, hardwareInfo, qrContent: '' });
  const images = extractImages(result.svgMarkup);
  assert.equal(images.length, 2, 'expected two images in media zone');
  const [top, bottom] = images;
  assert.ok(Math.abs(top.x - bottom.x) < 2, 'icons should stay centered when stacked');
  assert.ok(bottom.y > top.y + top.height - 1, 'stacked icons should not overlap');
  const mainFontWeight = getPresetMainFontWeight(geometry.printableHeightMm);
  const textMatches = findMainTextElements(result.svgMarkup, mainFontWeight);
  assert.equal(textMatches.length, 1, 'main line should render once');
  assert.equal(textMatches[0][1].trim(), 'M2 × 10', 'main line should remain intact');
});

test('main text font weight clamps legacy presets to bold minimum', async () => {
  clearPresetOverrides();
  try {
    const geometry = {
      labelWidthMm: 37,
      labelHeightMm: 18,
      printableWidthMm: 33,
      printableHeightMm: 16,
      marginX: 2,
      marginY: 1,
    };
    setPresetOverride(geometry.printableHeightMm, {
      text_zone: {
        main: {
          font_weight: 600,
        },
      },
    });
    const textLines = { line1: 'Clamped', line2: 'Subtitle', line3: 'Details' };
    const result = await renderLabelSVG({
      geometry,
      pxPerMm,
      textLines,
      hardwareInfo: null,
      qrContent: '',
    });
    const textElements = extractTextElements(result.svgMarkup);
    assert.ok(textElements.length > 0, 'expected at least one text element');
    const [mainText, ...subtitleText] = textElements;
    assert.equal(mainText.fontWeight, 700, 'main text should clamp to bold minimum');
    subtitleText.forEach(element => {
      assert.ok(
        element.fontWeight < mainText.fontWeight,
        `subtitle weight ${element.fontWeight} should remain lighter than main ${mainText.fontWeight}`,
      );
    });
  } finally {
    clearPresetOverrides();
  }
});

test('fitTextToBox shrinks long lines and applies ellipsis when needed', () => {
  const pxPerMm = 300 / 25.4;
  const minPt = 8.25;
  const maxPt = 34;
  const result = fitTextToBox({
    lines: ['M2.5 × 16 Extremely Long Description That Should Shrink'],
    fontWeight: 800,
    minPt,
    maxPt,
    lineHeightPct: 120,
    widthPx: 210,
    heightPx: 120,
    pxPerMm,
    allowEllipsis: true,
  });
  const toPx = pt => (pt / 72) * (pxPerMm * 25.4);
  assert.ok(result.fontSizePx < toPx(maxPt), 'font size should reduce');
  assert.ok(result.fontSizePx >= toPx(minPt), 'font size should respect minimum');
  assert.ok(result.ellipsisApplied, 'main line should ellipsize when overflowing');
  assert.equal(result.lines.length <= 2, true);
  assert.ok(result.lines[result.lines.length - 1].endsWith('…'), 'ellipsis should appear on final line');
});

test('single icon fills the media zone proportionally', async () => {
  const geometry = {
    labelWidthMm: 37,
    labelHeightMm: 12,
    printableWidthMm: 33,
    printableHeightMm: 10,
    marginX: 2,
    marginY: 1,
  };
  const hardwareInfo = {
    type: 'photo',
    src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>',
    alt: 'photo',
  };
  const result = await renderLabelSVG({
    geometry,
    pxPerMm,
    textLines: { line1: 'Bolt', line2: 'Cap Head', line3: '' },
    hardwareInfo,
    qrContent: '',
  });
  const images = extractImages(result.svgMarkup);
  assert.equal(images.length, 1, 'single icon should render once');
  const icon = images[0];
  assert.ok(Math.abs(icon.width - icon.height) < 0.5, 'icon should remain square within zone');
  assert.ok(icon.width > 60, 'icon should scale to fill available space');
});

test('single-line labels center the main baseline within the text rect', async () => {
  const geometry = {
    labelWidthMm: 37,
    labelHeightMm: 12,
    printableWidthMm: 33,
    printableHeightMm: 10,
    marginX: 2,
    marginY: 1,
  };
  const textLines = { line1: 'Centered Text', line2: '', line3: '' };
  const result = await renderLabelSVG({
    geometry,
    pxPerMm,
    textLines,
    hardwareInfo: null,
    qrContent: '',
  });
  assert.ok(result.textLayout, 'expected layout metadata to be returned');
  const expectedCenterY = result.textRect.y + result.textRect.height / 2;
  assert.ok(
    Math.abs(result.textLayout.main.baseline - expectedCenterY) < 0.51,
    `main baseline (${result.textLayout.main.baseline.toFixed(2)}) should align with text rect center (${expectedCenterY.toFixed(2)})`,
  );
});

test('middle text alignment centers both main and subtitle anchors', async () => {
  clearPresetOverrides();
  try {
    const geometry = {
      labelWidthMm: 37,
      labelHeightMm: 12,
      printableWidthMm: 33,
      printableHeightMm: 10,
      marginX: 2,
      marginY: 1,
    };
    setPresetOverride(geometry.printableHeightMm, {
      text_zone: { alignment: 'middle' },
    });
    const textLines = { line1: 'Centered', line2: 'Subtitle', line3: '' };
    const result = await renderLabelSVG({
      geometry,
      pxPerMm,
      textLines,
      hardwareInfo: null,
      qrContent: '',
    });
    const expectedCenterX = result.textRect.x + result.textRect.width / 2;
    assert.equal(result.textLayout.main.anchor, 'middle');
    assert.equal(result.textLayout.sub.anchor, 'middle');
    assert.ok(
      Math.abs(result.textLayout.main.x - expectedCenterX) < 0.51,
      `main anchor (${result.textLayout.main.x.toFixed(2)}) should equal text rect midpoint (${expectedCenterX.toFixed(2)})`,
    );
    assert.ok(
      Math.abs(result.textLayout.sub.x - expectedCenterX) < 0.51,
      `subtitle anchor (${result.textLayout.sub.x.toFixed(2)}) should equal text rect midpoint (${expectedCenterX.toFixed(2)})`,
    );
    const mainFontWeight = getPresetMainFontWeight(geometry.printableHeightMm);
    const mainMatch = result.svgMarkup.match(new RegExp(`<text[^>]*font-weight="${mainFontWeight}"[^>]*>`));
    assert.ok(mainMatch, 'expected main text element with configured font weight');
    assert.match(mainMatch[0], /text-anchor="middle"/);
    const subtitleMatch = result.svgMarkup.match(/<text[^>]*font-weight="600"[^>]*>/);
    assert.ok(subtitleMatch, 'expected subtitle text element with font-weight 600');
    assert.match(subtitleMatch[0], /text-anchor="middle"/);
  } finally {
    clearPresetOverrides();
  }
});

test('main line shrinks before ellipsizing', async () => {
  const geometry = {
    labelWidthMm: 80,
    labelHeightMm: 12,
    printableWidthMm: 76,
    printableHeightMm: 10,
    marginX: 2,
    marginY: 1,
  };
  const textLines = {
    line1: 'M2.5 × 16 Countersunk Socket Cap',
    line2: 'Stainless Steel',
    line3: '',
  };
  const result = await renderLabelSVG({ geometry, pxPerMm, textLines, hardwareInfo: null, qrContent: '' });
  const mainFontWeight = getPresetMainFontWeight(geometry.printableHeightMm);
  const mainMatches = findMainTextElements(result.svgMarkup, mainFontWeight);
  assert.equal(mainMatches.length, 1, 'main line should render exactly once');
  assert.equal(mainMatches[0][1].trim(), 'M2.5 × 16 Countersunk Socket Cap');
});

test('main line only ellipsizes when unavoidable', async () => {
  const geometry = {
    labelWidthMm: 25,
    labelHeightMm: 12,
    printableWidthMm: 21,
    printableHeightMm: 10,
    marginX: 2,
    marginY: 1,
  };
  const textLines = {
    line1: 'M2.5 × 16 Countersunk Socket Cap Phillips Ultra Long',
    line2: 'Stainless Steel',
    line3: '',
  };
  const result = await renderLabelSVG({ geometry, pxPerMm, textLines, hardwareInfo: null, qrContent: '' });
  const mainFontWeight = getPresetMainFontWeight(geometry.printableHeightMm);
  const mainMatches = findMainTextElements(result.svgMarkup, mainFontWeight);
  assert.equal(mainMatches.length, 1, 'main line should still occupy one line');
  assert.ok(mainMatches[0][1].trim().endsWith('…'), 'ellipsis should appear only when absolutely required');
});

test('main font weight follows preset overrides', async () => {
  clearPresetOverrides();
  try {
    const geometry = {
      labelWidthMm: 37,
      labelHeightMm: 12,
      printableWidthMm: 33,
      printableHeightMm: 10,
      marginX: 2,
      marginY: 1,
    };
    setPresetOverride(geometry.printableHeightMm, {
      text_zone: { main: { font_weight: 600 } },
    });
    const textLines = { line1: 'Non-Bold', line2: '', line3: '' };
    const result = await renderLabelSVG({
      geometry,
      pxPerMm,
      textLines,
      hardwareInfo: null,
      qrContent: '',
    });
    const mainFontWeight = getPresetMainFontWeight(geometry.printableHeightMm);
    assert.equal(mainFontWeight, 700, 'override should clamp to bold minimum');
    const mainMatches = findMainTextElements(result.svgMarkup, mainFontWeight);
    assert.equal(mainMatches.length, 1, 'main line should render once with overridden weight');
    assert.equal(mainMatches[0][1].trim(), 'Non-Bold');
    assert.equal(result.textLayout.main.fontWeight, mainFontWeight);
  } finally {
    clearPresetOverrides();
  }
});

test('subtitle lines remain distinct with optional ellipsis on the last line', async () => {
  const geometry = {
    labelWidthMm: 37,
    labelHeightMm: 12,
    printableWidthMm: 33,
    printableHeightMm: 10,
    marginX: 2,
    marginY: 1,
  };
  const textLines = {
    line1: 'M2 × 10',
    line2: 'Socket Cap Screw With Very Long Descriptor',
    line3: 'Another Subtitle That Is Also Quite Long',
  };
  const result = await renderLabelSVG({ geometry, pxPerMm, textLines, hardwareInfo: null, qrContent: '' });
  const subtitleLines = result.textLayout.sub?.lines || [];
  assert.ok(subtitleLines.length >= 2, 'at least two subtitle lines should render');
  const nonFinalLines = subtitleLines.slice(0, -1);
  nonFinalLines.forEach(line => {
    assert.ok(!line.trim().endsWith('…'), 'only final subtitle line should ellipsize when needed');
  });
  assert.ok(
    subtitleLines[subtitleLines.length - 1].trim().endsWith('…'),
    'second subtitle line may ellipsize when space runs out',
  );
});

test('QR generator hook places QR image alongside text', async () => {
  const geometry = {
    labelWidthMm: 37,
    labelHeightMm: 12,
    printableWidthMm: 33,
    printableHeightMm: 10,
    marginX: 2,
    marginY: 1,
  };
  const qrDataUrl = 'data:image/png;base64,AAAAB';
  const result = await renderLabelSVG({
    geometry,
    pxPerMm,
    textLines: { line1: 'Label', line2: 'With QR', line3: '' },
    hardwareInfo: null,
    qrContent: 'https://example.com',
    qrGenerator: async (_, size) => ({ dataUrl: qrDataUrl, sizePx: size }),
  });
  const images = extractImages(result.svgMarkup);
  assert.equal(images.length, 1, 'QR should render as a single image when no media icons are present');
  assert.equal(images[0].href, qrDataUrl);
  const textMatches = [...result.svgMarkup.matchAll(/<text[^>]+x="([^"]+)"[^>]+y="([^"]+)"/g)];
  assert.ok(textMatches.length >= 1, 'text should remain present alongside QR');
  assert.ok(images[0].x > Number(textMatches[0][1]), 'QR should appear to the right of text content');
});

test('end text alignment anchors text to the right edge when QR is absent', async () => {
  clearPresetOverrides();
  try {
    const geometry = {
      labelWidthMm: 37,
      labelHeightMm: 12,
      printableWidthMm: 33,
      printableHeightMm: 10,
      marginX: 2,
      marginY: 1,
    };
    setPresetOverride(geometry.printableHeightMm, {
      text_zone: { alignment: 'end' },
    });
    const result = await renderLabelSVG({
      geometry,
      pxPerMm,
      textLines: { line1: 'Right Edge', line2: 'Subtitle', line3: '' },
      hardwareInfo: null,
      qrContent: '',
    });
    const expectedRightX = result.textRect.x + result.textRect.width;
    assert.equal(result.textLayout.main.anchor, 'end');
    assert.equal(result.textLayout.sub.anchor, 'end');
    assert.ok(
      Math.abs(result.textLayout.main.x - expectedRightX) < 0.51,
      `main anchor (${result.textLayout.main.x.toFixed(2)}) should equal text rect right edge (${expectedRightX.toFixed(2)})`,
    );
    assert.ok(
      Math.abs(result.textLayout.sub.x - expectedRightX) < 0.51,
      `subtitle anchor (${result.textLayout.sub.x.toFixed(2)}) should equal text rect right edge (${expectedRightX.toFixed(2)})`,
    );
    const mainFontWeight = getPresetMainFontWeight(geometry.printableHeightMm);
    const mainMatch = result.svgMarkup.match(new RegExp(`<text[^>]*font-weight="${mainFontWeight}"[^>]*>`));
    assert.ok(mainMatch, 'expected main text element');
    assert.match(mainMatch[0], /text-anchor="end"/);
  } finally {
    clearPresetOverrides();
  }
});

test('layoutText keeps end-aligned anchors clear of QR bounds', () => {
  clearPresetOverrides();
  try {
    const preset = getActiveLayoutPreset(12);
    const override = {
      ...preset,
      text_zone: { ...preset.text_zone, alignment: 'end' },
    };
    const textRect = { x: 20, y: 10, width: 160, height: 60 };
    const qrSizePx = 48;
    const qrMarginPx = mmToPx(override.qr.margin_mm || 0, pxPerMm);
    const layout = layoutText({
      textLines: { line1: 'QR Label', line2: '', line3: '' },
      textRect,
      preset: override,
      pxPerMm,
      qrBounds: { size: qrSizePx },
    });
    const expectedAnchor = textRect.x + textRect.width - (qrSizePx + qrMarginPx);
    assert.equal(layout.main.anchor, 'end');
    assert.ok(
      Math.abs(layout.main.x - expectedAnchor) < 0.51,
      `main anchor (${layout.main.x.toFixed(2)}) should align with QR clearance (${expectedAnchor.toFixed(2)})`,
    );
  } finally {
    clearPresetOverrides();
  }
});

test('cropToPrintable output trims exported dimensions to printable area', async () => {
  const geometry = {
    labelWidthMm: 37,
    labelHeightMm: 12,
    printableWidthMm: 33,
    printableHeightMm: 10,
    marginX: 2,
    marginY: 1,
  };
  const result = await renderLabelSVG({
    geometry,
    pxPerMm,
    textLines: { line1: 'Label', line2: '', line3: '' },
    hardwareInfo: null,
    qrContent: '',
    cropToPrintable: true,
  });
  const expectedWidthPx = Math.round(mmToPx(geometry.printableWidthMm, pxPerMm));
  const expectedHeightPx = Math.round(mmToPx(geometry.printableHeightMm, pxPerMm));
  assert.equal(result.widthPx, expectedWidthPx);
  assert.equal(result.heightPx, expectedHeightPx);
  assert.match(
    result.svgMarkup,
    new RegExp(`<svg[^>]+width="${expectedWidthPx}"[^>]+height="${expectedHeightPx}"`),
    'cropped SVG should use printable dimensions',
  );
  assert.match(
    result.svgMarkup,
    /transform="translate\(-?\d+(?:\.\d+)? -?\d+(?:\.\d+)?\)"/,
    'cropped export should translate content into printable viewBox',
  );
  assert.ok(
    !/stroke="rgba\(100,116,139,0.5\)"/.test(result.svgMarkup),
    'cropped export should omit outer frame stroke',
  );
});

test('icon-only labels can expand media zone to full content width with override', async () => {
  clearPresetOverrides();
  try {
    const geometry = {
      labelWidthMm: 37,
      labelHeightMm: 12,
      printableWidthMm: 33,
      printableHeightMm: 12,
      marginX: 2,
      marginY: 0,
    };
    setPresetOverride(geometry.printableHeightMm, {
      media_zone_width_pct: 100,
      media_zone_width_pct_max: 100,
      media_zone_width_pct_max_user: 100,
    });
    const result = await renderLabelSVG({
      geometry,
      pxPerMm,
      textLines: { line1: '', line2: '', line3: '' },
      hardwareInfo: {
        type: 'photo',
        src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>',
        alt: 'icon',
      },
      qrContent: '',
    });
    const images = extractImages(result.svgMarkup);
    assert.equal(images.length, 1, 'expected single media element');
    const icon = images[0];
    const preset = getActiveLayoutPreset(geometry.printableHeightMm);
    const printableWidthPx = mmToPx(geometry.printableWidthMm, pxPerMm);
    const paddingPx = mmToPx(preset.padding_mm || 0, pxPerMm);
    const expectedMediaWidthPx = Math.max(0, printableWidthPx - paddingPx * 2);
    const contentStartPx = mmToPx(geometry.marginX || 0, pxPerMm) + paddingPx;
    const computedZoneWidth = (icon.x - contentStartPx) * 2 + icon.width;
    assert.ok(
      Math.abs(computedZoneWidth - expectedMediaWidthPx) < 1.5,
      `media zone width (${computedZoneWidth.toFixed(2)}) should fill content width (${expectedMediaWidthPx.toFixed(2)})`,
    );
  } finally {
    clearPresetOverrides();
  }
});
