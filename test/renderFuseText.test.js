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
