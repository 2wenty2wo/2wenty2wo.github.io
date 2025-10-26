/**
 * Fuse and Glass Fuse Picker Event Handlers
 *
 * Manages event handlers for fuse-related pickers including:
 * - Fuse Type
 * - Fuse Value
 * - Glass Speed
 * - Glass Size
 * - Thread Size
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import {
  setFuseTypeSelection,
  syncFuseTypePicker,
  setThreadSizeSelection,
  syncThreadSizePicker,
  setFuseValueSelection,
  syncFuseValuePicker,
  setGlassSpeedSelection,
  syncGlassSpeedPicker,
  setGlassSizeSelection,
  syncGlassSizePicker,
} from '../forms.js';

const {
  fuseTypePicker,
  fuseTypePickerButton,
  fuseTypePickerList,
  threadSizePicker,
  threadSizePickerButton,
  threadSizePickerList,
  fuseValuePicker,
  fuseValuePickerButton,
  fuseValuePickerList,
  glassSpeedPicker,
  glassSpeedPickerButton,
  glassSpeedPickerList,
  glassSizePicker,
  glassSizePickerButton,
  glassSizePickerList,
} = elements;

// Module-level state
let fuseTypePickerOpen = false;
let threadSizePickerOpen = false;
let fuseValuePickerOpen = false;
let glassSpeedPickerOpen = false;
let glassSizePickerOpen = false;

function getFuseTypeOptionElements() {
  if (!fuseTypePickerList) {
    return [];
  }
  return Array.from(fuseTypePickerList.querySelectorAll('[role="option"]'));
}

function focusFuseTypeOption(option) {
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

function openFuseTypePicker() {
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

function closeFuseTypePicker({ focusButton = false } = {}) {
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

function toggleFuseTypePicker() {
  if (fuseTypePickerOpen) {
    closeFuseTypePicker({ focusButton: false });
  } else {
    openFuseTypePicker();
  }
}

function moveFuseTypeOption(delta) {
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

function handleFuseTypeButtonKeydown(event) {
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

function handleFuseTypeListKeydown(event) {
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

function handleFuseTypeListClick(event) {
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

function handleFuseTypeListFocusOut() {
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

function getThreadSizeOptionElements() {
  if (!threadSizePickerList) {
    return [];
  }
  return Array.from(threadSizePickerList.querySelectorAll('[role="option"]'));
}

function focusThreadSizeOption(option) {
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

function openThreadSizePicker() {
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

function closeThreadSizePicker({ focusButton = false } = {}) {
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

function toggleThreadSizePicker() {
  if (threadSizePickerOpen) {
    closeThreadSizePicker({ focusButton: false });
  } else {
    openThreadSizePicker();
  }
}

function moveThreadSizeOption(delta) {
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

function handleThreadSizeButtonKeydown(event) {
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

function handleThreadSizeListKeydown(event) {
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

function handleThreadSizeListClick(event) {
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

function handleThreadSizeListFocusOut() {
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

function getFuseValueOptionElements() {
  if (!fuseValuePickerList) {
    return [];
  }
  return Array.from(fuseValuePickerList.querySelectorAll('[role="option"]'));
}

function focusFuseValueOption(option) {
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

function openFuseValuePicker() {
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

function closeFuseValuePicker({ focusButton = false } = {}) {
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

function toggleFuseValuePicker() {
  if (fuseValuePickerOpen) {
    closeFuseValuePicker({ focusButton: false });
  } else {
    openFuseValuePicker();
  }
}

function moveFuseValueOption(delta) {
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

function handleFuseValueButtonKeydown(event) {
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

function handleFuseValueListKeydown(event) {
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

function handleFuseValueListClick(event) {
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

function handleFuseValueListFocusOut() {
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

function getGlassSpeedOptionElements() {
  if (!glassSpeedPickerList) {
    return [];
  }
  return Array.from(glassSpeedPickerList.querySelectorAll('[role="option"]'));
}

function focusGlassSpeedOption(option) {
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

function openGlassSpeedPicker() {
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

function closeGlassSpeedPicker({ focusButton = false } = {}) {
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

function toggleGlassSpeedPicker() {
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

function moveGlassSpeedOption(delta) {
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

function handleGlassSpeedButtonKeydown(event) {
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

function handleGlassSpeedListKeydown(event) {
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

function handleGlassSpeedListClick(event) {
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

function handleGlassSpeedListFocusOut() {
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

function getGlassSizeOptionElements() {
  if (!glassSizePickerList) {
    return [];
  }
  return Array.from(glassSizePickerList.querySelectorAll('[role="option"]'));
}

function focusGlassSizeOption(option) {
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

function openGlassSizePicker() {
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

function closeGlassSizePicker({ focusButton = false } = {}) {
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

function toggleGlassSizePicker() {
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

function moveGlassSizeOption(delta) {
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

function handleGlassSizeButtonKeydown(event) {
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

function handleGlassSizeListKeydown(event) {
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

function handleGlassSizeListClick(event) {
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

function handleGlassSizeListFocusOut() {
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

// Export functions needed by init.js
export {
  toggleFuseTypePicker,
  closeFuseTypePicker,
  handleFuseTypeButtonKeydown,
  handleFuseTypeListKeydown,
  handleFuseTypeListClick,
  handleFuseTypeListFocusOut,
  toggleThreadSizePicker,
  closeThreadSizePicker,
  handleThreadSizeButtonKeydown,
  handleThreadSizeListKeydown,
  handleThreadSizeListClick,
  handleThreadSizeListFocusOut,
  toggleFuseValuePicker,
  closeFuseValuePicker,
  handleFuseValueButtonKeydown,
  handleFuseValueListKeydown,
  handleFuseValueListClick,
  handleFuseValueListFocusOut,
  toggleGlassSpeedPicker,
  closeGlassSpeedPicker,
  handleGlassSpeedButtonKeydown,
  handleGlassSpeedListKeydown,
  handleGlassSpeedListClick,
  handleGlassSpeedListFocusOut,
  toggleGlassSizePicker,
  closeGlassSizePicker,
  handleGlassSizeButtonKeydown,
  handleGlassSizeListKeydown,
  handleGlassSizeListClick,
  handleGlassSizeListFocusOut,
};
