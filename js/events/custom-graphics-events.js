/**
 * Custom icon and image event handlers
 * Extracted from events.js
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import * as forms from '../forms.js';
import { updatePreview, updateDownloadState } from '../render.js';

export function getCustomIconOptionElements() {
  if (!customIconPickerList) {
    return [];
  }
  return Array.from(customIconPickerList.querySelectorAll('[role="option"]'));
}

export function focusCustomIconOption(option) {
  if (!option) {
    return;
  }
  const options = getCustomIconOptionElements();
  options.forEach(opt => {
    opt.tabIndex = opt === option ? 0 : -1;
  });
  option.focus({ preventScroll: false });
  if (typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' });
  }
}

export function openCustomIconPicker() {
  if (!customIconPicker || !customIconPickerButton || !customIconPickerList) {
    return;
  }
  if (customIconPickerButton.disabled) {
    return;
  }
  if (customIconPickerOpen) {
    return;
  }
  customIconPickerOpen = true;
  customIconPicker.classList.add('is-open');
  customIconPickerList.hidden = false;
  customIconPickerButton.setAttribute('aria-expanded', 'true');

  const options = getCustomIconOptionElements();
  const currentName = typeof state.customIconName === 'string' ? state.customIconName : '';
  const selectedOption = options.find(option => option.dataset.value === currentName);
  focusCustomIconOption(selectedOption || options[0]);
}

export function closeCustomIconPicker({ focusButton = false } = {}) {
  if (!customIconPicker || !customIconPickerButton || !customIconPickerList) {
    return;
  }
  if (!customIconPickerOpen) {
    if (focusButton && !customIconPickerButton.disabled) {
      customIconPickerButton.focus();
    }
    return;
  }
  customIconPickerOpen = false;
  customIconPicker.classList.remove('is-open');
  customIconPickerList.hidden = true;
  customIconPickerButton.setAttribute('aria-expanded', 'false');
  if (focusButton && !customIconPickerButton.disabled) {
    customIconPickerButton.focus();
  }
}

export function toggleCustomIconPicker() {
  if (customIconPickerOpen) {
    closeCustomIconPicker({ focusButton: false });
  } else {
    openCustomIconPicker();
  }
}

export function moveCustomIconOption(delta) {
  if (!customIconPickerList) {
    return;
  }
  const options = getCustomIconOptionElements();
  if (options.length === 0) {
    return;
  }
  const activeElement = document.activeElement;
  const activeOption =
    activeElement && customIconPickerList.contains(activeElement)
      ? activeElement.closest('[role="option"]')
      : null;
  let index = activeOption ? options.indexOf(activeOption) : -1;
  if (index === -1) {
    const currentName = typeof state.customIconName === 'string' ? state.customIconName : '';
    index = options.findIndex(option => option.dataset.value === currentName);
  }
  let nextIndex = index + delta;
  if (nextIndex < 0) {
    nextIndex = options.length - 1;
  } else if (nextIndex >= options.length) {
    nextIndex = 0;
  }
  const nextOption = options[nextIndex];
  if (nextOption) {
    focusCustomIconOption(nextOption);
  }
}

export function handleCustomIconButtonKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    openCustomIconPicker();
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    openCustomIconPicker();
    const options = getCustomIconOptionElements();
    if (options.length > 0) {
      focusCustomIconOption(options[options.length - 1]);
    }
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    toggleCustomIconPicker();
    return;
  }
  if (key === 'Escape' && customIconPickerOpen) {
    event.preventDefault();
    closeCustomIconPicker({ focusButton: true });
  }
}

export function handleCustomIconListKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    moveCustomIconOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    moveCustomIconOption(-1);
    return;
  }
  if (key === 'Home') {
    event.preventDefault();
    const options = getCustomIconOptionElements();
    if (options.length > 0) {
      focusCustomIconOption(options[0]);
    }
    return;
  }
  if (key === 'End') {
    event.preventDefault();
    const options = getCustomIconOptionElements();
    if (options.length > 0) {
      focusCustomIconOption(options[options.length - 1]);
    }
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    const target = event.target;
    if (target && target instanceof HTMLElement) {
      const option = target.closest('[role="option"]');
      if (option) {
        setCustomIconSelection({
          name: option.dataset.value || '',
          unicode: option.dataset.unicode || '',
          label: option.dataset.label || option.textContent || option.dataset.value || '',
          style: option.dataset.style || 'solid',
        });
        closeCustomIconPicker({ focusButton: true });
      }
    }
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closeCustomIconPicker({ focusButton: true });
    return;
  }
  if (key === 'Tab') {
    closeCustomIconPicker();
  }
}

export function handleCustomIconListClick(event) {
  if (!customIconPickerList) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const option = target.closest('[role="option"]');
  if (!option || !customIconPickerList.contains(option)) {
    return;
  }
  event.preventDefault();
  setCustomIconSelection({
    name: option.dataset.value || '',
    unicode: option.dataset.unicode || '',
    label: option.dataset.label || option.textContent || option.dataset.value || '',
    style: option.dataset.style || 'solid',
  });
  closeCustomIconPicker({ focusButton: true });
}

export function handleCustomIconListFocusOut() {
  if (!customIconPickerOpen) {
    return;
  }
  setTimeout(() => {
    if (!customIconPickerOpen) {
      return;
    }
    if (!customIconPicker) {
      closeCustomIconPicker();
      return;
    }
    const active = document.activeElement;
    if (!active || !customIconPicker.contains(active)) {
      closeCustomIconPicker();
    }
  }, 0);
}