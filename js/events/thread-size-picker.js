/**
 * Thread size picker event handlers
 * Extracted from events.js
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import * as forms from '../forms.js';
import { updatePreview, updateDownloadState } from '../render.js';

export function getThreadSizeOptionElements() {
  if (!threadSizePickerList) {
    return [];
  }
  return Array.from(threadSizePickerList.querySelectorAll('[role="option"]'));
}

export function focusThreadSizeOption(option) {
  if (!option) {
    return;
  }
  const options = getThreadSizeOptionElements();
  options.forEach(opt => {
    opt.tabIndex = opt === option ? 0 : -1;
  });
  option.focus();
  if (typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' });
  }
}

export function openThreadSizePicker() {
  if (!threadSizePicker || !threadSizePickerButton || !threadSizePickerList) {
    return;
  }
  if (threadSizePickerButton.disabled || threadSizePickerOpen) {
    return;
  }
  threadSizePickerOpen = true;
  threadSizePicker.classList.add('is-open');
  threadSizePickerList.hidden = false;
  threadSizePickerButton.setAttribute('aria-expanded', 'true');
  syncThreadSizePicker({ isValid: true });

  const options = getThreadSizeOptionElements();
  if (options.length === 0) {
    return;
  }
  const currentValue = typeof state.threadSize === 'string' ? state.threadSize : '';
  const selectedOption = options.find(option => option.dataset.value === currentValue);
  focusThreadSizeOption(selectedOption || options[0]);
}

export function closeThreadSizePicker({ focusButton = false } = {}) {
  if (!threadSizePicker || !threadSizePickerButton || !threadSizePickerList) {
    return;
  }
  if (!threadSizePickerOpen) {
    if (focusButton && !threadSizePickerButton.disabled) {
      threadSizePickerButton.focus();
    }
    return;
  }
  threadSizePickerOpen = false;
  threadSizePicker.classList.remove('is-open');
  threadSizePickerList.hidden = true;
  threadSizePickerButton.setAttribute('aria-expanded', 'false');
  if (focusButton && !threadSizePickerButton.disabled) {
    threadSizePickerButton.focus();
  }
}

export function toggleThreadSizePicker() {
  if (threadSizePickerOpen) {
    closeThreadSizePicker({ focusButton: false });
  } else {
    openThreadSizePicker();
  }
}

export function moveThreadSizeOption(delta) {
  if (!threadSizePickerList) {
    return;
  }
  const options = getThreadSizeOptionElements();
  if (options.length === 0) {
    return;
  }
  const active = document.activeElement;
  const activeOption = active && threadSizePickerList.contains(active)
    ? active.closest('[role="option"]')
    : null;
  let index = activeOption ? options.indexOf(activeOption) : -1;
  if (index === -1) {
    const currentValue = typeof state.threadSize === 'string' ? state.threadSize : '';
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
    focusThreadSizeOption(nextOption);
  }
}

export function handleThreadSizeButtonKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    openThreadSizePicker();
    moveThreadSizeOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    openThreadSizePicker();
    moveThreadSizeOption(-1);
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    toggleThreadSizePicker();
    return;
  }
  if (key === 'Escape' && threadSizePickerOpen) {
    event.preventDefault();
    closeThreadSizePicker({ focusButton: true });
  }
}

export function handleThreadSizeListKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    moveThreadSizeOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    moveThreadSizeOption(-1);
    return;
  }
  if (key === 'Home') {
    event.preventDefault();
    const options = getThreadSizeOptionElements();
    if (options.length > 0) {
      focusThreadSizeOption(options[0]);
    }
    return;
  }
  if (key === 'End') {
    event.preventDefault();
    const options = getThreadSizeOptionElements();
    if (options.length > 0) {
      focusThreadSizeOption(options[options.length - 1]);
    }
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    const target = event.target;
    if (target && target instanceof HTMLElement) {
      const option = target.closest('[role="option"]');
      if (option) {
        setThreadSizeSelection(option.dataset.value || '');
        closeThreadSizePicker({ focusButton: true });
      }
    }
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closeThreadSizePicker({ focusButton: true });
    return;
  }
  if (key === 'Tab') {
    closeThreadSizePicker();
  }
}

export function handleThreadSizeListClick(event) {
  if (!threadSizePickerList) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const option = target.closest('[role="option"]');
  if (!option || !threadSizePickerList.contains(option)) {
    return;
  }
  event.preventDefault();
  setThreadSizeSelection(option.dataset.value || '');
  closeThreadSizePicker({ focusButton: true });
}

export function handleThreadSizeListFocusOut() {
  if (!threadSizePickerOpen) {
    return;
  }
  setTimeout(() => {
    if (!threadSizePickerOpen) {
      return;
    }
    if (!threadSizePicker) {
      closeThreadSizePicker();
      return;
    }
    const active = document.activeElement;
    if (!active || !threadSizePicker.contains(active)) {
      closeThreadSizePicker();
    }
  }, 0);
}