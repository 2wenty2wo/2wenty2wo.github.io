import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  componentImageMap,
  fuseTypeOptions,
  fuseValues,
  mosfetChannelOptions,
  mosfetPartOptions,
} from '../js/data.js';

const createClassListMock = () => ({
  add: jest.fn(),
  remove: jest.fn(),
  toggle: jest.fn(),
  contains: jest.fn(() => false),
});

const mockFuseValueSelect = {
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
  },
};

const mockFuseValuePickerList = {
  items: [],
  hidden: false,
  appendChild(item) {
    this.items.push(item);
    return item;
  },
  set innerHTML(value) {
    if (value === '') {
      this.items = [];
      return;
    }
    throw new Error(`Unexpected innerHTML assignment: ${value}`);
  },
  querySelectorAll(selector) {
    if (selector === '[role="option"]') {
      return this.items;
    }
    return [];
  },
};

const mockFuseValueContainer = {
  classList: createClassListMock(),
};

const mockFuseValuePickerButton = {
  disabled: true,
  attributes: {},
  classList: createClassListMock(),
  setAttribute: jest.fn(function setAttribute(name, value) {
    this.attributes[name] = value;
  }),
  removeAttribute: jest.fn(function removeAttribute(name) {
    delete this.attributes[name];
  }),
  querySelector: jest.fn(() => null),
};

const mockFuseValuePicker = {
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    toggle: jest.fn(),
    contains: jest.fn(() => false),
  },
};

const mockGlassOptionsContainer = {
  classList: createClassListMock(),
};

const mockGlassSpeedOptionsContainer = {
  classList: createClassListMock(),
};

const mockGlassSizeSelect = {
  value: '',
};

const mockGlassSlowBlowCheckbox = {
  checked: false,
  disabled: false,
};

const mockGlassFastBlowCheckbox = {
  checked: false,
  disabled: false,
};

jest.mock('../js/dom-elements.js', () => ({
  __esModule: true,
  elements: {
    fuseValueContainer: mockFuseValueContainer,
    fuseValueSelect: mockFuseValueSelect,
    fuseValuePickerList: mockFuseValuePickerList,
    fuseValuePickerButton: mockFuseValuePickerButton,
    fuseValuePicker: mockFuseValuePicker,
    glassOptionsContainer: mockGlassOptionsContainer,
    glassSpeedOptionsContainer: mockGlassSpeedOptionsContainer,
    glassSizeSelect: mockGlassSizeSelect,
    glassSlowBlowCheckbox: mockGlassSlowBlowCheckbox,
    glassFastBlowCheckbox: mockGlassFastBlowCheckbox,
  },
}));

const createElementMock = jest.fn(tagName => {
  const baseElement = () => ({
    className: '',
    children: [],
    dataset: {},
    attributes: {},
    classList: createClassListMock(),
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    setAttribute(name, value) {
      if (name === 'data-value' || name.startsWith('data-')) {
        const key = name
          .replace(/^data-/, '')
          .replace(/-(.)/g, (_, group) => group.toUpperCase());
        this.dataset[key] = value;
      }
      this.attributes[name] = value;
    },
  });

  if (tagName === 'option') {
    return {
      value: '',
      textContent: '',
      setAttribute(name, value) {
        this.attributes = this.attributes || {};
        this.attributes[name] = value;
      },
    };
  }

  if (tagName === 'li') {
    const element = baseElement();
    element.dataset = {};
    element.tabIndex = 0;
    return element;
  }

  if (tagName === 'span') {
    const element = baseElement();
    element.textContent = '';
    return element;
  }

  throw new Error(`Unexpected element requested: ${tagName}`);
});

global.document = {
  createElement: createElementMock,
};

let populateFuseValues;
let setFuseTypeSelection;
let syncFuseValuePicker;
let state;

beforeAll(async () => {
  ({ populateFuseValues, setFuseTypeSelection, syncFuseValuePicker } = await import(
    '../js/forms.js',
  ));
  ({ state } = await import('../js/state.js'));
});

