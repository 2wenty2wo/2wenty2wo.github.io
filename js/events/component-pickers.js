/**
 * Electronic component picker event handlers
 * Extracted from events.js
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import * as forms from '../forms.js';
import { updatePreview, updateDownloadState } from '../render.js';

export function getComponentMountOptionElements() {
  if (!componentMountPickerList) {
    return [];
  }
  return Array.from(componentMountPickerList.querySelectorAll('[role="option"]'));
}

export function focusComponentMountOption(option) {
  if (!option) {
    return;
  }
  const options = getComponentMountOptionElements();
  options.forEach(opt => {
    opt.tabIndex = opt === option ? 0 : -1;
  });
  option.focus();
  if (typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' });
  }
}

export function openComponentMountPicker() {
  if (!componentMountPicker || !componentMountPickerButton || !componentMountPickerList) {
    return;
  }
  if (componentMountPickerButton.disabled) {
    return;
  }
  if (componentMountPickerOpen) {
    return;
  }
  componentMountPickerOpen = true;
  componentMountPicker.classList.add('is-open');
  componentMountPickerList.hidden = false;
  componentMountPickerButton.setAttribute('aria-expanded', 'true');

  const options = getComponentMountOptionElements();
  const currentValue = typeof state.componentMount === 'string' ? state.componentMount : '';
  const selectedOption = options.find(option => option.dataset.value === currentValue);
  focusComponentMountOption(selectedOption || options[0]);
}

export function closeComponentMountPicker({ focusButton = false } = {}) {
  if (!componentMountPicker || !componentMountPickerButton || !componentMountPickerList) {
    return;
  }
  if (!componentMountPickerOpen) {
    if (focusButton && !componentMountPickerButton.disabled) {
      componentMountPickerButton.focus();
    }
    return;
  }
  componentMountPickerOpen = false;
  componentMountPicker.classList.remove('is-open');
  componentMountPickerList.hidden = true;
  componentMountPickerButton.setAttribute('aria-expanded', 'false');
  if (focusButton && !componentMountPickerButton.disabled) {
    componentMountPickerButton.focus();
  }
}

export function toggleComponentMountPicker() {
  if (componentMountPickerOpen) {
    closeComponentMountPicker({ focusButton: false });
  } else {
    openComponentMountPicker();
  }
}

export function moveComponentMountOption(delta) {
  if (!componentMountPickerList) {
    return;
  }
  const options = getComponentMountOptionElements();
  if (options.length === 0) {
    return;
  }
  const active = document.activeElement;
  const activeOption = active && componentMountPickerList.contains(active)
    ? active.closest('[role="option"]')
    : null;
  let index = activeOption ? options.indexOf(activeOption) : -1;
  if (index === -1) {
    const currentValue = typeof state.componentMount === 'string' ? state.componentMount : '';
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
    focusComponentMountOption(nextOption);
  }
}

export function handleComponentMountButtonKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    openComponentMountPicker();
    moveComponentMountOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    openComponentMountPicker();
    moveComponentMountOption(-1);
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    toggleComponentMountPicker();
    return;
  }
  if (key === 'Escape' && componentMountPickerOpen) {
    event.preventDefault();
    closeComponentMountPicker({ focusButton: true });
  }
}

export function handleComponentMountListKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    moveComponentMountOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    moveComponentMountOption(-1);
    return;
  }
  if (key === 'Home') {
    event.preventDefault();
    const options = getComponentMountOptionElements();
    if (options.length > 0) {
      focusComponentMountOption(options[0]);
    }
    return;
  }
  if (key === 'End') {
    event.preventDefault();
    const options = getComponentMountOptionElements();
    if (options.length > 0) {
      focusComponentMountOption(options[options.length - 1]);
    }
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    const target = event.target;
    if (target && target instanceof HTMLElement) {
      const option = target.closest('[role="option"]');
      if (option) {
        setComponentMountSelection(option.dataset.value || '');
        closeComponentMountPicker({ focusButton: true });
      }
    }
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closeComponentMountPicker({ focusButton: true });
    return;
  }
  if (key === 'Tab') {
    closeComponentMountPicker();
  }
}

export function handleComponentMountListClick(event) {
  if (!componentMountPickerList) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const option = target.closest('[role="option"]');
  if (!option || !componentMountPickerList.contains(option)) {
    return;
  }
  event.preventDefault();
  setComponentMountSelection(option.dataset.value || '');
  closeComponentMountPicker({ focusButton: true });
}

export function handleComponentMountListFocusOut() {
  if (!componentMountPickerOpen) {
    return;
  }
  setTimeout(() => {
    if (!componentMountPickerOpen) {
      return;
    }
    if (!componentMountPicker) {
      closeComponentMountPicker();
      return;
    }
    const active = document.activeElement;
    if (!active || !componentMountPicker.contains(active)) {
      closeComponentMountPicker();
    }
  }, 0);
}

export function getResistorValueOptionElements() {
  if (!resistorValuePickerList) {
    return [];
  }
  return Array.from(resistorValuePickerList.querySelectorAll('[role="option"]'));
}

export function focusResistorValueOption(option) {
  if (!option) {
    return;
  }
  const options = getResistorValueOptionElements();
  options.forEach(opt => {
    opt.tabIndex = opt === option ? 0 : -1;
  });
  option.focus();
  if (typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' });
  }
}

export function openResistorValuePicker() {
  if (!resistorValuePicker || !resistorValuePickerButton || !resistorValuePickerList) {
    return;
  }
  if (resistorValuePickerButton.disabled) {
    return;
  }
  if (resistorValuePickerOpen) {
    return;
  }
  resistorValuePickerOpen = true;
  resistorValuePicker.classList.add('is-open');
  resistorValuePickerList.hidden = false;
  resistorValuePickerButton.setAttribute('aria-expanded', 'true');

  const options = getResistorValueOptionElements();
  const currentValue = typeof state.resistorValue === 'string' ? state.resistorValue : '';
  const selectedOption = options.find(option => option.dataset.value === currentValue);
  focusResistorValueOption(selectedOption || options[0]);
}

export function closeResistorValuePicker({ focusButton = false } = {}) {
  if (!resistorValuePicker || !resistorValuePickerButton || !resistorValuePickerList) {
    return;
  }
  if (!resistorValuePickerOpen) {
    if (focusButton && !resistorValuePickerButton.disabled) {
      resistorValuePickerButton.focus();
    }
    return;
  }
  resistorValuePickerOpen = false;
  resistorValuePicker.classList.remove('is-open');
  resistorValuePickerList.hidden = true;
  resistorValuePickerButton.setAttribute('aria-expanded', 'false');
  if (focusButton && !resistorValuePickerButton.disabled) {
    resistorValuePickerButton.focus();
  }
}

export function toggleResistorValuePicker() {
  if (resistorValuePickerOpen) {
    closeResistorValuePicker({ focusButton: false });
  } else {
    openResistorValuePicker();
  }
}

export function moveResistorValueOption(delta) {
  if (!resistorValuePickerList) {
    return;
  }
  const options = getResistorValueOptionElements();
  if (options.length === 0) {
    return;
  }
  const active = document.activeElement;
  const activeOption = active && resistorValuePickerList.contains(active)
    ? active.closest('[role="option"]')
    : null;
  let index = activeOption ? options.indexOf(activeOption) : -1;
  if (index === -1) {
    const currentValue = typeof state.resistorValue === 'string' ? state.resistorValue : '';
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
    focusResistorValueOption(nextOption);
  }
}

export function handleResistorValueButtonKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    openResistorValuePicker();
    moveResistorValueOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    openResistorValuePicker();
    moveResistorValueOption(-1);
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    toggleResistorValuePicker();
    return;
  }
  if (key === 'Escape' && resistorValuePickerOpen) {
    event.preventDefault();
    closeResistorValuePicker({ focusButton: true });
  }
}

export function handleResistorValueListKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    moveResistorValueOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    moveResistorValueOption(-1);
    return;
  }
  if (key === 'Home') {
    event.preventDefault();
    const options = getResistorValueOptionElements();
    if (options.length > 0) {
      focusResistorValueOption(options[0]);
    }
    return;
  }
  if (key === 'End') {
    event.preventDefault();
    const options = getResistorValueOptionElements();
    if (options.length > 0) {
      focusResistorValueOption(options[options.length - 1]);
    }
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    const target = event.target;
    if (target && target instanceof HTMLElement) {
      const option = target.closest('[role="option"]');
      if (option) {
        setResistorValueSelection(option.dataset.value || '');
        closeResistorValuePicker({ focusButton: true });
      }
    }
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closeResistorValuePicker({ focusButton: true });
    return;
  }
  if (key === 'Tab') {
    closeResistorValuePicker();
  }
}

export function handleResistorValueListClick(event) {
  if (!resistorValuePickerList) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const option = target.closest('[role="option"]');
  if (!option || !resistorValuePickerList.contains(option)) {
    return;
  }
  event.preventDefault();
  setResistorValueSelection(option.dataset.value || '');
  closeResistorValuePicker({ focusButton: true });
}

export function handleResistorValueListFocusOut() {
  if (!resistorValuePickerOpen) {
    return;
  }
  setTimeout(() => {
    if (!resistorValuePickerOpen) {
      return;
    }
    if (!resistorValuePicker) {
      closeResistorValuePicker();
      return;
    }
    const active = document.activeElement;
    if (!active || !resistorValuePicker.contains(active)) {
      closeResistorValuePicker();
    }
  }, 0);
}

export function getCapacitorValueOptionElements() {
  if (!capacitorValuePickerList) {
    return [];
  }
  return Array.from(capacitorValuePickerList.querySelectorAll('[role="option"]'));
}

export function focusCapacitorValueOption(option) {
  if (!option) {
    return;
  }
  const options = getCapacitorValueOptionElements();
  options.forEach(opt => {
    opt.tabIndex = opt === option ? 0 : -1;
  });
  option.focus();
  if (typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' });
  }
}

export function openCapacitorValuePicker() {
  if (!capacitorValuePicker || !capacitorValuePickerButton || !capacitorValuePickerList) {
    return;
  }
  if (capacitorValuePickerButton.disabled) {
    return;
  }
  if (capacitorValuePickerOpen) {
    return;
  }
  capacitorValuePickerOpen = true;
  capacitorValuePicker.classList.add('is-open');
  capacitorValuePickerList.hidden = false;
  capacitorValuePickerButton.setAttribute('aria-expanded', 'true');

  const options = getCapacitorValueOptionElements();
  const currentValue = typeof state.capacitorValue === 'string' ? state.capacitorValue : '';
  const selectedOption = options.find(option => option.dataset.value === currentValue);
  focusCapacitorValueOption(selectedOption || options[0]);
}

export function closeCapacitorValuePicker({ focusButton = false } = {}) {
  if (!capacitorValuePicker || !capacitorValuePickerButton || !capacitorValuePickerList) {
    return;
  }
  if (!capacitorValuePickerOpen) {
    if (focusButton && !capacitorValuePickerButton.disabled) {
      capacitorValuePickerButton.focus();
    }
    return;
  }
  capacitorValuePickerOpen = false;
  capacitorValuePicker.classList.remove('is-open');
  capacitorValuePickerList.hidden = true;
  capacitorValuePickerButton.setAttribute('aria-expanded', 'false');
  if (focusButton && !capacitorValuePickerButton.disabled) {
    capacitorValuePickerButton.focus();
  }
}

export function toggleCapacitorValuePicker() {
  if (capacitorValuePickerOpen) {
    closeCapacitorValuePicker({ focusButton: false });
  } else {
    openCapacitorValuePicker();
  }
}

export function moveCapacitorValueOption(delta) {
  if (!capacitorValuePickerList) {
    return;
  }
  const options = getCapacitorValueOptionElements();
  if (options.length === 0) {
    return;
  }
  const active = document.activeElement;
  const activeOption = active && capacitorValuePickerList.contains(active)
    ? active.closest('[role="option"]')
    : null;
  let index = activeOption ? options.indexOf(activeOption) : -1;
  if (index === -1) {
    const currentValue = typeof state.capacitorValue === 'string' ? state.capacitorValue : '';
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
    focusCapacitorValueOption(nextOption);
  }
}

export function handleCapacitorValueButtonKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    openCapacitorValuePicker();
    moveCapacitorValueOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    openCapacitorValuePicker();
    moveCapacitorValueOption(-1);
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    toggleCapacitorValuePicker();
    return;
  }
  if (key === 'Escape' && capacitorValuePickerOpen) {
    event.preventDefault();
    closeCapacitorValuePicker({ focusButton: true });
  }
}

export function handleCapacitorValueListKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    moveCapacitorValueOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    moveCapacitorValueOption(-1);
    return;
  }
  if (key === 'Home') {
    event.preventDefault();
    const options = getCapacitorValueOptionElements();
    if (options.length > 0) {
      focusCapacitorValueOption(options[0]);
    }
    return;
  }
  if (key === 'End') {
    event.preventDefault();
    const options = getCapacitorValueOptionElements();
    if (options.length > 0) {
      focusCapacitorValueOption(options[options.length - 1]);
    }
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    const target = event.target;
    if (target && target instanceof HTMLElement) {
      const option = target.closest('[role="option"]');
      if (option) {
        setCapacitorValueSelection(option.dataset.value || '');
        closeCapacitorValuePicker({ focusButton: true });
      }
    }
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closeCapacitorValuePicker({ focusButton: true });
    return;
  }
  if (key === 'Tab') {
    closeCapacitorValuePicker();
  }
}

export function handleCapacitorValueListClick(event) {
  if (!capacitorValuePickerList) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const option = target.closest('[role="option"]');
  if (!option || !capacitorValuePickerList.contains(option)) {
    return;
  }
  event.preventDefault();
  setCapacitorValueSelection(option.dataset.value || '');
  closeCapacitorValuePicker({ focusButton: true });
}

export function handleCapacitorValueListFocusOut() {
  if (!capacitorValuePickerOpen) {
    return;
  }
  setTimeout(() => {
    if (!capacitorValuePickerOpen) {
      return;
    }
    if (!capacitorValuePicker) {
      closeCapacitorValuePicker();
      return;
    }
    const active = document.activeElement;
    if (!active || !capacitorValuePicker.contains(active)) {
      closeCapacitorValuePicker();
    }
  }, 0);
}

export function getDiodeValueOptionElements() {
  if (!diodeValuePickerList) {
    return [];
  }
  return Array.from(diodeValuePickerList.querySelectorAll('[role="option"]'));
}

export function focusDiodeValueOption(option) {
  if (!option) {
    return;
  }
  const options = getDiodeValueOptionElements();
  options.forEach(opt => {
    opt.tabIndex = opt === option ? 0 : -1;
  });
  option.focus();
  if (typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' });
  }
}

export function openDiodeValuePicker() {
  if (!diodeValuePicker || !diodeValuePickerButton || !diodeValuePickerList) {
    return;
  }
  if (diodeValuePickerButton.disabled) {
    return;
  }
  if (diodeValuePickerOpen) {
    return;
  }
  diodeValuePickerOpen = true;
  diodeValuePicker.classList.add('is-open');
  diodeValuePickerList.hidden = false;
  diodeValuePickerButton.setAttribute('aria-expanded', 'true');

  const options = getDiodeValueOptionElements();
  const currentValue = typeof state.diodeValue === 'string' ? state.diodeValue : '';
  const selectedOption = options.find(option => option.dataset.value === currentValue);
  focusDiodeValueOption(selectedOption || options[0]);
}

export function closeDiodeValuePicker({ focusButton = false } = {}) {
  if (!diodeValuePicker || !diodeValuePickerButton || !diodeValuePickerList) {
    return;
  }
  if (!diodeValuePickerOpen) {
    if (focusButton && !diodeValuePickerButton.disabled) {
      diodeValuePickerButton.focus();
    }
    return;
  }
  diodeValuePickerOpen = false;
  diodeValuePicker.classList.remove('is-open');
  diodeValuePickerList.hidden = true;
  diodeValuePickerButton.setAttribute('aria-expanded', 'false');
  if (focusButton && !diodeValuePickerButton.disabled) {
    diodeValuePickerButton.focus();
  }
}

export function toggleDiodeValuePicker() {
  if (diodeValuePickerOpen) {
    closeDiodeValuePicker({ focusButton: false });
  } else {
    openDiodeValuePicker();
  }
}

export function moveDiodeValueOption(delta) {
  if (!diodeValuePickerList) {
    return;
  }
  const options = getDiodeValueOptionElements();
  if (options.length === 0) {
    return;
  }
  const active = document.activeElement;
  const activeOption = active && diodeValuePickerList.contains(active)
    ? active.closest('[role="option"]')
    : null;
  let index = activeOption ? options.indexOf(activeOption) : -1;
  if (index === -1) {
    const currentValue = typeof state.diodeValue === 'string' ? state.diodeValue : '';
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
    focusDiodeValueOption(nextOption);
  }
}

export function handleDiodeValueButtonKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    openDiodeValuePicker();
    moveDiodeValueOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    openDiodeValuePicker();
    moveDiodeValueOption(-1);
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    toggleDiodeValuePicker();
    return;
  }
  if (key === 'Escape' && diodeValuePickerOpen) {
    event.preventDefault();
    closeDiodeValuePicker({ focusButton: true });
  }
}

export function handleDiodeValueListKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    moveDiodeValueOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    moveDiodeValueOption(-1);
    return;
  }
  if (key === 'Home') {
    event.preventDefault();
    const options = getDiodeValueOptionElements();
    if (options.length > 0) {
      focusDiodeValueOption(options[0]);
    }
    return;
  }
  if (key === 'End') {
    event.preventDefault();
    const options = getDiodeValueOptionElements();
    if (options.length > 0) {
      focusDiodeValueOption(options[options.length - 1]);
    }
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    const target = event.target;
    if (target && target instanceof HTMLElement) {
      const option = target.closest('[role="option"]');
      if (option) {
        setDiodeValueSelection(option.dataset.value || '');
        closeDiodeValuePicker({ focusButton: true });
      }
    }
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closeDiodeValuePicker({ focusButton: true });
    return;
  }
  if (key === 'Tab') {
    closeDiodeValuePicker();
  }
}

export function handleDiodeValueListClick(event) {
  if (!diodeValuePickerList) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const option = target.closest('[role="option"]');
  if (!option || !diodeValuePickerList.contains(option)) {
    return;
  }
  event.preventDefault();
  setDiodeValueSelection(option.dataset.value || '');
  closeDiodeValuePicker({ focusButton: true });
}

export function handleDiodeValueListFocusOut() {
  if (!diodeValuePickerOpen) {
    return;
  }
  setTimeout(() => {
    if (!diodeValuePickerOpen) {
      return;
    }
    if (!diodeValuePicker) {
      closeDiodeValuePicker();
      return;
    }
    const active = document.activeElement;
    if (!active || !diodeValuePicker.contains(active)) {
      closeDiodeValuePicker();
    }
  }, 0);
}

export function getMosfetChannelOptionElements() {
  if (!mosfetChannelPickerList) {
    return [];
  }
  return Array.from(mosfetChannelPickerList.querySelectorAll('[role="option"]'));
}

export function focusMosfetChannelOption(option) {
  if (!option) {
    return;
  }
  const options = getMosfetChannelOptionElements();
  options.forEach(opt => {
    opt.tabIndex = opt === option ? 0 : -1;
  });
  option.focus();
  if (typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' });
  }
}

export function openMosfetChannelPicker() {
  if (!mosfetChannelPicker || !mosfetChannelPickerButton || !mosfetChannelPickerList) {
    return;
  }
  if (mosfetChannelPickerButton.disabled) {
    return;
  }
  if (mosfetChannelPickerOpen) {
    return;
  }
  mosfetChannelPickerOpen = true;
  mosfetChannelPicker.classList.add('is-open');
  mosfetChannelPickerList.hidden = false;
  mosfetChannelPickerButton.setAttribute('aria-expanded', 'true');

  const options = getMosfetChannelOptionElements();
  const currentValue = typeof state.mosfetChannel === 'string' ? state.mosfetChannel : '';
  const selectedOption = options.find(option => option.dataset.value === currentValue);
  focusMosfetChannelOption(selectedOption || options[0]);
}

export function closeMosfetChannelPicker({ focusButton = false } = {}) {
  if (!mosfetChannelPicker || !mosfetChannelPickerButton || !mosfetChannelPickerList) {
    return;
  }
  if (!mosfetChannelPickerOpen) {
    if (focusButton && !mosfetChannelPickerButton.disabled) {
      mosfetChannelPickerButton.focus();
    }
    return;
  }
  mosfetChannelPickerOpen = false;
  mosfetChannelPicker.classList.remove('is-open');
  mosfetChannelPickerList.hidden = true;
  mosfetChannelPickerButton.setAttribute('aria-expanded', 'false');
  if (focusButton && !mosfetChannelPickerButton.disabled) {
    mosfetChannelPickerButton.focus();
  }
}

export function toggleMosfetChannelPicker() {
  if (mosfetChannelPickerOpen) {
    closeMosfetChannelPicker({ focusButton: false });
  } else {
    openMosfetChannelPicker();
  }
}

export function moveMosfetChannelOption(delta) {
  if (!mosfetChannelPickerList) {
    return;
  }
  const options = getMosfetChannelOptionElements();
  if (options.length === 0) {
    return;
  }
  const active = document.activeElement;
  const activeOption = active && mosfetChannelPickerList.contains(active)
    ? active.closest('[role="option"]')
    : null;
  let index = activeOption ? options.indexOf(activeOption) : -1;
  if (index === -1) {
    const currentValue = typeof state.mosfetChannel === 'string' ? state.mosfetChannel : '';
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
    focusMosfetChannelOption(nextOption);
  }
}

export function handleMosfetChannelButtonKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    openMosfetChannelPicker();
    moveMosfetChannelOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    openMosfetChannelPicker();
    moveMosfetChannelOption(-1);
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    toggleMosfetChannelPicker();
    return;
  }
  if (key === 'Escape' && mosfetChannelPickerOpen) {
    event.preventDefault();
    closeMosfetChannelPicker({ focusButton: true });
  }
}

export function handleMosfetChannelListKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    moveMosfetChannelOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    moveMosfetChannelOption(-1);
    return;
  }
  if (key === 'Home') {
    event.preventDefault();
    const options = getMosfetChannelOptionElements();
    if (options.length > 0) {
      focusMosfetChannelOption(options[0]);
    }
    return;
  }
  if (key === 'End') {
    event.preventDefault();
    const options = getMosfetChannelOptionElements();
    if (options.length > 0) {
      focusMosfetChannelOption(options[options.length - 1]);
    }
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    const target = event.target;
    if (target && target instanceof HTMLElement) {
      const option = target.closest('[role="option"]');
      if (option) {
        setMosfetChannelSelection(option.dataset.value || '');
        closeMosfetChannelPicker({ focusButton: true });
      }
    }
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closeMosfetChannelPicker({ focusButton: true });
    return;
  }
  if (key === 'Tab') {
    closeMosfetChannelPicker();
  }
}

export function handleMosfetChannelListClick(event) {
  if (!mosfetChannelPickerList) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const option = target.closest('[role="option"]');
  if (!option || !mosfetChannelPickerList.contains(option)) {
    return;
  }
  event.preventDefault();
  setMosfetChannelSelection(option.dataset.value || '');
  closeMosfetChannelPicker({ focusButton: true });
}

export function handleMosfetChannelListFocusOut() {
  if (!mosfetChannelPickerOpen) {
    return;
  }
  setTimeout(() => {
    if (!mosfetChannelPickerOpen) {
      return;
    }
    if (!mosfetChannelPicker) {
      closeMosfetChannelPicker();
      return;
    }
    const active = document.activeElement;
    if (!active || !mosfetChannelPicker.contains(active)) {
      closeMosfetChannelPicker();
    }
  }, 0);
}

export function getMosfetPartOptionElements() {
  if (!mosfetPartPickerList) {
    return [];
  }
  return Array.from(mosfetPartPickerList.querySelectorAll('[role="option"]'));
}

export function focusMosfetPartOption(option) {
  if (!option) {
    return;
  }
  const options = getMosfetPartOptionElements();
  options.forEach(opt => {
    opt.tabIndex = opt === option ? 0 : -1;
  });
  option.focus();
  if (typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' });
  }
}

export function openMosfetPartPicker() {
  if (!mosfetPartPicker || !mosfetPartPickerButton || !mosfetPartPickerList) {
    return;
  }
  if (mosfetPartPickerButton.disabled) {
    return;
  }
  if (mosfetPartPickerOpen) {
    return;
  }
  mosfetPartPickerOpen = true;
  mosfetPartPicker.classList.add('is-open');
  mosfetPartPickerList.hidden = false;
  mosfetPartPickerButton.setAttribute('aria-expanded', 'true');

  const options = getMosfetPartOptionElements();
  const currentValue = typeof state.mosfetPart === 'string' ? state.mosfetPart : '';
  const selectedOption = options.find(option => option.dataset.value === currentValue);
  focusMosfetPartOption(selectedOption || options[0]);
}

export function closeMosfetPartPicker({ focusButton = false } = {}) {
  if (!mosfetPartPicker || !mosfetPartPickerButton || !mosfetPartPickerList) {
    return;
  }
  if (!mosfetPartPickerOpen) {
    if (focusButton && !mosfetPartPickerButton.disabled) {
      mosfetPartPickerButton.focus();
    }
    return;
  }
  mosfetPartPickerOpen = false;
  mosfetPartPicker.classList.remove('is-open');
  mosfetPartPickerList.hidden = true;
  mosfetPartPickerButton.setAttribute('aria-expanded', 'false');
  if (focusButton && !mosfetPartPickerButton.disabled) {
    mosfetPartPickerButton.focus();
  }
}

export function toggleMosfetPartPicker() {
  if (mosfetPartPickerOpen) {
    closeMosfetPartPicker({ focusButton: false });
  } else {
    openMosfetPartPicker();
  }
}

export function moveMosfetPartOption(delta) {
  if (!mosfetPartPickerList) {
    return;
  }
  const options = getMosfetPartOptionElements();
  if (options.length === 0) {
    return;
  }
  const active = document.activeElement;
  const activeOption = active && mosfetPartPickerList.contains(active)
    ? active.closest('[role="option"]')
    : null;
  let index = activeOption ? options.indexOf(activeOption) : -1;
  if (index === -1) {
    const currentValue = typeof state.mosfetPart === 'string' ? state.mosfetPart : '';
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
    focusMosfetPartOption(nextOption);
  }
}

export function handleMosfetPartButtonKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    openMosfetPartPicker();
    moveMosfetPartOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    openMosfetPartPicker();
    moveMosfetPartOption(-1);
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    toggleMosfetPartPicker();
    return;
  }
  if (key === 'Escape' && mosfetPartPickerOpen) {
    event.preventDefault();
    closeMosfetPartPicker({ focusButton: true });
  }
}

export function handleMosfetPartListKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    moveMosfetPartOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    moveMosfetPartOption(-1);
    return;
  }
  if (key === 'Home') {
    event.preventDefault();
    const options = getMosfetPartOptionElements();
    if (options.length > 0) {
      focusMosfetPartOption(options[0]);
    }
    return;
  }
  if (key === 'End') {
    event.preventDefault();
    const options = getMosfetPartOptionElements();
    if (options.length > 0) {
      focusMosfetPartOption(options[options.length - 1]);
    }
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    const target = event.target;
    if (target && target instanceof HTMLElement) {
      const option = target.closest('[role="option"]');
      if (option) {
        setMosfetPartSelection(option.dataset.value || '');
        closeMosfetPartPicker({ focusButton: true });
      }
    }
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closeMosfetPartPicker({ focusButton: true });
    return;
  }
  if (key === 'Tab') {
    closeMosfetPartPicker();
  }
}

export function handleMosfetPartListClick(event) {
  if (!mosfetPartPickerList) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const option = target.closest('[role="option"]');
  if (!option || !mosfetPartPickerList.contains(option)) {
    return;
  }
  event.preventDefault();
  setMosfetPartSelection(option.dataset.value || '');
  closeMosfetPartPicker({ focusButton: true });
}

export function handleMosfetPartListFocusOut() {
  if (!mosfetPartPickerOpen) {
    return;
  }
  setTimeout(() => {
    if (!mosfetPartPickerOpen) {
      return;
    }
    if (!mosfetPartPicker) {
      closeMosfetPartPicker();
      return;
    }
    const active = document.activeElement;
    if (!active || !mosfetPartPicker.contains(active)) {
      closeMosfetPartPicker();
    }
  }, 0);
}

export function getPotentiometerValueOptionElements() {
  if (!potentiometerValuePickerList) {
    return [];
  }
  return Array.from(potentiometerValuePickerList.querySelectorAll('[role="option"]'));
}

export function focusPotentiometerValueOption(option) {
  if (!option) {
    return;
  }
  const options = getPotentiometerValueOptionElements();
  options.forEach(opt => {
    opt.tabIndex = opt === option ? 0 : -1;
  });
  option.focus();
  if (typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' });
  }
}

export function openPotentiometerValuePicker() {
  if (
    !potentiometerValuePicker ||
    !potentiometerValuePickerButton ||
    !potentiometerValuePickerList
  ) {
    return;
  }
  if (potentiometerValuePickerButton.disabled || potentiometerValuePickerOpen) {
    return;
  }
  potentiometerValuePickerOpen = true;
  potentiometerValuePicker.classList.add('is-open');
  potentiometerValuePickerList.hidden = false;
  potentiometerValuePickerButton.setAttribute('aria-expanded', 'true');

  const options = getPotentiometerValueOptionElements();
  const currentValue =
    typeof state.potentiometerValue === 'string' ? state.potentiometerValue : '';
  const selectedOption = options.find(option => option.dataset.value === currentValue);
  focusPotentiometerValueOption(selectedOption || options[0]);
}

export function closePotentiometerValuePicker({ focusButton = false } = {}) {
  if (
    !potentiometerValuePicker ||
    !potentiometerValuePickerButton ||
    !potentiometerValuePickerList
  ) {
    return;
  }
  if (!potentiometerValuePickerOpen) {
    if (focusButton && !potentiometerValuePickerButton.disabled) {
      potentiometerValuePickerButton.focus();
    }
    return;
  }
  potentiometerValuePickerOpen = false;
  potentiometerValuePicker.classList.remove('is-open');
  potentiometerValuePickerList.hidden = true;
  potentiometerValuePickerButton.setAttribute('aria-expanded', 'false');
  if (focusButton && !potentiometerValuePickerButton.disabled) {
    potentiometerValuePickerButton.focus();
  }
}

export function togglePotentiometerValuePicker() {
  if (potentiometerValuePickerOpen) {
    closePotentiometerValuePicker({ focusButton: false });
  } else {
    openPotentiometerValuePicker();
  }
}

export function movePotentiometerValueOption(delta) {
  const options = getPotentiometerValueOptionElements();
  if (options.length === 0) {
    return;
  }
  const active = document.activeElement;
  const activeOption = active && potentiometerValuePickerList && potentiometerValuePickerList.contains(active)
    ? active.closest('[role="option"]')
    : null;
  let index = activeOption ? options.indexOf(activeOption) : -1;
  if (index === -1) {
    const currentValue =
      typeof state.potentiometerValue === 'string' ? state.potentiometerValue : '';
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
    focusPotentiometerValueOption(nextOption);
  }
}

export function handlePotentiometerValueButtonKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    openPotentiometerValuePicker();
    movePotentiometerValueOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    openPotentiometerValuePicker();
    movePotentiometerValueOption(-1);
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    togglePotentiometerValuePicker();
    return;
  }
  if (key === 'Escape' && potentiometerValuePickerOpen) {
    event.preventDefault();
    closePotentiometerValuePicker({ focusButton: true });
  }
}

export function handlePotentiometerValueListKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    movePotentiometerValueOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    movePotentiometerValueOption(-1);
    return;
  }
  if (key === 'Home') {
    event.preventDefault();
    const options = getPotentiometerValueOptionElements();
    if (options.length > 0) {
      focusPotentiometerValueOption(options[0]);
    }
    return;
  }
  if (key === 'End') {
    event.preventDefault();
    const options = getPotentiometerValueOptionElements();
    if (options.length > 0) {
      focusPotentiometerValueOption(options[options.length - 1]);
    }
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    const target = event.target;
    if (target && target instanceof HTMLElement) {
      const option = target.closest('[role="option"]');
      if (option) {
        setPotentiometerValueSelection(option.dataset.value || '');
        closePotentiometerValuePicker({ focusButton: true });
      }
    }
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closePotentiometerValuePicker({ focusButton: true });
    return;
  }
  if (key === 'Tab') {
    closePotentiometerValuePicker();
  }
}

export function handlePotentiometerValueListClick(event) {
  if (!potentiometerValuePickerList) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const option = target.closest('[role="option"]');
  if (!option || !potentiometerValuePickerList.contains(option)) {
    return;
  }
  event.preventDefault();
  setPotentiometerValueSelection(option.dataset.value || '');
  closePotentiometerValuePicker({ focusButton: true });
}

export function handlePotentiometerValueListFocusOut() {
  if (!potentiometerValuePickerOpen) {
    return;
  }
  setTimeout(() => {
    if (!potentiometerValuePickerOpen) {
      return;
    }
    if (!potentiometerValuePicker) {
      closePotentiometerValuePicker();
      return;
    }
    const active = document.activeElement;
    if (!active || !potentiometerValuePicker.contains(active)) {
      closePotentiometerValuePicker();
    }
  }, 0);
}

export function getPotentiometerTaperOptionElements() {
  if (!potentiometerTaperPickerList) {
    return [];
  }
  return Array.from(potentiometerTaperPickerList.querySelectorAll('[role="option"]'));
}

export function focusPotentiometerTaperOption(option) {
  if (!option) {
    return;
  }
  const options = getPotentiometerTaperOptionElements();
  options.forEach(opt => {
    opt.tabIndex = opt === option ? 0 : -1;
  });
  option.focus();
  if (typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' });
  }
}

export function openPotentiometerTaperPicker() {
  if (
    !potentiometerTaperPicker ||
    !potentiometerTaperPickerButton ||
    !potentiometerTaperPickerList
  ) {
    return;
  }
  if (potentiometerTaperPickerButton.disabled || potentiometerTaperPickerOpen) {
    return;
  }
  potentiometerTaperPickerOpen = true;
  potentiometerTaperPicker.classList.add('is-open');
  potentiometerTaperPickerList.hidden = false;
  potentiometerTaperPickerButton.setAttribute('aria-expanded', 'true');

  const options = getPotentiometerTaperOptionElements();
  const currentValue =
    typeof state.potentiometerTaper === 'string' ? state.potentiometerTaper : '';
  const selectedOption = options.find(option => option.dataset.value === currentValue);
  focusPotentiometerTaperOption(selectedOption || options[0]);
}

export function closePotentiometerTaperPicker({ focusButton = false } = {}) {
  if (
    !potentiometerTaperPicker ||
    !potentiometerTaperPickerButton ||
    !potentiometerTaperPickerList
  ) {
    return;
  }
  if (!potentiometerTaperPickerOpen) {
    if (focusButton && !potentiometerTaperPickerButton.disabled) {
      potentiometerTaperPickerButton.focus();
    }
    return;
  }
  potentiometerTaperPickerOpen = false;
  potentiometerTaperPicker.classList.remove('is-open');
  potentiometerTaperPickerList.hidden = true;
  potentiometerTaperPickerButton.setAttribute('aria-expanded', 'false');
  if (focusButton && !potentiometerTaperPickerButton.disabled) {
    potentiometerTaperPickerButton.focus();
  }
}

export function togglePotentiometerTaperPicker() {
  if (potentiometerTaperPickerOpen) {
    closePotentiometerTaperPicker({ focusButton: false });
  } else {
    openPotentiometerTaperPicker();
  }
}

export function movePotentiometerTaperOption(delta) {
  const options = getPotentiometerTaperOptionElements();
  if (options.length === 0) {
    return;
  }
  const active = document.activeElement;
  const activeOption = active && potentiometerTaperPickerList && potentiometerTaperPickerList.contains(active)
    ? active.closest('[role="option"]')
    : null;
  let index = activeOption ? options.indexOf(activeOption) : -1;
  if (index === -1) {
    const currentValue =
      typeof state.potentiometerTaper === 'string' ? state.potentiometerTaper : '';
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
    focusPotentiometerTaperOption(nextOption);
  }
}

export function handlePotentiometerTaperButtonKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    openPotentiometerTaperPicker();
    movePotentiometerTaperOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    openPotentiometerTaperPicker();
    movePotentiometerTaperOption(-1);
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    togglePotentiometerTaperPicker();
    return;
  }
  if (key === 'Escape' && potentiometerTaperPickerOpen) {
    event.preventDefault();
    closePotentiometerTaperPicker({ focusButton: true });
  }
}

export function handlePotentiometerTaperListKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    movePotentiometerTaperOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    movePotentiometerTaperOption(-1);
    return;
  }
  if (key === 'Home') {
    event.preventDefault();
    const options = getPotentiometerTaperOptionElements();
    if (options.length > 0) {
      focusPotentiometerTaperOption(options[0]);
    }
    return;
  }
  if (key === 'End') {
    event.preventDefault();
    const options = getPotentiometerTaperOptionElements();
    if (options.length > 0) {
      focusPotentiometerTaperOption(options[options.length - 1]);
    }
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    const target = event.target;
    if (target && target instanceof HTMLElement) {
      const option = target.closest('[role="option"]');
      if (option) {
        setPotentiometerTaperSelection(option.dataset.value || '');
        closePotentiometerTaperPicker({ focusButton: true });
      }
    }
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closePotentiometerTaperPicker({ focusButton: true });
    return;
  }
  if (key === 'Tab') {
    closePotentiometerTaperPicker();
  }
}

export function handlePotentiometerTaperListClick(event) {
  if (!potentiometerTaperPickerList) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const option = target.closest('[role="option"]');
  if (!option || !potentiometerTaperPickerList.contains(option)) {
    return;
  }
  event.preventDefault();
  setPotentiometerTaperSelection(option.dataset.value || '');
  closePotentiometerTaperPicker({ focusButton: true });
}

export function handlePotentiometerTaperListFocusOut() {
  if (!potentiometerTaperPickerOpen) {
    return;
  }
  setTimeout(() => {
    if (!potentiometerTaperPickerOpen) {
      return;
    }
    if (!potentiometerTaperPicker) {
      closePotentiometerTaperPicker();
      return;
    }
    const active = document.activeElement;
    if (!active || !potentiometerTaperPicker.contains(active)) {
      closePotentiometerTaperPicker();
    }
  }, 0);
}