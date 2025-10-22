/**
 * Hardware type picker functions
 * Extracted from forms.js
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import {
  hardwareCatalog,
  hardwareTypeImageMap
} from '../data.js';
import { updatePreview, updateDownloadState } from '../render.js';

const {
  hardwareTypeRadios,
  hardwareTypeSelect,
  hardwareTypePicker
} = elements;

// Constants
const PLACEHOLDER_BLANK = '\u00a0';
const HARDWARE_TYPE_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;

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
  const hideNotesField = showCustomFields || showFastenerFields;

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
    notesField.classList.toggle('d-none', hideNotesField);
  }
  if (!hideNotesField && notesLabel) {
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
  if (!hideNotesField && notesInput) {
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