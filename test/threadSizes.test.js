import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { metricThreadSizes } from '../js/data.js';

const createMockSelect = () => ({
  options: [],
  disabled: false,
  value: '',
  appendChild(option) {
    this.options.push(option);
    return option;
  },
  set innerHTML(value) {
    if (value === '') {
      this.options = [];
      return;
    }
    throw new Error(`Unexpected innerHTML assignment: ${value}`);
  }
});

const mockThreadSizeSelect = createMockSelect();

const mockUpdatePreview = jest.fn();
const mockUpdateDownloadState = jest.fn();

jest.mock('../js/dom-elements.js', () => ({
  __esModule: true,
  elements: {
    threadSizeSelect: mockThreadSizeSelect
  }
}));

jest.mock('../js/preview.js', () => ({
  __esModule: true,
  updatePreview: mockUpdatePreview,
  updateDownloadState: mockUpdateDownloadState
}));

const createElementMock = jest.fn(tagName => {
  if (tagName !== 'option') {
    throw new Error(`Unexpected tag requested: ${tagName}`);
  }
  return {
    value: '',
    textContent: ''
  };
});

global.document = {
  createElement: createElementMock
};

let populateThreadSizes;
let state;

beforeAll(async () => {
  ({ populateThreadSizes } = await import('../js/threadSizes.js'));
  ({ state } = await import('../js/state.js'));
});

const resetMockSelect = () => {
  mockThreadSizeSelect.options = [];
  mockThreadSizeSelect.disabled = false;
  mockThreadSizeSelect.value = 'preset-value';
};

describe('populateThreadSizes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createElementMock.mockClear();
    resetMockSelect();
    state.threadSize = 'M5';
    state.systemType = 'Metric';
    state.hardwareType = 'Screw';
  });

  it('enables the dropdown and populates metric options when the hardware type is Screw', () => {
    mockThreadSizeSelect.disabled = true;

    populateThreadSizes();

    expect(mockThreadSizeSelect.disabled).toBe(false);
    expect(mockThreadSizeSelect.value).toBe('');
    expect(state.threadSize).toBe('');
    expect(mockThreadSizeSelect.options).toHaveLength(metricThreadSizes.length + 1);
    const [placeholder, ...options] = mockThreadSizeSelect.options;
    expect(placeholder).toEqual(
      expect.objectContaining({ value: '', textContent: 'Select size…' })
    );
    expect(options.map(option => option.textContent)).toEqual(metricThreadSizes);
    expect(options.map(option => option.value)).toEqual(metricThreadSizes);
    expect(mockUpdateDownloadState).toHaveBeenCalledTimes(1);
    expect(mockUpdatePreview).toHaveBeenCalledTimes(1);
  });

  it('disables the dropdown and shows Not applicable when the hardware type is Fuse', () => {
    state.hardwareType = 'Fuse';

    populateThreadSizes();

    expect(mockThreadSizeSelect.disabled).toBe(true);
    expect(mockThreadSizeSelect.value).toBe('');
    expect(state.threadSize).toBe('');
    expect(mockThreadSizeSelect.options).toHaveLength(1);
    expect(mockThreadSizeSelect.options[0]).toEqual(
      expect.objectContaining({ value: '', textContent: 'Not applicable' })
    );
    expect(mockUpdateDownloadState).toHaveBeenCalledTimes(1);
    expect(mockUpdatePreview).toHaveBeenCalledTimes(1);
  });
});
