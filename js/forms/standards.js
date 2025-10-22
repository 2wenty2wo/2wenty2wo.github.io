/**
 * Standard filtering and selection functions
 * Extracted from forms.js
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import {
  STANDARD_PLACEHOLDER_TEXT
} from '../data.js';
import { updatePreview, updateDownloadState } from '../render.js';

const {
  standardField,
  standardSelect,
  standardLabel
} = elements;

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