/**
 * Fuse type picker event handlers
 * Extracted from events.js
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import * as forms from '../forms.js';
import { updatePreview, updateDownloadState } from '../render.js';

export function getFuseTypeOptionElements() {
  if (!fuseTypePickerList) {
    return [];
  }
  return Array.from(fuseTypePickerList.querySelectorAll('[role="option"]'));
}

export function focusFuseTypeOption(option) {
  if (!option) {
    return;
  }
  const options = getFuseTypeOptionElements();
  options.forEach(opt => {
    opt.tabIndex = opt === option ? 0 : -1;
  });
  option.focus();
  if (typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' });
  }
}

export function openFuseTypePicker() {
  if (!fuseTypePicker || !fuseTypePickerButton || !fuseTypePickerList) {
    return;
  }
  if (fuseTypePickerButton.disabled) {
    return;
  }
  if (fuseTypePickerOpen) {
    return;
  }
  fuseTypePickerOpen = true;
  fuseTypePicker.classList.add('is-open');
  fuseTypePickerList.hidden = false;
  fuseTypePickerButton.setAttribute('aria-expanded', 'true');
  syncFuseTypePicker();

  const options = getFuseTypeOptionElements();
  if (options.length === 0) {
    return;
  }
  const currentValue = typeof state.fuseType === 'string' ? state.fuseType : '';
  const selectedOption = options.find(option => option.dataset.value === currentValue);
  focusFuseTypeOption(selectedOption || options[0]);
}

export function closeFuseTypePicker({ focusButton = false } = {}) {
  if (!fuseTypePicker || !fuseTypePickerButton || !fuseTypePickerList) {
    return;
  }
  if (!fuseTypePickerOpen) {
    if (focusButton && !fuseTypePickerButton.disabled) {
      fuseTypePickerButton.focus();
    }
    return;
  }
  fuseTypePickerOpen = false;
  fuseTypePicker.classList.remove('is-open');
  fuseTypePickerList.hidden = true;
  fuseTypePickerButton.setAttribute('aria-expanded', 'false');
  if (focusButton && !fuseTypePickerButton.disabled) {
    fuseTypePickerButton.focus();
  }
}

export function toggleFuseTypePicker() {
  if (fuseTypePickerOpen) {
    closeFuseTypePicker({ focusButton: false });
  } else {
    openFuseTypePicker();
  }
}

export function moveFuseTypeOption(delta) {
  if (!fuseTypePickerList) {
    return;
  }
  const options = getFuseTypeOptionElements();
  if (options.length === 0) {
    return;
  }
  const active = document.activeElement;
  const activeOption = active && fuseTypePickerList.contains(active)
    ? active.closest('[role="option"]')
    : null;
  let index = activeOption ? options.indexOf(activeOption) : -1;
  if (index === -1) {
    const currentValue = typeof state.fuseType === 'string' ? state.fuseType : '';
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
    focusFuseTypeOption(nextOption);
  }
}

export function handleFuseTypeButtonKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    openFuseTypePicker();
    moveFuseTypeOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    openFuseTypePicker();
    moveFuseTypeOption(-1);
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    toggleFuseTypePicker();
    return;
  }
  if (key === 'Escape' && fuseTypePickerOpen) {
    event.preventDefault();
    closeFuseTypePicker({ focusButton: true });
  }
}

export function handleFuseTypeListKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    moveFuseTypeOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    moveFuseTypeOption(-1);
    return;
  }
  if (key === 'Home') {
    event.preventDefault();
    const options = getFuseTypeOptionElements();
    if (options.length > 0) {
      focusFuseTypeOption(options[0]);
    }
    return;
  }
  if (key === 'End') {
    event.preventDefault();
    const options = getFuseTypeOptionElements();
    if (options.length > 0) {
      focusFuseTypeOption(options[options.length - 1]);
    }
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    const target = event.target;
    if (target && target instanceof HTMLElement) {
      const option = target.closest('[role="option"]');
      if (option) {
        setFuseTypeSelection(option.dataset.value || '');
        closeFuseTypePicker({ focusButton: true });
      }
    }
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closeFuseTypePicker({ focusButton: true });
    return;
  }
  if (key === 'Tab') {
    closeFuseTypePicker();
  }
}

export function handleFuseTypeListClick(event) {
  if (!fuseTypePickerList) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const option = target.closest('[role="option"]');
  if (!option || !fuseTypePickerList.contains(option)) {
    return;
  }
  event.preventDefault();
  setFuseTypeSelection(option.dataset.value || '');
  closeFuseTypePicker({ focusButton: true });
}

export function handleFuseTypeListFocusOut() {
  if (!fuseTypePickerOpen) {
    return;
  }
  setTimeout(() => {
    if (!fuseTypePickerOpen) {
      return;
    }
    if (!fuseTypePicker) {
      closeFuseTypePicker();
      return;
    }
    const active = document.activeElement;
    if (!active || !fuseTypePicker.contains(active)) {
      closeFuseTypePicker();
    }
  }, 0);
}