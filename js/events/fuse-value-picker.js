/**
 * Fuse value and glass options picker event handlers
 * Extracted from events.js
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import * as forms from '../forms.js';
import { updatePreview, updateDownloadState } from '../render.js';

export function getFuseValueOptionElements() {
  if (!fuseValuePickerList) {
    return [];
  }
  return Array.from(fuseValuePickerList.querySelectorAll('[role="option"]'));
}

export function focusFuseValueOption(option) {
  if (!option) {
    return;
  }
  const options = getFuseValueOptionElements();
  options.forEach(opt => {
    opt.tabIndex = opt === option ? 0 : -1;
  });
  option.focus();
  if (typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' });
  }
}

export function openFuseValuePicker() {
  if (!fuseValuePicker || !fuseValuePickerButton || !fuseValuePickerList) {
    return;
  }
  if (fuseValuePickerButton.disabled || fuseValuePickerOpen) {
    return;
  }
  fuseValuePickerOpen = true;
  fuseValuePicker.classList.add('is-open');
  fuseValuePickerList.hidden = false;
  fuseValuePickerButton.setAttribute('aria-expanded', 'true');
  syncFuseValuePicker({ isValid: true });

  const options = getFuseValueOptionElements();
  if (options.length === 0) {
    return;
  }
  const currentValue = typeof state.fuseValue === 'string' ? state.fuseValue : '';
  const selectedOption = options.find(option => option.dataset.value === currentValue);
  focusFuseValueOption(selectedOption || options[0]);
}

export function closeFuseValuePicker({ focusButton = false } = {}) {
  if (!fuseValuePicker || !fuseValuePickerButton || !fuseValuePickerList) {
    return;
  }
  if (!fuseValuePickerOpen) {
    if (focusButton && !fuseValuePickerButton.disabled) {
      fuseValuePickerButton.focus();
    }
    return;
  }
  fuseValuePickerOpen = false;
  fuseValuePicker.classList.remove('is-open');
  fuseValuePickerList.hidden = true;
  fuseValuePickerButton.setAttribute('aria-expanded', 'false');
  if (focusButton && !fuseValuePickerButton.disabled) {
    fuseValuePickerButton.focus();
  }
}

export function toggleFuseValuePicker() {
  if (fuseValuePickerOpen) {
    closeFuseValuePicker({ focusButton: false });
  } else {
    openFuseValuePicker();
  }
}

export function moveFuseValueOption(delta) {
  if (!fuseValuePickerList) {
    return;
  }
  const options = getFuseValueOptionElements();
  if (options.length === 0) {
    return;
  }
  const active = document.activeElement;
  const activeOption = active && fuseValuePickerList.contains(active)
    ? active.closest('[role="option"]')
    : null;
  let index = activeOption ? options.indexOf(activeOption) : -1;
  if (index === -1) {
    const currentValue = typeof state.fuseValue === 'string' ? state.fuseValue : '';
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
    focusFuseValueOption(nextOption);
  }
}

export function handleFuseValueButtonKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    openFuseValuePicker();
    moveFuseValueOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    openFuseValuePicker();
    moveFuseValueOption(-1);
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    toggleFuseValuePicker();
    return;
  }
  if (key === 'Escape' && fuseValuePickerOpen) {
    event.preventDefault();
    closeFuseValuePicker({ focusButton: true });
  }
}

export function handleFuseValueListKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    moveFuseValueOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    moveFuseValueOption(-1);
    return;
  }
  if (key === 'Home') {
    event.preventDefault();
    const options = getFuseValueOptionElements();
    if (options.length > 0) {
      focusFuseValueOption(options[0]);
    }
    return;
  }
  if (key === 'End') {
    event.preventDefault();
    const options = getFuseValueOptionElements();
    if (options.length > 0) {
      focusFuseValueOption(options[options.length - 1]);
    }
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    const target = event.target;
    if (target && target instanceof HTMLElement) {
      const option = target.closest('[role="option"]');
      if (option) {
        setFuseValueSelection(option.dataset.value || '');
        closeFuseValuePicker({ focusButton: true });
      }
    }
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closeFuseValuePicker({ focusButton: true });
    return;
  }
  if (key === 'Tab') {
    closeFuseValuePicker();
  }
}

export function handleFuseValueListClick(event) {
  if (!fuseValuePickerList) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const option = target.closest('[role="option"]');
  if (!option || !fuseValuePickerList.contains(option)) {
    return;
  }
  event.preventDefault();
  setFuseValueSelection(option.dataset.value || '');
  closeFuseValuePicker({ focusButton: true });
}

export function handleFuseValueListFocusOut() {
  if (!fuseValuePickerOpen) {
    return;
  }
  setTimeout(() => {
    if (!fuseValuePickerOpen) {
      return;
    }
    if (!fuseValuePicker) {
      closeFuseValuePicker();
      return;
    }
    const active = document.activeElement;
    if (!active || !fuseValuePicker.contains(active)) {
      closeFuseValuePicker();
    }
  }, 0);
}

export function getGlassSpeedOptionElements() {
  if (!glassSpeedPickerList) {
    return [];
  }
  return Array.from(glassSpeedPickerList.querySelectorAll('[role="option"]'));
}

export function focusGlassSpeedOption(option) {
  if (!option) {
    return;
  }
  const options = getGlassSpeedOptionElements();
  options.forEach(opt => {
    opt.tabIndex = opt === option ? 0 : -1;
  });
  option.focus();
  if (typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' });
  }
}

export function openGlassSpeedPicker() {
  if (!glassSpeedPicker || !glassSpeedPickerButton || !glassSpeedPickerList) {
    return;
  }
  if (glassSpeedPickerButton.disabled || glassSpeedPickerOpen) {
    return;
  }
  glassSpeedPickerOpen = true;
  glassSpeedPicker.classList.add('is-open');
  glassSpeedPickerList.hidden = false;
  glassSpeedPickerButton.setAttribute('aria-expanded', 'true');
  syncGlassSpeedPicker({ isValid: true });

  const options = getGlassSpeedOptionElements();
  if (options.length === 0) {
    return;
  }
  const currentValue = typeof state.glassSpeed === 'string' ? state.glassSpeed : '';
  const selectedOption = options.find(option => option.dataset.value === currentValue);
  focusGlassSpeedOption(selectedOption || options[0]);
}

export function closeGlassSpeedPicker({ focusButton = false } = {}) {
  if (!glassSpeedPicker || !glassSpeedPickerButton || !glassSpeedPickerList) {
    return;
  }
  if (!glassSpeedPickerOpen) {
    if (focusButton && !glassSpeedPickerButton.disabled) {
      glassSpeedPickerButton.focus();
    }
    return;
  }
  glassSpeedPickerOpen = false;
  glassSpeedPicker.classList.remove('is-open');
  glassSpeedPickerList.hidden = true;
  glassSpeedPickerButton.setAttribute('aria-expanded', 'false');
  if (focusButton && !glassSpeedPickerButton.disabled) {
    glassSpeedPickerButton.focus();
  }
}

export function toggleGlassSpeedPicker() {
  if (!glassSpeedPicker || !glassSpeedPickerButton || !glassSpeedPickerList) {
    return;
  }
  if (glassSpeedPickerButton.disabled) {
    return;
  }
  if (glassSpeedPickerList.hidden) {
    glassSpeedPickerOpen = false;
  }
  if (glassSpeedPickerOpen) {
    closeGlassSpeedPicker({ focusButton: false });
  } else {
    openGlassSpeedPicker();
  }
}

export function moveGlassSpeedOption(delta) {
  if (!glassSpeedPickerList) {
    return;
  }
  const options = getGlassSpeedOptionElements();
  if (options.length === 0) {
    return;
  }
  const active = document.activeElement;
  const activeOption = active && glassSpeedPickerList.contains(active)
    ? active.closest('[role="option"]')
    : null;
  let index = activeOption ? options.indexOf(activeOption) : -1;
  if (index === -1) {
    const currentValue = typeof state.glassSpeed === 'string' ? state.glassSpeed : '';
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
    focusGlassSpeedOption(nextOption);
  }
}

export function handleGlassSpeedButtonKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    openGlassSpeedPicker();
    moveGlassSpeedOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    openGlassSpeedPicker();
    moveGlassSpeedOption(-1);
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    toggleGlassSpeedPicker();
    return;
  }
  if (key === 'Escape' && glassSpeedPickerOpen) {
    event.preventDefault();
    closeGlassSpeedPicker({ focusButton: true });
  }
}

export function handleGlassSpeedListKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    moveGlassSpeedOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    moveGlassSpeedOption(-1);
    return;
  }
  if (key === 'Home') {
    event.preventDefault();
    const options = getGlassSpeedOptionElements();
    if (options.length > 0) {
      focusGlassSpeedOption(options[0]);
    }
    return;
  }
  if (key === 'End') {
    event.preventDefault();
    const options = getGlassSpeedOptionElements();
    if (options.length > 0) {
      focusGlassSpeedOption(options[options.length - 1]);
    }
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    const target = event.target;
    if (target && target instanceof HTMLElement) {
      const option = target.closest('[role="option"]');
      if (option) {
        setGlassSpeedSelection(option.dataset.value || '');
        closeGlassSpeedPicker({ focusButton: true });
      }
    }
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closeGlassSpeedPicker({ focusButton: true });
    return;
  }
  if (key === 'Tab') {
    closeGlassSpeedPicker();
  }
}

export function handleGlassSpeedListClick(event) {
  if (!glassSpeedPickerList) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const option = target.closest('[role="option"]');
  if (!option || !glassSpeedPickerList.contains(option)) {
    return;
  }
  event.preventDefault();
  setGlassSpeedSelection(option.dataset.value || '');
  closeGlassSpeedPicker({ focusButton: true });
}

export function handleGlassSpeedListFocusOut() {
  if (!glassSpeedPickerOpen) {
    return;
  }
  setTimeout(() => {
    if (!glassSpeedPickerOpen) {
      return;
    }
    if (!glassSpeedPicker) {
      closeGlassSpeedPicker();
      return;
    }
    const active = document.activeElement;
    if (!active || !glassSpeedPicker.contains(active)) {
      closeGlassSpeedPicker();
    }
  }, 0);
}

export function getGlassSizeOptionElements() {
  if (!glassSizePickerList) {
    return [];
  }
  return Array.from(glassSizePickerList.querySelectorAll('[role="option"]'));
}

export function focusGlassSizeOption(option) {
  if (!option) {
    return;
  }
  const options = getGlassSizeOptionElements();
  options.forEach(opt => {
    opt.tabIndex = opt === option ? 0 : -1;
  });
  option.focus();
  if (typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' });
  }
}

export function openGlassSizePicker() {
  if (!glassSizePicker || !glassSizePickerButton || !glassSizePickerList) {
    return;
  }
  if (glassSizePickerButton.disabled || glassSizePickerOpen) {
    return;
  }
  glassSizePickerOpen = true;
  glassSizePicker.classList.add('is-open');
  glassSizePickerList.hidden = false;
  glassSizePickerButton.setAttribute('aria-expanded', 'true');
  syncGlassSizePicker({ isValid: true });

  const options = getGlassSizeOptionElements();
  if (options.length === 0) {
    return;
  }
  const currentValue = typeof state.glassSize === 'string' ? state.glassSize : '';
  const selectedOption = options.find(option => option.dataset.value === currentValue);
  focusGlassSizeOption(selectedOption || options[0]);
}

export function closeGlassSizePicker({ focusButton = false } = {}) {
  if (!glassSizePicker || !glassSizePickerButton || !glassSizePickerList) {
    return;
  }
  if (!glassSizePickerOpen) {
    if (focusButton && !glassSizePickerButton.disabled) {
      glassSizePickerButton.focus();
    }
    return;
  }
  glassSizePickerOpen = false;
  glassSizePicker.classList.remove('is-open');
  glassSizePickerList.hidden = true;
  glassSizePickerButton.setAttribute('aria-expanded', 'false');
  if (focusButton && !glassSizePickerButton.disabled) {
    glassSizePickerButton.focus();
  }
}

export function toggleGlassSizePicker() {
  if (!glassSizePicker || !glassSizePickerButton || !glassSizePickerList) {
    return;
  }
  if (glassSizePickerButton.disabled) {
    return;
  }
  if (glassSizePickerList.hidden) {
    glassSizePickerOpen = false;
  }
  if (glassSizePickerOpen) {
    closeGlassSizePicker({ focusButton: false });
  } else {
    openGlassSizePicker();
  }
}

export function moveGlassSizeOption(delta) {
  if (!glassSizePickerList) {
    return;
  }
  const options = getGlassSizeOptionElements();
  if (options.length === 0) {
    return;
  }
  const active = document.activeElement;
  const activeOption = active && glassSizePickerList.contains(active)
    ? active.closest('[role="option"]')
    : null;
  let index = activeOption ? options.indexOf(activeOption) : -1;
  if (index === -1) {
    const currentValue = typeof state.glassSize === 'string' ? state.glassSize : '';
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
    focusGlassSizeOption(nextOption);
  }
}

export function handleGlassSizeButtonKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    openGlassSizePicker();
    moveGlassSizeOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    openGlassSizePicker();
    moveGlassSizeOption(-1);
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    toggleGlassSizePicker();
    return;
  }
  if (key === 'Escape' && glassSizePickerOpen) {
    event.preventDefault();
    closeGlassSizePicker({ focusButton: true });
  }
}

export function handleGlassSizeListKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    moveGlassSizeOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    moveGlassSizeOption(-1);
    return;
  }
  if (key === 'Home') {
    event.preventDefault();
    const options = getGlassSizeOptionElements();
    if (options.length > 0) {
      focusGlassSizeOption(options[0]);
    }
    return;
  }
  if (key === 'End') {
    event.preventDefault();
    const options = getGlassSizeOptionElements();
    if (options.length > 0) {
      focusGlassSizeOption(options[options.length - 1]);
    }
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    const target = event.target;
    if (target && target instanceof HTMLElement) {
      const option = target.closest('[role="option"]');
      if (option) {
        setGlassSizeSelection(option.dataset.value || '');
        closeGlassSizePicker({ focusButton: true });
      }
    }
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closeGlassSizePicker({ focusButton: true });
    return;
  }
  if (key === 'Tab') {
    closeGlassSizePicker();
  }
}

export function handleGlassSizeListClick(event) {
  if (!glassSizePickerList) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const option = target.closest('[role="option"]');
  if (!option || !glassSizePickerList.contains(option)) {
    return;
  }
  event.preventDefault();
  setGlassSizeSelection(option.dataset.value || '');
  closeGlassSizePicker({ focusButton: true });
}

export function handleGlassSizeListFocusOut() {
  if (!glassSizePickerOpen) {
    return;
  }
  setTimeout(() => {
    if (!glassSizePickerOpen) {
      return;
    }
    if (!glassSizePicker) {
      closeGlassSizePicker();
      return;
    }
    const active = document.activeElement;
    if (!active || !glassSizePicker.contains(active)) {
      closeGlassSizePicker();
    }
  }, 0);
}