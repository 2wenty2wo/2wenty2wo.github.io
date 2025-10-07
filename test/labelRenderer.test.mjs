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
  importLayoutPresets,
  getPresetOverride,
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

        const scopeContainer = new StubElement('div');
        scopeContainer.classList.add('layout-editor-scope');
        scopeContainer.setAttribute('data-editor-scope-container', '');
        const scopeLabel = new StubElement('label');
        scopeLabel.classList.add('layout-editor-scope__label');
        scopeLabel.setAttribute('data-editor-scope-label', '');
        scopeLabel.textContent = 'Preset scope';
        const scopeControls = new StubElement('div');
        scopeControls.classList.add('layout-editor-scope__controls');
        const scopeSelect = new StubElement('select');
        scopeSelect.classList.add('layout-editor-scope__select');
        scopeSelect.setAttribute('data-editor-scope', '');
        const clearButton = new StubElement('button');
        clearButton.classList.add('layout-editor-scope__clear');
        clearButton.setAttribute('data-editor-clear-part', '');
        clearButton.textContent = 'Clear part override';
        scopeControls.append(scopeSelect, clearButton);
        scopeContainer.append(scopeLabel, scopeControls);

        const body = new StubElement('div');
        body.classList.add('layout-editor-body');

        this.append(header, scopeContainer, body);
        this._body = body;
        this._actions = actions;
        this._scope = { container: scopeContainer, select: scopeSelect, clearButton };
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
      if (selector === '[data-editor-scope-container]') {
        return Object.hasOwn(this.dataset, 'editorScopeContainer');
      }
      if (selector === '[data-editor-scope]') {
        return Object.hasOwn(this.dataset, 'editorScope');
      }
      if (selector === '[data-editor-clear-part]') {
        return Object.hasOwn(this.dataset, 'editorClearPart');
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

test('default layout presets expose icon padding and media/text gap defaults', () => {
  const expectedIconPadding = { 9: 0, 12: 0, 18: 0.4, 24: 2.2 };
  const expectedMediaTextGap = { 9: 0, 12: 0, 18: 0.6, 24: 0 };

  Object.entries(defaultLayoutPresets).forEach(([height, preset]) => {
    const key = Number(height);
    assert.equal(
      preset.icon_padding_mm,
      expectedIconPadding[key],
      `preset ${height} should include icon padding default`,
    );
    assert.equal(
      preset.media_text_gap_mm,
      expectedMediaTextGap[key],
      `preset ${height} should include media/text gap default`,
    );
  });
});

test('default layout presets define subtitle wrap modes for three subtitle slots', () => {
  Object.entries(defaultLayoutPresets).forEach(([height, preset]) => {
    const sub = preset.text_zone?.sub || {};
    assert.equal(
      sub.subtitle1_wrap_mode || 'wrap',
      'wrap',
      `preset ${height} should default subtitle1 wrap mode to wrap`,
    );
    assert.equal(
      sub.subtitle2_wrap_mode || 'wrap',
      'wrap',
      `preset ${height} should default subtitle2 wrap mode to wrap`,
    );
    assert.equal(
      sub.subtitle3_wrap_mode || 'wrap',
      'wrap',
      `preset ${height} should default subtitle3 wrap mode to wrap`,
    );
  });
});

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

  const presetKey = resolvePresetHeightKey(geometry);
  const previousOverride = getPresetOverride(presetKey);
  try {
    setPresetOverride(presetKey, { ...(previousOverride || {}), icon_gap_mm: 0 });
    const flushResult = await renderLabelSVG({
      geometry,
      pxPerMm,
      textLines,
      hardwareInfo,
      qrContent: '',
    });
    const flushImages = extractImages(flushResult.svgMarkup);
    assert.equal(flushImages.length, 2, 'expected two media images with zero gap');
    const [flushLeft, flushRight] = flushImages;
    const leftEdge = flushLeft.x + flushLeft.width;
    assert.ok(
      Math.abs(leftEdge - flushRight.x) < 0.5,
      'icons should touch when icon gap is zero',
    );
  } finally {
    if (previousOverride) {
      setPresetOverride(presetKey, previousOverride);
    } else {
      setPresetOverride(presetKey, null);
    }
  }
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
      parsed[String(heightKey)].icon_padding_mm,
      defaultLayoutPresets[String(heightKey)].icon_padding_mm,
      'icon padding default should be included when merging presets',
    );
    assert.equal(
      parsed[String(heightKey)].media_text_gap_mm,
      defaultLayoutPresets[String(heightKey)].media_text_gap_mm,
      'media/text gap default should be included when merging presets',
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

test('getActiveLayoutPreset resolves heights expressed with units', () => {
  clearPresetOverrides();
  try {
    const preset = getActiveLayoutPreset('18mm');
    const expected = defaultLayoutPresets['18'];
    assert.ok(expected, 'expected a default preset for 18 mm labels');
    assert.equal(preset.icon_layout, expected.icon_layout);
    assert.deepEqual(preset.text_zone.main, expected.text_zone.main);
  } finally {
    clearPresetOverrides();
  }
});

test('part-specific overrides take precedence over shared height overrides', () => {
  clearPresetOverrides();
  try {
    const heightKey = 12;
    const partType = 'Bolt';
    const baseOverride = { media_zone_width_pct: 44 };
    const partOverride = {
      media_zone_width_pct: 58,
      text_zone: { main: { max_pt: 15 } },
    };
    setPresetOverride(heightKey, baseOverride);
    setPresetOverride(heightKey, partOverride, { partType });
    const globalPreset = getActiveLayoutPreset(heightKey);
    const partPreset = getActiveLayoutPreset(heightKey, { partType });
    assert.equal(
      globalPreset.media_zone_width_pct,
      baseOverride.media_zone_width_pct,
      'global overrides should apply when editing all parts',
    );
    assert.equal(
      partPreset.media_zone_width_pct,
      partOverride.media_zone_width_pct,
      'part overrides should override media width for that part type',
    );
    assert.equal(
      partPreset.text_zone.main.max_pt,
      partOverride.text_zone.main.max_pt,
      'part overrides should override nested properties for that part type',
    );
    const storedGlobal = getPresetOverride(heightKey);
    const storedPart = getPresetOverride(heightKey, { partType });
    assert.deepEqual(storedGlobal, baseOverride, 'base override should remain stored separately');
    assert.deepEqual(
      storedPart,
      partOverride,
      'part override should persist separately from the shared override',
    );
  } finally {
    clearPresetOverrides();
  }
});

test('bolt subtitles include head, drive, and notes information', async () => {
  const stubDocument = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    documentElement: { style: { setProperty: () => {} } },
    createElement: tag => {
      if (tag === 'canvas') {
        return {
          getContext: () => ({
            drawImage: () => {},
            clearRect: () => {},
            scale: () => {},
          }),
          toBlob: callback => callback(null),
        };
      }
      return { style: {}, classList: { add: () => {}, remove: () => {}, contains: () => false } };
    },
    fonts: {
      ready: Promise.resolve(),
      load: () => Promise.resolve(),
    },
  };
  const originalDocument = global.document;
  try {
    global.document = stubDocument;
    const [{ state }, { buildTextLinesForTest }] = await Promise.all([
      import('../js/state.js'),
      import('../js/render.js'),
    ]);
    const originalState = { ...state };
    try {
      Object.assign(state, {
        hardwareType: 'Bolt',
        threadSize: 'M6',
        length: '20 mm',
        boltHead: 'cap_head',
        boltDrive: 'hex',
        notes: 'Use threadlocker',
        showText: true,
        showTextMain: true,
        showTextInfo: true,
      });
      const textLines = buildTextLinesForTest();
      assert.equal(textLines.line1, 'M6 × 20 mm', 'bolt size should appear on the main line');
      assert.equal(textLines.line2, 'Socket Cap', 'head label should occupy the second line');
      assert.equal(textLines.line3, 'Hex', 'drive label should occupy the third line');
      assert.ok(!textLines.line2.includes('•'), 'head and drive labels should no longer be combined');
      assert.ok(!textLines.line3.includes('Use threadlocker'), 'notes should not displace the drive label');

      Object.assign(state, {
        hardwareType: 'Bolt',
        threadSize: 'M6',
        length: '20 mm',
        boltHead: '',
        boltDrive: 'hex',
        notes: 'Use threadlocker',
        showText: true,
        showTextMain: true,
        showTextInfo: true,
      });
      const missingHeadLines = buildTextLinesForTest();
      assert.equal(
        missingHeadLines.line2,
        'Use threadlocker',
        'notes should reuse the second line when the head label is absent',
      );
      assert.equal(
        missingHeadLines.line3,
        'Hex',
        'drive label should remain on the third line when available',
      );

      Object.assign(state, {
        hardwareType: 'Bolt',
        threadSize: 'M6',
        length: '20 mm',
        boltHead: 'cap_head',
        boltDrive: '',
        notes: 'Use threadlocker',
        showText: true,
        showTextMain: true,
        showTextInfo: true,
      });
      const missingDriveLines = buildTextLinesForTest();
      assert.equal(
        missingDriveLines.line2,
        'Socket Cap',
        'head label should continue to appear on the second line when present',
      );
      assert.equal(
        missingDriveLines.line3,
        'Use threadlocker',
        'notes should reuse the third line when the drive label is absent',
      );
    } finally {
      Object.assign(state, originalState);
    }
  } finally {
    if (originalDocument === undefined) {
      delete global.document;
    } else {
      global.document = originalDocument;
    }
  }
});

