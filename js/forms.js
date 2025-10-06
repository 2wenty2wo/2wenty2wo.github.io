import { state, standardFilterState } from './state.js';
import { elements } from './dom-elements.js';
import {
  fuseValues,
  fuseTypeOptions,
  switchTypeOptions,
  bearingOptions,
  boltHeadOptions,
  boltDriveOptions,
  screwTypeOptions,
  nutTypeOptions,
  washerTypeOptions,
  hardwareCatalog,
  hardwareImageFolders,
  hardwareTypeImageMap,
  connectorCatalog,
  STANDARD_PLACEHOLDER_TEXT,
  CONNECTOR_PLACEHOLDER_TEXT,
  findConnectorCategory,
  electricalComponentTypes,
  componentImageMap,
  componentMountOptions,
  resistorValueOptions,
  capacitorValueOptions,
  diodeValueOptions,
  mosfetChannelOptions,
  mosfetPartOptions,
  potentiometerValueOptions,
  potentiometerTaperOptions,
  connectorCategoryImageMap,
  getConnectorSeriesImage,
} from './data.js';
import { updatePreview, updateDownloadState } from './render.js';
import {
  loadIconsForStyle,
  filterIcons,
  normalizeIconStyle,
  findIcon,
  loadIconSvg,
} from './fontawesome-icons.js';
import {
  populateThreadSizes,
  syncThreadSizePicker,
  setThreadSizeSelection,
} from './threadSizes.js';

const {
  threadSizeContainer,
  threadLengthRow,
  lengthContainer,
  lengthInput,
  lengthInputWrapper,
  lengthInputIcon,
  fuseSelectionRow,
  fuseTypeContainer,
  fuseTypeSelect,
  fuseTypePicker,
  fuseTypePickerButton,
  fuseTypePickerList,
  fuseValueContainer,
  glassOptionsContainer,
  glassSpeedOptionsContainer,
  fuseValueSelect,
  fuseValuePicker,
  fuseValuePickerButton,
  fuseValuePickerList,
  glassSizeSelect,
  glassSlowBlowCheckbox,
  glassFastBlowCheckbox,
  notesInput,
  nutTypeContainer,
  nutTypePicker,
  nutTypePickerButton,
  nutTypePickerList,
  nutTypeSelect,
  washerTypeContainer,
  washerTypePicker,
  washerTypePickerButton,
  washerTypePickerList,
  washerTypeSelect,
  switchSelectionRow,
  switchTypeContainer,
  switchTypePicker,
  switchTypePickerButton,
  switchTypePickerList,
  switchTypeSelect,
  measurementSystemContainer,
  connectorCategoryContainer,
  connectorCategorySelect,
  connectorCategoryPicker,
  connectorCategoryPickerButton,
  connectorCategoryPickerList,
  connectorCategoryHelp,
  connectorNotesHint,
  componentCategoryContainer,
  componentMountContainer,
  componentMountPicker,
  componentMountPickerButton,
  componentMountPickerList,
  componentMountSelect,
  resistorValueField,
  resistorValuePicker,
  resistorValuePickerButton,
  resistorValuePickerList,
  resistorValueSelect,
  capacitorValueField,
  capacitorValuePicker,
  capacitorValuePickerButton,
  capacitorValuePickerList,
  capacitorValueSelect,
  diodeValueField,
  diodeValuePicker,
  diodeValuePickerButton,
  diodeValuePickerList,
  diodeValueSelect,
  mosfetChannelField,
  mosfetChannelPicker,
  mosfetChannelPickerButton,
  mosfetChannelPickerList,
  mosfetChannelSelect,
  mosfetPartField,
  mosfetPartPicker,
  mosfetPartPickerButton,
  mosfetPartPickerList,
  mosfetPartSelect,
  potentiometerValueField,
  potentiometerValuePicker,
  potentiometerValuePickerButton,
  potentiometerValuePickerList,
  potentiometerValueSelect,
  potentiometerTaperField,
  potentiometerTaperPicker,
  potentiometerTaperPickerButton,
  potentiometerTaperPickerList,
  potentiometerTaperSelect,
  bearingOptionsContainer,
  bearingTypePicker,
  bearingTypePickerButton,
  bearingTypePickerList,
  bearingTypeSelect,
  customFieldsContainer,
  customGraphicSourceRadios,
  customImageFields,
  customImageInput,
  customImageClearButton,
  customImageNameDisplay,
  customIconFields,
  customIconSearchInput,
  customIconSelect,
  customIconPicker,
  customIconPickerButton,
  customIconPickerList,
  customIconStatus,
  customIconPreview,
  customPartFields,
  customPartPicker,
  customPartPickerButton,
  customPartPickerList,
  customPartSelect,
  customPartStatus,
  notesField,
  standardField,
  boltStandardGroup,
  connectorSeriesPicker,
  connectorSeriesPickerButton,
  connectorSeriesPickerList,
  boltHeadLabel,
  boltHeadPicker,
  boltHeadPickerButton,
  boltHeadPickerList,
  boltDrivePicker,
  boltDrivePickerButton,
  boltDrivePickerList,
  boltHeadSelect,
  boltDriveSelect,
  notesLabel,
  defaultNotesLabel,
  defaultNotesPlaceholder,
  standardSelect,
  standardLabel,
  defaultStandardLabel,
  hardwareTypeRadios,
  hardwareTypeSelect,
  hardwareTypePicker,
  hardwareTypePickerButton,
  hardwareTypePickerDialog,
  hardwareTypePickerFallback,
  hardwareTypePickerSurface,
  hardwareTypePickerSearch,
  hardwareTypePickerFilters,
  hardwareTypePickerRecentSection,
  hardwareTypePickerRecent,
  hardwareTypePickerList,
  hardwareTypePickerEmpty,
  hardwareTypeOptions,
  systemTypeRadios,
  componentCategoryRadios,
} = elements;

const PLACEHOLDER_BLANK = '\u00a0';
// Non-breaking space keeps custom pickers aligned without displaying placeholder copy.
const HARDWARE_TYPE_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;
const CUSTOM_PART_TYPE_VALUE = 'Custom';
const CUSTOM_PART_TYPE_ICON_CLASS = 'fa-pen-to-square';
const HARDWARE_TYPE_ALL_FILTER = 'All';
const HARDWARE_TYPE_DEFAULT_CATEGORY = 'Uncategorized';
const HARDWARE_TYPE_RECENT_STORAGE_KEY = 'gridfinity.recentHardwareTypes';
const HARDWARE_TYPE_RECENT_LIMIT = 5;
const PART_TYPE_PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"%3E%3Crect width="80" height="80" rx="14" fill="%23e2e8f0"/%3E%3Cpath fill="%2394a3b8" d="M24 26h32v8H24zm0 16h32v8H24zm0 16h32v8H24z"/%3E%3C/svg%3E';
const hardwareTypeOptionRecords = new Map();
const hardwareTypeFilterButtons = new Map();
let customIconAssetRequestId = 0;
const hardwareTypeFilterState = {
  category: HARDWARE_TYPE_ALL_FILTER,
  query: '',
};
let hardwareTypeCategories = [];
let hardwareTypeRecentValues = [];
let hardwareTypeSelectListenerAttached = false;
let hardwareTypeDialogMode = 'dialog';
const BOLT_DRIVE_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;
const BOLT_HEAD_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;
const SCREW_TYPE_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;
const validBoltDriveIds = new Set(boltDriveOptions.map(option => option.id));
const validBoltHeadIds = new Set(
  boltHeadOptions.concat(screwTypeOptions).map(option => option.id),
);
const NUT_TYPE_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;
const validNutTypeIds = new Set(nutTypeOptions.map(option => option.id));
const CUSTOM_GRAPHIC_SOURCES = new Set(['image', 'icon', 'parts']);
const DEFAULT_CUSTOM_GRAPHIC_SOURCE = 'image';
const DEFAULT_ICON_STYLE = 'solid';
const CUSTOM_ICON_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;
const FONT_AWESOME_STYLE_CLASSES = {
  solid: 'fa-solid',
  regular: 'fa-regular',
  brands: 'fa-brands',
};
let customIconRequestId = 0;
let lastIconCollection = { style: '', total: 0 };
const CUSTOM_PART_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;
const partGraphicOptions = Object.entries(hardwareTypeImageMap)
  .map(([id, src]) => ({ id, label: id, image: src }))
  .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
const validCustomPartIds = new Set(partGraphicOptions.map(option => option.id));
const WASHER_TYPE_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;
const validWasherTypeIds = new Set(washerTypeOptions.map(option => option.id));
const SWITCH_TYPE_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;
const validSwitchTypeIds = new Set(switchTypeOptions.map(option => option.id));
const switchTypeMap = new Map(switchTypeOptions.map(option => [option.id, option]));
const FUSE_TYPE_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;
const DEFAULT_FUSE_TYPE = 'Glass';
const PANEL_MOUNT_FUSE_HOLDER_TYPE = 'Panel Mount Fuse Holder';
const CARTRIDGE_FUSE_TYPES = new Set(['Glass', 'Ceramic', PANEL_MOUNT_FUSE_HOLDER_TYPE]);
const FUSE_TYPES_WITHOUT_AMPS = new Set([PANEL_MOUNT_FUSE_HOLDER_TYPE]);
const validFuseTypeIds = new Set(fuseTypeOptions.map(option => option.id));
const FUSE_VALUE_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;
const validFuseValuesSet = new Set(fuseValues.map(value => String(value)));
const ELECTRICAL_COMPONENT_TYPES = new Set(electricalComponentTypes);

function syncThreadLengthInputIcon(nextType) {
  if (!lengthInputWrapper || !lengthInputIcon) {
    return;
  }
  const type = typeof nextType === 'string' ? nextType.trim() : state.hardwareType;
  const shouldShowIcon = type === 'Bolt' || type === 'Screw';
  if (!shouldShowIcon) {
    lengthInputIcon.hidden = true;
    lengthInputIcon.removeAttribute('src');
    lengthInputIcon.removeAttribute('data-hardware-type');
    lengthInputWrapper.classList.remove('has-icon');
    return;
  }

  const folder = hardwareImageFolders[type];
  if (!folder) {
    lengthInputIcon.hidden = true;
    lengthInputIcon.removeAttribute('src');
    lengthInputIcon.removeAttribute('data-hardware-type');
    lengthInputWrapper.classList.remove('has-icon');
    return;
  }

  const currentType = lengthInputIcon.dataset.hardwareType || '';
  if (currentType !== type) {
    lengthInputIcon.src = `images/${folder}/thread_length.svg`;
    lengthInputIcon.dataset.hardwareType = type;
  }

  lengthInputIcon.hidden = false;
  lengthInputWrapper.classList.add('has-icon');
}
const COMPONENT_MOUNT_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;
const validComponentMounts = new Set(componentMountOptions.map(option => option.id));
const RESISTOR_VALUE_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;
const validResistorValues = new Set(resistorValueOptions.map(option => option.id));
const CAPACITOR_VALUE_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;
const validCapacitorValues = new Set(capacitorValueOptions.map(option => option.id));
const DIODE_VALUE_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;
const validDiodeValues = new Set(diodeValueOptions.map(option => option.id));
const MOSFET_CHANNEL_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;
const validMosfetChannels = new Set(mosfetChannelOptions.map(option => option.id));
const MOSFET_PART_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;
const validMosfetParts = new Set(mosfetPartOptions.map(option => option.id));
const POTENTIOMETER_VALUE_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;
const validPotentiometerValues = new Set(
  potentiometerValueOptions.map(option => option.id),
);
const POTENTIOMETER_TAPER_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;
const validPotentiometerTapers = new Set(
  potentiometerTaperOptions.map(option => option.id),
);
const BEARING_TYPE_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;
const validBearingCodes = new Set(bearingOptions.map(option => option.code));
const CONNECTOR_CATEGORY_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;
const CONNECTOR_SERIES_PLACEHOLDER_TEXT = CONNECTOR_PLACEHOLDER_TEXT;
const validConnectorCategoryIds = new Set(connectorCatalog.map(category => category.id));

function getFastenerHeadOptions() {
  return state.hardwareType === 'Screw' ? screwTypeOptions : boltHeadOptions;
}

function getFastenerHeadPlaceholder() {
  return state.hardwareType === 'Screw'
    ? SCREW_TYPE_PLACEHOLDER_TEXT
    : BOLT_HEAD_PLACEHOLDER_TEXT;
}

function getFastenerHeadImagePath(option) {
  if (!option || !option.image) {
    return '';
  }
  const basePath = state.hardwareType === 'Screw' ? 'images/screws' : 'images/bolts/head';
  return `${basePath}/${option.image}.svg`;
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function getOptionCategory(optionElement) {
  if (!optionElement) {
    return HARDWARE_TYPE_DEFAULT_CATEGORY;
  }
  const rawCategory = optionElement.dataset.cat;
  if (typeof rawCategory === 'string' && rawCategory.trim()) {
    return rawCategory.trim();
  }
  const parent = optionElement.parentElement;
  if (parent instanceof HTMLOptGroupElement && parent.label) {
    return parent.label.trim() || HARDWARE_TYPE_DEFAULT_CATEGORY;
  }
  return HARDWARE_TYPE_DEFAULT_CATEGORY;
}

function getOptionImage(optionElement) {
  if (!optionElement) {
    return '';
  }
  const rawImage = optionElement.dataset.img;
  if (typeof rawImage === 'string' && rawImage.trim()) {
    return rawImage.trim();
  }
  return hardwareTypeImageMap[optionElement.value] || '';
}

function createPartTypeCard(record, { variant = 'grid' } = {}) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'part-type-card';
  if (variant === 'recent') {
    card.classList.add('part-type-card--recent');
  }
  card.dataset.value = record.value;
  card.dataset.category = record.category;
  card.dataset.label = record.normalizedLabel;
  card.dataset.variant = variant;
  card.dataset.hardwareTypeOption = 'true';
  card.dataset.hasCustomImage = record.hasCustomImage ? 'true' : 'false';
  card.setAttribute('role', 'option');
  card.setAttribute('aria-selected', 'false');
  card.tabIndex = -1;

  const thumb = document.createElement('span');
  thumb.className = 'part-type-card__thumb';

  if (record.image) {
    const image = document.createElement('img');
    image.className = 'part-type-card__image';
    image.alt = '';
    image.decoding = 'async';
    image.loading = 'lazy';
    image.src = record.image;
    thumb.appendChild(image);
  }

  if (record.icon) {
    const icon = document.createElement('i');
    icon.className = `part-type-card__icon fa-solid ${record.icon}`;
    icon.setAttribute('aria-hidden', 'true');
    thumb.appendChild(icon);
  }

  const label = document.createElement('span');
  label.className = 'part-type-card__label';
  label.textContent = record.label;

  card.appendChild(thumb);
  card.appendChild(label);

  return card;
}

function loadHardwareTypeRecentValues() {
  try {
    const stored = localStorage.getItem(HARDWARE_TYPE_RECENT_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map(value => (typeof value === 'string' ? value.trim() : ''))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function saveHardwareTypeRecentValues(values) {
  try {
    if (!Array.isArray(values) || values.length === 0) {
      localStorage.removeItem(HARDWARE_TYPE_RECENT_STORAGE_KEY);
      return;
    }
    localStorage.setItem(HARDWARE_TYPE_RECENT_STORAGE_KEY, JSON.stringify(values));
  } catch {
    // Ignore storage failures.
  }
}

function updateHardwareTypeRecentUi() {
  if (!hardwareTypePickerRecentSection || !hardwareTypePickerRecent) {
    return;
  }

  hardwareTypePickerRecent.innerHTML = '';
  hardwareTypeOptionRecords.forEach(record => {
    record.recentElement = null;
  });

  const sanitizedValues = hardwareTypeRecentValues.filter(value =>
    hardwareTypeOptionRecords.has(value),
  );
  const limitedValues = sanitizedValues.slice(0, HARDWARE_TYPE_RECENT_LIMIT);
  hardwareTypeRecentValues = limitedValues;

  limitedValues.forEach(value => {
    const record = hardwareTypeOptionRecords.get(value);
    if (!record) {
      return;
    }
    const recentCard = createPartTypeCard(record, { variant: 'recent' });
    record.recentElement = recentCard;
    hardwareTypePickerRecent.appendChild(recentCard);
  });

  const hasRecent = hardwareTypePickerRecent.children.length > 0;
  hardwareTypePickerRecentSection.hidden = !hasRecent;

  if (sanitizedValues.length !== limitedValues.length) {
    saveHardwareTypeRecentValues(hardwareTypeRecentValues);
  }
}

function setHardwareTypeOptionVisibility(record, isVisible) {
  const shouldHide = !isVisible;
  if (record.mainElement) {
    record.mainElement.classList.toggle('is-hidden', shouldHide);
    record.mainElement.toggleAttribute('hidden', shouldHide);
  }
  if (record.recentElement) {
    record.recentElement.classList.toggle('is-hidden', shouldHide);
    record.recentElement.toggleAttribute('hidden', shouldHide);
  }
}

function updateHardwareTypeOptionTabState() {
  if (!hardwareTypePicker) {
    return;
  }
  const optionElements = Array.from(
    hardwareTypePicker.querySelectorAll('[data-hardware-type-option="true"]'),
  );
  let firstVisible = null;
  optionElements.forEach(optionElement => {
    const hidden =
      optionElement.hasAttribute('hidden') || optionElement.classList.contains('is-hidden');
    if (!hidden && !firstVisible) {
      firstVisible = optionElement;
    }
    optionElement.tabIndex = -1;
  });
  if (firstVisible) {
    firstVisible.tabIndex = 0;
  }
}

function applyHardwareTypeFilters() {
  const categoryFilter = hardwareTypeFilterState.category.toLowerCase();
  const queryFilter = hardwareTypeFilterState.query;
  let visibleCount = 0;

  hardwareTypeOptionRecords.forEach(record => {
    const matchesCategory =
      categoryFilter === HARDWARE_TYPE_ALL_FILTER.toLowerCase() ||
      record.normalizedCategory === categoryFilter;
    const matchesQuery = !queryFilter || record.normalizedLabel.includes(queryFilter);
    const isVisible = matchesCategory && matchesQuery;

    setHardwareTypeOptionVisibility(record, isVisible);
    if (isVisible) {
      visibleCount += 1;
    }
  });

  if (hardwareTypePickerEmpty) {
    hardwareTypePickerEmpty.hidden = visibleCount > 0;
  }

  if (hardwareTypePickerRecentSection && hardwareTypePickerRecent) {
    const hasVisibleRecent = Array.from(hardwareTypePickerRecent.children).some(element => {
      if (!(element instanceof HTMLElement)) {
        return false;
      }
      return !element.hasAttribute('hidden') && !element.classList.contains('is-hidden');
    });
    hardwareTypePickerRecentSection.hidden = !hasVisibleRecent;
  }

  updateHardwareTypeOptionTabState();

  return visibleCount;
}

function renderHardwareTypeFilterChips() {
  if (!hardwareTypePickerFilters) {
    return;
  }

  hardwareTypePickerFilters.innerHTML = '';
  hardwareTypeFilterButtons.clear();

  const categories = [HARDWARE_TYPE_ALL_FILTER, ...hardwareTypeCategories];
  categories.forEach(category => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'part-type-picker__filter';
    button.textContent = category;
    button.dataset.category = category;
    const isActive = category === hardwareTypeFilterState.category;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    hardwareTypePickerFilters.appendChild(button);
    hardwareTypeFilterButtons.set(category.toLowerCase(), button);
  });
}

function rememberHardwareTypeSelection(value) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed || !hardwareTypeOptionRecords.has(trimmed)) {
    return;
  }

  const existingIndex = hardwareTypeRecentValues.indexOf(trimmed);
  if (existingIndex !== -1) {
    hardwareTypeRecentValues.splice(existingIndex, 1);
  }
  hardwareTypeRecentValues.unshift(trimmed);
  if (hardwareTypeRecentValues.length > HARDWARE_TYPE_RECENT_LIMIT) {
    hardwareTypeRecentValues = hardwareTypeRecentValues.slice(0, HARDWARE_TYPE_RECENT_LIMIT);
  }
  saveHardwareTypeRecentValues(hardwareTypeRecentValues);
  updateHardwareTypeRecentUi();
  applyHardwareTypeFilters();
}

function setupHardwareTypeDialogMode() {
  if (!hardwareTypePicker) {
    return;
  }

  hardwareTypeDialogMode = 'dialog';
  if (hardwareTypePickerDialog && typeof hardwareTypePickerDialog.showModal === 'function') {
    hardwareTypePicker.dataset.dialogMode = 'dialog';
    hardwareTypePickerDialog.setAttribute('aria-modal', 'true');
    return;
  }

  if (hardwareTypePickerFallback && hardwareTypePickerSurface) {
    if (!hardwareTypePickerFallback.contains(hardwareTypePickerSurface)) {
      hardwareTypePickerFallback.appendChild(hardwareTypePickerSurface);
    }
    hardwareTypePickerFallback.setAttribute('role', 'dialog');
    hardwareTypePickerFallback.setAttribute('aria-modal', 'true');
    hardwareTypePickerFallback.setAttribute('aria-labelledby', 'hardware-type-picker-title');
    hardwareTypePickerFallback.hidden = true;
    hardwareTypePicker.dataset.dialogMode = 'overlay';
    hardwareTypeDialogMode = 'overlay';
  }
}

function handleHardwareTypeSelectChangeForRecents() {
  if (!hardwareTypeSelect) {
    return;
  }
  rememberHardwareTypeSelection(hardwareTypeSelect.value);
}

export function getHardwareTypePickerMode() {
  return hardwareTypeDialogMode;
}

