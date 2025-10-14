import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../js/dom-elements.js', () => ({
  __esModule: true,
  elements: new Proxy(
    {},
    {
      get: () => null,
    },
  ),
}));

const mockRenderLabelSVG = jest.fn(async () => ({
  svgMarkup: '',
  widthPx: 0,
  heightPx: 0,
  printableWidthMm: 0,
  printableHeightMm: 0,
}));

jest.mock('../js/label/renderLabelSVG.js', () => ({
  __esModule: true,
  renderLabelSVG: mockRenderLabelSVG,
  loadSvgImage: jest.fn(),
  canvasToBlob: jest.fn(),
  layoutPresetTools: {
    subscribePresetChanges: jest.fn(),
  },
}));

let buildTextLinesForTest;
let isLabelReady;
let state;

beforeAll(async () => {
  ({ buildTextLinesForTest, isLabelReady } = await import('../js/render.js'));
  ({ state } = await import('../js/state.js'));
});

beforeEach(() => {
  state.hardwareType = 'Fuse';
  state.fuseValue = '5';
  state.fuseType = 'Glass';
  state.glassSize = '';
  state.glassSpeed = '';
  state.notes = '';
  state.showText = true;
  state.showTextMain = true;
  state.showTextInfo = true;
});

describe('buildTextLinesForTest', () => {
  it('avoids duplicating the fuse suffix for panel mount holders', () => {
    state.fuseType = 'Panel Mount Fuse Holder';

    const lines = buildTextLinesForTest();

    expect(lines.line2).toBe('Panel Mount Fuse Holder');
  });

  it('includes the selected glass size for panel mount holders', () => {
    state.fuseType = 'Panel Mount Fuse Holder';
    state.fuseValue = '';
    state.glassSize = '6.3 × 32 mm';
    state.glassSpeed = 'Fast';
    state.notes = 'Spare';

    const lines = buildTextLinesForTest();

    expect(lines.line2).toBe('Panel Mount Fuse Holder');
    expect(lines.line3).toBe('6.3 × 32 mm');
    expect(lines.line4).toBe('Fast • Spare');
  });

  it('lists additional info on line3 when there is no glass size', () => {
    state.fuseType = 'Glass';
    state.glassSpeed = 'Slow-Blow';
    state.notes = '';

    const lines = buildTextLinesForTest();

    expect(lines.line3).toBe('Slow-Blow');
    expect(lines.line4).toBe('');
  });

  it('joins multiple details with separators when size is absent', () => {
    state.fuseType = 'Glass';
    state.glassSpeed = 'Fast';
    state.notes = 'Primary';

    const lines = buildTextLinesForTest();

    expect(lines.line3).toBe('Fast • Primary');
    expect(lines.line4).toBe('');
  });

  it('still appends the suffix when it is missing', () => {
    state.fuseType = 'Glass';

    const lines = buildTextLinesForTest();

    expect(lines.line2).toBe('Glass Fuse');
  });

  it('considers the panel mount holder ready without an amperage', () => {
    state.fuseType = 'Panel Mount Fuse Holder';
    state.fuseValue = '';

    expect(isLabelReady()).toBe(true);
  });
});