test('sub-part overrides merge with part and global overrides', () => {
  clearPresetOverrides();
  try {
    const heightKey = 12;
    const partType = 'Fuse';
    const subPartType = 'fuse-type:glass';
    const globalOverride = { padding_mm: 1.2 };
    const partOverride = { media_zone_width_pct: 52 };
    const subOverride = { text_zone: { main: { max_pt: 17 } } };
    setPresetOverride(heightKey, globalOverride);
    setPresetOverride(heightKey, partOverride, { partType });
    setPresetOverride(heightKey, subOverride, { partType, subPartType });
    const active = getActiveLayoutPreset(heightKey, { partType, subPartType });
    assert.equal(active.padding_mm, globalOverride.padding_mm, 'global override should persist for sub-part scope');
    assert.equal(active.media_zone_width_pct, partOverride.media_zone_width_pct, 'part override should apply within sub-part scope');
    assert.equal(
      active.text_zone.main.max_pt,
      subOverride.text_zone.main.max_pt,
      'sub-part override should override nested properties',
    );
    const storedSub = getPresetOverride(heightKey, { partType, subPartType });
    assert.deepEqual(storedSub, subOverride, 'sub-part override should be stored separately');
  } finally {
    clearPresetOverrides();
  }
});

test('icon padding and media/text gap persist through export and import', () => {
  clearPresetOverrides();
  try {
    const heightKey = 12;
    const override = { icon_padding_mm: 0.9, media_text_gap_mm: 1.1 };
    setPresetOverride(heightKey, override);
    const exported = exportLayoutPresets();
    clearPresetOverrides();
    importLayoutPresets(exported);
    const storedOverride = getPresetOverride(heightKey);
    const active = getActiveLayoutPreset(heightKey);
    assert.equal(storedOverride.icon_padding_mm, override.icon_padding_mm);
    assert.equal(storedOverride.media_text_gap_mm, override.media_text_gap_mm);
    assert.equal(active.icon_padding_mm, override.icon_padding_mm);
    assert.equal(active.media_text_gap_mm, override.media_text_gap_mm);
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
  assert.ok(result.lines.length >= 2, 'long content should wrap to multiple lines');
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
    textLines: { line1: 'Bolt', line2: 'Cap Head', line3: 'Hex Drive' },
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
    setPresetOverride(geometry.labelHeightMm, { text_zone: { block_offset_mm: 0 } });
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
  } finally {
    clearPresetOverrides();
  }
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

test('main wrap mode toggle influences layout', async () => {
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
    const longMain =
      'Ultra Long Main Line Content That Should Wrap Into Multiple Lines When The Mode Allows It';
    const textLines = { line1: longMain, line2: '', line3: '' };

    setPresetOverride(geometry.labelHeightMm, {
      text_zone: { main: { wrap_mode: 'wrap' } },
    });
    const wrapped = await renderLabelSVG({
      geometry,
      pxPerMm,
      textLines,
      hardwareInfo: null,
      qrContent: '',
    });
    const wrappedLines = wrapped.textLayout.main?.lines || [];
    assert.ok(
      wrappedLines.length >= 2,
      'enabling wrap mode should allow the main line to span multiple lines',
    );

    clearPresetOverrides();
    setPresetOverride(geometry.labelHeightMm, {
      text_zone: { main: { wrap_mode: 'fit' } },
    });
    const fitted = await renderLabelSVG({
      geometry,
      pxPerMm,
      textLines,
      hardwareInfo: null,
      qrContent: '',
    });
    const fittedLines = fitted.textLayout.main?.lines || [];
    assert.equal(
      fittedLines.length,
      1,
      'fit mode should keep the main line on a single line even when the content is long',
    );
  } finally {
    clearPresetOverrides();
  }
});

test('subtitle wrap modes apply per line', async () => {
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
    const longSubtitle =
      'Extremely verbose subtitle information that would normally require wrapping to fit comfortably within the label width';
    const longTertiarySubtitle =
      'Additional optional notes that easily extend beyond a single line when wrapping is permitted for the tertiary subtitle block';

    setPresetOverride(geometry.labelHeightMm, {
      text_zone: {
        sub: { subtitle1_wrap_mode: 'fit', subtitle2_wrap_mode: 'wrap', subtitle3_wrap_mode: 'wrap' },
      },
    });
    const fitSubtitle = await renderLabelSVG({
      geometry,
      pxPerMm,
      textLines: { line1: 'Main', line2: longSubtitle, line3: '' },
      hardwareInfo: null,
      qrContent: '',
    });
    const fitSubtitleLines = fitSubtitle.textLayout.sub?.lines || [];
    assert.equal(
      fitSubtitleLines.length,
      1,
      'disabling wrap on subtitle 1 should keep it to a single rendered line',
    );
    const fitSubtitleEntries = fitSubtitle.textLayout.sub?.entries || [];
    assert.equal(fitSubtitleEntries.length, 1, 'subtitle entries should include the first subtitle');
    assert.equal(
      fitSubtitleEntries[0]?.wrapMode,
      'fit',
      'subtitle 1 entry should reflect the resolved fit wrap mode',
    );

    clearPresetOverrides();
    setPresetOverride(geometry.labelHeightMm, {
      text_zone: {
        sub: { subtitle1_wrap_mode: 'wrap', subtitle2_wrap_mode: 'wrap', subtitle3_wrap_mode: 'wrap' },
      },
    });
    const wrapSubtitle = await renderLabelSVG({
      geometry,
      pxPerMm,
      textLines: { line1: 'Main', line2: longSubtitle, line3: '' },
      hardwareInfo: null,
      qrContent: '',
    });
    const wrapSubtitleLines = wrapSubtitle.textLayout.sub?.lines || [];
    assert.ok(
      wrapSubtitleLines.length >= 2,
      'enabling wrap on subtitle 1 should allow it to expand onto multiple lines',
    );
    const wrapSubtitleEntries = wrapSubtitle.textLayout.sub?.entries || [];
    assert.equal(wrapSubtitleEntries[0]?.wrapMode, 'wrap', 'subtitle 1 entry should report wrap mode');

    clearPresetOverrides();
    setPresetOverride(geometry.labelHeightMm, {
      text_zone: {
        sub: { subtitle1_wrap_mode: 'wrap', subtitle2_wrap_mode: 'fit', subtitle3_wrap_mode: 'wrap' },
      },
    });
    const fitThirdLine = await renderLabelSVG({
      geometry,
      pxPerMm,
      textLines: { line1: 'Main', line2: '', line3: longSubtitle },
      hardwareInfo: null,
      qrContent: '',
    });
    const fitThirdLines = fitThirdLine.textLayout.sub?.lines || [];
    assert.equal(
      fitThirdLines.length,
      1,
      'disabling wrap on subtitle 2 should keep it on one line when it appears alone',
    );
    const fitThirdEntries = fitThirdLine.textLayout.sub?.entries || [];
    assert.equal(fitThirdEntries[0]?.wrapMode, 'fit', 'subtitle 2 entry should record fit mode');

    clearPresetOverrides();
    setPresetOverride(geometry.labelHeightMm, {
      text_zone: {
        sub: { subtitle1_wrap_mode: 'wrap', subtitle2_wrap_mode: 'wrap', subtitle3_wrap_mode: 'wrap' },
      },
    });
    const wrapThirdLine = await renderLabelSVG({
      geometry,
      pxPerMm,
      textLines: { line1: 'Main', line2: '', line3: longSubtitle },
      hardwareInfo: null,
      qrContent: '',
    });
    const wrapThirdLines = wrapThirdLine.textLayout.sub?.lines || [];
    assert.ok(
      wrapThirdLines.length >= 2,
      'enabling wrap on subtitle 2 should allow it to span multiple lines',
    );
    const wrapThirdEntries = wrapThirdLine.textLayout.sub?.entries || [];
    assert.equal(wrapThirdEntries[0]?.wrapMode, 'wrap', 'subtitle 2 entry should report wrap mode');

    clearPresetOverrides();
    setPresetOverride(geometry.labelHeightMm, {
      text_zone: {
        sub: { subtitle1_wrap_mode: 'wrap', subtitle2_wrap_mode: 'wrap', subtitle3_wrap_mode: 'fit' },
      },
    });
    const fitFourthLine = await renderLabelSVG({
      geometry,
      pxPerMm,
      textLines: { line1: 'Main', line2: '', line3: '', subtitle3: longTertiarySubtitle },
      hardwareInfo: null,
      qrContent: '',
    });
    const fitFourthLines = fitFourthLine.textLayout.sub?.lines || [];
    assert.equal(
      fitFourthLines.length,
      1,
      'disabling wrap on subtitle 3 should keep optional notes to a single line',
    );
    const fitFourthEntries = fitFourthLine.textLayout.sub?.entries || [];
    assert.equal(fitFourthEntries[0]?.wrapMode, 'fit', 'subtitle 3 entry should record fit mode');

    clearPresetOverrides();
    setPresetOverride(geometry.labelHeightMm, {
      text_zone: {
        sub: { subtitle1_wrap_mode: 'wrap', subtitle2_wrap_mode: 'wrap', subtitle3_wrap_mode: 'wrap' },
      },
    });
    const wrapFourthLine = await renderLabelSVG({
      geometry,
      pxPerMm,
      textLines: { line1: 'Main', line2: '', line3: '', subtitle3: longTertiarySubtitle },
      hardwareInfo: null,
      qrContent: '',
    });
    const wrapFourthLines = wrapFourthLine.textLayout.sub?.lines || [];
    assert.ok(
      wrapFourthLines.length >= 2,
      'enabling wrap on subtitle 3 should allow tertiary notes to wrap naturally',
    );
    const wrapFourthEntries = wrapFourthLine.textLayout.sub?.entries || [];
    assert.equal(wrapFourthEntries[0]?.wrapMode, 'wrap', 'subtitle 3 entry should report wrap mode');

    const multiEntry = await renderLabelSVG({
      geometry,
      pxPerMm,
      textLines: { line1: 'Main', line2: 'First', line3: 'Second', subtitle3: 'Third' },
      hardwareInfo: null,
      qrContent: '',
    });
    const multiEntries = multiEntry.textLayout.sub?.entries || [];
    assert.deepEqual(
      multiEntries.map(entry => entry.text),
      ['First', 'Second', 'Third'],
      'subtitle entries should preserve the order of all three subtitle strings',
    );
  } finally {
    clearPresetOverrides();
  }
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

test('textRect width shrinks by a single QR clearance when QR content is present', async () => {
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
    const preset = getActiveLayoutPreset(geometry.labelHeightMm);
    const textLines = { line1: 'QR Width Check', line2: '', line3: '' };
    const baseResult = await renderLabelSVG({
      geometry,
      pxPerMm,
      textLines,
      hardwareInfo: null,
      qrContent: '',
    });
    const qrDataUrl = 'data:image/png;base64,AAAAC';
    const qrResult = await renderLabelSVG({
      geometry,
      pxPerMm,
      textLines,
      hardwareInfo: null,
      qrContent: 'https://example.com',
      qrGenerator: async (_, size) => ({ dataUrl: qrDataUrl, sizePx: size }),
    });
    const baseTextRect = baseResult.textRect;
    const qrSidePx = Math.max(
      24,
      Math.round(mmToPx(preset.qr?.side_mm || 0, pxPerMm)),
    );
    const qrMarginPx = mmToPx(preset.qr?.margin_mm || 0, pxPerMm);
    const maxWidthPct = Number.isFinite(preset.qr?.max_pct_of_text_zone_width)
      ? preset.qr.max_pct_of_text_zone_width
      : 100;
    const maxWidthByPct = (maxWidthPct / 100) * baseTextRect.width;
    const availableHeightPx = Math.max(0, baseTextRect.height - qrMarginPx * 2);
    const finalSidePx = Math.min(qrSidePx, maxWidthByPct, availableHeightPx);
    const expectedDropPx = finalSidePx + qrMarginPx;
    const actualDropPx = baseResult.textRect.width - qrResult.textRect.width;
    assert.ok(
      Math.abs(actualDropPx - expectedDropPx) < 0.51,
      `expected textRect width drop of ${expectedDropPx.toFixed(2)}px but got ${actualDropPx.toFixed(2)}px`,
    );
  } finally {
    clearPresetOverrides();
  }
});

test('oversized QR clamps to text height and preserves block offset', async () => {
  clearPresetOverrides();
  try {
    const geometry = {
      labelWidthMm: 37,
      labelHeightMm: 24,
      printableWidthMm: 33,
      printableHeightMm: 22,
      marginX: 2,
      marginY: 1,
    };
    const presetKey = geometry.labelHeightMm;
    const basePreset = getActiveLayoutPreset(presetKey);
    const exaggeratedSideMm = (geometry.printableHeightMm || geometry.labelHeightMm) * 2;
    setPresetOverride(presetKey, {
      qr: {
        ...(basePreset.qr || {}),
        side_mm: exaggeratedSideMm,
      },
    });
    const qrDataUrl = 'data:image/png;base64,AAAAD';
    const result = await renderLabelSVG({
      geometry,
      pxPerMm,
      textLines: { line1: 'Tall QR', line2: 'Check', line3: '' },
      hardwareInfo: null,
      qrContent: 'https://example.com/oversized',
      qrGenerator: async (_, size) => ({ dataUrl: qrDataUrl, sizePx: size }),
    });
    const images = extractImages(result.svgMarkup);
    assert.equal(images.length, 1, 'expected a single QR image to render');

    const activePreset = getActiveLayoutPreset(presetKey);
    const qrMarginMm = activePreset.qr?.margin_mm || 0;
    const qrMarginPx = mmToPx(qrMarginMm, pxPerMm);
    const availableHeightPx = Math.max(0, result.textRect.height - qrMarginPx * 2);
    assert.ok(
      images[0].height <= availableHeightPx + 0.51,
      `QR height (${images[0].height.toFixed(2)}px) should not exceed text height minus margins (${availableHeightPx.toFixed(2)}px)`,
    );
    assert.ok(
      result.textLayout.zones.block.y >= result.textRect.y - 0.51,
      'text block should remain at or below the top boundary of the text rect',
    );
  } finally {
    clearPresetOverrides();
  }
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
    const qrSizePx = 48;
    const qrMarginPx = mmToPx(override.qr.margin_mm || 0, pxPerMm);
    const clearancePx = qrSizePx + qrMarginPx;
    const textRect = {
      x: 20,
      y: 10,
      width: 160 - clearancePx,
      height: 60,
    };
    const layout = layoutText({
      textLines: { line1: 'QR Label', line2: '', line3: '' },
      textRect,
      preset: override,
      pxPerMm,
      qrBounds: { size: qrSizePx, clearancePx },
    });
    const expectedAnchor = textRect.x + textRect.width;
    assert.equal(layout.main.anchor, 'end');
    assert.ok(
      Math.abs(layout.main.x - expectedAnchor) < 0.51,
      `main anchor (${layout.main.x.toFixed(2)}) should align with QR clearance (${expectedAnchor.toFixed(2)})`,
    );
  } finally {
    clearPresetOverrides();
  }
});