export function setHardwareTypeFilterCategory(nextCategory) {
  const normalized = normalizeText(nextCategory);
  let resolvedCategory = HARDWARE_TYPE_ALL_FILTER;
  if (normalized && normalized !== HARDWARE_TYPE_ALL_FILTER.toLowerCase()) {
    const match = hardwareTypeCategories.find(
      category => category.toLowerCase() === normalized,
    );
    if (match) {
      resolvedCategory = match;
    }
  }
  hardwareTypeFilterState.category = resolvedCategory;

  hardwareTypeFilterButtons.forEach((button, key) => {
    const isActive = key === resolvedCategory.toLowerCase();
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  applyHardwareTypeFilters();
}

export function setHardwareTypeSearchQuery(nextQuery) {
  hardwareTypeFilterState.query = normalizeText(nextQuery);
  applyHardwareTypeFilters();
}

export function populateHardwareTypePicker() {
  if (!hardwareTypePickerList || !hardwareTypeSelect) {
    return;
  }

  hardwareTypeSelect.classList.add('visually-hidden');

  hardwareTypeOptionRecords.clear();
  hardwareTypeFilterButtons.clear();
  hardwareTypePickerList.innerHTML = '';
  if (hardwareTypePickerRecent) {
    hardwareTypePickerRecent.innerHTML = '';
  }
  if (hardwareTypePickerFilters) {
    hardwareTypePickerFilters.innerHTML = '';
  }

  const optionElements = Array.from(hardwareTypeSelect.querySelectorAll('option'));
  const categorySet = new Set();

  optionElements.forEach(option => {
    if (!(option instanceof HTMLOptionElement)) {
      return;
    }
    const value = option.value.trim();
    if (!value) {
      return;
    }

    const label = option.textContent.trim() || value;
    const category = getOptionCategory(option);
    const normalizedCategory = normalizeText(category);
    const rawImage = getOptionImage(option);

    const isCustomOption = value === CUSTOM_PART_TYPE_VALUE;

    const record = {
      value,
      label,
      normalizedLabel: normalizeText(label),
      category,
      normalizedCategory,
      image: rawImage || (isCustomOption ? '' : PART_TYPE_PLACEHOLDER_IMAGE),
      icon: isCustomOption ? CUSTOM_PART_TYPE_ICON_CLASS : '',
      hasCustomImage: Boolean(rawImage),
      mainElement: null,
      recentElement: null,
    };

    const card = createPartTypeCard(record, { variant: 'grid' });
    record.mainElement = card;
    hardwareTypePickerList.appendChild(card);
    hardwareTypeOptionRecords.set(value, record);
    categorySet.add(category);
  });

  hardwareTypeCategories = Array.from(categorySet).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  );

  hardwareTypeFilterState.category = HARDWARE_TYPE_ALL_FILTER;
  hardwareTypeFilterState.query = '';
  if (hardwareTypePickerSearch) {
    hardwareTypePickerSearch.value = '';
  }

  renderHardwareTypeFilterChips();

  hardwareTypeRecentValues = loadHardwareTypeRecentValues();
  updateHardwareTypeRecentUi();

  applyHardwareTypeFilters();
  setupHardwareTypeDialogMode();

  if (hardwareTypePickerButton) {
    hardwareTypePickerButton.disabled = false;
    hardwareTypePickerButton.setAttribute('aria-expanded', 'false');
  }

  if (!hardwareTypeSelectListenerAttached) {
    hardwareTypeSelect.addEventListener('change', handleHardwareTypeSelectChangeForRecents);
    hardwareTypeSelectListenerAttached = true;
  }

  syncHardwareTypePicker();
}

function getCustomPartOption(partId) {
  if (!partId) {
    return null;
  }
  return partGraphicOptions.find(option => option.id === partId) || null;
}

export function populateCustomPartPicker() {
  if (!customPartSelect) {
    return;
  }

  customPartSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = CUSTOM_PART_PLACEHOLDER_TEXT;
  customPartSelect.appendChild(placeholder);

  partGraphicOptions.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.id;
    opt.textContent = option.label;
    opt.dataset.image = option.image || '';
    customPartSelect.appendChild(opt);
  });

  if (customPartPickerList) {
    customPartPickerList.innerHTML = '';
    partGraphicOptions.forEach(option => {
      const item = document.createElement('li');
      item.className = 'bolt-drive-picker__option';
      item.dataset.value = option.id;
      item.dataset.label = option.label;
      item.dataset.image = option.image || '';
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', 'false');
      item.tabIndex = -1;

      const iconWrapper = document.createElement('span');
      iconWrapper.className = option.image
        ? 'bolt-drive-picker__option-icon'
        : 'bolt-drive-picker__option-icon is-empty';
      iconWrapper.setAttribute('aria-hidden', 'true');

      if (option.image) {
        const img = document.createElement('img');
        img.className = 'bolt-drive-picker__option-icon-image';
        img.src = option.image;
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        iconWrapper.appendChild(img);
      }

      const label = document.createElement('span');
      label.className = 'bolt-drive-picker__option-label';
      label.textContent = option.label;

      item.appendChild(iconWrapper);
      item.appendChild(label);
      customPartPickerList.appendChild(item);
    });
  }

  if (customPartPickerButton) {
    customPartPickerButton.disabled = partGraphicOptions.length === 0;
    customPartPickerButton.setAttribute('aria-expanded', 'false');
  }

  syncCustomPartPicker({ isValid: true });
}

export function syncCustomPartPicker({ isValid = true } = {}) {
  if (!customPartSelect) {
    return;
  }

  const currentValue = typeof state.customPartId === 'string' ? state.customPartId : '';
  const sanitizedValue = validCustomPartIds.has(currentValue) ? currentValue : '';
  if (sanitizedValue !== currentValue) {
    state.customPartId = sanitizedValue;
  }

  customPartSelect.value = sanitizedValue;
  if (!sanitizedValue && customPartSelect.options.length > 0) {
    customPartSelect.selectedIndex = 0;
  }

  const selectedOption = getCustomPartOption(sanitizedValue);

  if (customPartPickerButton) {
    const label = customPartPickerButton.querySelector('.bolt-drive-picker__current-label');
    const iconWrapper = customPartPickerButton.querySelector('.bolt-drive-picker__current-icon');
    const iconImage = customPartPickerButton.querySelector('.bolt-drive-picker__current-icon-image');

    if (label) {
      label.textContent = selectedOption ? selectedOption.label : CUSTOM_PART_PLACEHOLDER_TEXT;
    }

    if (iconWrapper && iconImage) {
      if (selectedOption && selectedOption.image) {
        iconImage.src = selectedOption.image;
        iconImage.hidden = false;
        iconWrapper.classList.remove('is-empty');
      } else {
        iconImage.hidden = true;
        iconImage.removeAttribute('src');
        iconWrapper.classList.add('is-empty');
      }
    }

    if (isValid) {
      customPartPickerButton.classList.remove('is-invalid');
      customPartPickerButton.removeAttribute('aria-invalid');
    } else {
      customPartPickerButton.classList.add('is-invalid');
      customPartPickerButton.setAttribute('aria-invalid', 'true');
    }
  }

  if (customPartPicker) {
    customPartPicker.classList.toggle('is-invalid', !isValid);
  }

  if (customPartPickerList) {
    const items = Array.from(customPartPickerList.querySelectorAll('[role="option"]'));
    items.forEach(item => {
      const isSelected = item.dataset.value === sanitizedValue;
      item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      item.classList.toggle('is-selected', isSelected);
      item.tabIndex = -1;
    });
  }

  if (customPartStatus) {
    if (selectedOption) {
      customPartStatus.textContent = `${selectedOption.label} icon selected.`;
      customPartStatus.classList.remove('text-danger');
    } else {
      customPartStatus.textContent = 'No built-in part icon selected.';
      customPartStatus.classList.remove('text-danger');
    }
  }
}

export function setCustomPartSelection(nextId, { triggerUpdate = true } = {}) {
  const desiredValue = typeof nextId === 'string' ? nextId.trim() : '';
  const sanitizedValue = validCustomPartIds.has(desiredValue) ? desiredValue : '';
  const previousValue = typeof state.customPartId === 'string' ? state.customPartId : '';

  state.customPartId = sanitizedValue;
  if (sanitizedValue) {
    state.customGraphicSource = 'parts';
  }
  syncCustomPartPicker({ isValid: true });
  applyCustomGraphicInfoDisplay();
  updateCustomImageUi();

  if (triggerUpdate && previousValue !== sanitizedValue) {
    updatePreview();
    updateDownloadState();
  }
}

function resolveComponentMountImage(mountId) {
  if (typeof mountId !== 'string' || !mountId) {
    return '';
  }
  const categoryKey = (state.componentCategory || state.hardwareType || '').trim();
  const imageGroup = componentImageMap[categoryKey] || componentImageMap[state.hardwareType] || null;
  if (!imageGroup) {
    return '';
  }
  if (imageGroup[mountId]) {
    return imageGroup[mountId];
  }
  const normalized = mountId.toLowerCase();
  return (
    imageGroup[normalized] ||
    imageGroup[normalized.replace(/\s+/g, '')] ||
    imageGroup[normalized.replace(/[-\s]+/g, '_')] ||
    imageGroup.default ||
    ''
  );
}

function refreshComponentMountPickerIcons() {
  if (!componentMountPickerList) {
    return;
  }
  const items = Array.from(componentMountPickerList.querySelectorAll('[role="option"]'));
  items.forEach(item => {
    const value = item.dataset.value || '';
    const iconWrapper = item.querySelector('.bolt-drive-picker__option-icon');
    if (!iconWrapper) {
      return;
    }
    let iconImage = iconWrapper.querySelector('img');
    const imageSrc = resolveComponentMountImage(value);
    if (imageSrc) {
      if (!iconImage) {
        iconImage = document.createElement('img');
        iconImage.className = 'bolt-drive-picker__option-icon-image';
        iconImage.alt = '';
        iconImage.loading = 'lazy';
        iconImage.decoding = 'async';
        iconWrapper.appendChild(iconImage);
      }
      iconWrapper.classList.remove('is-empty');
      iconImage.src = imageSrc;
      iconImage.hidden = false;
    } else {
      if (iconImage) {
        iconImage.hidden = true;
        iconImage.removeAttribute('src');
      }
      iconWrapper.classList.add('is-empty');
    }
  });
}

function createComponentMountPickerOption(option) {
  if (!componentMountPickerList) {
    return;
  }
  const item = document.createElement('li');
  item.className = 'bolt-drive-picker__option';
  item.dataset.value = option.id;
  item.setAttribute('role', 'option');
  item.setAttribute('aria-selected', 'false');
  item.tabIndex = -1;

  const icon = document.createElement('span');
  icon.className = 'bolt-drive-picker__option-icon';
  const imageSrc = resolveComponentMountImage(option.id);
  if (imageSrc) {
    const image = document.createElement('img');
    image.className = 'bolt-drive-picker__option-icon-image';
    image.src = imageSrc;
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';
    icon.appendChild(image);
  } else {
    icon.classList.add('is-empty');
  }

  const label = document.createElement('span');
  label.className = 'bolt-drive-picker__option-label';
  label.textContent = option.label;

  item.appendChild(icon);
  item.appendChild(label);

  componentMountPickerList.appendChild(item);
}

export function populateComponentMountPicker() {
  if (!componentMountSelect) {
    return;
  }

  const previousValue = typeof state.componentMount === 'string' ? state.componentMount : '';

  componentMountSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = COMPONENT_MOUNT_PLACEHOLDER_TEXT;
  componentMountSelect.appendChild(placeholder);

  componentMountOptions.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.id;
    opt.textContent = option.label;
    componentMountSelect.appendChild(opt);
  });

  const sanitizedValue = validComponentMounts.has(previousValue)
    ? previousValue
    : 'Through-Hole';
  state.componentMount = sanitizedValue;
  componentMountSelect.value = sanitizedValue;

  if (componentMountPickerList) {
    componentMountPickerList.innerHTML = '';
    componentMountOptions.forEach(option => {
      createComponentMountPickerOption(option);
    });
    componentMountPickerList.hidden = true;
  }

  if (componentMountPickerButton) {
    componentMountPickerButton.disabled = false;
    componentMountPickerButton.setAttribute('aria-expanded', 'false');
  }

  refreshComponentMountPickerIcons();
  syncComponentMountPicker({ isValid: true });
}

export function syncComponentMountPicker({ isValid = true } = {}) {
  if (!componentMountSelect) {
    return;
  }

  const currentValue = typeof state.componentMount === 'string' ? state.componentMount : '';
  const sanitizedValue = validComponentMounts.has(currentValue) ? currentValue : '';
  if (sanitizedValue !== currentValue) {
    state.componentMount = sanitizedValue;
  }

  componentMountSelect.value = sanitizedValue;
  if (!sanitizedValue && componentMountSelect.options.length > 0) {
    componentMountSelect.selectedIndex = 0;
  }

  const selectedOption = sanitizedValue
    ? componentMountOptions.find(option => option.id === sanitizedValue) || null
    : null;
  const imageSrc = resolveComponentMountImage(sanitizedValue);

  if (componentMountPickerButton) {
    const label = componentMountPickerButton.querySelector('.bolt-drive-picker__current-label');
    const iconWrapper = componentMountPickerButton.querySelector('.bolt-drive-picker__current-icon');
    const iconImage = componentMountPickerButton.querySelector('.bolt-drive-picker__current-icon-image');

    if (label) {
      label.textContent = selectedOption ? selectedOption.label : COMPONENT_MOUNT_PLACEHOLDER_TEXT;
    }

    if (iconWrapper && iconImage) {
      if (imageSrc) {
        iconImage.src = imageSrc;
        iconImage.hidden = false;
        iconWrapper.classList.remove('is-empty');
      } else {
        iconImage.hidden = true;
        iconImage.removeAttribute('src');
        iconWrapper.classList.add('is-empty');
      }
    }

    if (isValid) {
      componentMountPickerButton.classList.remove('is-invalid');
      componentMountPickerButton.removeAttribute('aria-invalid');
    } else {
      componentMountPickerButton.classList.add('is-invalid');
      componentMountPickerButton.setAttribute('aria-invalid', 'true');
    }
  }

  if (componentMountPicker) {
    componentMountPicker.classList.toggle('is-invalid', !isValid);
  }

  if (componentMountPickerList) {
    const optionElements = Array.from(
      componentMountPickerList.querySelectorAll('[role="option"]'),
    );
    optionElements.forEach(optionElement => {
      const isSelected = optionElement.dataset.value === sanitizedValue;
      optionElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      optionElement.classList.toggle('is-selected', isSelected);
      optionElement.tabIndex = -1;
    });
    refreshComponentMountPickerIcons();
  }
}

export function setComponentMountSelection(nextValue, { triggerUpdate = true } = {}) {
  const desiredValue = typeof nextValue === 'string' ? nextValue.trim() : '';
  const sanitizedValue = validComponentMounts.has(desiredValue) ? desiredValue : '';
  const previousValue = typeof state.componentMount === 'string' ? state.componentMount : '';

  state.componentMount = sanitizedValue || '';
  syncComponentMountPicker({ isValid: true });

  if (triggerUpdate && previousValue !== sanitizedValue) {
    updateDownloadState();
    updatePreview();
  }
}

export function populateResistorValues() {
  if (!resistorValueSelect) {
    return;
  }

  const previousValue = typeof state.resistorValue === 'string' ? state.resistorValue : '';

  resistorValueSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = RESISTOR_VALUE_PLACEHOLDER_TEXT;
  resistorValueSelect.appendChild(placeholder);

  resistorValueOptions.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.id;
    opt.textContent = option.label;
    resistorValueSelect.appendChild(opt);
  });

  const sanitizedValue = validResistorValues.has(previousValue) ? previousValue : '';
  state.resistorValue = sanitizedValue;
  resistorValueSelect.value = sanitizedValue;

  if (resistorValuePickerList) {
    resistorValuePickerList.innerHTML = '';
    resistorValueOptions.forEach(option => {
      const item = document.createElement('li');
      item.className = 'bolt-drive-picker__option';
      item.dataset.value = option.id;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', 'false');
      item.tabIndex = -1;

      const icon = document.createElement('span');
      icon.className = 'bolt-drive-picker__option-icon is-empty';
      icon.setAttribute('aria-hidden', 'true');
      item.appendChild(icon);

      const label = document.createElement('span');
      label.className = 'bolt-drive-picker__option-label';
      label.textContent = option.label;
      item.appendChild(label);

      resistorValuePickerList.appendChild(item);
    });
    resistorValuePickerList.hidden = true;
  }

  if (resistorValuePickerButton) {
    resistorValuePickerButton.setAttribute('aria-expanded', 'false');
  }

  syncResistorValuePicker({ isValid: true });
  updateComponentValueUi({ resetIfHidden: false });
}

