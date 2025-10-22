/**
 * Fuse type, value, and glass options functions
 * Extracted from forms.js
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import {
  fuseValues,
  fuseTypeOptions
} from '../data.js';
import { updatePreview, updateDownloadState } from '../render.js';

const {
  fuseSelectionRow,
  fuseTypeContainer,
  fuseTypeSelect,
  fuseTypePicker,
  fuseValueSelect,
  fuseValuePicker,
  glassSizePicker,
  glassSpeedPicker
} = elements;

// Constants
const PLACEHOLDER_BLANK = '\u00a0';
const FUSE_TYPE_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;
const FUSE_VALUE_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;

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
      const iconGlyph = iconWrapper.querySelector('.fuse-value-picker__glyph');
      if (requiresValue) {
        iconWrapper.classList.remove('is-empty');
        if (iconGlyph) {
          iconGlyph.classList.add('fa-solid', 'fa-a');
        }
      } else {
        iconWrapper.classList.add('is-empty');
        if (iconGlyph) {
          iconGlyph.classList.remove('fa-solid', 'fa-a');
        }
      }
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

export function populateGlassSpeedOptions() {
  if (!glassSpeedSelect) {
    return;
  }

  const previousValue = typeof state.glassSpeed === 'string' ? state.glassSpeed : '';

  glassSpeedSelect.innerHTML = '';
  glassSpeedOptionData.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.value;
    opt.textContent = option.label;
    glassSpeedSelect.appendChild(opt);
  });

  const hasSelectableOptions = glassSpeedOptionData.some(option => option.value);
  const sanitizedValue = hasSelectableOptions && validGlassSpeedValues.has(previousValue)
    ? previousValue
    : '';

  state.glassSpeed = sanitizedValue;
  glassSpeedSelect.value = sanitizedValue;

  if (glassSpeedPickerList) {
    glassSpeedPickerList.innerHTML = '';
    glassSpeedOptionData.forEach(option => {
      const item = document.createElement('li');
      item.className = 'bolt-drive-picker__option';
      item.dataset.value = option.value;
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

      glassSpeedPickerList.appendChild(item);
    });
    glassSpeedPickerList.hidden = true;
  }

  if (glassSpeedPickerButton) {
    glassSpeedPickerButton.disabled = !hasSelectableOptions;
    glassSpeedPickerButton.setAttribute('aria-expanded', 'false');
  }

  if (glassSpeedPicker) {
    glassSpeedPicker.classList.remove('is-open');
  }

  syncGlassSpeedPicker({
    isValid: true,
    isDisabled: !hasSelectableOptions,
    clearValue: !hasSelectableOptions,
  });
}

export function populateGlassSizeOptions() {
  if (!glassSizeSelect) {
    return;
  }

  const previousValue = typeof state.glassSize === 'string' ? state.glassSize : '';

  glassSizeSelect.innerHTML = '';
  glassSizeOptionData.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.value;
    opt.textContent = option.label;
    glassSizeSelect.appendChild(opt);
  });

  const hasSelectableOptions = glassSizeOptionData.some(option => option.value);
  const sanitizedValue = hasSelectableOptions && validGlassSizeValues.has(previousValue)
    ? previousValue
    : '';

  state.glassSize = sanitizedValue;
  glassSizeSelect.value = sanitizedValue;

  if (glassSizePickerList) {
    glassSizePickerList.innerHTML = '';
    glassSizeOptionData.forEach(option => {
      const item = document.createElement('li');
      item.className = 'bolt-drive-picker__option';
      item.dataset.value = option.value;
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

      glassSizePickerList.appendChild(item);
    });
    glassSizePickerList.hidden = true;
  }

  if (glassSizePickerButton) {
    glassSizePickerButton.disabled = !hasSelectableOptions;
    glassSizePickerButton.setAttribute('aria-expanded', 'false');
  }

  if (glassSizePicker) {
    glassSizePicker.classList.remove('is-open');
  }

  syncGlassSizePicker({
    isValid: true,
    isDisabled: !hasSelectableOptions,
    clearValue: !hasSelectableOptions,
  });
}

export function syncGlassSpeedPicker({
  isValid = true,
  isDisabled = false,
  clearValue = false,
} = {}) {
  if (!glassSpeedSelect) {
    return;
  }

  const hasSelectableOptions = glassSpeedOptionData.some(option => option.value);
  const shouldDisablePicker = Boolean(isDisabled) || !hasSelectableOptions;
  const shouldClearValue = Boolean(clearValue) || !hasSelectableOptions;

  let sanitizedValue = typeof state.glassSpeed === 'string' ? state.glassSpeed : '';
  if (shouldClearValue) {
    sanitizedValue = '';
  }
  if (sanitizedValue && !validGlassSpeedValues.has(sanitizedValue)) {
    sanitizedValue = '';
  }

  if (sanitizedValue !== state.glassSpeed) {
    state.glassSpeed = sanitizedValue;
  }

  glassSpeedSelect.value = sanitizedValue;

  const selectedOption = sanitizedValue
    ? glassSpeedOptionData.find(option => option.value === sanitizedValue) || null
    : null;

  const effectiveValidity = shouldDisablePicker ? true : Boolean(isValid);

  if (glassSpeedPickerButton) {
    glassSpeedPickerButton.disabled = shouldDisablePicker;
    const label = glassSpeedPickerButton.querySelector('.bolt-drive-picker__current-label');
    if (label) {
      label.textContent = selectedOption ? selectedOption.label : GLASS_SPEED_PLACEHOLDER_TEXT;
    }
    const iconWrapper = glassSpeedPickerButton.querySelector('.bolt-drive-picker__current-icon');
    if (iconWrapper) {
      const classList = iconWrapper.classList;
      if (classList && typeof classList.toggle === 'function') {
        classList.toggle('is-empty', !selectedOption);
      } else if (classList && typeof classList.remove === 'function' && typeof classList.add === 'function') {
        if (selectedOption) {
          classList.remove('is-empty');
        } else {
          classList.add('is-empty');
        }
      }
    }
    if (glassSpeedPickerButton.disabled) {
      glassSpeedPickerButton.setAttribute('aria-expanded', 'false');
    }
    if (effectiveValidity) {
      glassSpeedPickerButton.classList.remove('is-invalid');
      if (typeof glassSpeedPickerButton.removeAttribute === 'function') {
        glassSpeedPickerButton.removeAttribute('aria-invalid');
      }
    } else {
      glassSpeedPickerButton.classList.add('is-invalid');
      if (typeof glassSpeedPickerButton.setAttribute === 'function') {
        glassSpeedPickerButton.setAttribute('aria-invalid', 'true');
      }
    }
  }

  if (glassSpeedPicker) {
    glassSpeedPicker.classList.toggle('is-disabled', shouldDisablePicker);
    glassSpeedPicker.classList.toggle('is-invalid', !effectiveValidity);
  }

  if (glassSpeedPickerList) {
    const optionElements = Array.from(glassSpeedPickerList.querySelectorAll('[role="option"]'));
    optionElements.forEach(optionElement => {
      const isSelected = optionElement.dataset.value === sanitizedValue;
      optionElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      optionElement.classList.toggle('is-selected', isSelected);
      optionElement.tabIndex = -1;
    });
    if (shouldDisablePicker || (glassSpeedPickerButton && glassSpeedPickerButton.disabled)) {
      glassSpeedPickerList.hidden = true;
    }
  }
}

export function syncGlassSizePicker({
  isValid = true,
  isDisabled = false,
  clearValue = false,
} = {}) {
  if (!glassSizeSelect) {
    return;
  }

  const hasSelectableOptions = glassSizeOptionData.some(option => option.value);
  const shouldDisablePicker = Boolean(isDisabled) || !hasSelectableOptions;
  const shouldClearValue = Boolean(clearValue) || !hasSelectableOptions;

  let sanitizedValue = typeof state.glassSize === 'string' ? state.glassSize : '';
  if (shouldClearValue) {
    sanitizedValue = '';
  }
  if (sanitizedValue && !validGlassSizeValues.has(sanitizedValue)) {
    sanitizedValue = '';
  }

  if (sanitizedValue !== state.glassSize) {
    state.glassSize = sanitizedValue;
  }

  glassSizeSelect.value = sanitizedValue;

  const selectedOption = sanitizedValue
    ? glassSizeOptionData.find(option => option.value === sanitizedValue) || null
    : null;

  const effectiveValidity = shouldDisablePicker ? true : Boolean(isValid);

  if (glassSizePickerButton) {
    glassSizePickerButton.disabled = shouldDisablePicker;
    const label = glassSizePickerButton.querySelector('.bolt-drive-picker__current-label');
    if (label) {
      label.textContent = selectedOption ? selectedOption.label : GLASS_SIZE_PLACEHOLDER_TEXT;
    }
    const iconWrapper = glassSizePickerButton.querySelector('.bolt-drive-picker__current-icon');
    if (iconWrapper) {
      const classList = iconWrapper.classList;
      if (classList && typeof classList.toggle === 'function') {
        classList.toggle('is-empty', !selectedOption);
      } else if (classList && typeof classList.remove === 'function' && typeof classList.add === 'function') {
        if (selectedOption) {
          classList.remove('is-empty');
        } else {
          classList.add('is-empty');
        }
      }
    }
    if (glassSizePickerButton.disabled) {
      glassSizePickerButton.setAttribute('aria-expanded', 'false');
    }
    if (effectiveValidity) {
      glassSizePickerButton.classList.remove('is-invalid');
      if (typeof glassSizePickerButton.removeAttribute === 'function') {
        glassSizePickerButton.removeAttribute('aria-invalid');
      }
    } else {
      glassSizePickerButton.classList.add('is-invalid');
      if (typeof glassSizePickerButton.setAttribute === 'function') {
        glassSizePickerButton.setAttribute('aria-invalid', 'true');
      }
    }
  }

  if (glassSizePicker) {
    glassSizePicker.classList.toggle('is-disabled', shouldDisablePicker);
    glassSizePicker.classList.toggle('is-invalid', !effectiveValidity);
  }

  if (glassSizePickerList) {
    const optionElements = Array.from(glassSizePickerList.querySelectorAll('[role="option"]'));
    optionElements.forEach(optionElement => {
      const isSelected = optionElement.dataset.value === sanitizedValue;
      optionElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      optionElement.classList.toggle('is-selected', isSelected);
      optionElement.tabIndex = -1;
    });
    if (shouldDisablePicker || (glassSizePickerButton && glassSizePickerButton.disabled)) {
      glassSizePickerList.hidden = true;
    }
  }
}

export function setGlassSpeedSelection(nextValue, { triggerUpdate = true } = {}) {
  const desiredValue = typeof nextValue === 'string' ? nextValue.trim() : '';
  const sanitizedValue = desiredValue && validGlassSpeedValues.has(desiredValue) ? desiredValue : '';
  const previousValue = typeof state.glassSpeed === 'string' ? state.glassSpeed : '';

  state.glassSpeed = sanitizedValue;
  syncGlassSpeedPicker({
    isValid: true,
    isDisabled: Boolean(glassSpeedPickerButton && glassSpeedPickerButton.disabled),
  });

  if (triggerUpdate && previousValue !== sanitizedValue) {
    updateDownloadState();
    updatePreview();
  }
}

export function setGlassSizeSelection(nextValue, { triggerUpdate = true } = {}) {
  const desiredValue = typeof nextValue === 'string' ? nextValue.trim() : '';
  const sanitizedValue = desiredValue && validGlassSizeValues.has(desiredValue) ? desiredValue : '';
  const previousValue = typeof state.glassSize === 'string' ? state.glassSize : '';

  state.glassSize = sanitizedValue;
  syncGlassSizePicker({
    isValid: true,
    isDisabled: Boolean(glassSizePickerButton && glassSizePickerButton.disabled),
  });

  if (triggerUpdate && previousValue !== sanitizedValue) {
    updateDownloadState();
    updatePreview();
  }
}

export function updateGlassOptionVisibility({ resetIfHidden = false } = {}) {
  const shouldShow =
    state.hardwareType === 'Fuse' && CARTRIDGE_FUSE_TYPES.has(state.fuseType);
  const requiresSpeedOptions =
    shouldShow && state.fuseType !== PANEL_MOUNT_FUSE_HOLDER_TYPE;

  if (glassOptionsContainer) {
    glassOptionsContainer.classList.toggle('d-none', !shouldShow);
  }
  if (glassSpeedField) {
    glassSpeedField.classList.toggle('d-none', shouldShow ? !requiresSpeedOptions : true);
  }
  if (glassSizeField) {
    glassSizeField.classList.toggle('d-none', !shouldShow);
  }

  const shouldClearSpeed = !requiresSpeedOptions || (!shouldShow && resetIfHidden);
  const shouldClearSize = !shouldShow && resetIfHidden;

  syncGlassSpeedPicker({
    isValid: true,
    isDisabled: !shouldShow || !requiresSpeedOptions,
    clearValue: shouldClearSpeed,
  });

  syncGlassSizePicker({
    isValid: true,
    isDisabled: !shouldShow,
    clearValue: shouldClearSize,
  });
}