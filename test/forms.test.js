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

const NBSP = '\u00a0';

const baseGlassSpeedOptions = [
  { value: '', textContent: NBSP },
  { value: 'Slow-blow', textContent: 'Slow-blow' },
  { value: 'Fast-blow', textContent: 'Fast-blow' },
];

const baseGlassSizeOptions = [
  { value: '', textContent: NBSP },
  { value: '5 × 20 mm', textContent: '5 × 20 mm' },
  { value: '6.3 × 32 mm', textContent: '6.3 × 32 mm' },
];

const cloneOptions = options => options.map(option => ({ ...option }));

const mockGlassSpeedSelect = {
  value: '',
  disabled: false,
  options: cloneOptions(baseGlassSpeedOptions),
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

const mockGlassSizeSelect = {
  value: '',
  options: cloneOptions(baseGlassSizeOptions),
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

const mockGlassSpeedPicker = {
  classList: createClassListMock(),
};

const mockGlassSpeedPickerLabel = { textContent: '' };
const mockGlassSpeedPickerIcon = { classList: createClassListMock() };

const mockGlassSpeedPickerButton = {
  disabled: false,
  attributes: {},
  classList: createClassListMock(),
  setAttribute: jest.fn(function setAttribute(name, value) {
    this.attributes[name] = value;
  }),
  removeAttribute: jest.fn(function removeAttribute(name) {
    delete this.attributes[name];
  }),
  querySelector: jest.fn(selector => {
    if (selector === '.bolt-drive-picker__current-label') {
      return mockGlassSpeedPickerLabel;
    }
    if (selector === '.bolt-drive-picker__current-icon') {
      return mockGlassSpeedPickerIcon;
    }
    return null;
  }),
};

const mockGlassSpeedPickerList = {
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

const mockGlassSizePicker = {
  classList: createClassListMock(),
};

const mockGlassSizePickerLabel = { textContent: '' };
const mockGlassSizePickerIcon = { classList: createClassListMock() };

const mockGlassSizePickerButton = {
  disabled: false,
  attributes: {},
  classList: createClassListMock(),
  setAttribute: jest.fn(function setAttribute(name, value) {
    this.attributes[name] = value;
  }),
  removeAttribute: jest.fn(function removeAttribute(name) {
    delete this.attributes[name];
  }),
  querySelector: jest.fn(selector => {
    if (selector === '.bolt-drive-picker__current-label') {
      return mockGlassSizePickerLabel;
    }
    if (selector === '.bolt-drive-picker__current-icon') {
      return mockGlassSizePickerIcon;
    }
    return null;
  }),
};

const mockGlassSizePickerList = {
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

const mockGlassSpeedField = { classList: createClassListMock() };
const mockGlassSizeField = { classList: createClassListMock() };

jest.mock('../js/dom-elements.js', () => ({
  __esModule: true,
  elements: {
    fuseValueContainer: mockFuseValueContainer,
    fuseValueSelect: mockFuseValueSelect,
    fuseValuePickerList: mockFuseValuePickerList,
    fuseValuePickerButton: mockFuseValuePickerButton,
    fuseValuePicker: mockFuseValuePicker,
    glassOptionsContainer: mockGlassOptionsContainer,
    glassSpeedField: mockGlassSpeedField,
    glassSpeedPicker: mockGlassSpeedPicker,
    glassSpeedPickerButton: mockGlassSpeedPickerButton,
    glassSpeedPickerList: mockGlassSpeedPickerList,
    glassSpeedSelect: mockGlassSpeedSelect,
    glassSizeField: mockGlassSizeField,
    glassSizePicker: mockGlassSizePicker,
    glassSizePickerButton: mockGlassSizePickerButton,
    glassSizePickerList: mockGlassSizePickerList,
    glassSizeSelect: mockGlassSizeSelect,
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
let populateGlassSpeedOptions;
let populateGlassSizeOptions;
let setFuseTypeSelection;
let setGlassSpeedSelection;
let setGlassSizeSelection;
let syncFuseValuePicker;
let state;

beforeAll(async () => {
  ({
    populateFuseValues,
    populateGlassSpeedOptions,
    populateGlassSizeOptions,
    setFuseTypeSelection,
    setGlassSpeedSelection,
    setGlassSizeSelection,
    syncFuseValuePicker,
  } = await import('../js/forms.js'));
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
  mockGlassSpeedField.classList.toggle.mockClear();
  mockGlassSizeField.classList.toggle.mockClear();
  mockGlassSpeedSelect.value = '';
  mockGlassSpeedSelect.disabled = false;
  mockGlassSpeedSelect.options = cloneOptions(baseGlassSpeedOptions);
  mockGlassSizeSelect.value = '';
  mockGlassSizeSelect.options = cloneOptions(baseGlassSizeOptions);
  mockGlassSpeedPicker.classList.toggle.mockClear();
  mockGlassSizePicker.classList.toggle.mockClear();
  mockGlassSpeedPickerButton.disabled = false;
  mockGlassSpeedPickerButton.attributes = {};
  mockGlassSpeedPickerButton.classList.add.mockClear();
  mockGlassSpeedPickerButton.classList.remove.mockClear();
  mockGlassSpeedPickerButton.classList.toggle.mockClear();
  mockGlassSpeedPickerButton.setAttribute.mockClear();
  mockGlassSpeedPickerButton.removeAttribute.mockClear();
  mockGlassSpeedPickerButton.querySelector.mockClear();
  mockGlassSpeedPickerList.items = [];
  mockGlassSpeedPickerList.hidden = false;
  mockGlassSpeedPickerLabel.textContent = '';
  mockGlassSpeedPickerIcon.classList.add.mockClear();
  mockGlassSpeedPickerIcon.classList.remove.mockClear();
  mockGlassSpeedPickerIcon.classList.toggle.mockClear();
  mockGlassSizePickerButton.disabled = false;
  mockGlassSizePickerButton.attributes = {};
  mockGlassSizePickerButton.classList.add.mockClear();
  mockGlassSizePickerButton.classList.remove.mockClear();
  mockGlassSizePickerButton.classList.toggle.mockClear();
  mockGlassSizePickerButton.setAttribute.mockClear();
  mockGlassSizePickerButton.removeAttribute.mockClear();
  mockGlassSizePickerButton.querySelector.mockClear();
  mockGlassSizePickerList.items = [];
  mockGlassSizePickerList.hidden = false;
  mockGlassSizePickerLabel.textContent = '';
  mockGlassSizePickerIcon.classList.add.mockClear();
  mockGlassSizePickerIcon.classList.remove.mockClear();
  mockGlassSizePickerIcon.classList.toggle.mockClear();
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
    state.glassSpeed = 'Fast-blow';

    setFuseTypeSelection('Panel Mount Fuse Holder', { triggerUpdate: false });

    expect(mockGlassOptionsContainer.classList.toggle).toHaveBeenCalledWith('d-none', false);
    expect(mockGlassSpeedField.classList.toggle).toHaveBeenCalledWith('d-none', true);
    expect(mockGlassSizeField.classList.toggle).toHaveBeenCalledWith('d-none', false);
    expect(mockGlassSizeSelect.value).toBe('5 × 20 mm');
    expect(state.glassSpeed).toBe('');
    expect(mockGlassSpeedSelect.value).toBe('');
    expect(mockGlassSpeedSelect.disabled).toBe(true);
    expect(mockGlassSpeedPickerButton.disabled).toBe(true);
    expect(mockGlassSpeedPickerList.hidden).toBe(true);
  });

  it('hides and clears the glass options when switching to blade fuses', () => {
    state.fuseType = 'Panel Mount Fuse Holder';
    state.glassSize = '6.3 × 32 mm';
    mockGlassSizeSelect.value = state.glassSize;
    state.glassSpeed = 'Slow-blow';

    setFuseTypeSelection('Blade', { triggerUpdate: false });

    expect(mockGlassOptionsContainer.classList.toggle).toHaveBeenCalledWith('d-none', true);
    expect(state.glassSize).toBe('');
    expect(mockGlassSizeSelect.value).toBe('');
    expect(mockGlassSpeedField.classList.toggle).toHaveBeenCalledWith('d-none', true);
    expect(mockGlassSizeField.classList.toggle).toHaveBeenCalledWith('d-none', true);
    expect(state.glassSpeed).toBe('');
    expect(mockGlassSpeedSelect.value).toBe('');
    expect(mockGlassSpeedSelect.disabled).toBe(true);
    expect(mockGlassSpeedPickerButton.disabled).toBe(true);
  });

  it('restores fuse speed options when switching back to glass fuses', () => {
    setFuseTypeSelection('Panel Mount Fuse Holder', { triggerUpdate: false });
    state.glassSpeed = 'Slow-blow';

    setFuseTypeSelection('Glass', { triggerUpdate: false });

    expect(mockGlassSpeedField.classList.toggle).toHaveBeenLastCalledWith('d-none', false);
    expect(mockGlassSpeedSelect.disabled).toBe(false);
    expect(mockGlassSpeedSelect.value).toBe('Slow-blow');
    expect(mockGlassSpeedPickerButton.disabled).toBe(false);
  });
});

describe('glass fuse pickers', () => {
  it('includes the placeholder entry in the glass speed picker list', () => {
    populateGlassSpeedOptions();

    expect(mockGlassSpeedPickerList.items).toHaveLength(baseGlassSpeedOptions.length);
    const placeholderItem = mockGlassSpeedPickerList.items[0];
    expect(placeholderItem.dataset.value).toBe('');
    const labelSpan = placeholderItem.children.find(
      child => child.className === 'bolt-drive-picker__option-label',
    );
    expect(labelSpan && labelSpan.textContent).toBe(NBSP);
  });

  it('includes the placeholder entry in the glass size picker list', () => {
    populateGlassSizeOptions();

    expect(mockGlassSizePickerList.items).toHaveLength(baseGlassSizeOptions.length);
    const placeholderItem = mockGlassSizePickerList.items[0];
    expect(placeholderItem.dataset.value).toBe('');
    const labelSpan = placeholderItem.children.find(
      child => child.className === 'bolt-drive-picker__option-label',
    );
    expect(labelSpan && labelSpan.textContent).toBe(NBSP);
  });

  it('allows clearing the glass speed selection using the placeholder option', () => {
    populateGlassSpeedOptions();

    setGlassSpeedSelection('Slow-blow', { triggerUpdate: false });
    expect(state.glassSpeed).toBe('Slow-blow');
    expect(mockGlassSpeedPickerLabel.textContent).toBe('Slow-blow');

    const placeholderItem = mockGlassSpeedPickerList.items.find(item => item.dataset.value === '');
    expect(placeholderItem).toBeDefined();
    const placeholder = placeholderItem;

    mockGlassSpeedPickerIcon.classList.toggle.mockClear();
    placeholder.classList.toggle.mockClear();

    setGlassSpeedSelection('', { triggerUpdate: false });

    expect(state.glassSpeed).toBe('');
    expect(mockGlassSpeedPickerLabel.textContent).toBe(NBSP);
    expect(mockGlassSpeedPickerIcon.classList.toggle).toHaveBeenCalledWith('is-empty', true);
    expect(placeholder.attributes['aria-selected']).toBe('true');
    expect(placeholder.classList.toggle).toHaveBeenCalledWith('is-selected', true);
  });

  it('allows clearing the glass size selection using the placeholder option', () => {
    populateGlassSizeOptions();

    setGlassSizeSelection('5 × 20 mm', { triggerUpdate: false });
    expect(state.glassSize).toBe('5 × 20 mm');
    expect(mockGlassSizePickerLabel.textContent).toBe('5 × 20 mm');

    const placeholderItem = mockGlassSizePickerList.items.find(item => item.dataset.value === '');
    expect(placeholderItem).toBeDefined();
    const placeholder = placeholderItem;

    mockGlassSizePickerIcon.classList.toggle.mockClear();
    placeholder.classList.toggle.mockClear();

    setGlassSizeSelection('', { triggerUpdate: false });

    expect(state.glassSize).toBe('');
    expect(mockGlassSizePickerLabel.textContent).toBe(NBSP);
    expect(mockGlassSizePickerIcon.classList.toggle).toHaveBeenCalledWith('is-empty', true);
    expect(placeholder.attributes['aria-selected']).toBe('true');
    expect(placeholder.classList.toggle).toHaveBeenCalledWith('is-selected', true);
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
    const expectedImages = {
      IRLZ44N: 'images/mosfet/mosfet.svg',
      AO3400A: 'images/mosfet/mosfet_smd.svg',
      BS170: 'images/mosfet/mosfet.svg',
      IRF520: 'images/mosfet/mosfet.svg',
      FQP30N06L: 'images/mosfet/mosfet.svg',
    };

    const ids = mosfetPartOptions.map(option => option.id).sort();
    expect(ids).toEqual(Object.keys(expectedImages).sort());

    mosfetPartOptions.forEach(option => {
      expect(option.image).toBe(expectedImages[option.id]);
    });
  });
});