export function updateComponentValueUi({ resetIfHidden = true } = {}) {
  const showComponentFields = ELECTRICAL_COMPONENT_TYPES.has(state.hardwareType);
  const category = (state.componentCategory || state.hardwareType || '').trim();
  const showResistorValues = showComponentFields && category === 'Resistor';
  const showCapacitorValues = showComponentFields && category === 'Capacitor';
  const showDiodeValues = showComponentFields && category === 'Diode';
  const showMosfetChannels = showComponentFields && category === 'MOSFET';
  const showMosfetParts = showMosfetChannels;
  const showPotentiometerValues = showComponentFields && category === 'Potentiometer';
  const showPotentiometerTaper = showPotentiometerValues;

  if (resistorValueField) {
    resistorValueField.classList.toggle('d-none', !showResistorValues);
    resistorValueField.setAttribute('aria-hidden', showResistorValues ? 'false' : 'true');
  }

  if (resistorValueSelect) {
    resistorValueSelect.disabled = !showResistorValues;
  }

  if (resistorValuePickerButton) {
    resistorValuePickerButton.disabled = !showResistorValues;
    const isOpen = Boolean(
      showResistorValues &&
        resistorValuePicker &&
        resistorValuePicker.classList.contains('is-open'),
    );
    resistorValuePickerButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  if (resistorValuePickerList) {
    const shouldHideList =
      !showResistorValues ||
      !resistorValuePicker ||
      !resistorValuePicker.classList.contains('is-open');
    resistorValuePickerList.hidden = shouldHideList;
  }

  if (resistorValuePicker) {
    if (!showResistorValues) {
      resistorValuePicker.classList.remove('is-open');
      document.dispatchEvent(new CustomEvent('gridfinity:component-picker-close'));
    }
    resistorValuePicker.classList.toggle('is-disabled', !showResistorValues);
  }

  if (!showResistorValues && resetIfHidden) {
    state.resistorValue = '';
  }

  if (capacitorValueField) {
    capacitorValueField.classList.toggle('d-none', !showCapacitorValues);
    capacitorValueField.setAttribute('aria-hidden', showCapacitorValues ? 'false' : 'true');
  }

  if (capacitorValueSelect) {
    capacitorValueSelect.disabled = !showCapacitorValues;
  }

  if (capacitorValuePickerButton) {
    capacitorValuePickerButton.disabled = !showCapacitorValues;
    const isOpen = Boolean(
      showCapacitorValues &&
        capacitorValuePicker &&
        capacitorValuePicker.classList.contains('is-open'),
    );
    capacitorValuePickerButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  if (capacitorValuePickerList) {
    const shouldHideList =
      !showCapacitorValues ||
      !capacitorValuePicker ||
      !capacitorValuePicker.classList.contains('is-open');
    capacitorValuePickerList.hidden = shouldHideList;
  }

  if (capacitorValuePicker) {
    if (!showCapacitorValues) {
      capacitorValuePicker.classList.remove('is-open');
      document.dispatchEvent(new CustomEvent('gridfinity:component-picker-close'));
    }
    capacitorValuePicker.classList.toggle('is-disabled', !showCapacitorValues);
  }

  if (!showCapacitorValues && resetIfHidden) {
    state.capacitorValue = '';
  }

  if (diodeValueField) {
    diodeValueField.classList.toggle('d-none', !showDiodeValues);
    diodeValueField.setAttribute('aria-hidden', showDiodeValues ? 'false' : 'true');
  }

  if (diodeValueSelect) {
    diodeValueSelect.disabled = !showDiodeValues;
  }

  if (diodeValuePickerButton) {
    diodeValuePickerButton.disabled = !showDiodeValues;
    const isOpen = Boolean(
      showDiodeValues && diodeValuePicker && diodeValuePicker.classList.contains('is-open'),
    );
    diodeValuePickerButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  if (diodeValuePickerList) {
    const shouldHideList =
      !showDiodeValues || !diodeValuePicker || !diodeValuePicker.classList.contains('is-open');
    diodeValuePickerList.hidden = shouldHideList;
  }

  if (diodeValuePicker) {
    if (!showDiodeValues) {
      diodeValuePicker.classList.remove('is-open');
      document.dispatchEvent(new CustomEvent('gridfinity:component-picker-close'));
    }
    diodeValuePicker.classList.toggle('is-disabled', !showDiodeValues);
  }

  if (!showDiodeValues && resetIfHidden) {
    state.diodeValue = '';
  }

  if (mosfetChannelField) {
    mosfetChannelField.classList.toggle('d-none', !showMosfetChannels);
    mosfetChannelField.setAttribute('aria-hidden', showMosfetChannels ? 'false' : 'true');
  }

  if (mosfetChannelSelect) {
    mosfetChannelSelect.disabled = !showMosfetChannels;
  }

  if (mosfetChannelPickerButton) {
    mosfetChannelPickerButton.disabled = !showMosfetChannels;
    const isOpen = Boolean(
      showMosfetChannels &&
        mosfetChannelPicker &&
        mosfetChannelPicker.classList.contains('is-open'),
    );
    mosfetChannelPickerButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  if (mosfetChannelPickerList) {
    const shouldHideList =
      !showMosfetChannels ||
      !mosfetChannelPicker ||
      !mosfetChannelPicker.classList.contains('is-open');
    mosfetChannelPickerList.hidden = shouldHideList;
  }

  if (mosfetChannelPicker) {
    if (!showMosfetChannels) {
      mosfetChannelPicker.classList.remove('is-open');
      document.dispatchEvent(new CustomEvent('gridfinity:component-picker-close'));
    }
    mosfetChannelPicker.classList.toggle('is-disabled', !showMosfetChannels);
  }

  if (!showMosfetChannels && resetIfHidden) {
    state.mosfetChannel = '';
  }

  if (mosfetPartField) {
    mosfetPartField.classList.toggle('d-none', !showMosfetParts);
    mosfetPartField.setAttribute('aria-hidden', showMosfetParts ? 'false' : 'true');
  }

  if (mosfetPartSelect) {
    mosfetPartSelect.disabled = !showMosfetParts;
  }

  if (mosfetPartPickerButton) {
    mosfetPartPickerButton.disabled = !showMosfetParts;
    const isOpen = Boolean(
      showMosfetParts && mosfetPartPicker && mosfetPartPicker.classList.contains('is-open'),
    );
    mosfetPartPickerButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  if (mosfetPartPickerList) {
    const shouldHideList =
      !showMosfetParts || !mosfetPartPicker || !mosfetPartPicker.classList.contains('is-open');
    mosfetPartPickerList.hidden = shouldHideList;
  }

  if (mosfetPartPicker) {
    if (!showMosfetParts) {
      mosfetPartPicker.classList.remove('is-open');
      document.dispatchEvent(new CustomEvent('gridfinity:component-picker-close'));
    }
    mosfetPartPicker.classList.toggle('is-disabled', !showMosfetParts);
  }

  if (!showMosfetParts && resetIfHidden) {
    state.mosfetPart = '';
  }

  if (potentiometerValueField) {
    potentiometerValueField.classList.toggle('d-none', !showPotentiometerValues);
    potentiometerValueField.setAttribute('aria-hidden', showPotentiometerValues ? 'false' : 'true');
  }

  if (potentiometerValueSelect) {
    potentiometerValueSelect.disabled = !showPotentiometerValues;
  }

  if (potentiometerValuePickerButton) {
    potentiometerValuePickerButton.disabled = !showPotentiometerValues;
    const isOpen = Boolean(
      showPotentiometerValues &&
        potentiometerValuePicker &&
        potentiometerValuePicker.classList.contains('is-open'),
    );
    potentiometerValuePickerButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  if (potentiometerValuePickerList) {
    const shouldHideList =
      !showPotentiometerValues ||
      !potentiometerValuePicker ||
      !potentiometerValuePicker.classList.contains('is-open');
    potentiometerValuePickerList.hidden = shouldHideList;
  }

  if (potentiometerValuePicker) {
    if (!showPotentiometerValues) {
      potentiometerValuePicker.classList.remove('is-open');
      document.dispatchEvent(new CustomEvent('gridfinity:component-picker-close'));
    }
    potentiometerValuePicker.classList.toggle('is-disabled', !showPotentiometerValues);
  }

  if (!showPotentiometerValues && resetIfHidden) {
    state.potentiometerValue = '';
  }

  if (potentiometerTaperField) {
    potentiometerTaperField.classList.toggle('d-none', !showPotentiometerTaper);
    potentiometerTaperField.setAttribute('aria-hidden', showPotentiometerTaper ? 'false' : 'true');
  }

  if (potentiometerTaperSelect) {
    potentiometerTaperSelect.disabled = !showPotentiometerTaper;
  }

  if (potentiometerTaperPickerButton) {
    potentiometerTaperPickerButton.disabled = !showPotentiometerTaper;
    const isOpen = Boolean(
      showPotentiometerTaper &&
        potentiometerTaperPicker &&
        potentiometerTaperPicker.classList.contains('is-open'),
    );
    potentiometerTaperPickerButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  if (potentiometerTaperPickerList) {
    const shouldHideList =
      !showPotentiometerTaper ||
      !potentiometerTaperPicker ||
      !potentiometerTaperPicker.classList.contains('is-open');
    potentiometerTaperPickerList.hidden = shouldHideList;
  }

  if (potentiometerTaperPicker) {
    if (!showPotentiometerTaper) {
      potentiometerTaperPicker.classList.remove('is-open');
      document.dispatchEvent(new CustomEvent('gridfinity:component-picker-close'));
    }
    potentiometerTaperPicker.classList.toggle('is-disabled', !showPotentiometerTaper);
  }

  if (!showPotentiometerTaper && resetIfHidden) {
    state.potentiometerTaper = '';
  }

  refreshComponentMountPickerIcons();
  syncComponentMountPicker({ isValid: true });
  syncResistorValuePicker({ isValid: true });
  syncCapacitorValuePicker({ isValid: true });
  syncDiodeValuePicker({ isValid: true });
  syncPotentiometerValuePicker({ isValid: true });
  syncPotentiometerTaperPicker({ isValid: true });
}

export function syncResistorValuePicker({ isValid = true } = {}) {
  if (!resistorValueSelect) {
    return;
  }

  const currentValue = typeof state.resistorValue === 'string' ? state.resistorValue : '';
  const sanitizedValue = validResistorValues.has(currentValue) ? currentValue : '';
  if (sanitizedValue !== currentValue) {
    state.resistorValue = sanitizedValue;
  }

  resistorValueSelect.value = sanitizedValue;
  if (!sanitizedValue && resistorValueSelect.options.length > 0) {
    resistorValueSelect.selectedIndex = 0;
  }

  if (resistorValuePickerButton) {
    const label = resistorValuePickerButton.querySelector('.bolt-drive-picker__current-label');
    if (label) {
      label.textContent = sanitizedValue ? sanitizedValue : RESISTOR_VALUE_PLACEHOLDER_TEXT;
    }

    if (isValid) {
      resistorValuePickerButton.classList.remove('is-invalid');
      resistorValuePickerButton.removeAttribute('aria-invalid');
    } else {
      resistorValuePickerButton.classList.add('is-invalid');
      resistorValuePickerButton.setAttribute('aria-invalid', 'true');
    }
  }

  if (resistorValuePicker) {
    resistorValuePicker.classList.toggle('is-invalid', !isValid);
  }

  if (resistorValuePickerList) {
    const optionElements = Array.from(
      resistorValuePickerList.querySelectorAll('[role="option"]'),
    );
    optionElements.forEach(optionElement => {
      const isSelected = optionElement.dataset.value === sanitizedValue;
      optionElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      optionElement.classList.toggle('is-selected', isSelected);
      optionElement.tabIndex = -1;
    });
  }
}

export function setResistorValueSelection(nextValue, { triggerUpdate = true } = {}) {
  const desiredValue = typeof nextValue === 'string' ? nextValue.trim() : '';
  const sanitizedValue = validResistorValues.has(desiredValue) ? desiredValue : '';
  const previousValue = typeof state.resistorValue === 'string' ? state.resistorValue : '';

  state.resistorValue = sanitizedValue;
  syncResistorValuePicker({ isValid: true });

  if (triggerUpdate && previousValue !== sanitizedValue) {
    updateDownloadState();
    updatePreview();
  }
}

export function populateCapacitorValues() {
  if (!capacitorValueSelect) {
    return;
  }

  const previousValue = typeof state.capacitorValue === 'string' ? state.capacitorValue : '';

  capacitorValueSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = CAPACITOR_VALUE_PLACEHOLDER_TEXT;
  capacitorValueSelect.appendChild(placeholder);

  capacitorValueOptions.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.id;
    opt.textContent = option.label;
    capacitorValueSelect.appendChild(opt);
  });

  const sanitizedValue = validCapacitorValues.has(previousValue) ? previousValue : '';
  state.capacitorValue = sanitizedValue;
  capacitorValueSelect.value = sanitizedValue;

  if (capacitorValuePickerList) {
    capacitorValuePickerList.innerHTML = '';
    capacitorValueOptions.forEach(option => {
      const item = document.createElement('li');
      item.className = 'bolt-drive-picker__option';
      item.dataset.value = option.id;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', 'false');
      item.tabIndex = -1;

      const icon = document.createElement('span');
      icon.className = 'bolt-drive-picker__option-icon is-empty';
      icon.setAttribute('aria-hidden', 'true');
      item.appendChild(icon);

      const label = document.createElement('span');
      label.className = 'bolt-drive-picker__option-label';
      label.textContent = option.label;
      item.appendChild(label);

      capacitorValuePickerList.appendChild(item);
    });
    capacitorValuePickerList.hidden = true;
  }

  if (capacitorValuePickerButton) {
    capacitorValuePickerButton.setAttribute('aria-expanded', 'false');
  }

  syncCapacitorValuePicker({ isValid: true });
  updateComponentValueUi({ resetIfHidden: false });
}

export function populateDiodeValues() {
  if (!diodeValueSelect) {
    return;
  }

  const previousValue = typeof state.diodeValue === 'string' ? state.diodeValue : '';

  diodeValueSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = DIODE_VALUE_PLACEHOLDER_TEXT;
  diodeValueSelect.appendChild(placeholder);

  diodeValueOptions.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.id;
    opt.textContent = option.label;
    diodeValueSelect.appendChild(opt);
  });

  const sanitizedValue = validDiodeValues.has(previousValue) ? previousValue : '';
  state.diodeValue = sanitizedValue;
  diodeValueSelect.value = sanitizedValue;

  if (diodeValuePickerList) {
    diodeValuePickerList.innerHTML = '';
    diodeValueOptions.forEach(option => {
      const item = document.createElement('li');
      item.className = 'bolt-drive-picker__option';
      item.dataset.value = option.id;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', 'false');
      item.tabIndex = -1;

      const icon = document.createElement('span');
      icon.className = 'bolt-drive-picker__option-icon is-empty';
      icon.setAttribute('aria-hidden', 'true');
      item.appendChild(icon);

      const label = document.createElement('span');
      label.className = 'bolt-drive-picker__option-label';
      label.textContent = option.label;
      item.appendChild(label);

      diodeValuePickerList.appendChild(item);
    });
    diodeValuePickerList.hidden = true;
  }

  if (diodeValuePickerButton) {
    diodeValuePickerButton.setAttribute('aria-expanded', 'false');
  }

  syncDiodeValuePicker({ isValid: true });
  updateComponentValueUi({ resetIfHidden: false });
}

export function populateMosfetChannels() {
  if (!mosfetChannelSelect) {
    return;
  }

  const previousValue =
    typeof state.mosfetChannel === 'string' ? state.mosfetChannel : '';

  mosfetChannelSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = MOSFET_CHANNEL_PLACEHOLDER_TEXT;
  mosfetChannelSelect.appendChild(placeholder);

  mosfetChannelOptions.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.id;
    opt.textContent = option.label;
    mosfetChannelSelect.appendChild(opt);
  });

  const sanitizedValue = validMosfetChannels.has(previousValue) ? previousValue : '';
  state.mosfetChannel = sanitizedValue;
  mosfetChannelSelect.value = sanitizedValue;

  if (mosfetChannelPickerList) {
    mosfetChannelPickerList.innerHTML = '';
    mosfetChannelOptions.forEach(option => {
      const item = document.createElement('li');
      item.className = 'bolt-drive-picker__option';
      item.dataset.value = option.id;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', 'false');
      item.tabIndex = -1;

      const icon = document.createElement('span');
      icon.className = 'bolt-drive-picker__option-icon';
      icon.setAttribute('aria-hidden', 'true');
      const imageSrc = option.image || '';
      if (imageSrc) {
        const image = document.createElement('img');
        image.className = 'bolt-drive-picker__option-icon-image';
        image.src = imageSrc;
        image.alt = '';
        image.loading = 'lazy';
        image.decoding = 'async';
        icon.appendChild(image);
      } else {
        icon.classList.add('is-empty');
      }
      item.appendChild(icon);

      const label = document.createElement('span');
      label.className = 'bolt-drive-picker__option-label';
      label.textContent = option.label;
      item.appendChild(label);

      mosfetChannelPickerList.appendChild(item);
    });
    mosfetChannelPickerList.hidden = true;
  }

  if (mosfetChannelPickerButton) {
    mosfetChannelPickerButton.setAttribute('aria-expanded', 'false');
  }

  syncMosfetChannelPicker({ isValid: true });
  updateComponentValueUi({ resetIfHidden: false });
}

export function populateMosfetParts() {
  if (!mosfetPartSelect) {
    return;
  }

  const previousValue = typeof state.mosfetPart === 'string' ? state.mosfetPart : '';

  mosfetPartSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = MOSFET_PART_PLACEHOLDER_TEXT;
  mosfetPartSelect.appendChild(placeholder);

  mosfetPartOptions.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.id;
    opt.textContent = option.label;
    mosfetPartSelect.appendChild(opt);
  });

  const sanitizedValue = validMosfetParts.has(previousValue) ? previousValue : '';
  state.mosfetPart = sanitizedValue;
  mosfetPartSelect.value = sanitizedValue;

  if (mosfetPartPickerList) {
    mosfetPartPickerList.innerHTML = '';
    mosfetPartOptions.forEach(option => {
      const item = document.createElement('li');
      item.className = 'bolt-drive-picker__option';
      item.dataset.value = option.id;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', 'false');
      item.tabIndex = -1;

      const icon = document.createElement('span');
      icon.className = 'bolt-drive-picker__option-icon';
      icon.setAttribute('aria-hidden', 'true');
      const imageSrc = option.image || '';
      if (imageSrc) {
        const image = document.createElement('img');
        image.className = 'bolt-drive-picker__option-icon-image';
        image.src = imageSrc;
        image.alt = '';
        image.loading = 'lazy';
        image.decoding = 'async';
        icon.appendChild(image);
      } else {
        icon.classList.add('is-empty');
      }
      item.appendChild(icon);

      const label = document.createElement('span');
      label.className = 'bolt-drive-picker__option-label';
      label.textContent = option.label;
      item.appendChild(label);

      mosfetPartPickerList.appendChild(item);
    });
    mosfetPartPickerList.hidden = true;
  }

  if (mosfetPartPickerButton) {
    mosfetPartPickerButton.setAttribute('aria-expanded', 'false');
  }

  syncMosfetPartPicker({ isValid: true });
  updateComponentValueUi({ resetIfHidden: false });
}

export function syncCapacitorValuePicker({ isValid = true } = {}) {
  if (!capacitorValueSelect) {
    return;
  }

  const currentValue = typeof state.capacitorValue === 'string' ? state.capacitorValue : '';
  const sanitizedValue = validCapacitorValues.has(currentValue) ? currentValue : '';
  if (sanitizedValue !== currentValue) {
    state.capacitorValue = sanitizedValue;
  }

  capacitorValueSelect.value = sanitizedValue;
  if (!sanitizedValue && capacitorValueSelect.options.length > 0) {
    capacitorValueSelect.selectedIndex = 0;
  }

  if (capacitorValuePickerButton) {
    const label = capacitorValuePickerButton.querySelector('.bolt-drive-picker__current-label');
    if (label) {
      label.textContent = sanitizedValue ? sanitizedValue : CAPACITOR_VALUE_PLACEHOLDER_TEXT;
    }

    if (isValid) {
      capacitorValuePickerButton.classList.remove('is-invalid');
      capacitorValuePickerButton.removeAttribute('aria-invalid');
    } else {
      capacitorValuePickerButton.classList.add('is-invalid');
      capacitorValuePickerButton.setAttribute('aria-invalid', 'true');
    }
  }

  if (capacitorValuePicker) {
    capacitorValuePicker.classList.toggle('is-invalid', !isValid);
  }

  if (capacitorValuePickerList) {
    const optionElements = Array.from(
      capacitorValuePickerList.querySelectorAll('[role="option"]'),
    );
    optionElements.forEach(optionElement => {
      const isSelected = optionElement.dataset.value === sanitizedValue;
      optionElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      optionElement.classList.toggle('is-selected', isSelected);
      optionElement.tabIndex = -1;
    });
  }
}

export function setCapacitorValueSelection(nextValue, { triggerUpdate = true } = {}) {
  const desiredValue = typeof nextValue === 'string' ? nextValue.trim() : '';
  const sanitizedValue = validCapacitorValues.has(desiredValue) ? desiredValue : '';
  const previousValue = typeof state.capacitorValue === 'string' ? state.capacitorValue : '';

  state.capacitorValue = sanitizedValue;
  syncCapacitorValuePicker({ isValid: true });

  if (triggerUpdate && previousValue !== sanitizedValue) {
    updateDownloadState();
    updatePreview();
  }
}

export function syncDiodeValuePicker({ isValid = true } = {}) {
  if (!diodeValueSelect) {
    return;
  }

  const currentValue = typeof state.diodeValue === 'string' ? state.diodeValue : '';
  const sanitizedValue = validDiodeValues.has(currentValue) ? currentValue : '';
  if (sanitizedValue !== currentValue) {
    state.diodeValue = sanitizedValue;
  }

  diodeValueSelect.value = sanitizedValue;
  if (!sanitizedValue && diodeValueSelect.options.length > 0) {
    diodeValueSelect.selectedIndex = 0;
  }

  if (diodeValuePickerButton) {
    const label = diodeValuePickerButton.querySelector('.bolt-drive-picker__current-label');
    if (label) {
      label.textContent = sanitizedValue ? sanitizedValue : DIODE_VALUE_PLACEHOLDER_TEXT;
    }

    if (isValid) {
      diodeValuePickerButton.classList.remove('is-invalid');
      diodeValuePickerButton.removeAttribute('aria-invalid');
    } else {
      diodeValuePickerButton.classList.add('is-invalid');
      diodeValuePickerButton.setAttribute('aria-invalid', 'true');
    }
  }

  if (diodeValuePicker) {
    diodeValuePicker.classList.toggle('is-invalid', !isValid);
  }

  if (diodeValuePickerList) {
    const optionElements = Array.from(
      diodeValuePickerList.querySelectorAll('[role="option"]'),
    );
    optionElements.forEach(optionElement => {
      const isSelected = optionElement.dataset.value === sanitizedValue;
      optionElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      optionElement.classList.toggle('is-selected', isSelected);
      optionElement.tabIndex = -1;
    });
  }
}

export function setDiodeValueSelection(nextValue, { triggerUpdate = true } = {}) {
  const desiredValue = typeof nextValue === 'string' ? nextValue.trim() : '';
  const sanitizedValue = validDiodeValues.has(desiredValue) ? desiredValue : '';
  const previousValue = typeof state.diodeValue === 'string' ? state.diodeValue : '';

  state.diodeValue = sanitizedValue;
  syncDiodeValuePicker({ isValid: true });

  if (triggerUpdate && previousValue !== sanitizedValue) {
    updateDownloadState();
    updatePreview();
  }
}

export function syncMosfetChannelPicker({ isValid = true } = {}) {
  if (!mosfetChannelSelect) {
    return;
  }

  const currentValue = typeof state.mosfetChannel === 'string' ? state.mosfetChannel : '';
  const sanitizedValue = validMosfetChannels.has(currentValue) ? currentValue : '';
  if (sanitizedValue !== currentValue) {
    state.mosfetChannel = sanitizedValue;
  }

  mosfetChannelSelect.value = sanitizedValue;
  if (!sanitizedValue && mosfetChannelSelect.options.length > 0) {
    mosfetChannelSelect.selectedIndex = 0;
  }

  const selectedOption = mosfetChannelOptions.find(option => option.id === sanitizedValue);
  const imageSrc = selectedOption && selectedOption.image ? selectedOption.image : '';

  if (mosfetChannelPickerButton) {
    const label = mosfetChannelPickerButton.querySelector('.bolt-drive-picker__current-label');
    const iconWrapper = mosfetChannelPickerButton.querySelector('.bolt-drive-picker__current-icon');
    let iconImage = iconWrapper
      ? iconWrapper.querySelector('.bolt-drive-picker__current-icon-image')
      : null;

    if (label) {
      label.textContent = sanitizedValue
        ? selectedOption?.label || sanitizedValue
        : MOSFET_CHANNEL_PLACEHOLDER_TEXT;
    }

    if (iconWrapper) {
      if (imageSrc) {
        if (!iconImage) {
          iconImage = document.createElement('img');
          iconImage.className = 'bolt-drive-picker__current-icon-image';
          iconImage.alt = '';
          iconImage.loading = 'lazy';
          iconImage.decoding = 'async';
          iconWrapper.appendChild(iconImage);
        }
        iconWrapper.classList.remove('is-empty');
        iconImage.src = imageSrc;
        iconImage.hidden = false;
      } else {
        if (iconImage) {
          iconImage.hidden = true;
          iconImage.removeAttribute('src');
        }
        iconWrapper.classList.add('is-empty');
      }
    }

    if (isValid) {
      mosfetChannelPickerButton.classList.remove('is-invalid');
      mosfetChannelPickerButton.removeAttribute('aria-invalid');
    } else {
      mosfetChannelPickerButton.classList.add('is-invalid');
      mosfetChannelPickerButton.setAttribute('aria-invalid', 'true');
    }
  }

  if (mosfetChannelPicker) {
    mosfetChannelPicker.classList.toggle('is-invalid', !isValid);
  }

  if (mosfetChannelPickerList) {
    const optionElements = Array.from(
      mosfetChannelPickerList.querySelectorAll('[role="option"]'),
    );
    optionElements.forEach(optionElement => {
      const isSelected = optionElement.dataset.value === sanitizedValue;
      optionElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      optionElement.classList.toggle('is-selected', isSelected);
      optionElement.tabIndex = -1;
    });
  }
}

export function setMosfetChannelSelection(nextValue, { triggerUpdate = true } = {}) {
  const desiredValue = typeof nextValue === 'string' ? nextValue.trim() : '';
  const sanitizedValue = validMosfetChannels.has(desiredValue) ? desiredValue : '';
  const previousValue = typeof state.mosfetChannel === 'string' ? state.mosfetChannel : '';

  state.mosfetChannel = sanitizedValue;
  syncMosfetChannelPicker({ isValid: true });

  if (triggerUpdate && previousValue !== sanitizedValue) {
    updateDownloadState();
    updatePreview();
  }
}

export function syncMosfetPartPicker({ isValid = true } = {}) {
  if (!mosfetPartSelect) {
    return;
  }

  const currentValue = typeof state.mosfetPart === 'string' ? state.mosfetPart : '';
  const sanitizedValue = validMosfetParts.has(currentValue) ? currentValue : '';
  if (sanitizedValue !== currentValue) {
    state.mosfetPart = sanitizedValue;
  }

  mosfetPartSelect.value = sanitizedValue;
  if (!sanitizedValue && mosfetPartSelect.options.length > 0) {
    mosfetPartSelect.selectedIndex = 0;
  }

  const selectedOption = mosfetPartOptions.find(option => option.id === sanitizedValue);
  const imageSrc = selectedOption && selectedOption.image ? selectedOption.image : '';

  if (mosfetPartPickerButton) {
    const label = mosfetPartPickerButton.querySelector('.bolt-drive-picker__current-label');
    const iconWrapper = mosfetPartPickerButton.querySelector('.bolt-drive-picker__current-icon');
    let iconImage = iconWrapper
      ? iconWrapper.querySelector('.bolt-drive-picker__current-icon-image')
      : null;

    if (label) {
      label.textContent = sanitizedValue
        ? selectedOption?.label || sanitizedValue
        : MOSFET_PART_PLACEHOLDER_TEXT;
    }

    if (iconWrapper) {
      if (imageSrc) {
        if (!iconImage) {
          iconImage = document.createElement('img');
          iconImage.className = 'bolt-drive-picker__current-icon-image';
          iconImage.alt = '';
          iconImage.loading = 'lazy';
          iconImage.decoding = 'async';
          iconWrapper.appendChild(iconImage);
        }
        iconWrapper.classList.remove('is-empty');
        iconImage.src = imageSrc;
        iconImage.hidden = false;
      } else {
        if (iconImage) {
          iconImage.hidden = true;
          iconImage.removeAttribute('src');
        }
        iconWrapper.classList.add('is-empty');
      }
    }

    if (isValid) {
      mosfetPartPickerButton.classList.remove('is-invalid');
      mosfetPartPickerButton.removeAttribute('aria-invalid');
    } else {
      mosfetPartPickerButton.classList.add('is-invalid');
      mosfetPartPickerButton.setAttribute('aria-invalid', 'true');
    }
  }

  if (mosfetPartPicker) {
    mosfetPartPicker.classList.toggle('is-invalid', !isValid);
  }

  if (mosfetPartPickerList) {
    const optionElements = Array.from(mosfetPartPickerList.querySelectorAll('[role="option"]'));
    optionElements.forEach(optionElement => {
      const isSelected = optionElement.dataset.value === sanitizedValue;
      optionElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      optionElement.classList.toggle('is-selected', isSelected);
      optionElement.tabIndex = -1;
    });
  }
}

export function setMosfetPartSelection(nextValue, { triggerUpdate = true } = {}) {
  const desiredValue = typeof nextValue === 'string' ? nextValue.trim() : '';
  const sanitizedValue = validMosfetParts.has(desiredValue) ? desiredValue : '';
  const previousValue = typeof state.mosfetPart === 'string' ? state.mosfetPart : '';

  state.mosfetPart = sanitizedValue;
  syncMosfetPartPicker({ isValid: true });

  if (triggerUpdate && previousValue !== sanitizedValue) {
    updateDownloadState();
    updatePreview();
  }
}

export function populatePotentiometerValues() {
  if (!potentiometerValueSelect) {
    return;
  }

  const previousValue =
    typeof state.potentiometerValue === 'string' ? state.potentiometerValue : '';

  potentiometerValueSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = POTENTIOMETER_VALUE_PLACEHOLDER_TEXT;
  potentiometerValueSelect.appendChild(placeholder);

  potentiometerValueOptions.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.id;
    opt.textContent = option.label;
    potentiometerValueSelect.appendChild(opt);
  });

  const sanitizedValue = validPotentiometerValues.has(previousValue) ? previousValue : '';
  state.potentiometerValue = sanitizedValue;
  potentiometerValueSelect.value = sanitizedValue;

  if (potentiometerValuePickerList) {
    potentiometerValuePickerList.innerHTML = '';
    potentiometerValueOptions.forEach(option => {
      const item = document.createElement('li');
      item.className = 'bolt-drive-picker__option';
      item.dataset.value = option.id;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', 'false');
      item.tabIndex = -1;

      const icon = document.createElement('span');
      icon.className = 'bolt-drive-picker__option-icon';
      icon.setAttribute('aria-hidden', 'true');
      const imageSrc = option.image || '';
      if (imageSrc) {
        const image = document.createElement('img');
        image.className = 'bolt-drive-picker__option-icon-image';
        image.src = imageSrc;
        image.alt = '';
        image.loading = 'lazy';
        image.decoding = 'async';
        icon.appendChild(image);
      } else {
        icon.classList.add('is-empty');
      }
      item.appendChild(icon);

      const label = document.createElement('span');
      label.className = 'bolt-drive-picker__option-label';
      label.textContent = option.label;
      item.appendChild(label);

      potentiometerValuePickerList.appendChild(item);
    });
    potentiometerValuePickerList.hidden = true;
  }

  if (potentiometerValuePickerButton) {
    potentiometerValuePickerButton.setAttribute('aria-expanded', 'false');
  }

  syncPotentiometerValuePicker({ isValid: true });
  updateComponentValueUi({ resetIfHidden: false });
}

