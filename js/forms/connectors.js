/**
 * Connector category and series functions
 * Extracted from forms.js
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import {
  connectorCatalog,
  CONNECTOR_PLACEHOLDER_TEXT,
  findConnectorCategory,
  getConnectorSeriesImage
} from '../data.js';
import { updatePreview, updateDownloadState } from '../render.js';

const {
  connectorCategoryContainer,
  connectorCategorySelect,
  connectorCategoryPicker,
  connectorSeriesPicker
} = elements;

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