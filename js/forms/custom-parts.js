/**
 * Custom part picker functions
 * Extracted from forms.js
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import { updatePreview, updateDownloadState } from '../form-updates.js';

const {
  customPartPicker,
  customPartSelect
} = elements;

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

  if (record.image) {
    const image = document.createElement('img');
    image.className = 'part-type-card__image';
    image.alt = '';
    image.decoding = 'async';
    image.loading = 'lazy';
    image.src = record.image;
    thumb.appendChild(image);
  }

  if (record.icon) {
    const icon = document.createElement('i');
    icon.className = `part-type-card__icon fa-solid ${record.icon}`;
    icon.setAttribute('aria-hidden', 'true');
    thumb.appendChild(icon);
  }

  const label = document.createElement('span');
  label.className = 'part-type-card__label';
  label.textContent = record.label;

  card.appendChild(thumb);
  card.appendChild(label);

  return card;
}

function getCustomPartOption(partId) {
  if (!partId) {
    return null;
  }
  return partGraphicOptions.find(option => option.id === partId) || null;
}

export function populateCustomPartPicker() {
  if (!customPartSelect) {
    return;
  }

  customPartSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = CUSTOM_PART_PLACEHOLDER_TEXT;
  customPartSelect.appendChild(placeholder);

  partGraphicOptions.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.id;
    opt.textContent = option.label;
    opt.dataset.image = option.image || '';
    customPartSelect.appendChild(opt);
  });

  if (customPartPickerList) {
    customPartPickerList.innerHTML = '';
    partGraphicOptions.forEach(option => {
      const item = document.createElement('li');
      item.className = 'bolt-drive-picker__option';
      item.dataset.value = option.id;
      item.dataset.label = option.label;
      item.dataset.image = option.image || '';
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', 'false');
      item.tabIndex = -1;

      const iconWrapper = document.createElement('span');
      iconWrapper.className = option.image
        ? 'bolt-drive-picker__option-icon'
        : 'bolt-drive-picker__option-icon is-empty';
      iconWrapper.setAttribute('aria-hidden', 'true');

      if (option.image) {
        const img = document.createElement('img');
        img.className = 'bolt-drive-picker__option-icon-image';
        img.src = option.image;
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        iconWrapper.appendChild(img);
      }

      const label = document.createElement('span');
      label.className = 'bolt-drive-picker__option-label';
      label.textContent = option.label;

      item.appendChild(iconWrapper);
      item.appendChild(label);
      customPartPickerList.appendChild(item);
    });
  }

  if (customPartPickerButton) {
    customPartPickerButton.disabled = partGraphicOptions.length === 0;
    customPartPickerButton.setAttribute('aria-expanded', 'false');
  }

  syncCustomPartPicker({ isValid: true });
}

export function syncCustomPartPicker({ isValid = true } = {}) {
  if (!customPartSelect) {
    return;
  }

  const currentValue = typeof state.customPartId === 'string' ? state.customPartId : '';
  const sanitizedValue = validCustomPartIds.has(currentValue) ? currentValue : '';
  if (sanitizedValue !== currentValue) {
    state.customPartId = sanitizedValue;
  }

  customPartSelect.value = sanitizedValue;
  if (!sanitizedValue && customPartSelect.options.length > 0) {
    customPartSelect.selectedIndex = 0;
  }

  const selectedOption = getCustomPartOption(sanitizedValue);

  if (customPartPickerButton) {
    const label = customPartPickerButton.querySelector('.bolt-drive-picker__current-label');
    const iconWrapper = customPartPickerButton.querySelector('.bolt-drive-picker__current-icon');
    const iconImage = customPartPickerButton.querySelector('.bolt-drive-picker__current-icon-image');

    if (label) {
      label.textContent = selectedOption ? selectedOption.label : CUSTOM_PART_PLACEHOLDER_TEXT;
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
      customPartPickerButton.classList.remove('is-invalid');
      customPartPickerButton.removeAttribute('aria-invalid');
    } else {
      customPartPickerButton.classList.add('is-invalid');
      customPartPickerButton.setAttribute('aria-invalid', 'true');
    }
  }

  if (customPartPicker) {
    customPartPicker.classList.toggle('is-invalid', !isValid);
  }

  if (customPartPickerList) {
    const items = Array.from(customPartPickerList.querySelectorAll('[role="option"]'));
    items.forEach(item => {
      const isSelected = item.dataset.value === sanitizedValue;
      item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      item.classList.toggle('is-selected', isSelected);
      item.tabIndex = -1;
    });
  }

  if (customPartStatus) {
    if (selectedOption) {
      customPartStatus.textContent = `${selectedOption.label} icon selected.`;
      customPartStatus.classList.remove('text-danger');
    } else {
      customPartStatus.textContent = 'No built-in part icon selected.';
      customPartStatus.classList.remove('text-danger');
    }
  }
}

export function setCustomPartSelection(nextId, { triggerUpdate = true } = {}) {
  const desiredValue = typeof nextId === 'string' ? nextId.trim() : '';
  const sanitizedValue = validCustomPartIds.has(desiredValue) ? desiredValue : '';
  const previousValue = typeof state.customPartId === 'string' ? state.customPartId : '';

  state.customPartId = sanitizedValue;
  if (sanitizedValue) {
    state.customGraphicSource = 'parts';
  }
  syncCustomPartPicker({ isValid: true });
  applyCustomGraphicInfoDisplay();
  updateCustomImageUi();

  if (triggerUpdate && previousValue !== sanitizedValue) {
    updatePreview();
    updateDownloadState();
  }
}