export function populatePotentiometerTapers() {
  if (!potentiometerTaperSelect) {
    return;
  }

  const previousValue =
    typeof state.potentiometerTaper === 'string' ? state.potentiometerTaper : '';

  potentiometerTaperSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = POTENTIOMETER_TAPER_PLACEHOLDER_TEXT;
  potentiometerTaperSelect.appendChild(placeholder);

  potentiometerTaperOptions.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.id;
    opt.textContent = option.label;
    potentiometerTaperSelect.appendChild(opt);
  });

  const sanitizedValue = validPotentiometerTapers.has(previousValue) ? previousValue : '';
  state.potentiometerTaper = sanitizedValue;
  potentiometerTaperSelect.value = sanitizedValue;

  if (potentiometerTaperPickerList) {
    potentiometerTaperPickerList.innerHTML = '';
    potentiometerTaperOptions.forEach(option => {
      const item = document.createElement('li');
      item.className = 'bolt-drive-picker__option';
      item.dataset.value = option.id;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', 'false');
      item.tabIndex = -1;

      const icon = document.createElement('span');
      icon.className = 'bolt-drive-picker__option-icon';
      icon.setAttribute('aria-hidden', 'true');
      const imageSrc = option.image || '';
      if (imageSrc) {
        const image = document.createElement('img');
        image.className = 'bolt-drive-picker__option-icon-image';
        image.src = imageSrc;
        image.alt = '';
        image.loading = 'lazy';
        image.decoding = 'async';
        icon.appendChild(image);
      } else {
        icon.classList.add('is-empty');
      }
      item.appendChild(icon);

      const label = document.createElement('span');
      label.className = 'bolt-drive-picker__option-label';
      label.textContent = option.label;
      item.appendChild(label);

      potentiometerTaperPickerList.appendChild(item);
    });
    potentiometerTaperPickerList.hidden = true;
  }

  if (potentiometerTaperPickerButton) {
    potentiometerTaperPickerButton.setAttribute('aria-expanded', 'false');
  }

  syncPotentiometerTaperPicker({ isValid: true });
  updateComponentValueUi({ resetIfHidden: false });
}

export function syncPotentiometerValuePicker({ isValid = true } = {}) {
  if (!potentiometerValueSelect) {
    return;
  }

  const currentValue =
    typeof state.potentiometerValue === 'string' ? state.potentiometerValue : '';
  const sanitizedValue = validPotentiometerValues.has(currentValue) ? currentValue : '';
  if (sanitizedValue !== currentValue) {
    state.potentiometerValue = sanitizedValue;
  }

  potentiometerValueSelect.value = sanitizedValue;
  if (!sanitizedValue && potentiometerValueSelect.options.length > 0) {
    potentiometerValueSelect.selectedIndex = 0;
  }

  const imageSrc = sanitizedValue ? 'images/potentiometer/potentiometer.svg' : '';

  if (potentiometerValuePickerButton) {
    const label =
      potentiometerValuePickerButton.querySelector('.bolt-drive-picker__current-label');
    const iconWrapper =
      potentiometerValuePickerButton.querySelector('.bolt-drive-picker__current-icon');
    let iconImage = iconWrapper
      ? iconWrapper.querySelector('.bolt-drive-picker__current-icon-image')
      : null;

    if (label) {
      label.textContent = sanitizedValue
        ? sanitizedValue
        : POTENTIOMETER_VALUE_PLACEHOLDER_TEXT;
    }

    if (iconWrapper) {
      if (imageSrc) {
        if (!iconImage) {
          iconImage = document.createElement('img');
          iconImage.className = 'bolt-drive-picker__current-icon-image';
          iconImage.alt = '';
          iconImage.loading = 'lazy';
          iconImage.decoding = 'async';
          iconWrapper.appendChild(iconImage);
        }
        iconWrapper.classList.remove('is-empty');
        iconImage.src = imageSrc;
        iconImage.hidden = false;
      } else {
        if (iconImage) {
          iconImage.hidden = true;
          iconImage.removeAttribute('src');
        }
        iconWrapper.classList.add('is-empty');
      }
    }

    if (isValid) {
      potentiometerValuePickerButton.classList.remove('is-invalid');
      potentiometerValuePickerButton.removeAttribute('aria-invalid');
    } else {
      potentiometerValuePickerButton.classList.add('is-invalid');
      potentiometerValuePickerButton.setAttribute('aria-invalid', 'true');
    }
  }

  if (potentiometerValuePicker) {
    potentiometerValuePicker.classList.toggle('is-invalid', !isValid);
  }

  if (potentiometerValuePickerList) {
    const optionElements = Array.from(
      potentiometerValuePickerList.querySelectorAll('[role="option"]'),
    );
    optionElements.forEach(optionElement => {
      const isSelected = optionElement.dataset.value === sanitizedValue;
      optionElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      optionElement.classList.toggle('is-selected', isSelected);
      optionElement.tabIndex = -1;
    });
  }
}

export function syncPotentiometerTaperPicker({ isValid = true } = {}) {
  if (!potentiometerTaperSelect) {
    return;
  }

  const currentValue =
    typeof state.potentiometerTaper === 'string' ? state.potentiometerTaper : '';
  const sanitizedValue = validPotentiometerTapers.has(currentValue) ? currentValue : '';
  if (sanitizedValue !== currentValue) {
    state.potentiometerTaper = sanitizedValue;
  }

  potentiometerTaperSelect.value = sanitizedValue;
  if (!sanitizedValue && potentiometerTaperSelect.options.length > 0) {
    potentiometerTaperSelect.selectedIndex = 0;
  }

  const imageSrc = sanitizedValue ? 'images/potentiometer/potentiometer.svg' : '';

  if (potentiometerTaperPickerButton) {
    const label =
      potentiometerTaperPickerButton.querySelector('.bolt-drive-picker__current-label');
    const iconWrapper =
      potentiometerTaperPickerButton.querySelector('.bolt-drive-picker__current-icon');
    let iconImage = iconWrapper
      ? iconWrapper.querySelector('.bolt-drive-picker__current-icon-image')
      : null;

    if (label) {
      label.textContent = sanitizedValue
        ? sanitizedValue
        : POTENTIOMETER_TAPER_PLACEHOLDER_TEXT;
    }

    if (iconWrapper) {
      if (imageSrc) {
        if (!iconImage) {
          iconImage = document.createElement('img');
          iconImage.className = 'bolt-drive-picker__current-icon-image';
          iconImage.alt = '';
          iconImage.loading = 'lazy';
          iconImage.decoding = 'async';
          iconWrapper.appendChild(iconImage);
        }
        iconWrapper.classList.remove('is-empty');
        iconImage.src = imageSrc;
        iconImage.hidden = false;
      } else {
        if (iconImage) {
          iconImage.hidden = true;
          iconImage.removeAttribute('src');
        }
        iconWrapper.classList.add('is-empty');
      }
    }

    if (isValid) {
      potentiometerTaperPickerButton.classList.remove('is-invalid');
      potentiometerTaperPickerButton.removeAttribute('aria-invalid');
    } else {
      potentiometerTaperPickerButton.classList.add('is-invalid');
      potentiometerTaperPickerButton.setAttribute('aria-invalid', 'true');
    }
  }

  if (potentiometerTaperPicker) {
    potentiometerTaperPicker.classList.toggle('is-invalid', !isValid);
  }

  if (potentiometerTaperPickerList) {
    const optionElements = Array.from(
      potentiometerTaperPickerList.querySelectorAll('[role="option"]'),
    );
    optionElements.forEach(optionElement => {
      const isSelected = optionElement.dataset.value === sanitizedValue;
      optionElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      optionElement.classList.toggle('is-selected', isSelected);
      optionElement.tabIndex = -1;
    });
  }
}

export function setPotentiometerValueSelection(nextValue, { triggerUpdate = true } = {}) {
  const desiredValue = typeof nextValue === 'string' ? nextValue.trim() : '';
  const sanitizedValue = validPotentiometerValues.has(desiredValue) ? desiredValue : '';
  const previousValue =
    typeof state.potentiometerValue === 'string' ? state.potentiometerValue : '';

  state.potentiometerValue = sanitizedValue;
  syncPotentiometerValuePicker({ isValid: true });

  if (triggerUpdate && previousValue !== sanitizedValue) {
    updateDownloadState();
    updatePreview();
  }
}

export function setPotentiometerTaperSelection(nextValue, { triggerUpdate = true } = {}) {
  const desiredValue = typeof nextValue === 'string' ? nextValue.trim() : '';
  const sanitizedValue = validPotentiometerTapers.has(desiredValue) ? desiredValue : '';
  const previousValue =
    typeof state.potentiometerTaper === 'string' ? state.potentiometerTaper : '';

  state.potentiometerTaper = sanitizedValue;
  syncPotentiometerTaperPicker({ isValid: true });

  if (triggerUpdate && previousValue !== sanitizedValue) {
    updateDownloadState();
    updatePreview();
  }
}

export function syncHardwareTypePicker() {
  const currentValue =
    typeof state.hardwareType === 'string' ? state.hardwareType.trim() : '';
  let resolvedValue = hardwareTypeOptions.has(currentValue) ? currentValue : '';

  if (!resolvedValue && hardwareTypeSelect) {
    const selectValue = typeof hardwareTypeSelect.value === 'string'
      ? hardwareTypeSelect.value.trim()
      : '';
    if (selectValue && hardwareTypeOptions.has(selectValue)) {
      resolvedValue = selectValue;
      if (currentValue !== selectValue) {
        state.hardwareType = selectValue;
      }
    }
  }

  if (hardwareTypeSelect) {
    hardwareTypeSelect.value = resolvedValue || hardwareTypeSelect.value;
  }

  if (hardwareTypePickerButton) {
    const label = hardwareTypePickerButton.querySelector('.part-type-picker__chip-label');
    const iconImage = hardwareTypePickerButton.querySelector('.part-type-picker__chip-image');
    const fallback = hardwareTypePickerButton.querySelector('.part-type-picker__chip-fallback');
    const imageSrc = resolvedValue
      ? hardwareTypeImageMap[resolvedValue] ?? hardwareTypeImageMap.get?.(resolvedValue) ?? ''
      : '';

    let optionLabel = HARDWARE_TYPE_PLACEHOLDER_TEXT;
    if (resolvedValue && hardwareTypeSelect) {
      const match = Array.from(hardwareTypeSelect.options).find(
        option => option.value === resolvedValue,
      );
      if (match) {
        optionLabel = match.textContent.trim() || HARDWARE_TYPE_PLACEHOLDER_TEXT;
      }
    }

    if (label) {
      label.textContent = optionLabel;
    }

    if (iconImage) {
      iconImage.classList.remove('is-rotated-90');

      if (imageSrc) {
        iconImage.src = imageSrc;
        iconImage.hidden = false;
        iconImage.removeAttribute('hidden');
        if (resolvedValue === 'Bolt' || resolvedValue === 'Screw') {
          iconImage.classList.add('is-rotated-90');
        }
      } else {
        iconImage.hidden = true;
        iconImage.setAttribute('hidden', '');
        iconImage.removeAttribute('src');
      }
    }

    if (fallback instanceof HTMLElement) {
      const showIconFallback = resolvedValue === CUSTOM_PART_TYPE_VALUE;
      fallback.classList.toggle('part-type-picker__chip-fallback--icon', showIconFallback);

      if (imageSrc) {
        fallback.hidden = true;
        fallback.innerHTML = '';
        fallback.style.backgroundImage = '';
        fallback.style.backgroundSize = '';
        fallback.style.backgroundPosition = '';
        fallback.style.backgroundRepeat = '';
      } else if (showIconFallback) {
        fallback.hidden = false;
        fallback.innerHTML = '';
        const icon = document.createElement('i');
        icon.className = `fa-solid ${CUSTOM_PART_TYPE_ICON_CLASS}`;
        icon.setAttribute('aria-hidden', 'true');
        fallback.appendChild(icon);
        fallback.style.backgroundImage = '';
        fallback.style.backgroundSize = '';
        fallback.style.backgroundPosition = '';
        fallback.style.backgroundRepeat = '';
      } else {
        fallback.hidden = false;
        fallback.innerHTML = '';
        fallback.style.backgroundImage = `url("${PART_TYPE_PLACEHOLDER_IMAGE}")`;
        fallback.style.backgroundSize = 'cover';
        fallback.style.backgroundPosition = 'center';
        fallback.style.backgroundRepeat = 'no-repeat';
      }
    }
  }

  if (hardwareTypePickerList) {
    const optionItems = Array.from(
      hardwareTypePickerList.querySelectorAll('[role="option"]'),
    );
    optionItems.forEach(item => {
      const isSelected = item.dataset.value === resolvedValue;
      item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      item.classList.toggle('is-selected', isSelected);
      item.tabIndex = -1;
    });
  }
}

function fuseTypeRequiresValue(type) {
  return !FUSE_TYPES_WITHOUT_AMPS.has(type);
}

function applyFuseValueVisibility({ showFuseFields = state.hardwareType === 'Fuse' } = {}) {
  const sanitizedType = validFuseTypeIds.has(state.fuseType)
    ? state.fuseType
    : DEFAULT_FUSE_TYPE;

  if (sanitizedType !== state.fuseType) {
    state.fuseType = sanitizedType;
  }

  const requiresValue = showFuseFields && fuseTypeRequiresValue(sanitizedType);
  const shouldShowField = requiresValue;

  if (!requiresValue && state.fuseValue) {
    state.fuseValue = '';
  }

  if (fuseValueContainer && fuseValueContainer.classList) {
    fuseValueContainer.classList.toggle('d-none', !shouldShowField);
  }

  if (fuseValueSelect) {
    fuseValueSelect.disabled = !shouldShowField;
    fuseValueSelect.value = shouldShowField ? state.fuseValue || '' : '';
  }

  if (fuseValuePickerButton) {
    fuseValuePickerButton.disabled = !shouldShowField;
    if (!shouldShowField) {
      if (typeof fuseValuePickerButton.setAttribute === 'function') {
        fuseValuePickerButton.setAttribute('aria-expanded', 'false');
      }
      if (
        fuseValuePickerButton.classList &&
        typeof fuseValuePickerButton.classList.remove === 'function'
      ) {
        fuseValuePickerButton.classList.remove('is-invalid');
      }
      if (typeof fuseValuePickerButton.removeAttribute === 'function') {
        fuseValuePickerButton.removeAttribute('aria-invalid');
      }
    } else {
      const pickerIsOpen = Boolean(
        fuseValuePicker &&
          fuseValuePicker.classList &&
          typeof fuseValuePicker.classList.contains === 'function' &&
          fuseValuePicker.classList.contains('is-open'),
      );
      if (typeof fuseValuePickerButton.setAttribute === 'function') {
        fuseValuePickerButton.setAttribute('aria-expanded', pickerIsOpen ? 'true' : 'false');
      }
    }
  }

  if (fuseValuePickerList) {
    const pickerIsOpen = Boolean(
      fuseValuePicker &&
        fuseValuePicker.classList &&
        typeof fuseValuePicker.classList.contains === 'function' &&
        fuseValuePicker.classList.contains('is-open'),
    );
    const shouldHideList = !shouldShowField || !pickerIsOpen;
    fuseValuePickerList.hidden = shouldHideList;
  }

  if (
    !shouldShowField &&
    fuseValuePicker &&
    fuseValuePicker.classList &&
    typeof fuseValuePicker.classList.remove === 'function'
  ) {
    fuseValuePicker.classList.remove('is-open');
  }

  return { requiresValue };
}

export function syncFuseTypePicker({ isValid = true } = {}) {
  const currentValue = typeof state.fuseType === 'string' ? state.fuseType : '';
  const sanitizedValue = validFuseTypeIds.has(currentValue) ? currentValue : DEFAULT_FUSE_TYPE;

  if (sanitizedValue !== currentValue) {
    state.fuseType = sanitizedValue;
  }

  if (fuseTypeSelect) {
    fuseTypeSelect.value = sanitizedValue;
  }

  const selectedOption = fuseTypeOptions.find(option => option.id === sanitizedValue) || null;

  if (fuseTypePickerButton) {
    const label = fuseTypePickerButton.querySelector('.bolt-drive-picker__current-label');
    const iconWrapper = fuseTypePickerButton.querySelector('.bolt-drive-picker__current-icon');
    const iconImage = fuseTypePickerButton.querySelector('.bolt-drive-picker__current-icon-image');

    if (label) {
      label.textContent = selectedOption ? selectedOption.label : FUSE_TYPE_PLACEHOLDER_TEXT;
    }

    if (iconWrapper && iconImage) {
      if (selectedOption && selectedOption.image) {
        iconImage.src = selectedOption.image;
        iconImage.hidden = false;
        iconWrapper.classList.remove('is-empty');
      } else {
        iconImage.hidden = true;
        iconImage.removeAttribute('src');
        iconWrapper.classList.add('is-empty');
      }
    }

    if (isValid) {
      fuseTypePickerButton.classList.remove('is-invalid');
      fuseTypePickerButton.removeAttribute('aria-invalid');
    } else {
      fuseTypePickerButton.classList.add('is-invalid');
      fuseTypePickerButton.setAttribute('aria-invalid', 'true');
    }
  }

  if (fuseTypePicker) {
    fuseTypePicker.classList.toggle('is-invalid', !isValid);
  }

  if (fuseTypePickerList) {
    const optionElements = Array.from(
      fuseTypePickerList.querySelectorAll('[role="option"]'),
    );
    optionElements.forEach(optionElement => {
      const isSelected = optionElement.dataset.value === sanitizedValue;
      optionElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      optionElement.classList.toggle('is-selected', isSelected);
      optionElement.tabIndex = -1;
    });
  }
}

export function setFuseTypeSelection(nextId, { triggerUpdate = true } = {}) {
  const desiredValue = typeof nextId === 'string' ? nextId.trim() : '';
  const sanitizedValue = validFuseTypeIds.has(desiredValue) ? desiredValue : DEFAULT_FUSE_TYPE;
  const previousValue = validFuseTypeIds.has(state.fuseType)
    ? state.fuseType
    : DEFAULT_FUSE_TYPE;

  state.fuseType = sanitizedValue;
  syncFuseTypePicker({ isValid: true });

  const showFuseFields = state.hardwareType === 'Fuse';
  applyFuseValueVisibility({ showFuseFields });
  syncFuseValuePicker({ isValid: true });

  const previousWasCartridge = CARTRIDGE_FUSE_TYPES.has(previousValue);
  const nextIsCartridge = CARTRIDGE_FUSE_TYPES.has(sanitizedValue);
  const shouldResetCartridgeOptions = previousWasCartridge && !nextIsCartridge;
  updateGlassOptionVisibility({ resetIfHidden: shouldResetCartridgeOptions });

  if (triggerUpdate && previousValue !== sanitizedValue) {
    updateDownloadState();
    updatePreview();
  }
}

export function populateFuseTypePicker() {
  if (!fuseTypeSelect) {
    state.fuseType = DEFAULT_FUSE_TYPE;
    return;
  }

  const previousType = typeof state.fuseType === 'string' ? state.fuseType : DEFAULT_FUSE_TYPE;

  fuseTypeSelect.innerHTML = '';
  if (fuseTypePickerList) {
    fuseTypePickerList.innerHTML = '';
  }

  fuseTypeOptions.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.id;
    opt.textContent = option.label;
    fuseTypeSelect.appendChild(opt);

    if (fuseTypePickerList) {
      const item = document.createElement('li');
      item.className = 'bolt-drive-picker__option';
      item.dataset.value = option.id;
      item.setAttribute('role', 'option');
      item.tabIndex = -1;

      const icon = document.createElement('span');
      icon.className = 'bolt-drive-picker__option-icon';

      if (option.image) {
        const image = document.createElement('img');
        image.className = 'bolt-drive-picker__option-icon-image';
        image.src = option.image;
        image.alt = '';
        image.loading = 'lazy';
        image.decoding = 'async';
        icon.appendChild(image);
      } else {
        icon.classList.add('is-empty');
      }

      const label = document.createElement('span');
      label.className = 'bolt-drive-picker__option-label';
      label.textContent = option.label;

      item.appendChild(icon);
      item.appendChild(label);

      fuseTypePickerList.appendChild(item);
    }
  });

  const sanitizedValue = validFuseTypeIds.has(previousType) ? previousType : DEFAULT_FUSE_TYPE;
  state.fuseType = sanitizedValue;
  fuseTypeSelect.value = sanitizedValue;
  fuseTypeSelect.disabled = false;

  if (fuseTypePickerButton) {
    fuseTypePickerButton.disabled = false;
    fuseTypePickerButton.setAttribute('aria-expanded', 'false');
  }
  if (fuseTypePickerList) {
    fuseTypePickerList.hidden = true;
  }

  syncFuseTypePicker({ isValid: true });
}

export function syncBoltDrivePicker({ isValid = true } = {}) {
  if (!boltDriveSelect) {
    return;
  }

  const currentValue = typeof state.boltDrive === 'string' ? state.boltDrive : '';
  const sanitizedValue = validBoltDriveIds.has(currentValue) ? currentValue : '';
  if (sanitizedValue !== currentValue) {
    state.boltDrive = sanitizedValue;
  }

  boltDriveSelect.value = sanitizedValue;
  if (!sanitizedValue) {
    if (boltDriveSelect.options.length > 0) {
      boltDriveSelect.selectedIndex = 0;
    }
  }

  const selectedOption = sanitizedValue
    ? boltDriveOptions.find(option => option.id === sanitizedValue) || null
    : null;

  if (boltDrivePickerButton) {
    const label = boltDrivePickerButton.querySelector('.bolt-drive-picker__current-label');
    const iconWrapper = boltDrivePickerButton.querySelector('.bolt-drive-picker__current-icon');
    const iconImage = boltDrivePickerButton.querySelector('.bolt-drive-picker__current-icon-image');

    if (label) {
      label.textContent = selectedOption ? selectedOption.label : BOLT_DRIVE_PLACEHOLDER_TEXT;
    }

    if (iconWrapper && iconImage) {
      if (selectedOption) {
        iconImage.src = `images/bolts/drive/${selectedOption.image}.svg`;
        iconImage.hidden = false;
        iconWrapper.classList.remove('is-empty');
      } else {
        iconImage.hidden = true;
        iconImage.removeAttribute('src');
        iconWrapper.classList.add('is-empty');
      }
    }

    if (isValid) {
      boltDrivePickerButton.classList.remove('is-invalid');
      boltDrivePickerButton.removeAttribute('aria-invalid');
    } else {
      boltDrivePickerButton.classList.add('is-invalid');
      boltDrivePickerButton.setAttribute('aria-invalid', 'true');
    }
  }

  if (boltDrivePicker) {
    boltDrivePicker.classList.toggle('is-invalid', !isValid);
  }

  if (boltDrivePickerList) {
    const optionElements = Array.from(
      boltDrivePickerList.querySelectorAll('[role="option"]'),
    );
    optionElements.forEach(optionElement => {
      const isSelected = optionElement.dataset.value === sanitizedValue;
      optionElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      optionElement.classList.toggle('is-selected', isSelected);
      optionElement.tabIndex = -1;
    });
  }
}

export function setBoltDriveSelection(nextId, { triggerUpdate = true } = {}) {
  const desiredValue = typeof nextId === 'string' ? nextId.trim() : '';
  const sanitizedValue = validBoltDriveIds.has(desiredValue) ? desiredValue : '';
  const previousValue = typeof state.boltDrive === 'string' ? state.boltDrive : '';

  state.boltDrive = sanitizedValue;
  syncBoltDrivePicker({ isValid: true });

  if (triggerUpdate && previousValue !== sanitizedValue) {
    updatePreview();
    updateDownloadState();
  }
}

