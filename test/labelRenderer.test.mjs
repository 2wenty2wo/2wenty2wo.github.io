import test from 'node:test';
import assert from 'node:assert/strict';

import { renderLabelSVG, fitTextToBox, mmToPx, layoutText } from '../js/label/renderLabelSVG.js';
import { ensureLayoutEditor } from '../js/label/layoutEditor.js';
import {
  setPresetOverride,
  clearPresetOverrides,
  getActiveLayoutPreset,
  exportLayoutPresets,
  defaultLayoutPresets,
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

function resolvePresetHeightKey(geometryOrHeight) {
  if (typeof geometryOrHeight === 'number') {
    return geometryOrHeight;
  }
  if (!geometryOrHeight || typeof geometryOrHeight !== 'object') {
    return undefined;
  }
  const { labelHeightMm, printableHeightMm } = geometryOrHeight;
  return labelHeightMm ?? printableHeightMm;
}

function getPresetMainFontWeight(geometryOrHeight) {
  const preset = getActiveLayoutPreset(resolvePresetHeightKey(geometryOrHeight));
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

function setupLayoutEditorTestEnvironment() {
  const originals = {
    window: global.window,
    document: global.document,
    navigator: global.navigator,
    localStorage: global.localStorage,
    prompt: global.prompt,
  };

  const elementsById = new Map();

  class StubElement {
    constructor(tag) {
      this.tagName = tag.toUpperCase();
      this.children = [];
      this.attributes = new Map();
      this.style = {};
      this.dataset = {};
      this.listeners = {};
      this._textContent = '';
      this._innerHTML = '';
      this._id = null;
      this._classSet = new Set();
      const updateClassName = () => {
        this.className = Array.from(this._classSet).join(' ');
      };
      this.classList = {
        add: (...tokens) => {
          tokens.forEach(token => this._classSet.add(token));
          updateClassName();
        },
        remove: (...tokens) => {
          tokens.forEach(token => this._classSet.delete(token));
          updateClassName();
        },
        contains: token => this._classSet.has(token),
      };
    }

    set id(value) {
      this._id = value;
      if (value) {
        elementsById.set(value, this);
      }
    }

    get id() {
      return this._id;
    }

    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    }

    append(...children) {
      children.forEach(child => this.appendChild(child));
    }

    addEventListener(type, handler) {
      if (!this.listeners[type]) {
        this.listeners[type] = [];
      }
      this.listeners[type].push(handler);
    }

    setAttribute(name, value) {
      this.attributes.set(name, value);
      if (name === 'id') {
        this.id = value;
      } else if (name === 'class') {
        value
          .split(/\s+/)
          .filter(Boolean)
          .forEach(token => this._classSet.add(token));
        this.className = value;
      } else if (name.startsWith('data-')) {
        const key = name
          .slice(5)
          .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        this.dataset[key] = value;
      }
    }

    getAttribute(name) {
      if (name === 'id') {
        return this.id;
      }
      if (name === 'class') {
        return this.className || '';
      }
      if (name.startsWith('data-')) {
        const key = name
          .slice(5)
          .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        return Object.hasOwn(this.dataset, key) ? this.dataset[key] : null;
      }
      return this.attributes.get(name) ?? null;
    }

    set textContent(value) {
      this._textContent = value;
      if (value === '') {
        this.children = [];
      }
    }

    get textContent() {
      return this._textContent;
    }

    set innerHTML(value) {
      this._innerHTML = value;
      if (this.tagName === 'DIV' && value.includes('layout-editor-body')) {
        this.children = [];
        const header = new StubElement('div');
        header.classList.add('layout-editor-header');

        const title = new StubElement('h3');
        title.classList.add('layout-editor-title');
        title.textContent = 'Layout Editor';

        const actionsWrapper = new StubElement('div');
        actionsWrapper.classList.add('layout-editor-actions');

        const actions = ['reset', 'export', 'import', 'copy'].map(action => {
          const button = new StubElement('button');
          button.setAttribute('data-editor-action', action);
          actionsWrapper.appendChild(button);
          return button;
        });

        header.append(title, actionsWrapper);

        const body = new StubElement('div');
        body.classList.add('layout-editor-body');

        this.append(header, body);
        this._body = body;
        this._actions = actions;
      }
    }

    get innerHTML() {
      return this._innerHTML;
    }

    querySelector(selector) {
      const results = this.querySelectorAll(selector);
      return results.length > 0 ? results[0] : null;
    }

    querySelectorAll(selector) {
      const matches = [];
      const visit = node => {
        if (node._matchesSelector(selector)) {
          matches.push(node);
        }
        node.children.forEach(child => visit(child));
      };
      this.children.forEach(child => visit(child));
      return matches;
    }

    _matchesSelector(selector) {
      if (!selector) {
        return false;
      }
      if (selector.startsWith('.')) {
        const className = selector.slice(1);
        return this.classList.contains(className);
      }
      if (selector.startsWith('#')) {
        return this.id === selector.slice(1);
      }
      if (selector === '[data-editor-action]') {
        return Object.hasOwn(this.dataset, 'editorAction');
      }
      return this.tagName.toLowerCase() === selector.toLowerCase();
    }
  }

  class StubCanvas extends StubElement {
    constructor() {
      super('canvas');
      this.width = 0;
      this.height = 0;
      this._context = {
        clearRect() {},
        drawImage() {},
        setTransform() {},
        beginPath() {},
        moveTo() {},
        lineTo() {},
        closePath() {},
        stroke() {},
        fillRect() {},
      };
    }

    getContext(type) {
      if (type === '2d') {
        return this._context;
      }
      return null;
    }

    toDataURL() {
      return 'data:image/png;base64,';
    }
  }

  const documentStub = {
    createElement: tag => (tag === 'canvas' ? new StubCanvas() : new StubElement(tag)),
    getElementById: id => elementsById.get(id) || null,
    body: new StubElement('body'),
    head: new StubElement('head'),
  };

  documentStub.body.appendChild = StubElement.prototype.appendChild.bind(documentStub.body);
  documentStub.head.appendChild = StubElement.prototype.appendChild.bind(documentStub.head);

  const storageMap = new Map();
  const localStorageStub = {
    getItem: key => (storageMap.has(key) ? storageMap.get(key) : null),
    setItem: (key, value) => {
      storageMap.set(key, String(value));
    },
    removeItem: key => {
      storageMap.delete(key);
    },
  };

  const windowStub = {
    location: { search: '?layoutEditor=1' },
    addEventListener() {},
    removeEventListener() {},
    requestAnimationFrame: cb => setTimeout(cb, 0),
    cancelAnimationFrame: id => clearTimeout(id),
    setTimeout,
    clearTimeout,
    prompt: () => '',
    alert() {},
    localStorage: localStorageStub,
  };

  const navigatorStub = {
    clipboard: {
      writeText: () => Promise.resolve(),
    },
  };

  global.window = windowStub;
  global.document = documentStub;
  global.navigator = navigatorStub;
  global.localStorage = localStorageStub;
  global.prompt = () => '';
  windowStub.prompt = () => '';

  return () => {
    global.window = originals.window;
    global.document = originals.document;
    global.navigator = originals.navigator;
    global.localStorage = originals.localStorage;
    global.prompt = originals.prompt;
  };
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
  const mainFontWeight = getPresetMainFontWeight(geometry);
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
    setPresetOverride(geometry.labelHeightMm, {
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

test('exporting presets with defaults merges overrides', () => {
  clearPresetOverrides();
  try {
    const heightKey = 12;
    const override = {
      text_zone: {
        main: {
          font_weight: 745,
        },
      },
    };
    setPresetOverride(heightKey, override);
    const exported = exportLayoutPresets(true);
    const parsed = JSON.parse(exported);
    assert.equal(
      parsed[String(heightKey)].padding_mm,
      defaultLayoutPresets[String(heightKey)].padding_mm,
      'defaults should remain in exported presets',
    );
    assert.equal(
      parsed[String(heightKey)].text_zone.main.font_weight,
      override.text_zone.main.font_weight,
      'export should merge override values with defaults',
    );
  } finally {
    clearPresetOverrides();
  }
});

test('exporting presets with defaults preserves zero-value overrides', () => {
  clearPresetOverrides();
  try {
    const heightKey = 12;
    const override = { padding_mm: 0 };
    setPresetOverride(heightKey, override);
    const exported = exportLayoutPresets(true);
    const parsed = JSON.parse(exported);
    assert.equal(
      parsed[String(heightKey)].padding_mm,
      override.padding_mm,
      'export should include explicit zero overrides when merging defaults',
    );
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

test('fuse illustrations honor provided aspect ratio hints', async () => {
  const geometry = {
    labelWidthMm: 37,
    labelHeightMm: 12,
    printableWidthMm: 33,
    printableHeightMm: 10,
    marginX: 2,
    marginY: 1,
  };
  const hardwareInfo = {
    type: 'fuse-illustration',
    src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>',
    alt: 'Glass fuse illustration',
    aspectRatio: 926 / 307,
  };
  const result = await renderLabelSVG({
    geometry,
    pxPerMm,
    textLines: { line1: 'Fuse', line2: 'Glass', line3: '' },
    hardwareInfo,
    qrContent: '',
  });
  const images = extractImages(result.svgMarkup);
  assert.equal(images.length, 1, 'expected fuse illustration to render once');
  const [illustration] = images;
  assert.ok(illustration.height > 0, 'fuse illustration should have non-zero height');
  assert.ok(
    illustration.width > illustration.height,
    `expected wide fuse illustration (width ${illustration.width} > height ${illustration.height})`,
  );
  const measuredRatio = illustration.width / illustration.height;
  assert.ok(
    measuredRatio > 2,
    `expected fuse illustration ratio to exceed 2:1, received ${measuredRatio.toFixed(2)}`,
  );
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
    setPresetOverride(geometry.labelHeightMm, {
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
    const mainFontWeight = getPresetMainFontWeight(geometry);
    const mainMatch = result.svgMarkup.match(new RegExp(`<text[^>]*font-weight="${mainFontWeight}"[^>]*>`));
    assert.ok(mainMatch, 'expected main text element with configured font weight');
    assert.match(mainMatch[0], /text-anchor="middle"/);
    assert.match(mainMatch[0], /font-family="'Oswald'/);
    const subtitleMatch = result.svgMarkup.match(/<text[^>]*font-weight="300"[^>]*>/);
    assert.ok(subtitleMatch, 'expected subtitle text element with font-weight 300');
    assert.match(subtitleMatch[0], /text-anchor="middle"/);
    assert.match(subtitleMatch[0], /font-family="'Roboto'/);
    assert.ok(
      (result.textLayout.sub.fontFamily || '').startsWith("'Roboto'"),
      'subtitle layout should report the Roboto font stack',
    );
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
  const mainFontWeight = getPresetMainFontWeight(geometry);
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
  const mainFontWeight = getPresetMainFontWeight(geometry);
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
    setPresetOverride(geometry.labelHeightMm, {
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
    const mainFontWeight = getPresetMainFontWeight(geometry);
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
  const finalLine = subtitleLines[subtitleLines.length - 1]?.trim() ?? '';
  const ellipsisCount = subtitleLines.filter(line => line.includes('…')).length;
  if (ellipsisCount > 0) {
    assert.equal(ellipsisCount, 1, 'ellipsis should appear on at most one subtitle line');
    assert.ok(finalLine.endsWith('…'), 'ellipsis should only appear on the final subtitle line');
  } else {
    assert.ok(finalLine.length > 0, 'final subtitle line should contain text when ellipsis is unnecessary');
  }

  const compactGeometry = {
    labelWidthMm: 20,
    labelHeightMm: 12,
    printableWidthMm: 16,
    printableHeightMm: 10,
    marginX: 2,
    marginY: 1,
  };
  const compactResult = await renderLabelSVG({
    geometry: compactGeometry,
    pxPerMm,
    textLines: { line1: 'M4 × 12', line2: 'Pan head', line3: '' },
    hardwareInfo: null,
    qrContent: '',
  });
  const compactSubtitleLines = compactResult.textLayout.sub?.lines || [];
  assert.equal(
    compactSubtitleLines.length,
    1,
    'compact screw subtitle should stay on a single line without wrapping',
  );
  const compactText = compactSubtitleLines[0]?.trim() ?? '';
  assert.ok(
    compactText === 'Pan head' || compactText.startsWith('Pan hea'),
    'compact subtitle should surface the updated Pan head screw label',
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
    setPresetOverride(geometry.labelHeightMm, {
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
    const mainFontWeight = getPresetMainFontWeight(geometry);
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

test('layout editor keeps latest render height when exporting presets after rapid updates', () => {
  clearPresetOverrides();
  const cleanup = setupLayoutEditorTestEnvironment();
  const geometryShort = {
    labelWidthMm: 37,
    labelHeightMm: 12,
    printableWidthMm: 33,
    printableHeightMm: 10,
    marginX: 2,
    marginY: 1,
  };
  const geometryTall = {
    labelWidthMm: 37,
    labelHeightMm: 24,
    printableWidthMm: 33,
    printableHeightMm: 22,
    marginX: 2,
    marginY: 1,
  };
  const baseContext = {
    textLines: { line1: 'Line 1', line2: 'Line 2', line3: 'Line 3' },
    hardwareInfo: null,
    qrContent: '',
  };
  const shortPreset = getActiveLayoutPreset(geometryShort.labelHeightMm);
  const tallPreset = getActiveLayoutPreset(geometryTall.labelHeightMm);
  try {
    ensureLayoutEditor({ ...baseContext, geometry: geometryShort, preset: shortPreset, layoutEditorToken: 1 });
    ensureLayoutEditor({ ...baseContext, geometry: geometryTall, preset: tallPreset, layoutEditorToken: 2 });
    ensureLayoutEditor({ ...baseContext, geometry: geometryShort, preset: shortPreset, layoutEditorToken: 1 });

    const panel = document.getElementById('layout-editor-panel');
    assert.ok(panel, 'layout editor panel should exist');
    const body = panel.querySelector('.layout-editor-body');
    assert.ok(body, 'layout editor body should be available');
    const field = body.children.find(
      child => Array.isArray(child.children) && child.children.some(node => node.tagName === 'INPUT'),
    );
    assert.ok(field, 'expected to locate numeric field for padding');
    const input = field.children.find(node => node.tagName === 'INPUT');
    assert.ok(input, 'expected an input element inside the field');
    input.value = '2.7';
    const listeners = input.listeners?.input || [];
    listeners.forEach(listener => listener({ currentTarget: input, target: input }));

    const storedRaw = window.localStorage.getItem('gridfinity-layout-presets');
    assert.ok(storedRaw, 'overrides should persist after editing latest height');
    const stored = JSON.parse(storedRaw);
    assert.deepEqual(Object.keys(stored), ['24'], 'only the latest height override should be saved');
    assert.equal(stored['24'].padding_mm, 2.7, 'latest height override should reflect edited value');

    const exported = JSON.parse(exportLayoutPresets(true));
    assert.equal(exported['24'].padding_mm, 2.7, 'export should include override for latest height');
    assert.equal(
      exported['12'].padding_mm,
      defaultLayoutPresets['12'].padding_mm,
      'export should retain defaults for stale render height',
    );
  } finally {
    if (typeof window !== 'undefined' && window && window.location) {
      window.location.search = '?layoutEditor=0';
      ensureLayoutEditor({ ...baseContext, geometry: geometryShort, preset: shortPreset, layoutEditorToken: 1 });
    }
    clearPresetOverrides();
    cleanup();
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
    setPresetOverride(geometry.labelHeightMm, {
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
    const preset = getActiveLayoutPreset(resolvePresetHeightKey(geometry));
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
