import { state, standardFilterState } from './state.js';
import { elements } from './dom-elements.js';
import {
  fuseValues,
  fuseTypeOptions,
  bearingOptions,
  boltHeadOptions,
  boltDriveOptions,
  screwTypeOptions,
  nutTypeOptions,
  hardwareCatalog,
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
} from './data.js';
import { updatePreview, updateDownloadState } from './render.js';
import {
  populateThreadSizes,
  syncThreadSizePicker,
  setThreadSizeSelection,
} from './threadSizes.js';

const {
  threadSizeContainer,
  threadLengthRow,
  lengthContainer,
  fuseSelectionRow,
  fuseTypeContainer,
  fuseTypeSelect,
  fuseTypePicker,
  fuseTypePickerButton,
  fuseTypePickerList,
  fuseValueContainer,
  glassOptionsContainer,
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
  measurementSystemContainer,
  connectorCategoryContainer,
  connectorCategorySelect,
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
  bearingOptionsContainer,
  bearingTypePicker,
  bearingTypePickerButton,
  bearingTypePickerList,
  bearingTypeSelect,
  customFieldsContainer,
  customImageInput,
  customImageClearButton,
  customImageNameDisplay,
  notesField,
  standardField,
  boltStandardGroup,
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

const HARDWARE_TYPE_PLACEHOLDER_TEXT = 'Select part type…';
const HARDWARE_TYPE_ALL_FILTER = 'All';
const HARDWARE_TYPE_DEFAULT_CATEGORY = 'Uncategorized';
const HARDWARE_TYPE_RECENT_STORAGE_KEY = 'gridfinity.recentHardwareTypes';
const HARDWARE_TYPE_RECENT_LIMIT = 5;
const PART_TYPE_PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"%3E%3Crect width="80" height="80" rx="14" fill="%23e2e8f0"/%3E%3Cpath fill="%2394a3b8" d="M24 26h32v8H24zm0 16h32v8H24zm0 16h32v8H24z"/%3E%3C/svg%3E';
const hardwareTypeOptionRecords = new Map();
const hardwareTypeFilterButtons = new Map();
const hardwareTypeFilterState = {
  category: HARDWARE_TYPE_ALL_FILTER,
  query: '',
};
let hardwareTypeCategories = [];
let hardwareTypeRecentValues = [];
let hardwareTypeSelectListenerAttached = false;
let hardwareTypeDialogMode = 'dialog';
const BOLT_DRIVE_PLACEHOLDER_TEXT = 'Select drive…';
const BOLT_HEAD_PLACEHOLDER_TEXT = 'Select head…';
const SCREW_TYPE_PLACEHOLDER_TEXT = 'Select type…';
const validBoltDriveIds = new Set(boltDriveOptions.map(option => option.id));
const validBoltHeadIds = new Set(
  boltHeadOptions.concat(screwTypeOptions).map(option => option.id),
);
const NUT_TYPE_PLACEHOLDER_TEXT = 'Select type…';
const validNutTypeIds = new Set(nutTypeOptions.map(option => option.id));
const FUSE_TYPE_PLACEHOLDER_TEXT = 'Select fuse type…';
const DEFAULT_FUSE_TYPE = 'Glass';
const CARTRIDGE_FUSE_TYPES = new Set(['Glass', 'Ceramic']);
const validFuseTypeIds = new Set(fuseTypeOptions.map(option => option.id));
const FUSE_VALUE_PLACEHOLDER_TEXT = 'Select value…';
const validFuseValuesSet = new Set(fuseValues.map(value => String(value)));
const ELECTRICAL_COMPONENT_TYPES = new Set(electricalComponentTypes);
const COMPONENT_MOUNT_PLACEHOLDER_TEXT = 'Select mounting…';
const validComponentMounts = new Set(componentMountOptions.map(option => option.id));
const RESISTOR_VALUE_PLACEHOLDER_TEXT = 'Select value…';
const validResistorValues = new Set(resistorValueOptions.map(option => option.id));
const CAPACITOR_VALUE_PLACEHOLDER_TEXT = 'Select value…';
const validCapacitorValues = new Set(capacitorValueOptions.map(option => option.id));
const DIODE_VALUE_PLACEHOLDER_TEXT = 'Select value…';
const validDiodeValues = new Set(diodeValueOptions.map(option => option.id));
const BEARING_TYPE_PLACEHOLDER_TEXT = 'Select bearing…';
const validBearingCodes = new Set(bearingOptions.map(option => option.code));

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

  const image = document.createElement('img');
  image.className = 'part-type-card__image';
  image.alt = '';
  image.decoding = 'async';
  image.loading = 'lazy';
  image.src = record.image;
  thumb.appendChild(image);

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

    const record = {
      value,
      label,
      normalizedLabel: normalizeText(label),
      category,
      normalizedCategory,
      image: rawImage || PART_TYPE_PLACEHOLDER_IMAGE,
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

  refreshComponentMountPickerIcons();
  syncComponentMountPicker({ isValid: true });
  syncResistorValuePicker({ isValid: true });
  syncCapacitorValuePicker({ isValid: true });
  syncDiodeValuePicker({ isValid: true });
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

export function syncHardwareTypePicker() {
  const currentValue = typeof state.hardwareType === 'string' ? state.hardwareType : '';
  const sanitizedValue = hardwareTypeOptions.has(currentValue) ? currentValue : '';

  if (hardwareTypeSelect) {
    hardwareTypeSelect.value = sanitizedValue || hardwareTypeSelect.value;
  }

  if (hardwareTypePickerButton) {
    const label = hardwareTypePickerButton.querySelector('.part-type-picker__chip-label');
    const iconImage = hardwareTypePickerButton.querySelector('.part-type-picker__chip-image');
    const fallback = hardwareTypePickerButton.querySelector('.part-type-picker__chip-fallback');
    const imageSrc = sanitizedValue ? hardwareTypeImageMap[sanitizedValue] : '';

    let optionLabel = HARDWARE_TYPE_PLACEHOLDER_TEXT;
    if (sanitizedValue && hardwareTypeSelect) {
      const match = Array.from(hardwareTypeSelect.options).find(
        option => option.value === sanitizedValue,
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
        if (sanitizedValue === 'Bolt' || sanitizedValue === 'Screw') {
          iconImage.classList.add('is-rotated-90');
        }
      } else {
        iconImage.hidden = true;
        iconImage.removeAttribute('src');
      }
    }

    if (fallback instanceof HTMLElement) {
      if (imageSrc) {
        fallback.hidden = true;
        fallback.style.backgroundImage = '';
        fallback.style.backgroundSize = '';
        fallback.style.backgroundPosition = '';
        fallback.style.backgroundRepeat = '';
      } else {
        fallback.hidden = false;
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
      const isSelected = item.dataset.value === sanitizedValue;
      item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      item.classList.toggle('is-selected', isSelected);
      item.tabIndex = -1;
    });
  }
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

export function populateConnectorCategories() {
  if (!connectorCategorySelect) {
    return;
  }
  connectorCategorySelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select connector category…';
  placeholder.disabled = true;
  placeholder.selected = !state.connectorCategory;
  connectorCategorySelect.appendChild(placeholder);
  connectorCatalog.forEach(category => {
    const opt = document.createElement('option');
    opt.value = category.id;
    opt.textContent = category.label;
    connectorCategorySelect.appendChild(opt);
  });
  connectorCategorySelect.value = state.connectorCategory || '';
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

      const icon = document.createElement('span');
      icon.className = 'bolt-drive-picker__option-icon';

      const image = document.createElement('img');
      image.className = 'bolt-drive-picker__option-icon-image';
      image.src = 'images/bearings/bearing.svg';
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      icon.appendChild(image);

      const label = document.createElement('span');
      label.className = 'bolt-drive-picker__option-label';
      label.textContent = `${option.code} — ${option.description}`;

      item.appendChild(icon);
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
    notesInput.placeholder = defaultNotesPlaceholder;
    return;
  }
  const category = findConnectorCategory(state.connectorCategory);
  if (connectorCategorySelect) {
    connectorCategorySelect.value = state.connectorCategory || '';
  }
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
}

export { populateThreadSizes, syncThreadSizePicker, setThreadSizeSelection };

export function syncFuseValuePicker({ isValid = true } = {}) {
  if (!fuseValueSelect) {
    return;
  }

  const currentValue = typeof state.fuseValue === 'string' ? state.fuseValue.trim() : '';
  const sanitizedValue = currentValue && validFuseValuesSet.has(currentValue) ? currentValue : '';

  if (sanitizedValue !== currentValue) {
    state.fuseValue = sanitizedValue;
  }

  fuseValueSelect.value = sanitizedValue;

  if (fuseValuePickerButton) {
    const label = fuseValuePickerButton.querySelector('.bolt-drive-picker__current-label');
    if (label) {
      label.textContent = sanitizedValue ? `${sanitizedValue} A` : FUSE_VALUE_PLACEHOLDER_TEXT;
    }
    const iconWrapper = fuseValuePickerButton.querySelector('.bolt-drive-picker__current-icon');
    if (iconWrapper) {
      iconWrapper.classList.add('is-empty');
    }

    if (isValid) {
      fuseValuePickerButton.classList.remove('is-invalid');
      fuseValuePickerButton.removeAttribute('aria-invalid');
    } else {
      fuseValuePickerButton.classList.add('is-invalid');
      fuseValuePickerButton.setAttribute('aria-invalid', 'true');
    }
  }

  if (fuseValuePicker) {
    fuseValuePicker.classList.toggle('is-invalid', !isValid);
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
  if (glassOptionsContainer) {
    glassOptionsContainer.classList.toggle('d-none', !shouldShow);
  }
  if (shouldShow) {
    if (glassSizeSelect) {
      glassSizeSelect.value = state.glassSize || '';
    }
    if (glassSlowBlowCheckbox && glassFastBlowCheckbox) {
      glassSlowBlowCheckbox.checked = state.glassSpeed.startsWith('Slow');
      glassFastBlowCheckbox.checked = state.glassSpeed.startsWith('Fast');
    }
  } else if (resetIfHidden) {
    state.glassSpeed = '';
    state.glassSize = '';
    if (glassSlowBlowCheckbox) {
      glassSlowBlowCheckbox.checked = false;
    }
    if (glassFastBlowCheckbox) {
      glassFastBlowCheckbox.checked = false;
    }
    if (glassSizeSelect) {
      glassSizeSelect.value = '';
    }
  }
}

export function updateCustomImageUi() {
  const hasImage = !!state.customImageData;
  if (customImageClearButton) {
    customImageClearButton.disabled = !hasImage;
  }
  if (customImageNameDisplay) {
    if (state.customImageName) {
      customImageNameDisplay.textContent = state.customImageName;
      customImageNameDisplay.classList.remove('d-none');
    } else {
      customImageNameDisplay.textContent = '';
      customImageNameDisplay.classList.add('d-none');
    }
  }
}

export function clearCustomImage({ resetInput = true } = {}) {
  state.customImageData = '';
  state.customImageName = '';
  if (resetInput && customImageInput) {
    customImageInput.value = '';
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
  updatePreview();
}

export function filterStandardOptions(query) {
  if (!standardSelect || standardSelect.disabled) {
    return;
  }
  const normalized = (query || '').trim().toLowerCase();
  let selectionCleared = false;
  let matchesFound = false;
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
  const showComponentFields = ELECTRICAL_COMPONENT_TYPES.has(type);
  const showCustomFields = type === 'Custom';
  const showBearingFields = type === 'Bearing';
  const showBoltFields = type === 'Bolt';
  const showScrewFields = type === 'Screw';
  const showFastenerFields = showBoltFields || showScrewFields;
  const showNutFields = type === 'Nut';

  if (lengthContainer) {
    lengthContainer.style.display = requiresThreadDetails ? '' : 'none';
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
      showCustomFields ||
      showBearingFields ||
      showComponentFields;
  });

  if (threadLengthRow) {
    const hideThreadLength =
      showFuseFields ||
      showConnectorFields ||
      showCustomFields ||
      showBearingFields ||
      showComponentFields;
    threadLengthRow.classList.toggle(
      'single-column',
      !requiresThreadDetails &&
        !showFuseFields &&
        !showConnectorFields &&
        !showCustomFields &&
        !showBearingFields &&
        !showComponentFields &&
        !showNutFields,
    );
    threadLengthRow.style.display = hideThreadLength ? 'none' : '';
  }
  if (threadSizeContainer) {
    threadSizeContainer.style.display =
      showFuseFields ||
      showConnectorFields ||
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
  if (fuseValueContainer) {
    fuseValueContainer.classList.toggle('d-none', !showFuseFields);
  }
  if (fuseValueSelect) {
    fuseValueSelect.disabled = !showFuseFields;
    if (showFuseFields) {
      fuseValueSelect.value = state.fuseValue || '';
    }
  }
  if (fuseValuePickerButton) {
    fuseValuePickerButton.disabled = !showFuseFields;
    if (!showFuseFields) {
      fuseValuePickerButton.setAttribute('aria-expanded', 'false');
    } else {
      const isOpen = Boolean(fuseValuePicker && fuseValuePicker.classList.contains('is-open'));
      fuseValuePickerButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
  }
  if (fuseValuePickerList) {
    const shouldHideList =
      !showFuseFields || !fuseValuePicker || !fuseValuePicker.classList.contains('is-open');
    fuseValuePickerList.hidden = shouldHideList;
  }
  if (!showFuseFields && fuseValuePicker) {
    fuseValuePicker.classList.remove('is-open');
  }
  if (showFuseFields) {
    syncFuseTypePicker();
    syncFuseValuePicker({ isValid: true });
  }
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
      showCustomFields || showBearingFields || showComponentFields || showFuseFields || showNutFields,
    );
  }
  if (standardLabel) {
    if (showConnectorFields) {
      standardLabel.textContent = 'Connector Series';
    } else {
      standardLabel.textContent = defaultStandardLabel;
    }
    standardLabel.setAttribute('for', showFastenerFields ? 'bolt-head-select' : 'standard-select');
  }
  if (standardSelect) {
    const hideStandardSelect = showFastenerFields || showFuseFields || showNutFields;
    standardSelect.classList.toggle('d-none', hideStandardSelect);
    if (hideStandardSelect) {
      standardSelect.disabled = true;
      standardSelect.setAttribute('aria-hidden', 'true');
      standardSelect.setAttribute('aria-required', 'false');
    } else {
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