export function syncBoltHeadPicker({ isValid = true } = {}) {
  if (!boltHeadSelect) {
    return;
  }

  const currentValue = typeof state.boltHead === 'string' ? state.boltHead : '';
  const sanitizedValue = validBoltHeadIds.has(currentValue) ? currentValue : '';
  if (sanitizedValue !== currentValue) {
    state.boltHead = sanitizedValue;
  }

  boltHeadSelect.value = sanitizedValue;
  if (!sanitizedValue && boltHeadSelect.options.length > 0) {
    boltHeadSelect.selectedIndex = 0;
  }

  const headOptions = getFastenerHeadOptions();
  const selectedOption = sanitizedValue
    ? headOptions.find(option => option.id === sanitizedValue) || null
    : null;
  const placeholderText = getFastenerHeadPlaceholder();

  if (boltHeadPickerButton) {
    const label = boltHeadPickerButton.querySelector('.bolt-drive-picker__current-label');
    const iconWrapper = boltHeadPickerButton.querySelector('.bolt-drive-picker__current-icon');
    const iconImage = boltHeadPickerButton.querySelector(
      '.bolt-drive-picker__current-icon-image',
    );

    if (label) {
      label.textContent = selectedOption ? selectedOption.label : placeholderText;
    }

    if (iconWrapper && iconImage) {
      if (selectedOption) {
        iconImage.src = getFastenerHeadImagePath(selectedOption);
        iconImage.hidden = false;
        iconWrapper.classList.remove('is-empty');
      } else {
        iconImage.hidden = true;
        iconImage.removeAttribute('src');
        iconWrapper.classList.add('is-empty');
      }
    }

    if (isValid) {
      boltHeadPickerButton.classList.remove('is-invalid');
      boltHeadPickerButton.removeAttribute('aria-invalid');
    } else {
      boltHeadPickerButton.classList.add('is-invalid');
      boltHeadPickerButton.setAttribute('aria-invalid', 'true');
    }
  }

  if (boltHeadPicker) {
    boltHeadPicker.classList.toggle('is-invalid', !isValid);
  }

  if (boltHeadPickerList) {
    const optionElements = Array.from(
      boltHeadPickerList.querySelectorAll('[role="option"]'),
    );
    optionElements.forEach(optionElement => {
      const isSelected = optionElement.dataset.value === sanitizedValue;
      optionElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      optionElement.classList.toggle('is-selected', isSelected);
      optionElement.tabIndex = -1;
    });
  }
}

export function setBoltHeadSelection(nextId, { triggerUpdate = true } = {}) {
  const desiredValue = typeof nextId === 'string' ? nextId.trim() : '';
  const sanitizedValue = validBoltHeadIds.has(desiredValue) ? desiredValue : '';
  const previousValue = typeof state.boltHead === 'string' ? state.boltHead : '';

  state.boltHead = sanitizedValue;
  syncBoltHeadPicker({ isValid: true });

  if (triggerUpdate && previousValue !== sanitizedValue) {
    updatePreview();
    updateDownloadState();
  }
}

export function syncNutTypePicker({ isValid = true } = {}) {
  if (!nutTypeSelect) {
    return;
  }

  const currentValue = typeof state.nutType === 'string' ? state.nutType : '';
  const sanitizedValue = validNutTypeIds.has(currentValue) ? currentValue : '';
  if (sanitizedValue !== currentValue) {
    state.nutType = sanitizedValue;
  }

  nutTypeSelect.value = sanitizedValue;
  if (!sanitizedValue && nutTypeSelect.options.length > 0) {
    nutTypeSelect.selectedIndex = 0;
  }

  const selectedOption = sanitizedValue
    ? nutTypeOptions.find(option => option.id === sanitizedValue) || null
    : null;

  if (nutTypePickerButton) {
    const label = nutTypePickerButton.querySelector('.bolt-drive-picker__current-label');
    const iconWrapper = nutTypePickerButton.querySelector('.bolt-drive-picker__current-icon');
    const iconImage = nutTypePickerButton.querySelector('.bolt-drive-picker__current-icon-image');

    if (label) {
      label.textContent = selectedOption ? selectedOption.label : NUT_TYPE_PLACEHOLDER_TEXT;
    }

    if (iconWrapper && iconImage) {
      if (selectedOption) {
        iconImage.src = `images/nuts/${selectedOption.image}.svg`;
        iconImage.hidden = false;
        iconWrapper.classList.remove('is-empty');
      } else {
        iconImage.hidden = true;
        iconImage.removeAttribute('src');
        iconWrapper.classList.add('is-empty');
      }
    }

    if (isValid) {
      nutTypePickerButton.classList.remove('is-invalid');
      nutTypePickerButton.removeAttribute('aria-invalid');
    } else {
      nutTypePickerButton.classList.add('is-invalid');
      nutTypePickerButton.setAttribute('aria-invalid', 'true');
    }
  }

  if (nutTypePicker) {
    nutTypePicker.classList.toggle('is-invalid', !isValid);
  }

  if (nutTypePickerList) {
    const optionElements = Array.from(
      nutTypePickerList.querySelectorAll('[role="option"]'),
    );
    optionElements.forEach(optionElement => {
      const isSelected = optionElement.dataset.value === sanitizedValue;
      optionElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      optionElement.classList.toggle('is-selected', isSelected);
      optionElement.tabIndex = -1;
    });
  }
}

export function setNutTypeSelection(nextId, { triggerUpdate = true } = {}) {
  const desiredValue = typeof nextId === 'string' ? nextId.trim() : '';
  const sanitizedValue = validNutTypeIds.has(desiredValue) ? desiredValue : '';
  const previousValue = typeof state.nutType === 'string' ? state.nutType : '';

  state.nutType = sanitizedValue;
  syncNutTypePicker({ isValid: true });

  if (triggerUpdate && previousValue !== sanitizedValue) {
    updatePreview();
    updateDownloadState();
  }
}

export function populateNutTypeOptions() {
  if (!nutTypeSelect) {
    state.nutType = '';
    return;
  }

  const previousType = typeof state.nutType === 'string' ? state.nutType : '';

  nutTypeSelect.innerHTML = '';
  if (nutTypePickerList) {
    nutTypePickerList.innerHTML = '';
  }

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = NUT_TYPE_PLACEHOLDER_TEXT;
  placeholder.disabled = true;
  placeholder.selected = !previousType;
  nutTypeSelect.appendChild(placeholder);

  nutTypeOptions.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.id;
    opt.textContent = option.label;
    nutTypeSelect.appendChild(opt);

    if (nutTypePickerList) {
      const item = document.createElement('li');
      item.className = 'bolt-drive-picker__option';
      item.dataset.value = option.id;
      item.setAttribute('role', 'option');
      item.tabIndex = -1;

      const icon = document.createElement('span');
      icon.className = 'bolt-drive-picker__option-icon';

      const image = document.createElement('img');
      image.className = 'bolt-drive-picker__option-icon-image';
      image.src = `images/nuts/${option.image}.svg`;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      icon.appendChild(image);

      const label = document.createElement('span');
      label.className = 'bolt-drive-picker__option-label';
      label.textContent = option.label;

      item.appendChild(icon);
      item.appendChild(label);

      nutTypePickerList.appendChild(item);
    }
  });

  const sanitizedValue = validNutTypeIds.has(previousType) ? previousType : '';
  state.nutType = sanitizedValue;
  nutTypeSelect.value = sanitizedValue;
  if (!sanitizedValue) {
    placeholder.selected = true;
  }

  nutTypeSelect.disabled = false;
  nutTypeSelect.title = 'Select nut style';
  nutTypeSelect.setAttribute('aria-required', 'true');

  if (nutTypePickerButton) {
    nutTypePickerButton.disabled = false;
    nutTypePickerButton.setAttribute('aria-expanded', 'false');
  }
  if (nutTypePickerList) {
    nutTypePickerList.hidden = true;
  }

  syncNutTypePicker({ isValid: true });
}

export function syncSwitchTypePicker({ isValid = true } = {}) {
  if (!switchTypeSelect) {
    return;
  }

  const currentValue = typeof state.switchType === 'string' ? state.switchType : '';
  const sanitizedValue = validSwitchTypeIds.has(currentValue) ? currentValue : '';
  if (sanitizedValue !== currentValue) {
    state.switchType = sanitizedValue;
  }

  switchTypeSelect.value = sanitizedValue;
  if (!sanitizedValue && switchTypeSelect.options.length > 0) {
    switchTypeSelect.selectedIndex = 0;
  }

  const selectedOption = sanitizedValue ? switchTypeMap.get(sanitizedValue) || null : null;

  if (switchTypePickerButton) {
    const label = switchTypePickerButton.querySelector('.bolt-drive-picker__current-label');
    const iconWrapper = switchTypePickerButton.querySelector('.bolt-drive-picker__current-icon');
    const iconImage = switchTypePickerButton.querySelector(
      '.bolt-drive-picker__current-icon-image',
    );

    if (label) {
      label.textContent = selectedOption
        ? selectedOption.label
        : SWITCH_TYPE_PLACEHOLDER_TEXT;
    }

    if (iconWrapper && iconImage) {
      if (selectedOption && selectedOption.image) {
        iconImage.src = selectedOption.image;
        iconImage.hidden = false;
        iconWrapper.classList.remove('is-empty');
      } else {
        iconImage.hidden = true;
        iconImage.removeAttribute('src');
        iconWrapper.classList.add('is-empty');
      }
    }

    if (isValid) {
      switchTypePickerButton.classList.remove('is-invalid');
      switchTypePickerButton.removeAttribute('aria-invalid');
    } else {
      switchTypePickerButton.classList.add('is-invalid');
      switchTypePickerButton.setAttribute('aria-invalid', 'true');
    }
  }

  if (switchTypePicker) {
    switchTypePicker.classList.toggle('is-invalid', !isValid);
  }

  if (switchTypePickerList) {
    const optionElements = Array.from(
      switchTypePickerList.querySelectorAll('[role="option"]'),
    );
    optionElements.forEach(optionElement => {
      const isSelected = optionElement.dataset.value === sanitizedValue;
      optionElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      optionElement.classList.toggle('is-selected', isSelected);
      optionElement.tabIndex = -1;
    });
  }
}

export function setSwitchTypeSelection(nextId, { triggerUpdate = true } = {}) {
  const desiredValue = typeof nextId === 'string' ? nextId.trim() : '';
  const sanitizedValue = validSwitchTypeIds.has(desiredValue) ? desiredValue : '';
  const previousValue = typeof state.switchType === 'string' ? state.switchType : '';

  state.switchType = sanitizedValue;
  syncSwitchTypePicker({ isValid: true });

  if (triggerUpdate && previousValue !== sanitizedValue) {
    updatePreview();
    updateDownloadState();
  }
}

export function populateSwitchTypePicker() {
  if (!switchTypeSelect) {
    state.switchType = '';
    return;
  }

  const previousType = typeof state.switchType === 'string' ? state.switchType : '';

  switchTypeSelect.innerHTML = '';
  if (switchTypePickerList) {
    switchTypePickerList.innerHTML = '';
  }

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = SWITCH_TYPE_PLACEHOLDER_TEXT;
  placeholder.disabled = true;
  placeholder.selected = !previousType;
  switchTypeSelect.appendChild(placeholder);

  switchTypeOptions.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.id;
    opt.textContent = option.label;
    switchTypeSelect.appendChild(opt);

    if (switchTypePickerList) {
      const item = document.createElement('li');
      item.className = 'bolt-drive-picker__option';
      item.dataset.value = option.id;
      item.setAttribute('role', 'option');
      item.tabIndex = -1;

      const icon = document.createElement('span');
      icon.className = 'bolt-drive-picker__option-icon';

      if (option.image) {
        const image = document.createElement('img');
        image.className = 'bolt-drive-picker__option-icon-image';
        image.src = option.image;
        image.alt = '';
        image.loading = 'lazy';
        image.decoding = 'async';
        icon.appendChild(image);
      } else {
        icon.classList.add('is-empty');
      }

      const label = document.createElement('span');
      label.className = 'bolt-drive-picker__option-label';
      label.textContent = option.label;

      item.appendChild(icon);
      item.appendChild(label);

      switchTypePickerList.appendChild(item);
    }
  });

  const sanitizedValue = validSwitchTypeIds.has(previousType) ? previousType : '';
  state.switchType = sanitizedValue;
  switchTypeSelect.value = sanitizedValue;
  if (!sanitizedValue) {
    placeholder.selected = true;
  }

  switchTypeSelect.disabled = false;
  switchTypeSelect.title = 'Select switch type';
  switchTypeSelect.setAttribute('aria-required', 'true');

  if (switchTypePickerButton) {
    switchTypePickerButton.disabled = false;
    switchTypePickerButton.setAttribute('aria-expanded', 'false');
  }
  if (switchTypePickerList) {
    switchTypePickerList.hidden = true;
  }

  syncSwitchTypePicker({ isValid: true });
}

export function syncWasherTypePicker({ isValid = true } = {}) {
  if (!washerTypeSelect) {
    return;
  }

  const currentValue = typeof state.washerType === 'string' ? state.washerType : '';
  const sanitizedValue = validWasherTypeIds.has(currentValue) ? currentValue : '';
  if (sanitizedValue !== currentValue) {
    state.washerType = sanitizedValue;
  }

  washerTypeSelect.value = sanitizedValue;
  if (!sanitizedValue && washerTypeSelect.options.length > 0) {
    washerTypeSelect.selectedIndex = 0;
  }

  const selectedOption = sanitizedValue
    ? washerTypeOptions.find(option => option.id === sanitizedValue) || null
    : null;

  if (washerTypePickerButton) {
    const label = washerTypePickerButton.querySelector('.bolt-drive-picker__current-label');
    const iconWrapper = washerTypePickerButton.querySelector('.bolt-drive-picker__current-icon');
    const iconImage = washerTypePickerButton.querySelector('.bolt-drive-picker__current-icon-image');

    if (label) {
      label.textContent = selectedOption
        ? selectedOption.label
        : WASHER_TYPE_PLACEHOLDER_TEXT;
    }

    if (iconWrapper && iconImage) {
      if (selectedOption) {
        iconImage.src = `images/washers/${selectedOption.image}.svg`;
        iconImage.hidden = false;
        iconWrapper.classList.remove('is-empty');
      } else {
        iconImage.hidden = true;
        iconImage.removeAttribute('src');
        iconWrapper.classList.add('is-empty');
      }
    }

    if (isValid) {
      washerTypePickerButton.classList.remove('is-invalid');
      washerTypePickerButton.removeAttribute('aria-invalid');
    } else {
      washerTypePickerButton.classList.add('is-invalid');
      washerTypePickerButton.setAttribute('aria-invalid', 'true');
    }
  }

  if (washerTypePicker) {
    washerTypePicker.classList.toggle('is-invalid', !isValid);
  }

  if (washerTypePickerList) {
    const optionElements = Array.from(
      washerTypePickerList.querySelectorAll('[role="option"]'),
    );
    optionElements.forEach(optionElement => {
      const isSelected = optionElement.dataset.value === sanitizedValue;
      optionElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      optionElement.classList.toggle('is-selected', isSelected);
      optionElement.tabIndex = -1;
    });
  }
}

export function setWasherTypeSelection(nextId, { triggerUpdate = true } = {}) {
  const desiredValue = typeof nextId === 'string' ? nextId.trim() : '';
  const sanitizedValue = validWasherTypeIds.has(desiredValue) ? desiredValue : '';
  const previousValue = typeof state.washerType === 'string' ? state.washerType : '';

  state.washerType = sanitizedValue;
  syncWasherTypePicker({ isValid: true });

  if (triggerUpdate && previousValue !== sanitizedValue) {
    updatePreview();
    updateDownloadState();
  }
}

export function populateWasherTypeOptions() {
  if (!washerTypeSelect) {
    state.washerType = '';
    return;
  }

  const previousType = typeof state.washerType === 'string' ? state.washerType : '';

  washerTypeSelect.innerHTML = '';
  if (washerTypePickerList) {
    washerTypePickerList.innerHTML = '';
  }

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = WASHER_TYPE_PLACEHOLDER_TEXT;
  placeholder.disabled = true;
  placeholder.selected = !previousType;
  washerTypeSelect.appendChild(placeholder);

  washerTypeOptions.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.id;
    opt.textContent = option.label;
    washerTypeSelect.appendChild(opt);

    if (washerTypePickerList) {
      const item = document.createElement('li');
      item.className = 'bolt-drive-picker__option';
      item.dataset.value = option.id;
      item.setAttribute('role', 'option');
      item.tabIndex = -1;

      const icon = document.createElement('span');
      icon.className = 'bolt-drive-picker__option-icon';

      const image = document.createElement('img');
      image.className = 'bolt-drive-picker__option-icon-image';
      image.src = `images/washers/${option.image}.svg`;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      icon.appendChild(image);

      const label = document.createElement('span');
      label.className = 'bolt-drive-picker__option-label';
      label.textContent = option.label;

      item.appendChild(icon);
      item.appendChild(label);

      washerTypePickerList.appendChild(item);
    }
  });

  const sanitizedValue = validWasherTypeIds.has(previousType) ? previousType : '';
  state.washerType = sanitizedValue;
  washerTypeSelect.value = sanitizedValue;
  if (!sanitizedValue) {
    placeholder.selected = true;
  }

  washerTypeSelect.disabled = false;
  washerTypeSelect.title = 'Select washer style';
  washerTypeSelect.setAttribute('aria-required', 'true');

  if (washerTypePickerButton) {
    washerTypePickerButton.disabled = false;
    washerTypePickerButton.setAttribute('aria-expanded', 'false');
  }
  if (washerTypePickerList) {
    washerTypePickerList.hidden = true;
  }

  syncWasherTypePicker({ isValid: true });
}

export function syncConnectorSeriesPicker({ isValid = true } = {}) {
  if (state.hardwareType !== 'Connector') {
    return;
  }
  const categoryId = typeof state.connectorCategory === 'string' ? state.connectorCategory : '';
  const category = findConnectorCategory(categoryId);
  const series = category && Array.isArray(category.series) ? category.series : [];
  const currentCode = typeof state.standardCode === 'string' ? state.standardCode : '';
  const selectedEntry = series.find(entry => entry.code === currentCode) || null;
  const sanitizedCode = selectedEntry ? selectedEntry.code : '';

  if (sanitizedCode !== currentCode) {
    state.standardCode = sanitizedCode;
  }

  const displayName = selectedEntry
    ? selectedEntry.name && selectedEntry.name.trim()
      ? `${selectedEntry.code} — ${selectedEntry.name}`
      : selectedEntry.code
    : '';
  state.standard = displayName;

  if (standardSelect) {
    if (sanitizedCode) {
      standardSelect.value = sanitizedCode;
    } else {
      standardSelect.value = '';
      if (standardSelect.options.length > 0) {
        standardSelect.selectedIndex = 0;
      }
    }
  }

  if (connectorSeriesPickerButton) {
    const label = connectorSeriesPickerButton.querySelector('.bolt-drive-picker__current-label');
    const iconWrapper = connectorSeriesPickerButton.querySelector('.bolt-drive-picker__current-icon');
    const iconImage = connectorSeriesPickerButton.querySelector('.bolt-drive-picker__current-icon-image');

    if (label) {
      label.textContent = displayName || CONNECTOR_SERIES_PLACEHOLDER_TEXT;
    }

    if (iconWrapper && iconImage) {
      const iconSrc = selectedEntry ? getConnectorSeriesImage(categoryId, selectedEntry.code) : '';
      if (iconSrc) {
        iconImage.src = iconSrc;
        iconImage.hidden = false;
        iconWrapper.classList.remove('is-empty');
      } else {
        iconImage.hidden = true;
        iconImage.removeAttribute('src');
        iconWrapper.classList.add('is-empty');
      }
    }

    if (isValid) {
      connectorSeriesPickerButton.classList.remove('is-invalid');
      connectorSeriesPickerButton.removeAttribute('aria-invalid');
    } else {
      connectorSeriesPickerButton.classList.add('is-invalid');
      connectorSeriesPickerButton.setAttribute('aria-invalid', 'true');
    }
  }

  if (connectorSeriesPicker) {
    connectorSeriesPicker.classList.toggle('is-invalid', !isValid);
    connectorSeriesPicker.classList.toggle('is-disabled', series.length === 0);
  }

  if (connectorSeriesPickerList) {
    const optionElements = Array.from(
      connectorSeriesPickerList.querySelectorAll('[role="option"]'),
    );
    optionElements.forEach(optionElement => {
      const isSelected = optionElement.dataset.value === sanitizedCode;
      optionElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      optionElement.classList.toggle('is-selected', isSelected);
      optionElement.tabIndex = -1;
    });
  }
}

export function setConnectorSeriesSelection(nextCode, { triggerUpdate = true } = {}) {
  if (state.hardwareType !== 'Connector') {
    return;
  }
  const desiredCode = typeof nextCode === 'string' ? nextCode.trim() : '';
  const categoryId = typeof state.connectorCategory === 'string' ? state.connectorCategory : '';
  const category = findConnectorCategory(categoryId);
  const series = category && Array.isArray(category.series) ? category.series : [];
  const selectedEntry = series.find(entry => entry.code === desiredCode) || null;
  const sanitizedCode = selectedEntry ? selectedEntry.code : '';
  const previousCode = typeof state.standardCode === 'string' ? state.standardCode : '';

  state.standardCode = sanitizedCode;
  if (selectedEntry) {
    state.standard = selectedEntry.name && selectedEntry.name.trim()
      ? `${selectedEntry.code} — ${selectedEntry.name}`
      : selectedEntry.code;
  } else {
    state.standard = '';
  }

  syncConnectorSeriesPicker({ isValid: true });

  if (triggerUpdate && previousCode !== sanitizedCode) {
    updateDownloadState();
    updatePreview();
  }
}

export function syncConnectorCategoryPicker({ isValid = true } = {}) {
  const currentValue = typeof state.connectorCategory === 'string' ? state.connectorCategory : '';
  const sanitizedValue = validConnectorCategoryIds.has(currentValue) ? currentValue : '';
  if (sanitizedValue !== currentValue) {
    state.connectorCategory = sanitizedValue;
  }

  if (connectorCategorySelect) {
    connectorCategorySelect.value = sanitizedValue || '';
    if (!sanitizedValue && connectorCategorySelect.options.length > 0) {
      connectorCategorySelect.selectedIndex = 0;
    }
  }

  const category = sanitizedValue ? findConnectorCategory(sanitizedValue) : null;
  const iconSrc = sanitizedValue ? connectorCategoryImageMap[sanitizedValue] || '' : '';

  if (connectorCategoryPickerButton) {
    const label = connectorCategoryPickerButton.querySelector('.bolt-drive-picker__current-label');
    const iconWrapper = connectorCategoryPickerButton.querySelector('.bolt-drive-picker__current-icon');
    const iconImage = connectorCategoryPickerButton.querySelector('.bolt-drive-picker__current-icon-image');

    if (label) {
      label.textContent = category ? category.label : CONNECTOR_CATEGORY_PLACEHOLDER_TEXT;
    }

    if (iconWrapper && iconImage) {
      if (iconSrc) {
        iconImage.src = iconSrc;
        iconImage.hidden = false;
        iconWrapper.classList.remove('is-empty');
      } else {
        iconImage.hidden = true;
        iconImage.removeAttribute('src');
        iconWrapper.classList.add('is-empty');
      }
    }

    if (isValid) {
      connectorCategoryPickerButton.classList.remove('is-invalid');
      connectorCategoryPickerButton.removeAttribute('aria-invalid');
    } else {
      connectorCategoryPickerButton.classList.add('is-invalid');
      connectorCategoryPickerButton.setAttribute('aria-invalid', 'true');
    }
  }

  if (connectorCategoryPicker) {
    connectorCategoryPicker.classList.toggle('is-invalid', !isValid);
    const isDisabled = connectorCatalog.length === 0;
    connectorCategoryPicker.classList.toggle('is-disabled', isDisabled);
  }

  if (connectorCategoryPickerList) {
    const optionElements = Array.from(
      connectorCategoryPickerList.querySelectorAll('[role="option"]'),
    );
    optionElements.forEach(optionElement => {
      const isSelected = optionElement.dataset.value === sanitizedValue;
      optionElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      optionElement.classList.toggle('is-selected', isSelected);
      optionElement.tabIndex = -1;
    });
  }
}

