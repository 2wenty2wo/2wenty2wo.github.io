/**
 * Switch type picker functions
 * Extracted from forms.js
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import {
  switchTypeOptions
} from '../data.js';
import { updatePreview, updateDownloadState } from '../render.js';

const {
  switchTypeContainer,
  switchTypePicker,
  switchTypePickerButton,
  switchTypePickerList,
  switchTypeSelect
} = elements;

// Constants
const PLACEHOLDER_BLANK = '\u00a0';
const SWITCH_TYPE_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;
const validSwitchTypeIds = new Set(switchTypeOptions.map(option => option.id));
const switchTypeMap = new Map(switchTypeOptions.map(option => [option.id, option]));

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