test('layoutText applies configured horizontal offset to anchors', () => {
  const preset = getActiveLayoutPreset(12);
  const horizontalOffsetMm = 1.5;
  const override = {
    ...preset,
    text_zone: {
      ...preset.text_zone,
      alignment: 'start',
      horizontal_offset_mm: horizontalOffsetMm,
    },
  };
  const offsetPx = mmToPx(horizontalOffsetMm, pxPerMm);
  const textRect = {
    x: 18,
    y: 8,
    width: 160,
    height: 70,
    horizontalOffsetPx: offsetPx,
    horizontalOffsetLimits: { min: -offsetPx, max: offsetPx },
  };
  const layout = layoutText({
    textLines: { line1: 'Offset Demo', line2: 'Subtitle', line3: '' },
    textRect,
    preset: override,
    pxPerMm,
    qrBounds: null,
  });
  assert.ok(
    Math.abs(layout.main.x - (textRect.x + offsetPx)) < 0.6,
    `main anchor should shift by offset (${layout.main.x.toFixed(2)} vs ${(textRect.x + offsetPx).toFixed(2)})`,
  );
  if (layout.sub && layout.sub.lineCount > 0) {
    assert.ok(
      Math.abs(layout.sub.x - (textRect.x + offsetPx)) < 0.6,
      `subtitle anchor should shift by offset (${layout.sub.x.toFixed(2)} vs ${(textRect.x + offsetPx).toFixed(2)})`,
    );
  }
});