export function setConnectorCategorySelection(nextId, { triggerUpdate = true } = {}) {
  const desiredValue = typeof nextId === 'string' ? nextId.trim() : '';
  const sanitizedValue = validConnectorCategoryIds.has(desiredValue) ? desiredValue : '';
  const previousValue = typeof state.connectorCategory === 'string' ? state.connectorCategory : '';

  state.connectorCategory = sanitizedValue;
  syncConnectorCategoryPicker({ isValid: true });

  if (triggerUpdate && previousValue !== sanitizedValue) {
    updateConnectorCategoryUi();
    populateStandards();
    updateDownloadState();
    updatePreview();
  }
}

export function populateConnectorCategories() {
  if (!connectorCategorySelect) {
    return;
  }

  const previousValue = typeof state.connectorCategory === 'string' ? state.connectorCategory : '';

  connectorCategorySelect.innerHTML = '';
  if (connectorCategoryPickerList) {
    connectorCategoryPickerList.innerHTML = '';
  }

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = PLACEHOLDER_BLANK;
  placeholder.disabled = true;
  placeholder.selected = !previousValue;
  connectorCategorySelect.appendChild(placeholder);

  connectorCatalog.forEach(category => {
    const opt = document.createElement('option');
    opt.value = category.id;
    opt.textContent = category.label;
    connectorCategorySelect.appendChild(opt);

    if (connectorCategoryPickerList) {
      const item = document.createElement('li');
      item.className = 'bolt-drive-picker__option';
      item.dataset.value = category.id;
      item.setAttribute('role', 'option');
      item.tabIndex = -1;

      const icon = document.createElement('span');
      icon.className = 'bolt-drive-picker__option-icon';

      const categoryIcon = connectorCategoryImageMap[category.id] || '';
      if (categoryIcon) {
        const image = document.createElement('img');
        image.className = 'bolt-drive-picker__option-icon-image is-rotated-90';
        image.src = categoryIcon;
        image.alt = '';
        image.loading = 'lazy';
        image.decoding = 'async';
        icon.appendChild(image);
      } else {
        icon.classList.add('is-empty');
      }

      const label = document.createElement('span');
      label.className = 'bolt-drive-picker__option-label';
      label.textContent = category.label;

      item.appendChild(icon);
      item.appendChild(label);

      connectorCategoryPickerList.appendChild(item);
    }
  });

  const sanitizedValue = validConnectorCategoryIds.has(previousValue) ? previousValue : '';
  state.connectorCategory = sanitizedValue;
  connectorCategorySelect.value = sanitizedValue;
  if (!sanitizedValue) {
    placeholder.selected = true;
  }

  connectorCategorySelect.disabled = false;
  connectorCategorySelect.title = 'Select connector category';
  connectorCategorySelect.setAttribute('aria-required', 'true');

  if (connectorCategoryPickerButton) {
    const isDisabled = connectorCatalog.length === 0;
    connectorCategoryPickerButton.disabled = isDisabled;
    connectorCategoryPickerButton.setAttribute('aria-expanded', 'false');
  }
  if (connectorCategoryPickerList) {
    connectorCategoryPickerList.hidden = true;
  }
  if (connectorCategoryPicker) {
    connectorCategoryPicker.classList.remove('is-open');
    connectorCategoryPicker.classList.toggle('is-disabled', connectorCatalog.length === 0);
  }

  syncConnectorCategoryPicker({ isValid: true });
}

function findBearingOption(code) {
  if (!code) {
    return null;
  }
  return bearingOptions.find(option => option.code === code) || null;
}

export function syncBearingTypePicker({ isValid = true } = {}) {
  const currentValue = typeof state.bearingType === 'string' ? state.bearingType.trim() : '';
  const sanitizedValue = validBearingCodes.has(currentValue) ? currentValue : '';
  const optionElement =
    sanitizedValue && bearingTypeSelect
      ? bearingTypeSelect.querySelector(`option[value="${sanitizedValue}"]`)
      : null;
  const labelText = optionElement
    ? optionElement.textContent.trim()
    : BEARING_TYPE_PLACEHOLDER_TEXT;

  if (bearingTypeSelect) {
    bearingTypeSelect.value = sanitizedValue;
  }

  if (bearingTypePickerButton) {
    const label = bearingTypePickerButton.querySelector('.bolt-drive-picker__current-label');
    if (label) {
      label.textContent = labelText;
    }
    const iconWrapper = bearingTypePickerButton.querySelector('.bolt-drive-picker__current-icon');
    const iconImage = bearingTypePickerButton.querySelector(
      '.bolt-drive-picker__current-icon-image',
    );
    if (iconWrapper) {
      if (iconImage) {
        if (sanitizedValue) {
          iconImage.src = 'images/bearings/bearing.svg';
          iconImage.hidden = false;
          iconWrapper.classList.remove('is-empty');
        } else {
          iconImage.hidden = true;
          iconImage.removeAttribute('src');
          iconWrapper.classList.add('is-empty');
        }
      } else if (!sanitizedValue) {
        iconWrapper.classList.add('is-empty');
      }
    }

    if (isValid) {
      bearingTypePickerButton.classList.remove('is-invalid');
      bearingTypePickerButton.removeAttribute('aria-invalid');
    } else {
      bearingTypePickerButton.classList.add('is-invalid');
      bearingTypePickerButton.setAttribute('aria-invalid', 'true');
    }
  }

  if (bearingTypePicker) {
    bearingTypePicker.classList.toggle('is-invalid', !isValid);
  }

  if (bearingTypePickerList) {
    const optionElements = Array.from(bearingTypePickerList.querySelectorAll('[role="option"]'));
    optionElements.forEach(option => {
      const isSelected = option.dataset.value === sanitizedValue;
      option.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      option.classList.toggle('is-selected', isSelected);
      option.tabIndex = -1;
    });
  }
}

export function setBearingTypeSelection(nextCode, { triggerUpdate = true } = {}) {
  const desiredValue = typeof nextCode === 'string' ? nextCode.trim() : '';
  const sanitizedValue = validBearingCodes.has(desiredValue) ? desiredValue : '';
  const previousValue = typeof state.bearingType === 'string' ? state.bearingType : '';
  const optionData = findBearingOption(sanitizedValue);

  state.bearingType = sanitizedValue;
  state.bearingDetails = optionData ? optionData.description : '';

  syncBearingTypePicker({ isValid: true });

  if (triggerUpdate && previousValue !== sanitizedValue) {
    updatePreview();
    updateDownloadState();
  }
}

export function populateBearingOptions() {
  if (!bearingTypeSelect) {
    state.bearingType = '';
    state.bearingDetails = '';
    return;
  }

  const previousValue = typeof state.bearingType === 'string' ? state.bearingType : '';
  const sanitizedValue = validBearingCodes.has(previousValue) ? previousValue : '';

  bearingTypeSelect.innerHTML = '';
  if (bearingTypePickerList) {
    bearingTypePickerList.innerHTML = '';
  }

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = BEARING_TYPE_PLACEHOLDER_TEXT;
  placeholder.disabled = true;
  placeholder.selected = !sanitizedValue;
  bearingTypeSelect.appendChild(placeholder);

  bearingOptions.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.code;
    opt.textContent = `${option.code} — ${option.description}`;
    opt.dataset.description = option.description;
    bearingTypeSelect.appendChild(opt);

    if (bearingTypePickerList) {
      const item = document.createElement('li');
      item.className = 'bolt-drive-picker__option';
      item.dataset.value = option.code;
      item.setAttribute('role', 'option');
      item.tabIndex = -1;

      const label = document.createElement('span');
      label.className = 'bolt-drive-picker__option-label';
      label.textContent = `${option.code} — ${option.description}`;

      item.appendChild(label);

      bearingTypePickerList.appendChild(item);
    }
  });

  const selectedOption = findBearingOption(sanitizedValue);
  state.bearingType = sanitizedValue;
  state.bearingDetails = selectedOption ? selectedOption.description : '';

  if (bearingTypePickerButton) {
    bearingTypePickerButton.disabled = bearingOptions.length === 0;
    bearingTypePickerButton.setAttribute('aria-expanded', 'false');
  }
  if (bearingTypePickerList) {
    bearingTypePickerList.hidden = true;
  }
  if (bearingTypePicker) {
    bearingTypePicker.classList.toggle('is-disabled', bearingOptions.length === 0);
    bearingTypePicker.classList.remove('is-open');
  }

  syncBearingTypePicker({ isValid: true });
}

function ensureConnectorCategory() {
  if (!state.connectorCategory) {
    const first = connectorCatalog[0];
    if (first) {
      state.connectorCategory = first.id;
    }
  }
  if (connectorCategorySelect) {
    connectorCategorySelect.value = state.connectorCategory || '';
  }
  syncConnectorCategoryPicker({ isValid: true });
}

export function updateConnectorCategoryUi() {
  if (!notesInput) {
    return;
  }
  if (state.hardwareType !== 'Connector') {
    if (connectorCategoryHelp) {
      connectorCategoryHelp.textContent = '';
      connectorCategoryHelp.classList.add('d-none');
    }
    syncConnectorCategoryPicker({ isValid: true });
    notesInput.placeholder = defaultNotesPlaceholder;
    return;
  }
  const category = findConnectorCategory(state.connectorCategory);
  if (connectorCategorySelect) {
    connectorCategorySelect.value = state.connectorCategory || '';
  }
  syncConnectorCategoryPicker({ isValid: true });
  if (connectorCategoryHelp) {
    if (category && category.help) {
      connectorCategoryHelp.textContent = category.help;
      connectorCategoryHelp.classList.remove('d-none');
    } else {
      connectorCategoryHelp.textContent = '';
      connectorCategoryHelp.classList.add('d-none');
    }
  }
  const example =
    category && category.example ? category.example : 'e.g., 3-pin JST-PH plug, 26 AWG leads';
  notesInput.placeholder = example;
  syncConnectorSeriesPicker({ isValid: true });
}

export { populateThreadSizes, syncThreadSizePicker, setThreadSizeSelection };

export function syncFuseValuePicker({ isValid = true } = {}) {
  const sanitizedType = validFuseTypeIds.has(state.fuseType)
    ? state.fuseType
    : DEFAULT_FUSE_TYPE;

  if (sanitizedType !== state.fuseType) {
    state.fuseType = sanitizedType;
  }

  const showFuseFields = state.hardwareType === 'Fuse';
  const requiresValue = showFuseFields && fuseTypeRequiresValue(sanitizedType);

  let currentValue = typeof state.fuseValue === 'string' ? state.fuseValue.trim() : '';
  if (!requiresValue) {
    currentValue = '';
  }

  const sanitizedValue =
    requiresValue && currentValue && validFuseValuesSet.has(currentValue) ? currentValue : '';

  if (sanitizedValue !== state.fuseValue) {
    state.fuseValue = sanitizedValue;
  }

  if (fuseValueSelect) {
    fuseValueSelect.value = sanitizedValue;
  }

  const effectiveValidity = requiresValue ? isValid : true;

  if (fuseValuePickerButton) {
    const label = fuseValuePickerButton.querySelector('.bolt-drive-picker__current-label');
    if (label) {
      label.textContent = sanitizedValue ? `${sanitizedValue} A` : FUSE_VALUE_PLACEHOLDER_TEXT;
    }
    const iconWrapper = fuseValuePickerButton.querySelector('.bolt-drive-picker__current-icon');
    if (iconWrapper) {
      iconWrapper.classList.add('is-empty');
    }

    if (effectiveValidity) {
      fuseValuePickerButton.classList.remove('is-invalid');
      if (typeof fuseValuePickerButton.removeAttribute === 'function') {
        fuseValuePickerButton.removeAttribute('aria-invalid');
      }
    } else {
      fuseValuePickerButton.classList.add('is-invalid');
      if (typeof fuseValuePickerButton.setAttribute === 'function') {
        fuseValuePickerButton.setAttribute('aria-invalid', 'true');
      }
    }
  }

  if (fuseValuePicker) {
    fuseValuePicker.classList.toggle('is-invalid', !effectiveValidity);
  }

  if (fuseValuePickerList) {
    const optionElements = Array.from(
      fuseValuePickerList.querySelectorAll('[role="option"]'),
    );
    optionElements.forEach(optionElement => {
      const isSelected = optionElement.dataset.value === sanitizedValue;
      optionElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      optionElement.classList.toggle('is-selected', isSelected);
      optionElement.tabIndex = -1;
    });
  }
}

export function setFuseValueSelection(nextValue, { triggerUpdate = true } = {}) {
  const desiredValue = typeof nextValue === 'string' ? nextValue.trim() : '';
  const sanitizedValue = desiredValue && validFuseValuesSet.has(desiredValue) ? desiredValue : '';
  const previousValue = typeof state.fuseValue === 'string' ? state.fuseValue : '';

  state.fuseValue = sanitizedValue;
  syncFuseValuePicker({ isValid: true });

  if (triggerUpdate && previousValue !== sanitizedValue) {
    updateDownloadState();
    updatePreview();
  }
}

export function populateFuseValues() {
  if (!fuseValueSelect) {
    return;
  }
  fuseValueSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = FUSE_VALUE_PLACEHOLDER_TEXT;
  fuseValueSelect.appendChild(placeholder);
  fuseValues.forEach(value => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = `${value} A`;
    fuseValueSelect.appendChild(opt);
  });

  const currentValue = typeof state.fuseValue === 'string' ? state.fuseValue.trim() : '';
  const sanitizedValue = currentValue && validFuseValuesSet.has(currentValue) ? currentValue : '';
  state.fuseValue = sanitizedValue;
  fuseValueSelect.value = sanitizedValue;

  if (fuseValuePickerList) {
    fuseValuePickerList.innerHTML = '';
    fuseValues.forEach(value => {
      const item = document.createElement('li');
      item.className = 'bolt-drive-picker__option';
      item.dataset.value = value;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', 'false');
      item.tabIndex = -1;

      const icon = document.createElement('span');
      icon.className = 'bolt-drive-picker__option-icon is-empty';
      icon.setAttribute('aria-hidden', 'true');
      item.appendChild(icon);

      const label = document.createElement('span');
      label.className = 'bolt-drive-picker__option-label';
      label.textContent = `${value} A`;
      item.appendChild(label);

      fuseValuePickerList.appendChild(item);
    });
    const shouldHideList = !fuseValuePicker || !fuseValuePicker.classList.contains('is-open');
    fuseValuePickerList.hidden = shouldHideList;
  }
  if (fuseValuePickerButton) {
    fuseValuePickerButton.disabled = false;
    fuseValuePickerButton.setAttribute('aria-expanded', 'false');
  }
  if (fuseValuePicker) {
    fuseValuePicker.classList.remove('is-open');
  }

  syncFuseValuePicker({ isValid: true });
}

export function updateGlassOptionVisibility({ resetIfHidden = false } = {}) {
  const shouldShow =
    state.hardwareType === 'Fuse' && CARTRIDGE_FUSE_TYPES.has(state.fuseType);
  const requiresSpeedOptions =
    shouldShow && state.fuseType !== PANEL_MOUNT_FUSE_HOLDER_TYPE;
  if (glassOptionsContainer) {
    glassOptionsContainer.classList.toggle('d-none', !shouldShow);
  }
  if (glassSpeedOptionsContainer) {
    glassSpeedOptionsContainer.classList.toggle('d-none', shouldShow ? !requiresSpeedOptions : false);
  }
  if (shouldShow) {
    if (glassSizeSelect) {
      glassSizeSelect.value = state.glassSize || '';
    }
    if (glassSlowBlowCheckbox) {
      glassSlowBlowCheckbox.disabled = !requiresSpeedOptions;
      glassSlowBlowCheckbox.checked =
        requiresSpeedOptions && state.glassSpeed.startsWith('Slow');
    }
    if (glassFastBlowCheckbox) {
      glassFastBlowCheckbox.disabled = !requiresSpeedOptions;
      glassFastBlowCheckbox.checked =
        requiresSpeedOptions && state.glassSpeed.startsWith('Fast');
    }
    if (!requiresSpeedOptions) {
      state.glassSpeed = '';
    }
  } else if (resetIfHidden) {
    state.glassSpeed = '';
    state.glassSize = '';
    if (glassSlowBlowCheckbox) {
      glassSlowBlowCheckbox.checked = false;
      glassSlowBlowCheckbox.disabled = false;
    }
    if (glassFastBlowCheckbox) {
      glassFastBlowCheckbox.checked = false;
      glassFastBlowCheckbox.disabled = false;
    }
    if (glassSizeSelect) {
      glassSizeSelect.value = '';
    }
  } else {
    if (glassSlowBlowCheckbox) {
      glassSlowBlowCheckbox.disabled = false;
    }
    if (glassFastBlowCheckbox) {
      glassFastBlowCheckbox.disabled = false;
    }
  }
}

function normalizeCustomGraphicSource(value) {
  if (typeof value !== 'string') {
    return DEFAULT_CUSTOM_GRAPHIC_SOURCE;
  }
  const normalized = value.trim().toLowerCase();
  return CUSTOM_GRAPHIC_SOURCES.has(normalized) ? normalized : DEFAULT_CUSTOM_GRAPHIC_SOURCE;
}

function getCurrentIconStyle() {
  state.customIconStyle = DEFAULT_ICON_STYLE;
  return DEFAULT_ICON_STYLE;
}

function setIconSelectEnabled(enabled) {
  if (customIconSelect) {
    customIconSelect.disabled = !enabled;
  }
  if (customIconPickerButton) {
    customIconPickerButton.disabled = !enabled;
    if (!enabled) {
      customIconPickerButton.setAttribute('aria-expanded', 'false');
    }
  }
  if (customIconPickerList) {
    customIconPickerList.hidden = true;
  }
  if (customIconPicker) {
    customIconPicker.classList.toggle('is-disabled', !enabled);
  }
  if (!enabled && typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent('gridfinity:custom-icon-picker-close'));
  }
}

function setIconSearchEnabled(enabled) {
  if (!customIconSearchInput) {
    return;
  }
  customIconSearchInput.disabled = !enabled;
}

function setIconControlsBusy(isBusy) {
  if (customIconSelect) {
    if (isBusy) {
      customIconSelect.setAttribute('aria-busy', 'true');
    } else {
      customIconSelect.removeAttribute('aria-busy');
    }
  }
  if (customIconPickerButton) {
    if (isBusy) {
      customIconPickerButton.setAttribute('aria-busy', 'true');
    } else {
      customIconPickerButton.removeAttribute('aria-busy');
    }
  }
  if (isBusy && typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent('gridfinity:custom-icon-picker-close'));
  }
}

function findCustomIconOption(name) {
  if (!customIconSelect || !name) {
    return null;
  }
  const options = Array.from(customIconSelect.options);
  return options.find(option => option.value === name) || null;
}

function getGlyphFromUnicode(unicode) {
  if (!unicode || typeof unicode !== 'string') {
    return '';
  }
  const segments = unicode.split('-').filter(Boolean);
  if (segments.length === 0) {
    return '';
  }
  try {
    const codePoints = segments.map(segment => parseInt(segment, 16)).filter(codePoint => {
      return Number.isFinite(codePoint) && !Number.isNaN(codePoint);
    });
    if (codePoints.length === 0) {
      return '';
    }
    return String.fromCodePoint(...codePoints);
  } catch {
    return '';
  }
}

function applyGlyphFont(target, style) {
  if (!target) {
    return;
  }
  const normalized = normalizeIconStyle(style || state.customIconStyle || DEFAULT_ICON_STYLE);
  const isBrands = normalized === 'brands';
  const fontStack = isBrands
    ? '"Font Awesome 6 Brands", "Font Awesome 6 Free", "Barlow", "Segoe UI", "Helvetica Neue", Arial, sans-serif'
    : '"Font Awesome 6 Free", "Font Awesome 6 Brands", "Barlow", "Segoe UI", "Helvetica Neue", Arial, sans-serif';
  target.style.fontFamily = fontStack;
  if (isBrands) {
    target.style.fontWeight = '400';
  } else {
    target.style.fontWeight = normalized === 'solid' ? '900' : '400';
  }
}

function resetCustomIconSvgData() {
  customIconAssetRequestId += 1;
  state.customIconSvgData = '';
}

function refreshSelectedCustomIconAsset() {
  const style = DEFAULT_ICON_STYLE;
  const name = typeof state.customIconName === 'string' ? state.customIconName.trim() : '';
  resetCustomIconSvgData();
  if (!name) {
    return;
  }
  const requestId = customIconAssetRequestId;
  loadIconSvg(style, name)
    .then(result => {
      if (customIconAssetRequestId !== requestId) {
        return;
      }
      const currentStyle = normalizeIconStyle(state.customIconStyle || DEFAULT_ICON_STYLE);
      const currentName = typeof state.customIconName === 'string' ? state.customIconName.trim() : '';
      if (currentStyle !== style || currentName !== name) {
        return;
      }
      state.customIconSvgData = result && result.dataUrl ? result.dataUrl : '';
      updatePreview();
      updateDownloadState();
    })
    .catch(error => {
      if (customIconAssetRequestId !== requestId) {
        return;
      }
      const currentStyle = normalizeIconStyle(state.customIconStyle || DEFAULT_ICON_STYLE);
      const currentName = typeof state.customIconName === 'string' ? state.customIconName.trim() : '';
      if (currentStyle !== style || currentName !== name) {
        return;
      }
      console.error('Unable to load Font Awesome icon SVG', error);
      state.customIconSvgData = '';
      updatePreview();
      updateDownloadState();
    });
}

function syncCustomIconPickerDisplay() {
  if (!customIconPickerButton) {
    return;
  }
  const name = typeof state.customIconName === 'string' ? state.customIconName : '';
  const labelFromState = typeof state.customIconLabel === 'string' ? state.customIconLabel : '';
  const unicodeFromState = typeof state.customIconUnicode === 'string' ? state.customIconUnicode : '';
  let resolvedLabel = labelFromState;
  let resolvedUnicode = unicodeFromState;
  let resolvedStyle = normalizeIconStyle(state.customIconStyle || DEFAULT_ICON_STYLE);
  let resolvedGlyph = '';

  const option = name ? findCustomIconOption(name) : null;
  if (option) {
    if (!resolvedLabel) {
      resolvedLabel = option.dataset.label || option.textContent || name;
    }
    if (!resolvedUnicode) {
      resolvedUnicode = option.dataset.unicode || '';
    }
    if (option.dataset.style) {
      resolvedStyle = normalizeIconStyle(option.dataset.style);
    }
    if (option.dataset.glyph) {
      resolvedGlyph = option.dataset.glyph;
    }
  }

  if (!resolvedGlyph && resolvedUnicode) {
    resolvedGlyph = getGlyphFromUnicode(resolvedUnicode);
  }

  const labelElement = customIconPickerButton.querySelector('.bolt-drive-picker__current-label');
  const iconWrapper = customIconPickerButton.querySelector('.bolt-drive-picker__current-icon');
  const glyphElement = customIconPickerButton.querySelector('.bolt-drive-picker__current-icon-glyph');

  const styleLabel = resolvedStyle.charAt(0).toUpperCase() + resolvedStyle.slice(1);
  const buttonLabel = name
    ? `${(resolvedLabel || name).trim()} (${name}) · ${styleLabel}`
    : CUSTOM_ICON_PLACEHOLDER_TEXT;

  if (labelElement) {
    labelElement.textContent = buttonLabel;
  }

  if (glyphElement) {
    if (resolvedGlyph) {
      glyphElement.textContent = resolvedGlyph;
      applyGlyphFont(glyphElement, resolvedStyle);
    } else {
      glyphElement.textContent = '';
      glyphElement.style.fontFamily = '';
      glyphElement.style.fontWeight = '';
    }
  }

  if (iconWrapper) {
    iconWrapper.classList.toggle('is-empty', !resolvedGlyph);
  }

  if (customIconPickerList) {
    const items = Array.from(customIconPickerList.querySelectorAll('[role="option"]'));
    items.forEach(item => {
      const isSelected = item.dataset.value === name;
      item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      item.classList.toggle('is-selected', isSelected);
      item.tabIndex = -1;
    });
  }
}

