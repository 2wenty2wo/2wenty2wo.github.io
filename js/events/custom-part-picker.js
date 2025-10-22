/**
 * Custom part picker event handlers
 * Extracted from events.js
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import * as forms from '../forms.js';
import { updatePreview, updateDownloadState } from '../render.js';

export function getCustomPartOptionElements() {
  if (!customPartPickerList) {
    return [];
  }
  return Array.from(customPartPickerList.querySelectorAll('[role="option"]'));
}

export function focusCustomPartOption(option) {
  if (!option) {
    return;
  }
  const options = getCustomPartOptionElements();
  options.forEach(opt => {
    opt.tabIndex = opt === option ? 0 : -1;
  });
  option.focus();
  if (typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' });
  }
}

export function openCustomPartPicker() {
  if (!customPartPicker || !customPartPickerButton || !customPartPickerList) {
    return;
  }
  if (customPartPickerButton.disabled) {
    return;
  }
  if (customPartPickerOpen) {
    return;
  }
  customPartPickerOpen = true;
  customPartPicker.classList.add('is-open');
  customPartPickerList.hidden = false;
  customPartPickerButton.setAttribute('aria-expanded', 'true');
  syncCustomPartPicker({ isValid: true });

  const options = getCustomPartOptionElements();
  if (options.length === 0) {
    return;
  }
  const currentValue = typeof state.customPartId === 'string' ? state.customPartId : '';
  const selectedOption = options.find(option => option.dataset.value === currentValue);
  focusCustomPartOption(selectedOption || options[0]);
}

export function closeCustomPartPicker({ focusButton = false } = {}) {
  if (!customPartPicker || !customPartPickerButton || !customPartPickerList) {
    return;
  }
  if (!customPartPickerOpen) {
    if (focusButton && !customPartPickerButton.disabled) {
      customPartPickerButton.focus();
    }
    return;
  }
  customPartPickerOpen = false;
  customPartPicker.classList.remove('is-open');
  customPartPickerList.hidden = true;
  customPartPickerButton.setAttribute('aria-expanded', 'false');
  if (focusButton && !customPartPickerButton.disabled) {
    customPartPickerButton.focus();
  }
}

export function toggleCustomPartPicker() {
  if (customPartPickerOpen) {
    closeCustomPartPicker({ focusButton: false });
  } else {
    openCustomPartPicker();
  }
}

export function moveCustomPartOption(delta) {
  if (!customPartPickerList) {
    return;
  }
  const options = getCustomPartOptionElements();
  if (options.length === 0) {
    return;
  }
  const active = document.activeElement;
  const activeOption = active && customPartPickerList.contains(active)
    ? active.closest('[role="option"]')
    : null;
  let index = activeOption ? options.indexOf(activeOption) : -1;
  if (index === -1) {
    const currentValue = typeof state.customPartId === 'string' ? state.customPartId : '';
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
    focusCustomPartOption(nextOption);
  }
}

export function handleCustomPartButtonKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    openCustomPartPicker();
    moveCustomPartOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    openCustomPartPicker();
    moveCustomPartOption(-1);
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    toggleCustomPartPicker();
  }
}

export function handleCustomPartListKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    moveCustomPartOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    moveCustomPartOption(-1);
    return;
  }
  if (key === 'Home') {
    event.preventDefault();
    const options = getCustomPartOptionElements();
    if (options.length > 0) {
      focusCustomPartOption(options[0]);
    }
    return;
  }
  if (key === 'End') {
    event.preventDefault();
    const options = getCustomPartOptionElements();
    if (options.length > 0) {
      focusCustomPartOption(options[options.length - 1]);
    }
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    const target = event.target;
    if (target && target instanceof HTMLElement) {
      const option = target.closest('[role="option"]');
      if (option) {
        setCustomGraphicSource('parts');
        setCustomPartSelection(option.dataset.value || '');
        closeCustomPartPicker({ focusButton: true });
      }
    }
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closeCustomPartPicker({ focusButton: true });
    return;
  }
  if (key === 'Tab') {
    closeCustomPartPicker();
  }
}

export function handleCustomPartListClick(event) {
  if (!customPartPickerList) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const option = target.closest('[role="option"]');
  if (!option || !customPartPickerList.contains(option)) {
    return;
  }
  event.preventDefault();
  setCustomGraphicSource('parts');
  setCustomPartSelection(option.dataset.value || '');
  closeCustomPartPicker({ focusButton: true });
}

export function handleCustomPartListFocusOut() {
  if (!customPartPickerOpen) {
    return;
  }
  setTimeout(() => {
    if (!customPartPickerOpen) {
      return;
    }
    if (!customPartPicker) {
      closeCustomPartPicker();
      return;
    }
    const active = document.activeElement;
    if (!active || !customPartPicker.contains(active)) {
      closeCustomPartPicker();
    }
  }, 0);
}