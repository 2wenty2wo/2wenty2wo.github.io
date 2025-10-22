/**
 * Electronic component functions (resistor, capacitor, etc.)
 * Extracted from forms.js
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import {
  electricalComponentTypes,
  componentMountOptions,
  resistorValueOptions,
  capacitorValueOptions
} from '../data.js';
import { updatePreview, updateDownloadState } from '../render.js';

const {
  componentCategoryContainer,
  componentMountPicker,
  resistorValuePicker,
  capacitorValuePicker
} = elements;

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

    const iconWrapper = resistorValuePickerButton.querySelector(
      '.bolt-drive-picker__current-icon',
    );
    const iconImage = resistorValuePickerButton.querySelector(
      '.bolt-drive-picker__current-icon-image',
    );
    if (iconWrapper && iconImage) {
      if (showResistorValues) {
        iconImage.src = 'images/resistors/omega.svg';
        iconImage.hidden = false;
        iconImage.classList.add('bolt-drive-picker__current-icon-image--omega');
        iconWrapper.classList.remove('is-empty');
      } else {
        iconImage.hidden = true;
        iconImage.removeAttribute('src');
        iconImage.classList.remove('bolt-drive-picker__current-icon-image--omega');
        iconWrapper.classList.add('is-empty');
      }
    }
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
    const iconWrapper = resistorValuePickerButton.querySelector('.bolt-drive-picker__current-icon');
    const iconImage = resistorValuePickerButton.querySelector(
      '.bolt-drive-picker__current-icon-image',
    );
    if (label) {
      label.textContent = sanitizedValue ? sanitizedValue : RESISTOR_VALUE_PLACEHOLDER_TEXT;
    }

    if (iconWrapper && iconImage) {
      if (!resistorValuePickerButton.disabled) {
        iconImage.src = 'images/resistors/omega.svg';
        iconImage.hidden = false;
        iconImage.classList.add('bolt-drive-picker__current-icon-image--omega');
        iconWrapper.classList.remove('is-empty');
      } else {
        iconImage.hidden = true;
        iconImage.removeAttribute('src');
        iconImage.classList.remove('bolt-drive-picker__current-icon-image--omega');
        iconWrapper.classList.add('is-empty');
      }
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

  const imageSrc = sanitizedValue ? 'images/resistors/omega.svg' : '';

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
        iconImage.classList.add('bolt-drive-picker__current-icon-image--omega');
      } else {
        if (iconImage) {
          iconImage.hidden = true;
          iconImage.removeAttribute('src');
          iconImage.classList.remove('bolt-drive-picker__current-icon-image--omega');
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