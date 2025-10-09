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
  state.showTextInfoLine2 = true;
  state.showTextInfoLine3 = true;
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

    const lines = buildTextLinesForTest();

    expect(lines.line2).toBe('Panel Mount Fuse Holder — 6.3 × 32 mm');
  });

  it('still appends the suffix when it is missing', () => {
    state.fuseType = 'Glass';

    const lines = buildTextLinesForTest();

    expect(lines.line2).toBe('Glass Fuse');
  });

  it('hides the secondary info line when disabled', () => {
    state.fuseType = 'Glass';
    state.glassSize = '6.3 × 32 mm';
    state.glassSpeed = 'Fast-blow';
    state.showTextInfoLine2 = false;

    const lines = buildTextLinesForTest();

    expect(lines.line2).toBe('');
    expect(lines.line3).toBe('Fast-blow');
  });

  it('hides the tertiary info line when disabled', () => {
    state.fuseType = 'Glass';
    state.glassSpeed = 'Fast-blow';
    state.notes = 'Spare';
    state.showTextInfoLine3 = false;

    const lines = buildTextLinesForTest();

    expect(lines.line2).toBe('Glass Fuse');
    expect(lines.line3).toBe('');
  });

  it('considers the panel mount holder ready without an amperage', () => {
    state.fuseType = 'Panel Mount Fuse Holder';
    state.fuseValue = '';

    expect(isLabelReady()).toBe(true);
  });
});
