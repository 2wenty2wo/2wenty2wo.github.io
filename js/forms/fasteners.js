/**
 * Bolt, nut, washer, and bearing functions
 * Extracted from forms.js
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import {
  boltHeadOptions,
  boltDriveOptions,
  nutTypeOptions,
  washerTypeOptions,
  bearingOptions
} from '../data.js';
import { updatePreview, updateDownloadState } from '../render.js';

const {
  boltHeadPicker,
  boltDrivePicker,
  nutTypePicker,
  washerTypePicker,
  bearingTypePicker
} = elements;

// Constants
const PLACEHOLDER_BLANK = '\u00a0';
const BOLT_HEAD_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;
const BOLT_DRIVE_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;

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