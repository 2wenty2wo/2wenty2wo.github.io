/**
 * Switch type picker event handlers
 * Extracted from events.js
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import * as forms from '../forms.js';
import { updatePreview, updateDownloadState } from '../render.js';

export function getSwitchTypeOptionElements() {
  if (!switchTypePickerList) {
    return [];
  }
  return Array.from(switchTypePickerList.querySelectorAll('[role="option"]'));
}

export function focusSwitchTypeOption(option) {
  if (!option) {
    return;
  }
  const options = getSwitchTypeOptionElements();
  options.forEach(opt => {
    opt.tabIndex = opt === option ? 0 : -1;
  });
  option.focus();
  if (typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' });
  }
}

export function openSwitchTypePicker() {
  if (!switchTypePicker || !switchTypePickerButton || !switchTypePickerList) {
    return;
  }
  if (switchTypePickerButton.disabled || switchTypePickerOpen) {
    return;
  }
  switchTypePickerOpen = true;
  switchTypePicker.classList.add('is-open');
  switchTypePickerList.hidden = false;
  switchTypePickerButton.setAttribute('aria-expanded', 'true');
  syncSwitchTypePicker({ isValid: true });

  const options = getSwitchTypeOptionElements();
  if (options.length === 0) {
    return;
  }
  const currentValue = typeof state.switchType === 'string' ? state.switchType : '';
  const selectedOption = options.find(option => option.dataset.value === currentValue);
  focusSwitchTypeOption(selectedOption || options[0]);
}

export function closeSwitchTypePicker({ focusButton = false } = {}) {
  if (!switchTypePicker || !switchTypePickerButton || !switchTypePickerList) {
    return;
  }
  if (!switchTypePickerOpen) {
    if (focusButton && !switchTypePickerButton.disabled) {
      switchTypePickerButton.focus();
    }
    return;
  }
  switchTypePickerOpen = false;
  switchTypePicker.classList.remove('is-open');
  switchTypePickerList.hidden = true;
  switchTypePickerButton.setAttribute('aria-expanded', 'false');
  if (focusButton && !switchTypePickerButton.disabled) {
    switchTypePickerButton.focus();
  }
}

export function toggleSwitchTypePicker() {
  if (switchTypePickerOpen) {
    closeSwitchTypePicker({ focusButton: false });
  } else {
    openSwitchTypePicker();
  }
}

export function moveSwitchTypeOption(delta) {
  const options = getSwitchTypeOptionElements();
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
  focusSwitchTypeOption(options[nextIndex]);
}

export function handleSwitchTypeButtonKeydown(event) {
  if (!switchTypePickerList) {
    return;
  }
  const key = event.key;
  if (key === 'ArrowDown' || key === 'Down') {
    event.preventDefault();
    openSwitchTypePicker();
    const options = getSwitchTypeOptionElements();
    if (options.length > 0) {
      focusSwitchTypeOption(options[0]);
    }
    return;
  }
  if (key === 'ArrowUp' || key === 'Up') {
    event.preventDefault();
    openSwitchTypePicker();
    const options = getSwitchTypeOptionElements();
    if (options.length > 0) {
      focusSwitchTypeOption(options[options.length - 1]);
    }
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    toggleSwitchTypePicker();
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closeSwitchTypePicker({ focusButton: true });
  }
}

export function handleSwitchTypeListKeydown(event) {
  const key = event.key;
  if (key === 'ArrowDown' || key === 'Down') {
    event.preventDefault();
    moveSwitchTypeOption(1);
    return;
  }
  if (key === 'ArrowUp' || key === 'Up') {
    event.preventDefault();
    moveSwitchTypeOption(-1);
    return;
  }
  if (key === 'Home') {
    event.preventDefault();
    const options = getSwitchTypeOptionElements();
    if (options.length > 0) {
      focusSwitchTypeOption(options[0]);
    }
    return;
  }
  if (key === 'End') {
    event.preventDefault();
    const options = getSwitchTypeOptionElements();
    if (options.length > 0) {
      focusSwitchTypeOption(options[options.length - 1]);
    }
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    const target = event.target;
    if (target && target instanceof HTMLElement) {
      const option = target.closest('[role="option"]');
      if (option) {
        setSwitchTypeSelection(option.dataset.value || '');
        closeSwitchTypePicker({ focusButton: true });
      }
    }
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closeSwitchTypePicker({ focusButton: true });
    return;
  }
  if (key === 'Tab') {
    closeSwitchTypePicker();
  }
}

export function handleSwitchTypeListClick(event) {
  if (!switchTypePickerList) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const option = target.closest('[role="option"]');
  if (!option || !switchTypePickerList.contains(option)) {
    return;
  }
  event.preventDefault();
  setSwitchTypeSelection(option.dataset.value || '');
  closeSwitchTypePicker({ focusButton: true });
}

export function handleSwitchTypeListFocusOut() {
  if (!switchTypePickerOpen) {
    return;
  }
  setTimeout(() => {
    if (!switchTypePickerOpen) {
      return;
    }
    if (!switchTypePicker) {
      closeSwitchTypePicker();
      return;
    }
    const active = document.activeElement;
    if (!active || !switchTypePicker.contains(active)) {
      closeSwitchTypePicker();
    }
  }, 0);
}