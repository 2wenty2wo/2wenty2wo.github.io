/**
 * Washer type picker event handlers
 * Extracted from events.js
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import * as forms from '../forms.js';
import { updatePreview, updateDownloadState } from '../render.js';

export function getWasherTypeOptionElements() {
  if (!washerTypePickerList) {
    return [];
  }
  return Array.from(washerTypePickerList.querySelectorAll('[role="option"]'));
}

export function focusWasherTypeOption(option) {
  if (!option) {
    return;
  }
  const options = getWasherTypeOptionElements();
  options.forEach(opt => {
    opt.tabIndex = opt === option ? 0 : -1;
  });
  option.focus();
  if (typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' });
  }
}

export function openWasherTypePicker() {
  if (!washerTypePicker || !washerTypePickerButton || !washerTypePickerList) {
    return;
  }
  if (washerTypePickerButton.disabled) {
    return;
  }
  if (washerTypePickerOpen) {
    return;
  }
  washerTypePickerOpen = true;
  washerTypePicker.classList.add('is-open');
  washerTypePickerList.hidden = false;
  washerTypePickerButton.setAttribute('aria-expanded', 'true');
  syncWasherTypePicker({ isValid: true });

  const options = getWasherTypeOptionElements();
  if (options.length === 0) {
    return;
  }
  const currentValue = typeof state.washerType === 'string' ? state.washerType : '';
  const selectedOption = options.find(option => option.dataset.value === currentValue);
  focusWasherTypeOption(selectedOption || options[0]);
}

export function closeWasherTypePicker({ focusButton = false } = {}) {
  if (!washerTypePicker || !washerTypePickerButton || !washerTypePickerList) {
    return;
  }
  if (!washerTypePickerOpen) {
    if (focusButton && !washerTypePickerButton.disabled) {
      washerTypePickerButton.focus();
    }
    return;
  }
  washerTypePickerOpen = false;
  washerTypePicker.classList.remove('is-open');
  washerTypePickerList.hidden = true;
  washerTypePickerButton.setAttribute('aria-expanded', 'false');
  if (focusButton && !washerTypePickerButton.disabled) {
    washerTypePickerButton.focus();
  }
}

export function toggleWasherTypePicker() {
  if (washerTypePickerOpen) {
    closeWasherTypePicker({ focusButton: false });
  } else {
    openWasherTypePicker();
  }
}

export function moveWasherTypeOption(delta) {
  const options = getWasherTypeOptionElements();
  if (options.length === 0) {
    return;
  }
  const active = document.activeElement;
  const activeIndex = options.findIndex(option => option === active);
  let nextIndex = activeIndex + delta;
  if (nextIndex < 0) {
    nextIndex = options.length - 1;
  }
  if (nextIndex >= options.length) {
    nextIndex = 0;
  }
  focusWasherTypeOption(options[nextIndex]);
}

export function handleWasherTypeButtonKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ') {
    event.preventDefault();
    openWasherTypePicker();
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closeWasherTypePicker({ focusButton: true });
  }
}

export function handleWasherTypeListKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    moveWasherTypeOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    moveWasherTypeOption(-1);
    return;
  }
  if (key === 'Home') {
    event.preventDefault();
    const options = getWasherTypeOptionElements();
    if (options.length > 0) {
      focusWasherTypeOption(options[0]);
    }
    return;
  }
  if (key === 'End') {
    event.preventDefault();
    const options = getWasherTypeOptionElements();
    if (options.length > 0) {
      focusWasherTypeOption(options[options.length - 1]);
    }
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    const target = event.target;
    if (target && target instanceof HTMLElement) {
      const option = target.closest('[role="option"]');
      if (option) {
        setWasherTypeSelection(option.dataset.value || '');
        closeWasherTypePicker({ focusButton: true });
      }
    }
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closeWasherTypePicker({ focusButton: true });
    return;
  }
  if (key === 'Tab') {
    closeWasherTypePicker();
  }
}

export function handleWasherTypeListClick(event) {
  if (!washerTypePickerList) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const option = target.closest('[role="option"]');
  if (!option || !washerTypePickerList.contains(option)) {
    return;
  }
  event.preventDefault();
  setWasherTypeSelection(option.dataset.value || '');
  closeWasherTypePicker({ focusButton: true });
}

export function handleWasherTypeListFocusOut() {
  if (!washerTypePickerOpen) {
    return;
  }
  setTimeout(() => {
    if (!washerTypePickerOpen) {
      return;
    }
    if (!washerTypePicker) {
      closeWasherTypePicker();
      return;
    }
    const active = document.activeElement;
    if (!active || !washerTypePicker.contains(active)) {
      closeWasherTypePicker();
    }
  }, 0);
}