beforeEach(() => {
  createElementMock.mockClear();
  mockFuseValueSelect.options = [];
  mockFuseValueSelect.value = '';
  mockFuseValuePickerList.items = [];
  mockFuseValuePickerList.hidden = false;
  mockFuseValuePickerButton.disabled = true;
  mockFuseValuePickerButton.attributes = {};
  mockFuseValuePickerButton.classList.add.mockClear();
  mockFuseValuePickerButton.classList.remove.mockClear();
  mockFuseValuePickerButton.classList.toggle.mockClear();
  mockFuseValuePickerButton.setAttribute.mockClear();
  mockFuseValuePickerButton.removeAttribute.mockClear();
  mockFuseValuePickerButton.querySelector.mockClear();
  mockFuseValueContainer.classList.toggle.mockClear();
  mockFuseValuePicker.classList.contains.mockReturnValue(false);
  mockFuseValuePicker.classList.remove.mockClear();
  mockFuseValuePicker.classList.toggle.mockClear();
  mockGlassOptionsContainer.classList.toggle.mockClear();
  mockGlassSpeedOptionsContainer.classList.toggle.mockClear();
  mockGlassSizeSelect.value = '';
  mockGlassSlowBlowCheckbox.checked = false;
  mockGlassSlowBlowCheckbox.disabled = false;
  mockGlassFastBlowCheckbox.checked = false;
  mockGlassFastBlowCheckbox.disabled = false;
  state.fuseValue = '';
  state.fuseType = 'Glass';
  state.hardwareType = 'Fuse';
  state.glassSize = '';
  state.glassSpeed = '';
  mockFuseValueSelect.disabled = false;
  mockFuseValueSelect.value = '';
  mockFuseValuePickerButton.disabled = true;
  mockFuseValuePickerButton.attributes = {};
});

describe('fuse type option data', () => {
  it('includes the panel mount fuse holder option with artwork', () => {
    expect(fuseTypeOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'Panel Mount Fuse Holder',
          label: 'Panel Mount Fuse Holder',
          image: 'images/fuses/fuse_holder_panel_mount.svg',
        }),
      ]),
    );
  });
});

describe('populateFuseValues', () => {
  it('lists common fuse ratings in ascending order including 3.15 A', () => {
    expect(fuseValues).toContain('3.15');
    const sorted = [...fuseValues].sort((a, b) => parseFloat(a) - parseFloat(b));
    expect(fuseValues).toEqual(sorted);
  });

  it('populates the fuse selectors with every rating and preserves a valid selection', () => {
    state.fuseValue = '3.15';

    populateFuseValues();

    const selectValues = mockFuseValueSelect.options.map(option => option.value);
    expect(selectValues).toContain('3.15');
    expect(mockFuseValueSelect.value).toBe('3.15');

    const pickerValues = mockFuseValuePickerList.items.map(item => item.dataset.value);
    expect(pickerValues).toContain('3.15');
    expect(mockFuseValuePickerList.hidden).toBe(true);
  });
});

