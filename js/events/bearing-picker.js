/**
 * Bearing picker event handlers
 * Extracted from events.js
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import * as forms from '../forms.js';
import { updatePreview, updateDownloadState } from '../render.js';

export function getBearingTypeOptionElements() {
  if (!bearingTypePickerList) {
    return [];
  }
  return Array.from(bearingTypePickerList.querySelectorAll('[role="option"]'));
}

export function focusBearingTypeOption(option) {
  if (!option) {
    return;
  }
  const options = getBearingTypeOptionElements();
  options.forEach(opt => {
    opt.tabIndex = opt === option ? 0 : -1;
  });
  option.focus();
  if (typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' });
  }
}

export function openBearingTypePicker() {
  if (!bearingTypePicker || !bearingTypePickerButton || !bearingTypePickerList) {
    return;
  }
  if (bearingTypePickerButton.disabled) {
    return;
  }
  if (bearingTypePickerOpen) {
    return;
  }
  bearingTypePickerOpen = true;
  bearingTypePicker.classList.add('is-open');
  bearingTypePickerList.hidden = false;
  bearingTypePickerButton.setAttribute('aria-expanded', 'true');
  syncBearingTypePicker({ isValid: true });

  const options = getBearingTypeOptionElements();
  const currentValue = typeof state.bearingType === 'string' ? state.bearingType : '';
  const selectedOption = options.find(option => option.dataset.value === currentValue);
  focusBearingTypeOption(selectedOption || options[0]);
}

export function closeBearingTypePicker({ focusButton = false } = {}) {
  if (!bearingTypePicker || !bearingTypePickerButton || !bearingTypePickerList) {
    return;
  }
  if (!bearingTypePickerOpen) {
    if (focusButton && !bearingTypePickerButton.disabled) {
      bearingTypePickerButton.focus();
    }
    return;
  }
  bearingTypePickerOpen = false;
  bearingTypePicker.classList.remove('is-open');
  bearingTypePickerList.hidden = true;
  bearingTypePickerButton.setAttribute('aria-expanded', 'false');
  if (focusButton && !bearingTypePickerButton.disabled) {
    bearingTypePickerButton.focus();
  }
}

export function toggleBearingTypePicker() {
  if (bearingTypePickerOpen) {
    closeBearingTypePicker({ focusButton: false });
  } else {
    openBearingTypePicker();
  }
}

export function moveBearingTypeOption(delta) {
  if (!bearingTypePickerList) {
    return;
  }
  const options = getBearingTypeOptionElements();
  if (options.length === 0) {
    return;
  }
  const active = document.activeElement;
  const activeOption = active && bearingTypePickerList.contains(active)
    ? active.closest('[role="option"]')
    : null;
  let index = activeOption ? options.indexOf(activeOption) : -1;
  if (index === -1) {
    const currentValue = typeof state.bearingType === 'string' ? state.bearingType : '';
    index = options.findIndex(option => option.dataset.value === currentValue);
  }
  let nextIndex = index + delta;
  if (nextIndex < 0) {
    nextIndex = options.length - 1;
  } else if (nextIndex >= options.length) {
    nextIndex = 0;
  }
  const nextOption = options[nextIndex];
  if (nextOption) {
    focusBearingTypeOption(nextOption);
  }
}

export function handleBearingTypeButtonKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    openBearingTypePicker();
    moveBearingTypeOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    openBearingTypePicker();
    moveBearingTypeOption(-1);
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    toggleBearingTypePicker();
    return;
  }
  if (key === 'Escape' && bearingTypePickerOpen) {
    event.preventDefault();
    closeBearingTypePicker({ focusButton: true });
  }
}

export function handleBearingTypeListKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    moveBearingTypeOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    moveBearingTypeOption(-1);
    return;
  }
  if (key === 'Home') {
    event.preventDefault();
    const options = getBearingTypeOptionElements();
    if (options.length > 0) {
      focusBearingTypeOption(options[0]);
    }
    return;
  }
  if (key === 'End') {
    event.preventDefault();
    const options = getBearingTypeOptionElements();
    if (options.length > 0) {
      focusBearingTypeOption(options[options.length - 1]);
    }
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    const target = event.target;
    if (target && target instanceof HTMLElement) {
      const option = target.closest('[role="option"]');
      if (option) {
        setBearingTypeSelection(option.dataset.value || '');
        closeBearingTypePicker({ focusButton: true });
      }
    }
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closeBearingTypePicker({ focusButton: true });
    return;
  }
  if (key === 'Tab') {
    closeBearingTypePicker();
  }
}

export function handleBearingTypeListClick(event) {
  if (!bearingTypePickerList) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const option = target.closest('[role="option"]');
  if (!option || !bearingTypePickerList.contains(option)) {
    return;
  }
  event.preventDefault();
  setBearingTypeSelection(option.dataset.value || '');
  closeBearingTypePicker({ focusButton: true });
}

export function handleBearingTypeListFocusOut() {
  if (!bearingTypePickerOpen) {
    return;
  }
  setTimeout(() => {
    if (!bearingTypePickerOpen) {
      return;
    }
    if (!bearingTypePicker) {
      closeBearingTypePicker();
      return;
    }
    const active = document.activeElement;
    if (!active || !bearingTypePicker.contains(active)) {
      closeBearingTypePicker();
    }
  }, 0);
}