function clearCustomIconPreview() {
  if (!customIconPreview) {
    return;
  }
  const previousIconClass = customIconPreview.dataset.iconClass;
  if (previousIconClass) {
    customIconPreview.classList.remove(previousIconClass);
    delete customIconPreview.dataset.iconClass;
  }
  Object.values(FONT_AWESOME_STYLE_CLASSES).forEach(cls => {
    customIconPreview.classList.remove(cls);
  });
  customIconPreview.classList.add('d-none');
}

function setCustomIconPreview(style, iconName) {
  if (!customIconPreview) {
    return;
  }
  clearCustomIconPreview();
  const styleClass = FONT_AWESOME_STYLE_CLASSES[style] || FONT_AWESOME_STYLE_CLASSES.solid;
  customIconPreview.classList.remove('d-none');
  customIconPreview.classList.add(styleClass);
  const iconClass = `fa-${iconName}`;
  customIconPreview.classList.add(iconClass);
  customIconPreview.dataset.iconClass = iconClass;
}

function setCustomIconStatus(message, { isError = false, isLoading = false } = {}) {
  if (!customIconStatus) {
    return;
  }
  const normalized = typeof message === 'string' ? message : '';
  customIconStatus.textContent = normalized;
  customIconStatus.classList.remove('text-danger', 'fw-semibold', 'text-muted');
  if (isError) {
    customIconStatus.classList.add('text-danger', 'fw-semibold');
  } else if (isLoading) {
    customIconStatus.classList.add('text-muted');
  }
}

function applyCustomGraphicInfoDisplay() {
  const source = normalizeCustomGraphicSource(state.customGraphicSource);
  const style = getCurrentIconStyle();
  if (customImageNameDisplay) {
    let displayText = '';
    if (source === 'image' && state.customImageName) {
      displayText = state.customImageName;
    } else if (source === 'icon' && state.customIconName) {
      const label = state.customIconLabel || state.customIconName;
      displayText = label;
    } else if (source === 'parts' && state.customPartId) {
      const partOption = getCustomPartOption(state.customPartId);
      displayText = partOption ? partOption.label : state.customPartId;
    }
    if (displayText) {
      customImageNameDisplay.textContent = displayText;
      customImageNameDisplay.classList.remove('d-none');
    } else {
      customImageNameDisplay.textContent = '';
      customImageNameDisplay.classList.add('d-none');
    }
  }
  if (source === 'icon' && state.customIconName && state.customIconUnicode) {
    setCustomIconPreview(style, state.customIconName);
  } else {
    clearCustomIconPreview();
  }
  if (source === 'parts') {
    syncCustomPartPicker({ isValid: true });
  }
  if (customIconSelect) {
    if (source === 'icon' && state.customIconName) {
      customIconSelect.value = state.customIconName;
    } else if (source !== 'icon') {
      customIconSelect.value = '';
      customIconSelect.selectedIndex = -1;
    }
  }
  syncCustomIconPickerDisplay();
}

export async function refreshCustomIconOptions({ preserveSelection = true } = {}) {
  if (!customIconSelect) {
    return;
  }
  const source = normalizeCustomGraphicSource(state.customGraphicSource);
  if (source !== 'icon') {
    return;
  }
  const style = getCurrentIconStyle();
  const query = customIconSearchInput ? customIconSearchInput.value : '';
  const requestId = (customIconRequestId += 1);
  setIconControlsBusy(true);
  setIconSelectEnabled(false);
  setIconSearchEnabled(false);
  setCustomIconStatus('Loading icons…', { isLoading: true });
  if (customIconPickerList) {
    customIconPickerList.innerHTML = '';
  }
  try {
    const collection = await loadIconsForStyle(style);
    if (requestId !== customIconRequestId) {
      return;
    }
    lastIconCollection = { style, total: collection.icons.length };
    const filtered = filterIcons(collection.icons, query);
    customIconSelect.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = CUSTOM_ICON_PLACEHOLDER_TEXT;
    customIconSelect.appendChild(placeholder);

    if (customIconPickerList) {
      customIconPickerList.innerHTML = '';
    }

    filtered.forEach(icon => {
      const option = document.createElement('option');
      option.value = icon.name;
      const glyph = getGlyphFromUnicode(icon.unicode);
      const labelText = `${icon.label} (${icon.name})`;
      option.textContent = glyph ? `${glyph}  ${labelText}` : labelText;
      option.dataset.label = icon.label;
      option.dataset.unicode = icon.unicode;
      option.dataset.style = icon.style;
      option.dataset.glyph = glyph;
      if (glyph) {
        const isBrands = icon.style === 'brands';
        const fontStack = isBrands
          ? '"Font Awesome 6 Brands", "Font Awesome 6 Free", "Barlow", "Segoe UI", "Helvetica Neue", Arial, sans-serif'
          : '"Font Awesome 6 Free", "Font Awesome 6 Brands", "Barlow", "Segoe UI", "Helvetica Neue", Arial, sans-serif';
        option.style.fontFamily = fontStack;
        option.style.fontWeight = isBrands ? '400' : icon.style === 'solid' ? '900' : '400';
      } else {
        option.style.fontFamily = '';
        option.style.fontWeight = '';
      }
      customIconSelect.appendChild(option);

      if (customIconPickerList) {
        const item = document.createElement('li');
        item.className = 'bolt-drive-picker__option';
        item.dataset.value = icon.name;
        item.dataset.label = icon.label;
        item.dataset.unicode = icon.unicode;
        item.dataset.style = icon.style;
        item.dataset.glyph = glyph;
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', 'false');
        item.tabIndex = -1;

        const iconWrapper = document.createElement('span');
        iconWrapper.className = glyph
          ? 'bolt-drive-picker__option-icon'
          : 'bolt-drive-picker__option-icon is-empty';
        iconWrapper.setAttribute('aria-hidden', 'true');

        const glyphElement = document.createElement('span');
        glyphElement.className = 'bolt-drive-picker__option-icon-glyph';
        glyphElement.textContent = glyph;
        if (glyph) {
          applyGlyphFont(glyphElement, icon.style);
        } else {
          glyphElement.style.fontFamily = '';
          glyphElement.style.fontWeight = '';
        }
        iconWrapper.appendChild(glyphElement);
        item.appendChild(iconWrapper);

        const labelElement = document.createElement('span');
        labelElement.className = 'bolt-drive-picker__option-label';
        labelElement.textContent = labelText;
        item.appendChild(labelElement);

        customIconPickerList.appendChild(item);
      }
    });

    if (customIconPickerList) {
      customIconPickerList.hidden = true;
    }
    if (filtered.length === 0) {
      setCustomIconStatus('No icons match your search.');
      customIconSelect.value = '';
      customIconSelect.selectedIndex = -1;
      setIconSelectEnabled(false);
    } else {
      const total = collection.icons.length;
      const message =
        filtered.length === total
          ? `Showing ${filtered.length.toLocaleString()} icons.`
          : `Showing ${filtered.length.toLocaleString()} of ${total.toLocaleString()} icons.`;
      setCustomIconStatus(message);
      if (preserveSelection && state.customIconName) {
        customIconSelect.value = state.customIconName;
        if (customIconSelect.selectedIndex === -1) {
          state.customIconName = '';
          state.customIconUnicode = '';
          state.customIconLabel = '';
        }
      } else {
        customIconSelect.value = '';
        customIconSelect.selectedIndex = -1;
      }
      setIconSelectEnabled(true);
    }
    setIconControlsBusy(false);
    setIconSearchEnabled(true);
    syncCustomIconPickerDisplay();
    applyCustomGraphicInfoDisplay();
  } catch (error) {
    if (requestId !== customIconRequestId) {
      return;
    }
    console.error('Unable to load Font Awesome icons', error);
    customIconSelect.innerHTML = '';
    if (customIconPickerList) {
      customIconPickerList.innerHTML = '';
      customIconPickerList.hidden = true;
    }
    setIconControlsBusy(false);
    setIconSelectEnabled(false);
    setIconSearchEnabled(true);
    setCustomIconStatus('Unable to load Font Awesome icons. Check your connection and try again.', {
      isError: true,
    });
    syncCustomIconPickerDisplay();
  }
}

export function setCustomGraphicSource(source, options = {}) {
  const normalized = normalizeCustomGraphicSource(source);
  const previous = normalizeCustomGraphicSource(state.customGraphicSource);
  state.customGraphicSource = normalized;
  if (normalized === 'icon' && !state.customIconStyle) {
    state.customIconStyle = DEFAULT_ICON_STYLE;
  }
  updateCustomImageUi();
  if (normalized === 'icon' && previous !== 'icon') {
    refreshCustomIconOptions({ preserveSelection: true });
    if (state.customIconName) {
      refreshSelectedCustomIconAsset();
    }
  }
  if (options.triggerUpdate !== false) {
    updateDownloadState();
    updatePreview();
  }
}

export function setCustomIconSelection(icon = {}) {
  const style = DEFAULT_ICON_STYLE;
  const name = typeof icon.name === 'string' ? icon.name : '';
  const unicode = typeof icon.unicode === 'string' ? icon.unicode : '';
  const label = typeof icon.label === 'string' && icon.label.trim().length > 0 ? icon.label : name;
  state.customGraphicSource = 'icon';
  state.customIconStyle = style;
  state.customIconName = name;
  state.customIconUnicode = unicode;
  state.customIconLabel = label;
  refreshSelectedCustomIconAsset();
  applyCustomGraphicInfoDisplay();
  if (!state.customIconUnicode && state.customIconName) {
    findIcon(style, state.customIconName)
      .then(record => {
        if (!record) {
          return;
        }
        if (state.customIconName !== record.name) {
          return;
        }
        state.customIconUnicode = record.unicode;
        state.customIconLabel = record.label;
        applyCustomGraphicInfoDisplay();
        updatePreview();
        updateDownloadState();
      })
      .catch(error => {
        console.error('Unable to resolve Font Awesome icon', error);
      });
  }
  updateCustomImageUi();
  updateDownloadState();
  updatePreview();
}

export function ensureCustomIconAsset() {
  if (state.customGraphicSource !== 'icon') {
    return;
  }
  if (!state.customIconName) {
    resetCustomIconSvgData();
    return;
  }
  if (state.customIconSvgData) {
    return;
  }
  refreshSelectedCustomIconAsset();
}

export function updateCustomImageUi() {
  const source = normalizeCustomGraphicSource(state.customGraphicSource);
  state.customGraphicSource = source;
  if (Array.isArray(customGraphicSourceRadios)) {
    customGraphicSourceRadios.forEach(radio => {
      if (!radio) {
        return;
      }
      radio.checked = radio.value === source;
    });
  }
  if (customImageFields) {
    customImageFields.classList.toggle('d-none', source !== 'image');
  }
  if (customIconFields) {
    customIconFields.classList.toggle('d-none', source !== 'icon');
  }
  if (customPartFields) {
    customPartFields.classList.toggle('d-none', source !== 'parts');
  }
  const hasImage = source === 'image' && Boolean(state.customImageData);
  const hasIcon =
    source === 'icon' && Boolean(state.customIconUnicode || state.customIconSvgData);
  const hasPart = source === 'parts' && Boolean(state.customPartId);
  if (customImageClearButton) {
    let label = 'Clear selection';
    if (source === 'icon') {
      label = 'Remove icon';
    } else if (source === 'parts') {
      label = 'Remove part icon';
    } else {
      label = 'Remove image';
    }
    customImageClearButton.disabled = !(hasImage || hasIcon || hasPart);
    customImageClearButton.textContent = label;
    customImageClearButton.setAttribute('aria-label', label);
  }
  if (source === 'icon') {
    const style = getCurrentIconStyle();
    const needsRefresh =
      !lastIconCollection ||
      lastIconCollection.style !== style ||
      !customIconSelect ||
      customIconSelect.options.length === 0;
    if (needsRefresh) {
      refreshCustomIconOptions({ preserveSelection: true });
    } else {
      setIconControlsBusy(false);
      const enableSelect =
        !!customIconSelect && !customIconSelect.disabled && customIconSelect.options.length > 0;
      setIconSelectEnabled(enableSelect);
      setIconSearchEnabled(true);
    }
  } else if (source === 'parts') {
    setIconControlsBusy(false);
    setIconSelectEnabled(false);
    setIconSearchEnabled(false);
    setCustomIconStatus('');
    syncCustomPartPicker({ isValid: true });
  } else {
    setIconControlsBusy(false);
    setIconSelectEnabled(false);
    setIconSearchEnabled(false);
    setCustomIconStatus('');
  }
  if (source === 'image' && state.customImageName && customImageNameDisplay) {
    customImageNameDisplay.textContent = state.customImageName;
    customImageNameDisplay.classList.remove('d-none');
  }
  if (source === 'image' && !state.customImageName && customImageNameDisplay) {
    customImageNameDisplay.textContent = '';
    customImageNameDisplay.classList.add('d-none');
  }
  applyCustomGraphicInfoDisplay();
}

export function clearCustomImage({ resetInput = true } = {}) {
  const source = normalizeCustomGraphicSource(state.customGraphicSource);
  if (source === 'icon') {
    resetCustomIconSvgData();
    state.customIconName = '';
    state.customIconUnicode = '';
    state.customIconLabel = '';
    if (customIconSelect) {
      customIconSelect.value = '';
      customIconSelect.selectedIndex = -1;
    }
  } else if (source === 'parts') {
    state.customPartId = '';
    syncCustomPartPicker({ isValid: true });
  } else {
    state.customImageData = '';
    state.customImageName = '';
    if (resetInput && customImageInput) {
      customImageInput.value = '';
    }
  }
  updateCustomImageUi();
  updatePreview();
  updateDownloadState();
}

export function handleCustomImageFile(file) {
  if (!file) {
    return;
  }
  const isImage = !file.type || file.type.startsWith('image/');
  if (!isImage) {
    alert('Please select an image file (PNG, JPG, SVG, GIF).');
    if (customImageInput) {
      customImageInput.value = '';
    }
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const result = typeof reader.result === 'string' ? reader.result : '';
    state.customGraphicSource = 'image';
    state.customIconName = '';
    state.customIconUnicode = '';
    state.customIconLabel = '';
    resetCustomIconSvgData();
    state.customImageData = result;
    state.customImageName = file.name || 'Custom image';
    updateCustomImageUi();
    updatePreview();
    updateDownloadState();
    if (customImageInput) {
      customImageInput.value = '';
    }
  };
  reader.onerror = () => {
    console.error('Unable to load custom image', reader.error);
    clearCustomImage({ resetInput: false });
  };
  reader.readAsDataURL(file);
}

function populateBoltOptions() {
  if (!boltHeadSelect || !boltDriveSelect) {
    return;
  }

  const previousHead = typeof state.boltHead === 'string' ? state.boltHead : '';
  const previousDrive = typeof state.boltDrive === 'string' ? state.boltDrive : '';
  const isScrew = state.hardwareType === 'Screw';
  const headOptions = getFastenerHeadOptions();
  const headPlaceholderText = isScrew
    ? SCREW_TYPE_PLACEHOLDER_TEXT
    : BOLT_HEAD_PLACEHOLDER_TEXT;

  boltHeadSelect.innerHTML = '';
  boltDriveSelect.innerHTML = '';
  if (boltHeadPickerList) {
    boltHeadPickerList.innerHTML = '';
  }
  if (boltDrivePickerList) {
    boltDrivePickerList.innerHTML = '';
  }

  const headPlaceholder = document.createElement('option');
  headPlaceholder.value = '';
  headPlaceholder.textContent = headPlaceholderText;
  headPlaceholder.disabled = true;
  headPlaceholder.selected = !previousHead;
  boltHeadSelect.appendChild(headPlaceholder);

  const drivePlaceholder = document.createElement('option');
  drivePlaceholder.value = '';
  drivePlaceholder.textContent = BOLT_DRIVE_PLACEHOLDER_TEXT;
  drivePlaceholder.disabled = true;
  drivePlaceholder.selected = !previousDrive;
  boltDriveSelect.appendChild(drivePlaceholder);

  headOptions.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.id;
    opt.textContent = option.label;
    boltHeadSelect.appendChild(opt);

    if (boltHeadPickerList) {
      const item = document.createElement('li');
      item.className = 'bolt-drive-picker__option';
      item.dataset.value = option.id;
      item.setAttribute('role', 'option');
      item.tabIndex = -1;

      const icon = document.createElement('span');
      icon.className = 'bolt-drive-picker__option-icon';

      const image = document.createElement('img');
      image.className = 'bolt-drive-picker__option-icon-image';
      image.src = getFastenerHeadImagePath(option);
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      icon.appendChild(image);

      const label = document.createElement('span');
      label.className = 'bolt-drive-picker__option-label';
      label.textContent = option.label;

      item.appendChild(icon);
      item.appendChild(label);

      boltHeadPickerList.appendChild(item);
    }
  });

  boltDriveOptions.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.id;
    opt.textContent = option.label;
    boltDriveSelect.appendChild(opt);

    if (boltDrivePickerList) {
      const item = document.createElement('li');
      item.className = 'bolt-drive-picker__option';
      item.dataset.value = option.id;
      item.setAttribute('role', 'option');
      item.tabIndex = -1;

      const icon = document.createElement('span');
      icon.className = 'bolt-drive-picker__option-icon';

      const image = document.createElement('img');
      image.className = 'bolt-drive-picker__option-icon-image';
      image.src = `images/bolts/drive/${option.image}.svg`;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      icon.appendChild(image);

      const label = document.createElement('span');
      label.className = 'bolt-drive-picker__option-label';
      label.textContent = option.label;

      item.appendChild(icon);
      item.appendChild(label);

      boltDrivePickerList.appendChild(item);
    }
  });

  setBoltHeadSelection(previousHead, { triggerUpdate: false });
  setBoltDriveSelection(previousDrive, { triggerUpdate: false });

  boltHeadSelect.disabled = false;
  boltHeadSelect.title = isScrew ? 'Select screw type' : 'Select head style';
  boltHeadSelect.setAttribute('aria-required', 'true');

  boltDriveSelect.disabled = false;
  boltDriveSelect.title = 'Select drive style';
  boltDriveSelect.setAttribute('aria-required', 'true');

  if (boltHeadPickerButton) {
    boltHeadPickerButton.disabled = false;
    boltHeadPickerButton.setAttribute('aria-expanded', 'false');
  }
  if (boltHeadPickerList) {
    boltHeadPickerList.hidden = true;
  }
  if (boltDrivePickerButton) {
    boltDrivePickerButton.disabled = false;
    boltDrivePickerButton.setAttribute('aria-expanded', 'false');
  }
  if (boltDrivePickerList) {
    boltDrivePickerList.hidden = true;
  }
}

export function populateStandards() {
  const previousCode = typeof state.standardCode === 'string' ? state.standardCode : '';

  if (connectorSeriesPicker) {
    connectorSeriesPicker.classList.add('d-none');
    connectorSeriesPicker.classList.remove('is-open');
    connectorSeriesPicker.setAttribute('aria-hidden', 'true');
  }
  if (connectorSeriesPickerButton) {
    connectorSeriesPickerButton.disabled = true;
    connectorSeriesPickerButton.setAttribute('aria-expanded', 'false');
  }
  if (connectorSeriesPickerList) {
    connectorSeriesPickerList.hidden = true;
    connectorSeriesPickerList.innerHTML = '';
  }
  if (standardSelect) {
    standardSelect.classList.remove('d-none');
  }

  if (state.hardwareType === 'Bolt' || state.hardwareType === 'Screw') {
    standardFilterState.query = '';
    if (standardSelect) {
      standardSelect.innerHTML = '';
      standardSelect.disabled = true;
      standardSelect.title = '';
      standardSelect.value = '';
    }
    state.standard = '';
    state.standardCode = '';
    populateBoltOptions();
    updatePreview();
    return;
  }

  if (state.hardwareType === 'Nut') {
    if (standardSelect) {
      standardSelect.innerHTML = '';
      standardSelect.disabled = true;
      standardSelect.title = '';
      standardSelect.value = '';
    }
    state.standard = '';
    state.standardCode = '';
    populateNutTypeOptions();
    updatePreview();
    return;
  }

  if (state.hardwareType === 'Washer') {
    if (standardSelect) {
      standardSelect.innerHTML = '';
      standardSelect.disabled = true;
      standardSelect.title = '';
      standardSelect.value = '';
    }
    state.standard = '';
    state.standardCode = '';
    populateWasherTypeOptions();
    updatePreview();
    return;
  }

  if (!standardSelect) {
    return;
  }

  standardSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';

  if (ELECTRICAL_COMPONENT_TYPES.has(state.hardwareType)) {
    placeholder.textContent = 'Not used for electrical component labels';
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.dataset.defaultText = placeholder.textContent;
    standardSelect.appendChild(placeholder);
    standardSelect.disabled = true;
    standardSelect.title = '';
    state.standard = '';
    state.standardCode = '';
    standardSelect.value = '';
    updatePreview();
    return;
  }

  if (state.hardwareType === 'Custom') {
    placeholder.textContent = 'Not used for custom labels';
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.dataset.defaultText = placeholder.textContent;
    standardSelect.appendChild(placeholder);
    standardSelect.disabled = true;
    standardSelect.title = '';
    state.standard = '';
    state.standardCode = '';
    standardSelect.value = '';
    updatePreview();
    return;
  }

  if (state.hardwareType === 'Fuse') {
    placeholder.textContent = 'Not used for fuse labels';
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.dataset.defaultText = placeholder.textContent;
    standardSelect.appendChild(placeholder);
    standardSelect.disabled = true;
    standardSelect.title = '';
    state.standard = '';
    state.standardCode = '';
    standardSelect.value = '';
    updatePreview();
    return;
  }

  if (state.hardwareType === 'Switch') {
    placeholder.textContent = 'Not used for switch labels';
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.dataset.defaultText = placeholder.textContent;
    standardSelect.appendChild(placeholder);
    standardSelect.disabled = true;
    standardSelect.title = '';
    state.standard = '';
    state.standardCode = '';
    standardSelect.value = '';
    updatePreview();
    return;
  }

  let standards = [];
  let placeholderText = STANDARD_PLACEHOLDER_TEXT;
  let noOptionsText = 'No standards available';
  let titleText = 'Type to filter standards (Esc clears filter)';
  if (state.hardwareType === 'Connector') {
    const category = findConnectorCategory(state.connectorCategory);
    standards = category && Array.isArray(category.series) ? category.series : [];
    placeholderText = CONNECTOR_PLACEHOLDER_TEXT;
    noOptionsText = 'No connector series available';
    titleText = 'Type to filter connector series (Esc clears filter)';

    if (connectorSeriesPicker) {
      connectorSeriesPicker.classList.remove('d-none');
      connectorSeriesPicker.setAttribute('aria-hidden', 'false');
      connectorSeriesPicker.classList.toggle('is-disabled', standards.length === 0);
    }
    if (connectorSeriesPickerButton) {
      connectorSeriesPickerButton.disabled = standards.length === 0;
      connectorSeriesPickerButton.setAttribute('aria-expanded', 'false');
      connectorSeriesPickerButton.setAttribute('aria-labelledby', 'standard-field-label');
    }
    if (standardSelect) {
      standardSelect.classList.add('d-none');
    }
  } else {
    const subset = hardwareCatalog[state.hardwareType];
    standards = Array.isArray(subset) ? subset : [];
  }

  standardFilterState.query = '';

  if (standards.length === 0) {
    placeholder.textContent = noOptionsText;
    placeholder.dataset.defaultText = placeholder.textContent;
    placeholder.disabled = false;
    placeholder.selected = true;
    standardSelect.appendChild(placeholder);
    standardSelect.disabled = true;
    standardSelect.title = '';
    state.standard = '';
    state.standardCode = '';
    updatePreview();
    return;
  }

  placeholder.textContent = placeholderText;
  placeholder.dataset.defaultText = placeholderText;
  placeholder.disabled = false;
  placeholder.selected = true;
  standardSelect.appendChild(placeholder);
  standards.forEach(entry => {
    const opt = document.createElement('option');
    opt.value = entry.code;
    if (state.hardwareType === 'Connector') {
      const display = entry.name ? `${entry.code} — ${entry.name}` : entry.code;
      opt.textContent = display;
      opt.dataset.name = entry.name || entry.code;
    } else {
      opt.textContent = `${entry.code} — ${entry.name}`;
      opt.dataset.name = entry.name;
    }
    standardSelect.appendChild(opt);

    if (state.hardwareType === 'Connector' && connectorSeriesPickerList) {
      const item = document.createElement('li');
      item.className = 'bolt-drive-picker__option';
      item.dataset.value = entry.code;
      item.dataset.name = entry.name || entry.code;
      item.setAttribute('role', 'option');
      item.tabIndex = -1;

      const icon = document.createElement('span');
      icon.className = 'bolt-drive-picker__option-icon';

      const resolvedIcon = getConnectorSeriesImage(state.connectorCategory, entry.code);
      if (resolvedIcon) {
        const image = document.createElement('img');
        image.className = 'bolt-drive-picker__option-icon-image is-rotated-90';
        image.src = resolvedIcon;
        image.alt = '';
        image.loading = 'lazy';
        image.decoding = 'async';
        icon.appendChild(image);
      } else {
        icon.classList.add('is-empty');
      }

      const label = document.createElement('span');
      label.className = 'bolt-drive-picker__option-label';
      label.textContent = entry.name ? `${entry.code} — ${entry.name}` : entry.code;

      item.appendChild(icon);
      item.appendChild(label);

      connectorSeriesPickerList.appendChild(item);
    }
  });
  standardSelect.disabled = false;
  standardSelect.title = titleText;

  const availableOption = previousCode
    ? Array.from(standardSelect.options).find(option => option.value === previousCode)
    : null;

  if (availableOption && availableOption.value) {
    standardSelect.value = availableOption.value;
    const displayName = availableOption.dataset.name || availableOption.textContent || '';
    state.standardCode = availableOption.value;
    state.standard = displayName;
  } else {
    standardSelect.value = '';
    placeholder.selected = true;
    state.standard = '';
    state.standardCode = '';
  }

  filterStandardOptions('');
  if (state.hardwareType === 'Connector') {
    syncConnectorSeriesPicker({ isValid: true });
  }
  updatePreview();
}