describe('fuse type selection behaviour', () => {
  it('hides the amperage controls and clears the value for panel mount holders', () => {
    state.fuseValue = '5';
    mockFuseValuePicker.classList.contains.mockReturnValue(true);

    setFuseTypeSelection('Panel Mount Fuse Holder', { triggerUpdate: false });

    expect(state.fuseValue).toBe('');
    expect(mockFuseValueSelect.disabled).toBe(true);
    expect(mockFuseValueSelect.value).toBe('');
    expect(mockFuseValueContainer.classList.toggle).toHaveBeenCalledWith('d-none', true);
    expect(mockFuseValuePickerButton.disabled).toBe(true);
    expect(mockFuseValuePickerButton.attributes['aria-expanded']).toBe('false');
    expect(mockFuseValuePickerButton.classList.remove).toHaveBeenCalledWith('is-invalid');
    expect(mockFuseValuePickerButton.removeAttribute).toHaveBeenCalledWith('aria-invalid');
    expect(mockFuseValuePicker.classList.remove).toHaveBeenCalledWith('is-open');
  });

  it('keeps validation clear when amperage is not required', () => {
    state.fuseType = 'Panel Mount Fuse Holder';
    state.fuseValue = '';

    syncFuseValuePicker({ isValid: false });

    expect(mockFuseValuePickerButton.classList.add).not.toHaveBeenCalledWith('is-invalid');
    expect(mockFuseValuePickerButton.classList.remove).toHaveBeenCalledWith('is-invalid');
    expect(mockFuseValuePickerButton.removeAttribute).toHaveBeenCalledWith('aria-invalid');
    expect(mockFuseValuePicker.classList.toggle).toHaveBeenCalledWith('is-invalid', false);
  });

  it('reveals the glass options for panel mount holders and keeps the selected size', () => {
    state.glassSize = '5 × 20 mm';
    state.glassSpeed = 'Fast Blow';

    setFuseTypeSelection('Panel Mount Fuse Holder', { triggerUpdate: false });

    expect(mockGlassOptionsContainer.classList.toggle).toHaveBeenCalledWith('d-none', false);
    expect(mockGlassSpeedOptionsContainer.classList.toggle).toHaveBeenCalledWith('d-none', true);
    expect(mockGlassSizeSelect.value).toBe('5 × 20 mm');
    expect(state.glassSpeed).toBe('');
    expect(mockGlassSlowBlowCheckbox.checked).toBe(false);
    expect(mockGlassFastBlowCheckbox.checked).toBe(false);
    expect(mockGlassSlowBlowCheckbox.disabled).toBe(true);
    expect(mockGlassFastBlowCheckbox.disabled).toBe(true);
  });

  it('hides and clears the glass options when switching to blade fuses', () => {
    state.fuseType = 'Panel Mount Fuse Holder';
    state.glassSize = '6.3 × 32 mm (1/4″ × 1-1/4″)';
    mockGlassSizeSelect.value = state.glassSize;
    state.glassSpeed = 'Slow Blow (Time Delay)';

    setFuseTypeSelection('Blade', { triggerUpdate: false });

    expect(mockGlassOptionsContainer.classList.toggle).toHaveBeenCalledWith('d-none', true);
    expect(state.glassSize).toBe('');
    expect(mockGlassSizeSelect.value).toBe('');
    expect(mockGlassSpeedOptionsContainer.classList.toggle).toHaveBeenCalledWith('d-none', false);
    expect(state.glassSpeed).toBe('');
    expect(mockGlassSlowBlowCheckbox.checked).toBe(false);
    expect(mockGlassFastBlowCheckbox.checked).toBe(false);
    expect(mockGlassSlowBlowCheckbox.disabled).toBe(false);
    expect(mockGlassFastBlowCheckbox.disabled).toBe(false);
  });

  it('restores fuse speed options when switching back to glass fuses', () => {
    setFuseTypeSelection('Panel Mount Fuse Holder', { triggerUpdate: false });
    state.glassSpeed = 'Slow Blow (Time Delay)';

    setFuseTypeSelection('Glass', { triggerUpdate: false });

    expect(mockGlassSpeedOptionsContainer.classList.toggle).toHaveBeenLastCalledWith(
      'd-none',
      false,
    );
    expect(mockGlassSlowBlowCheckbox.disabled).toBe(false);
    expect(mockGlassFastBlowCheckbox.disabled).toBe(false);
    expect(mockGlassSlowBlowCheckbox.checked).toBe(true);
    expect(mockGlassFastBlowCheckbox.checked).toBe(false);
  });
});

describe('MOSFET option data', () => {
  it('uses dedicated artwork for the MOSFET SMD mount', () => {
    expect(componentImageMap.MOSFET.SMD).toBe('images/mosfet/mosfet_smd.svg');
  });

  it('provides shared artwork for each MOSFET channel type option', () => {
    expect(mosfetChannelOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'N-Channel Logic-Level', image: 'images/mosfet/mosfet.svg' }),
        expect.objectContaining({ id: 'P-Channel', image: 'images/mosfet/mosfet.svg' }),
      ]),
    );
  });

  it('includes popular MOSFET part numbers with matching art', () => {
    const ids = mosfetPartOptions.map(option => option.id);
    expect(ids).toEqual(
      expect.arrayContaining(['IRLZ44N', 'AO3400A', 'BS170', 'IRF520', 'FQP30N06L']),
    );
    mosfetPartOptions.forEach(option => {
      expect(option.image).toBe('images/mosfet/mosfet.svg');
    });
  });
});