test('layoutText clamps vertical block offsets within the text rectangle', () => {
  const preset = getActiveLayoutPreset(9);
  const override = {
    ...preset,
    text_zone: {
      ...preset.text_zone,
      block_offset_mm: 12,
    },
  };
  const textRect = {
    x: 12,
    y: 4,
    width: 140,
    height: 48,
    horizontalOffsetPx: 0,
    horizontalOffsetLimits: { min: 0, max: 0 },
  };
  const layout = layoutText({
    textLines: { line1: 'Clamped Block', line2: 'Subtitle', line3: '' },
    textRect,
    preset: override,
    pxPerMm,
    qrBounds: null,
  });
  const blockZone = layout.zones.block;
  const maxTop = Math.max(textRect.y, textRect.y + textRect.height - blockZone.height);
  assert.ok(blockZone.y <= maxTop + 0.01, 'block top should not extend beyond allowed maximum');
  assert.ok(blockZone.y >= textRect.y - 0.01, 'block top should remain within textRect top boundary');
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
    const collectLabeledControls = node => {
      const collected = [];
      const walk = current => {
        if (!current || !Array.isArray(current.children)) {
          return;
        }
        const labelEl = current.children.find(child => child.tagName === 'LABEL');
        const controlEl = current.children.find(
          child => child.tagName === 'INPUT' || child.tagName === 'SELECT',
        );
        if (labelEl && controlEl) {
          collected.push({ label: labelEl.textContent, control: controlEl });
        }
        current.children.forEach(child => walk(child));
      };
      walk(node);
      return collected;
    };
    const labeledControls = collectLabeledControls(body);
    const paddingField = labeledControls.find(field => field.label === 'Padding (mm)');
    assert.ok(paddingField, 'expected to locate numeric field for padding');
    const iconPaddingField = labeledControls.find(field => field.label === 'Icon padding (mm)');
    assert.ok(iconPaddingField, 'icon padding field should be present');
    const mediaGapField = labeledControls.find(field => field.label === 'Media/Text gap (mm)');
    assert.ok(mediaGapField, 'media/text gap field should be present');
    const subtitle3WrapField = labeledControls.find(
      field => field.label === 'Subtitle 3 wrap mode',
    );
    assert.ok(subtitle3WrapField, 'subtitle 3 wrap mode selector should be present');
    paddingField.control.value = '2.7';
    const listeners = paddingField.control.listeners?.input || [];
    listeners.forEach(listener =>
      listener({ currentTarget: paddingField.control, target: paddingField.control }),
    );

    const storedRaw =
      window.localStorage.getItem('gridfinity-layout-presets:v3') ||
      window.localStorage.getItem('gridfinity-layout-presets');
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

test('layout editor scope select lists hierarchical overrides', () => {
  clearPresetOverrides();
  const cleanup = setupLayoutEditorTestEnvironment();
  try {
    const heightKey = 12;
    const geometry = {
      labelWidthMm: 37,
      labelHeightMm: 12,
      printableWidthMm: 33,
      printableHeightMm: 10,
      marginX: 2,
      marginY: 1,
    };
    const scopeHierarchy = [
      { label: 'All parts', partType: null, subPartType: null },
      {
        label: 'Fuse',
        partType: 'Fuse',
        subPartType: null,
        children: [
          { label: 'Glass Fuse', partType: 'Fuse', subPartType: 'fuse-type:glass' },
          { label: 'Ceramic Fuse', partType: 'Fuse', subPartType: 'fuse-type:ceramic' },
        ],
      },
    ];
    const activeScope = scopeHierarchy[1].children[0];
    setPresetOverride(heightKey, { media_zone_width_pct: 45 });
    setPresetOverride(heightKey, { padding_mm: 1.6 }, { partType: 'Fuse' });
    setPresetOverride(heightKey, { text_zone: { main: { max_pt: 16 } } }, {
      partType: 'Fuse',
      subPartType: 'fuse-type:glass',
    });
    const preset = getActiveLayoutPreset(heightKey, { partType: 'Fuse', subPartType: 'fuse-type:glass' });
    ensureLayoutEditor({
      geometry,
      preset,
      textLines: { line1: 'Fuse', line2: 'Glass', line3: '' },
      hardwareInfo: null,
      qrContent: '',
      layoutEditorToken: 1,
      partType: 'Fuse',
      partLabel: 'Fuse',
      partScope: { hierarchy: scopeHierarchy, active: activeScope },
    });
    ensureLayoutEditor({
      geometry,
      preset,
      textLines: { line1: 'Fuse', line2: 'Glass', line3: '' },
      hardwareInfo: null,
      qrContent: '',
      layoutEditorToken: 2,
      partType: 'Fuse',
      partLabel: 'Fuse',
      partScope: { hierarchy: scopeHierarchy, active: activeScope },
    });
    const panel = document.getElementById('layout-editor-panel');
    const select = panel.querySelector('[data-editor-scope]');
    const clearButton = panel.querySelector('[data-editor-clear-part]');
    assert.ok(select.listeners?.change?.length, 'scope select should expose change listener');
    const triggerChange = () => {
      (select.listeners?.change || []).forEach(listener => listener({ currentTarget: select, target: select }));
    };
    select.value = '2';
    triggerChange();
    assert.equal(clearButton.textContent, 'Clear Glass Fuse override');
    assert.equal(clearButton.disabled, false);
    select.value = '1';
    triggerChange();
    assert.equal(clearButton.textContent, 'Clear Fuse override');
    assert.equal(clearButton.disabled, false);
    (clearButton.listeners?.click || []).forEach(listener =>
      listener({ currentTarget: clearButton, target: clearButton, preventDefault() {} }),
    );
    assert.equal(
      getPresetOverride(heightKey, { partType: 'Fuse' }),
      null,
      'clearing Fuse scope should remove part override',
    );
    assert.ok(
      getPresetOverride(heightKey, { partType: 'Fuse', subPartType: 'fuse-type:glass' }),
      'sub-part override should remain after clearing part scope',
    );
    select.value = '0';
    triggerChange();
    assert.equal(clearButton.textContent, 'Clear All parts override');
    assert.equal(clearButton.disabled, false);
    select.value = '2';
    triggerChange();
    assert.equal(clearButton.textContent, 'Clear Glass Fuse override');
    assert.equal(clearButton.disabled, false);
    (clearButton.listeners?.click || []).forEach(listener =>
      listener({ currentTarget: clearButton, target: clearButton, preventDefault() {} }),
    );
    assert.equal(
      getPresetOverride(heightKey, { partType: 'Fuse', subPartType: 'fuse-type:glass' }),
      null,
      'clearing sub-part scope should remove sub-part override',
    );
    assert.equal(clearButton.disabled, true, 'clear button should disable when no override remains for scope');
  } finally {
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
