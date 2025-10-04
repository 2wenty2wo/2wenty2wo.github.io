import test from 'node:test';
import assert from 'node:assert/strict';

import { renderLabelSVG, fitTextToBox, mmToPx } from '../js/label/renderLabelSVG.js';

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
  const textMatches = [...result.svgMarkup.matchAll(/font-weight="800"[^>]*>([^<]+)<\/text>/g)];
  assert.equal(textMatches.length, 1, 'main line should render once');
  assert.equal(textMatches[0][1].trim(), 'M2 × 10', 'main line should remain intact');
});

test('fitTextToBox shrinks long lines and applies ellipsis when needed', () => {
  const minFontSizePx = (8.25 / 72) * 300;
  const result = fitTextToBox({
    text: 'M2.5 × 16 Extremely Long Description That Should Shrink',
    fontWeight: 800,
    maxFontSizePx: 140,
    minFontSizePx,
    boxWidthPx: 210,
    boxHeightPx: 120,
    lineClamp: 2,
  });
  assert.ok(result.fontSizePx < 140, 'font size should reduce');
  assert.ok(result.fontSizePx >= minFontSizePx, 'font size should respect minimum');
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
  const mainMatches = [...result.svgMarkup.matchAll(/font-weight="800"[^>]*>([^<]+)<\/text>/g)];
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
  const mainMatches = [...result.svgMarkup.matchAll(/font-weight="800"[^>]*>([^<]+)<\/text>/g)];
  assert.equal(mainMatches.length, 1, 'main line should still occupy one line');
  assert.ok(mainMatches[0][1].trim().endsWith('…'), 'ellipsis should appear only when absolutely required');
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
  const subtitleMatches = [...result.svgMarkup.matchAll(/font-weight="600"[^>]*>([^<]+)<\/text>/g)];
  assert.equal(subtitleMatches.length, 2, 'two subtitle lines should render');
  assert.ok(
    subtitleMatches[0][1].trim().endsWith('Descriptor'),
    'first subtitle line should not ellipsize before the second line',
  );
  assert.ok(
    subtitleMatches[1][1].trim().endsWith('…'),
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
