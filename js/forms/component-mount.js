/**
 * Component Mount Picker Module
 *
 * Handles the component mount type selection UI for electrical components, including:
 * - Populating mount options (Through-Hole, SMD, etc.)
 * - Syncing picker state with application state
 * - Managing mount selection and validation
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import {
  componentMountOptions,
  componentImageMap,
} from '../data.js';
import { updatePreview, updateDownloadState } from '../render.js';

const {
  // componentMountContainer, // Unused
  componentMountPicker,
  componentMountPickerButton,
  componentMountPickerList,
  componentMountSelect,
} = elements;

const PLACEHOLDER_BLANK = '\u00a0';
const COMPONENT_MOUNT_PLACEHOLDER_TEXT = PLACEHOLDER_BLANK;
const validComponentMounts = new Set(componentMountOptions.map(option => option.id));

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