export function filterStandardOptions(query) {
  if (!standardSelect || standardSelect.disabled) {
    return;
  }
  const normalized = (query || '').trim().toLowerCase();
  let selectionCleared = false;
  let matchesFound = false;
  const isConnectorType = state.hardwareType === 'Connector';
  const connectorListOptions = isConnectorType && connectorSeriesPickerList
    ? Array.from(connectorSeriesPickerList.querySelectorAll('[role="option"]'))
    : [];
  Array.from(standardSelect.options).forEach(option => {
    if (!option.value) {
      option.hidden = false;
      option.style.display = '';
      return;
    }
    const code = option.value.toLowerCase();
    const name = (option.dataset.name || '').toLowerCase();
    const matches = !normalized || code.includes(normalized) || name.includes(normalized);
    option.hidden = !matches;
    option.style.display = matches ? '' : 'none';
    if (matches) {
      matchesFound = true;
    } else if (option.selected) {
      selectionCleared = true;
    }

    if (connectorListOptions.length > 0) {
      const listOption = connectorListOptions.find(item => item.dataset.value === option.value);
      if (listOption) {
        listOption.hidden = !matches;
        listOption.style.display = matches ? '' : 'none';
      }
    }
  });

  if (selectionCleared) {
    standardSelect.value = '';
    if (state.standard || state.standardCode) {
      state.standard = '';
      state.standardCode = '';
      updatePreview();
    }
    updateDownloadState();
  }

  if (isConnectorType) {
    syncConnectorSeriesPicker({ isValid: true });
  }

  const placeholder = standardSelect.querySelector('option[value=""]');
  if (placeholder) {
    const defaultText = placeholder.dataset.defaultText || STANDARD_PLACEHOLDER_TEXT;
    if (!normalized) {
      placeholder.textContent = defaultText;
      placeholder.disabled = false;
      placeholder.style.display = '';
      placeholder.hidden = false;
      if (!standardSelect.value) {
        placeholder.selected = true;
      }
    } else if (!matchesFound) {
      placeholder.textContent = 'No matches found';
      placeholder.disabled = true;
      placeholder.style.display = '';
      placeholder.hidden = false;
      placeholder.selected = true;
    } else {
      placeholder.textContent = defaultText;
      placeholder.disabled = false;
      placeholder.style.display = '';
      placeholder.hidden = false;
    }
  }
}

export function clearStandardFilter() {
  standardFilterState.query = '';
  if (!standardSelect || standardSelect.disabled) {
    return;
  }
  filterStandardOptions('');
}

export function handleStandardSelectKeydown(event) {
  if (!standardSelect || standardSelect.disabled) {
    return;
  }

  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  const key = event.key;

  if (key === 'Escape') {
    if (standardFilterState.query) {
      event.preventDefault();
      clearStandardFilter();
    }
    return;
  }

  if (key === 'Backspace') {
    if (standardFilterState.query) {
      event.preventDefault();
      standardFilterState.query = standardFilterState.query.slice(0, -1);
      filterStandardOptions(standardFilterState.query);
    }
    return;
  }

  if (key === 'Delete') {
    if (standardFilterState.query) {
      event.preventDefault();
      clearStandardFilter();
    }
    return;
  }

  if (key.length === 1) {
    event.preventDefault();
    standardFilterState.query += key.toLowerCase();
    filterStandardOptions(standardFilterState.query);
  }
}

function syncHardwareTypeControls(nextType) {
  const desiredType = nextType || state.hardwareType;
  const sanitizedType = hardwareTypeOptions.has(desiredType) ? desiredType : '';

  if (hardwareTypeSelect && sanitizedType) {
    hardwareTypeSelect.value = sanitizedType;
  }

  hardwareTypeRadios.forEach(radio => {
    radio.checked = radio.value === sanitizedType;
  });

  syncHardwareTypePicker();
}

export function onHardwareTypeChange() {
  const type = state.hardwareType;
  if (ELECTRICAL_COMPONENT_TYPES.has(type)) {
    state.componentCategory = type;
  }
  syncHardwareTypeControls(type);
  const requiresThreadDetails = type === 'Bolt' || type === 'Screw';
  const showFuseFields = type === 'Fuse';
  const showConnectorFields = type === 'Connector';
  const showSwitchFields = type === 'Switch';
  const showComponentFields = ELECTRICAL_COMPONENT_TYPES.has(type);
  const showCustomFields = type === 'Custom';
  const showBearingFields = type === 'Bearing';
  const showBoltFields = type === 'Bolt';
  const showScrewFields = type === 'Screw';
  const showFastenerFields = showBoltFields || showScrewFields;
  const showNutFields = type === 'Nut';
  const showWasherFields = type === 'Washer';

  if (lengthContainer) {
    lengthContainer.style.display = requiresThreadDetails ? '' : 'none';
  }

  syncThreadLengthInputIcon(type);

  if (switchSelectionRow) {
    switchSelectionRow.classList.toggle('d-none', !showSwitchFields);
  }
  if (switchTypeContainer) {
    switchTypeContainer.classList.toggle('d-none', !showSwitchFields);
    switchTypeContainer.setAttribute('aria-hidden', !showSwitchFields ? 'true' : 'false');
  }
  if (switchTypeSelect) {
    if (showSwitchFields) {
      const sanitizedSwitchType = validSwitchTypeIds.has(state.switchType)
        ? state.switchType
        : '';
      switchTypeSelect.value = sanitizedSwitchType;
      switchTypeSelect.disabled = false;
      switchTypeSelect.setAttribute('aria-required', 'true');
      switchTypeSelect.title = 'Select switch type';
    } else {
      switchTypeSelect.disabled = true;
      switchTypeSelect.setAttribute('aria-required', 'false');
      switchTypeSelect.title = '';
    }
  }
  if (switchTypePickerButton) {
    switchTypePickerButton.disabled = !showSwitchFields;
    if (!showSwitchFields) {
      switchTypePickerButton.setAttribute('aria-expanded', 'false');
    } else {
      const isOpen = Boolean(
        switchTypePicker && switchTypePicker.classList.contains('is-open'),
      );
      switchTypePickerButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
  }
  if (switchTypePickerList) {
    const shouldHideSwitchList =
      !showSwitchFields ||
      !switchTypePicker ||
      !switchTypePicker.classList.contains('is-open');
    switchTypePickerList.hidden = shouldHideSwitchList;
  }
  if (!showSwitchFields && switchTypePicker) {
    switchTypePicker.classList.remove('is-open');
    document.dispatchEvent(new CustomEvent('gridfinity:switch-picker-close'));
  }

  if (bearingOptionsContainer) {
    const hidden = !showBearingFields;
    bearingOptionsContainer.classList.toggle('d-none', hidden);
    bearingOptionsContainer.setAttribute('aria-hidden', hidden ? 'true' : 'false');
  }
  if (bearingTypeSelect) {
    bearingTypeSelect.disabled = !showBearingFields;
  }
  if (bearingTypePickerButton) {
    bearingTypePickerButton.disabled = !showBearingFields || bearingOptions.length === 0;
    if (!showBearingFields) {
      bearingTypePickerButton.setAttribute('aria-expanded', 'false');
    }
  }
  if (bearingTypePickerList) {
    bearingTypePickerList.hidden = true;
  }
  if (bearingTypePicker) {
    if (!showBearingFields) {
      bearingTypePicker.classList.remove('is-open');
    }
    const isDisabled = !showBearingFields || bearingOptions.length === 0;
    bearingTypePicker.classList.toggle('is-disabled', isDisabled);
  }
  if (showBearingFields) {
    syncBearingTypePicker({ isValid: true });
  }

  if (customFieldsContainer) {
    customFieldsContainer.classList.toggle('d-none', !showCustomFields);
  }
  if (connectorCategoryContainer) {
    const hidden = !showConnectorFields;
    connectorCategoryContainer.classList.toggle('d-none', hidden);
    connectorCategoryContainer.setAttribute('aria-hidden', hidden ? 'true' : 'false');
  }
  if (componentCategoryContainer) {
    const hidden = !showComponentFields;
    componentCategoryContainer.classList.toggle('d-none', hidden);
    componentCategoryContainer.setAttribute('aria-hidden', hidden ? 'true' : 'false');
  }
  if (componentMountContainer) {
    const hidden = !showComponentFields;
    componentMountContainer.classList.toggle('d-none', hidden);
    componentMountContainer.setAttribute('aria-hidden', hidden ? 'true' : 'false');
  }
  if (componentCategoryRadios) {
    const desiredCategory = state.componentCategory || 'Resistor';
    componentCategoryRadios.forEach(radio => {
      radio.disabled = !showComponentFields;
      if (showComponentFields) {
        radio.checked = radio.value === desiredCategory;
      }
    });
    if (showComponentFields) {
      const activeCategory = componentCategoryRadios.find(radio => radio.checked);
      if (activeCategory) {
        state.componentCategory = activeCategory.value;
      }
      updateComponentValueUi({ resetIfHidden: false });
    }
  }
  if (componentMountSelect) {
    if (showComponentFields) {
      const desiredMount = validComponentMounts.has(state.componentMount)
        ? state.componentMount
        : 'Through-Hole';
      state.componentMount = desiredMount;
      componentMountSelect.value = desiredMount;
    }
    componentMountSelect.disabled = !showComponentFields;
  }

  if (componentMountPickerButton) {
    componentMountPickerButton.disabled = !showComponentFields;
    const isOpen = Boolean(
      showComponentFields &&
        componentMountPicker &&
        componentMountPicker.classList.contains('is-open'),
    );
    componentMountPickerButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  if (componentMountPickerList) {
    const shouldHideList =
      !showComponentFields ||
      !componentMountPicker ||
      !componentMountPicker.classList.contains('is-open');
    componentMountPickerList.hidden = shouldHideList;
  }

  if (componentMountPicker) {
    if (!showComponentFields) {
      componentMountPicker.classList.remove('is-open');
      document.dispatchEvent(new CustomEvent('gridfinity:component-picker-close'));
    }
    componentMountPicker.classList.toggle('is-disabled', !showComponentFields);
  }

  if (!showComponentFields) {
    syncComponentMountPicker({ isValid: true });
  } else {
    syncComponentMountPicker({ isValid: true });
  }

  updateComponentValueUi({ resetIfHidden: !showComponentFields });

  if (measurementSystemContainer) {
    const hideMeasurementSystem =
      showFuseFields ||
      showConnectorFields ||
      showSwitchFields ||
      showCustomFields ||
      showBearingFields ||
      showComponentFields;
    measurementSystemContainer.style.display = hideMeasurementSystem ? 'none' : '';
    measurementSystemContainer.setAttribute(
      'aria-hidden',
      hideMeasurementSystem ? 'true' : 'false',
    );
  }
  systemTypeRadios.forEach(radio => {
    radio.disabled =
      showFuseFields ||
      showConnectorFields ||
      showSwitchFields ||
      showCustomFields ||
      showBearingFields ||
      showComponentFields;
  });

  if (threadLengthRow) {
    const hideThreadLength =
      showFuseFields ||
      showConnectorFields ||
      showSwitchFields ||
      showCustomFields ||
      showBearingFields ||
      showComponentFields;
    threadLengthRow.classList.toggle(
      'single-column',
      !requiresThreadDetails &&
        !showFuseFields &&
        !showConnectorFields &&
        !showSwitchFields &&
        !showCustomFields &&
        !showBearingFields &&
        !showComponentFields &&
        !showNutFields &&
        !showWasherFields,
    );
    threadLengthRow.style.display = hideThreadLength ? 'none' : '';
    if (hideThreadLength) {
      state.length = '';
      if (lengthInput) {
        lengthInput.value = '';
      }
    }
  }
  if (threadSizeContainer) {
    threadSizeContainer.style.display =
      showFuseFields ||
      showConnectorFields ||
      showSwitchFields ||
      showCustomFields ||
      showBearingFields ||
      showComponentFields
        ? 'none'
        : '';
  }
  if (fuseSelectionRow) {
    fuseSelectionRow.classList.toggle('d-none', !showFuseFields);
  }
  if (fuseTypeSelect) {
    fuseTypeSelect.disabled = !showFuseFields;
    if (showFuseFields) {
      const desiredType = validFuseTypeIds.has(state.fuseType)
        ? state.fuseType
        : DEFAULT_FUSE_TYPE;
      fuseTypeSelect.value = desiredType;
    }
  }
  if (fuseTypePickerButton) {
    fuseTypePickerButton.disabled = !showFuseFields;
    if (!showFuseFields) {
      fuseTypePickerButton.setAttribute('aria-expanded', 'false');
    } else {
      const isOpen = Boolean(fuseTypePicker && fuseTypePicker.classList.contains('is-open'));
      fuseTypePickerButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
  }
  if (fuseTypePickerList) {
    const shouldHideList =
      !showFuseFields || !fuseTypePicker || !fuseTypePicker.classList.contains('is-open');
    fuseTypePickerList.hidden = shouldHideList;
  }
  if (!showFuseFields && fuseTypePicker) {
    fuseTypePicker.classList.remove('is-open');
  }
  if (!showFuseFields) {
    document.dispatchEvent(new CustomEvent('gridfinity:fuse-picker-close'));
  }
  if (fuseTypeContainer) {
    fuseTypeContainer.classList.toggle('d-none', !showFuseFields);
  }
  applyFuseValueVisibility({ showFuseFields });
  if (showFuseFields) {
    syncFuseTypePicker();
  }
  syncFuseValuePicker({ isValid: true });
  syncSwitchTypePicker({ isValid: true });
  if (connectorNotesHint) {
    connectorNotesHint.classList.toggle('d-none', !showConnectorFields);
  }
  if (notesField) {
    notesField.classList.toggle('d-none', showCustomFields);
  }
  if (notesLabel) {
    if (showConnectorFields) {
      notesLabel.textContent = 'Connector Details (optional)';
    } else if (showComponentFields) {
      notesLabel.textContent = 'Electrical Component Notes';
    } else {
      notesLabel.textContent = defaultNotesLabel;
    }
  }
  if (standardField) {
    standardField.classList.toggle(
      'd-none',
      showCustomFields ||
        showBearingFields ||
        showComponentFields ||
        showFuseFields ||
        showSwitchFields ||
        showNutFields ||
        showWasherFields,
    );
  }
  if (standardLabel) {
    if (showConnectorFields) {
      standardLabel.textContent = 'Connector Series';
    } else {
      standardLabel.textContent = defaultStandardLabel;
    }
    const hideStandardLabel =
      showFastenerFields ||
      showFuseFields ||
      showSwitchFields ||
      showNutFields ||
      showWasherFields;
    standardLabel.classList.toggle('d-none', hideStandardLabel);
    standardLabel.setAttribute('for', hideStandardLabel ? 'bolt-head-select' : 'standard-select');
  }
  if (standardSelect) {
    const hideStandardSelect =
      showFastenerFields ||
      showFuseFields ||
      showSwitchFields ||
      showNutFields ||
      showWasherFields;
    standardSelect.classList.toggle('d-none', hideStandardSelect);
    standardSelect.hidden = hideStandardSelect;
    if (hideStandardSelect) {
      standardSelect.disabled = true;
      standardSelect.setAttribute('aria-hidden', 'true');
      standardSelect.setAttribute('aria-required', 'false');
    } else {
      standardSelect.disabled = false;
      standardSelect.hidden = false;
      standardSelect.removeAttribute('hidden');
      standardSelect.setAttribute('aria-hidden', 'false');
      standardSelect.removeAttribute('aria-required');
    }
  }
  if (boltStandardGroup) {
    boltStandardGroup.classList.toggle('d-none', !showFastenerFields);
    boltStandardGroup.setAttribute('aria-hidden', showFastenerFields ? 'false' : 'true');
  }
  if (boltHeadLabel) {
    boltHeadLabel.textContent = showScrewFields ? 'Type' : 'Head';
  }
  if (boltHeadSelect) {
    boltHeadSelect.disabled = !showFastenerFields;
    if (!showFastenerFields) {
      boltHeadSelect.removeAttribute('aria-required');
      boltHeadSelect.title = '';
    }
  }
  if (boltHeadPickerButton) {
    boltHeadPickerButton.disabled = !showFastenerFields;
    if (!showFastenerFields) {
      boltHeadPickerButton.setAttribute('aria-expanded', 'false');
    }
  }
  if (boltHeadPickerList) {
    boltHeadPickerList.hidden = true;
  }
  if (boltHeadPicker) {
    boltHeadPicker.classList.toggle('is-disabled', !showFastenerFields);
  }
  if (boltDriveSelect) {
    boltDriveSelect.disabled = !showFastenerFields;
    if (!showFastenerFields) {
      boltDriveSelect.removeAttribute('aria-required');
      boltDriveSelect.title = '';
    }
  }
  if (boltDrivePickerButton) {
    boltDrivePickerButton.disabled = !showFastenerFields;
    if (!showFastenerFields) {
      boltDrivePickerButton.setAttribute('aria-expanded', 'false');
    }
  }
  if (boltDrivePickerList) {
    boltDrivePickerList.hidden = true;
  }
  if (boltDrivePicker) {
    boltDrivePicker.classList.toggle('is-disabled', !showFastenerFields);
  }
  if (!showFastenerFields) {
    syncBoltHeadPicker({ isValid: true });
    syncBoltDrivePicker({ isValid: true });
  }
  if (nutTypeContainer) {
    const hidden = !showNutFields;
    nutTypeContainer.classList.toggle('d-none', hidden);
    nutTypeContainer.setAttribute('aria-hidden', hidden ? 'true' : 'false');
  }
  if (nutTypeSelect) {
    nutTypeSelect.disabled = !showNutFields;
    if (!showNutFields) {
      nutTypeSelect.removeAttribute('aria-required');
      nutTypeSelect.title = '';
    }
  }
  if (nutTypePickerButton) {
    nutTypePickerButton.disabled = !showNutFields;
    if (!showNutFields) {
      nutTypePickerButton.setAttribute('aria-expanded', 'false');
    }
  }
  if (nutTypePickerList) {
    nutTypePickerList.hidden = true;
  }
  if (nutTypePicker) {
    nutTypePicker.classList.toggle('is-disabled', !showNutFields);
  }
  if (!showNutFields) {
    state.nutType = '';
    syncNutTypePicker({ isValid: true });
  }
  if (washerTypeContainer) {
    const hidden = !showWasherFields;
    washerTypeContainer.classList.toggle('d-none', hidden);
    washerTypeContainer.setAttribute('aria-hidden', hidden ? 'true' : 'false');
  }
  if (washerTypeSelect) {
    washerTypeSelect.disabled = !showWasherFields;
    if (!showWasherFields) {
      washerTypeSelect.removeAttribute('aria-required');
      washerTypeSelect.title = '';
    }
  }
  if (washerTypePickerButton) {
    washerTypePickerButton.disabled = !showWasherFields;
    if (!showWasherFields) {
      washerTypePickerButton.setAttribute('aria-expanded', 'false');
    }
  }
  if (washerTypePickerList) {
    washerTypePickerList.hidden = true;
  }
  if (washerTypePicker) {
    washerTypePicker.classList.toggle('is-disabled', !showWasherFields);
  }
  if (!showWasherFields) {
    state.washerType = '';
    syncWasherTypePicker({ isValid: true });
  }
  if (notesInput) {
    if (showConnectorFields) {
      notesInput.required = false;
      notesInput.setAttribute('aria-required', 'false');
      updateConnectorCategoryUi();
    } else {
      notesInput.placeholder = defaultNotesPlaceholder;
      notesInput.required = false;
      notesInput.setAttribute('aria-required', 'false');
      if (showComponentFields) {
        notesInput.placeholder = 'Value, tolerance, voltage rating (optional)';
      }
    }
  }
  if (showConnectorFields) {
    ensureConnectorCategory();
    updateConnectorCategoryUi();
  } else if (connectorCategoryHelp) {
    connectorCategoryHelp.textContent = '';
    connectorCategoryHelp.classList.add('d-none');
  }
  if (showCustomFields) {
    updateCustomImageUi();
  }
  updateGlassOptionVisibility({ resetIfHidden: !showFuseFields });
  populateThreadSizes();
  populateStandards();
  updateDownloadState();
}

export function applyHardwareTypeSelection(nextType) {
  if (typeof nextType !== 'string') {
    syncHardwareTypeControls();
    return;
  }
  const trimmed = nextType.trim();
  if (!trimmed || !hardwareTypeOptions.has(trimmed)) {
    syncHardwareTypeControls();
    return;
  }
  if (trimmed === state.hardwareType) {
    syncHardwareTypeControls(trimmed);
    return;
  }
  state.hardwareType = trimmed;
  onHardwareTypeChange();
}
