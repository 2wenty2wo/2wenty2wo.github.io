/**
 * Bearing Type Picker Module
 *
 * Handles the bearing type selection UI, including:
 * - Populating bearing options from data
 * - Syncing picker state with application state
 * - Managing bearing type selection and validation
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import { bearingOptions } from '../data.js';
import { updatePreview, updateDownloadState } from '../render.js';

const {
  // bearingOptionsContainer, // Unused
  bearingTypePicker,
  bearingTypePickerButton,
  bearingTypePickerList,
  bearingTypeSelect,
} = elements;

const PLACEHOLDER_BLANK = '\u00a0';
const BEARING_TYPE_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;
const validBearingCodes = new Set(bearingOptions.map(option => option.code));

function normalizeBearingDimensions(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeBearingShieldType(value) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) {
    return '';
  }
  const lower = trimmed.toLowerCase();
  return lower.replace(/(^|[\s/-])([a-z])/g, (match, prefix, char) => `${prefix}${char.toUpperCase()}`);
}

function normalizeBearingNotes(value) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) {
    return '';
  }
  return trimmed.replace(/\s+/g, ' ');
}

function normalizeBearingFields(option) {
  if (!option) {
    return {
      dimensions: '',
      shieldType: '',
      notes: '',
      details: '',
    };
  }

  const dimensions = normalizeBearingDimensions(option.dimensions);
  const shieldType = normalizeBearingShieldType(option.shieldType);
  const notes = normalizeBearingNotes(option.notes);
  const details = [dimensions, shieldType, notes].filter(Boolean).join(' — ');

  return {
    dimensions,
    shieldType,
    notes,
    details,
  };
}

function formatBearingDetails(option) {
  return normalizeBearingFields(option).details;
}

function formatBearingOptionLabel(option) {
  if (!option) {
    return '';
  }
  const code = typeof option.code === 'string' ? option.code.trim() : '';
  const { dimensions, shieldType, notes } = normalizeBearingFields(option);
  const detailParts = [dimensions, shieldType].filter(Boolean);
  if (notes) {
    detailParts.push(notes);
  }
  if (!code) {
    return detailParts.join(' · ');
  }
  if (detailParts.length === 0) {
    return code;
  }
  return `${code} — ${detailParts.join(' · ')}`;
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
  const optionData = findBearingOption(sanitizedValue);
  const labelText = optionData
    ? formatBearingOptionLabel(optionData)
    : BEARING_TYPE_PLACEHOLDER_TEXT;

  if (bearingTypeSelect) {
    bearingTypeSelect.value = sanitizedValue;
  }

  if (bearingTypePickerButton) {
    const label = bearingTypePickerButton.querySelector('.bolt-drive-picker__current-label');
    if (label) {
      label.textContent = optionData ? labelText : BEARING_TYPE_PLACEHOLDER_TEXT;
      if (optionData) {
        label.setAttribute('aria-label', labelText);
      } else {
        label.removeAttribute('aria-label');
      }
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

    if (optionData) {
      bearingTypePickerButton.setAttribute('aria-label', labelText);
    } else {
      bearingTypePickerButton.removeAttribute('aria-label');
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
  const normalizedFields = normalizeBearingFields(optionData);

  state.bearingType = sanitizedValue;
  state.bearingDimensions = normalizedFields.dimensions;
  state.bearingShieldType = normalizedFields.shieldType;
  state.bearingNotes = normalizedFields.notes;
  state.bearingDetails = normalizedFields.details;

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
    state.bearingDimensions = '';
    state.bearingShieldType = '';
    state.bearingNotes = '';
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
    opt.textContent = formatBearingOptionLabel(option);
    opt.dataset.details = formatBearingDetails(option);
    bearingTypeSelect.appendChild(opt);

    if (bearingTypePickerList) {
      const item = document.createElement('li');
      item.className = 'bolt-drive-picker__option';
      item.dataset.value = option.code;
      item.setAttribute('role', 'option');
      item.tabIndex = -1;
      item.setAttribute('aria-label', formatBearingOptionLabel(option));

      const label = document.createElement('div');
      label.className = 'bolt-drive-picker__option-label';
      label.textContent = formatBearingOptionLabel(option);

      item.appendChild(label);

      bearingTypePickerList.appendChild(item);
    }
  });

  const selectedOption = findBearingOption(sanitizedValue);
  const normalizedFields = normalizeBearingFields(selectedOption);
  state.bearingType = sanitizedValue;
  state.bearingDimensions = normalizedFields.dimensions;
  state.bearingShieldType = normalizedFields.shieldType;
  state.bearingNotes = normalizedFields.notes;
  state.bearingDetails = normalizedFields.details;

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
