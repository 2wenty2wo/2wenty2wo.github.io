import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
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

jest.mock('../js/dom-elements.js', () => ({
  __esModule: true,
  elements: {
    fuseValueSelect: mockFuseValueSelect,
    fuseValuePickerList: mockFuseValuePickerList,
    fuseValuePickerButton: mockFuseValuePickerButton,
    fuseValuePicker: mockFuseValuePicker,
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
let state;

beforeAll(async () => {
  ({ populateFuseValues } = await import('../js/forms.js'));
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
  mockFuseValuePicker.classList.contains.mockReturnValue(false);
  mockFuseValuePicker.classList.remove.mockClear();
  mockFuseValuePicker.classList.toggle.mockClear();
  state.fuseValue = '';
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

describe('MOSFET option data', () => {
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
