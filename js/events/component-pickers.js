/**
 * Electronic Component Picker Event Handlers
 *
 * Manages event handlers for electronic component pickers including:
 * - Component Mount
 * - Resistor Value
 * - Capacitor Value
 * - Diode Value
 * - MOSFET Channel
 * - MOSFET Part
 * - Potentiometer Value
 * - Potentiometer Taper
 * - Bearing Type
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import {
  setComponentMountSelection,
  setResistorValueSelection,
  setCapacitorValueSelection,
  setDiodeValueSelection,
  setMosfetChannelSelection,
  setMosfetPartSelection,
  setPotentiometerValueSelection,
  setPotentiometerTaperSelection,
  setBearingTypeSelection,
  syncBearingTypePicker,
} from '../forms.js';

const {
  componentMountPicker,
  componentMountPickerButton,
  componentMountPickerList,
  resistorValuePicker,
  resistorValuePickerButton,
  resistorValuePickerList,
  capacitorValuePicker,
  capacitorValuePickerButton,
  capacitorValuePickerList,
  diodeValuePicker,
  diodeValuePickerButton,
  diodeValuePickerList,
  mosfetChannelPicker,
  mosfetChannelPickerButton,
  mosfetChannelPickerList,
  mosfetPartPicker,
  mosfetPartPickerButton,
  mosfetPartPickerList,
  potentiometerValuePicker,
  potentiometerValuePickerButton,
  potentiometerValuePickerList,
  potentiometerTaperPicker,
  potentiometerTaperPickerButton,
  potentiometerTaperPickerList,
  bearingTypePicker,
  bearingTypePickerButton,
  bearingTypePickerList,
} = elements;

// Module-level state
let componentMountPickerOpen = false;
let resistorValuePickerOpen = false;
let capacitorValuePickerOpen = false;
let diodeValuePickerOpen = false;
let mosfetChannelPickerOpen = false;
let mosfetPartPickerOpen = false;
let potentiometerValuePickerOpen = false;
let potentiometerTaperPickerOpen = false;
let bearingTypePickerOpen = false;

function getComponentMountOptionElements() {
  if (!componentMountPickerList) {
    return [];
  }
  return Array.from(componentMountPickerList.querySelectorAll('[role="option"]'));
}

function focusComponentMountOption(option) {
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

function openComponentMountPicker() {
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

function closeComponentMountPicker({ focusButton = false } = {}) {
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

function toggleComponentMountPicker() {
  if (componentMountPickerOpen) {
    closeComponentMountPicker({ focusButton: false });
  } else {
    openComponentMountPicker();
  }
}

function moveComponentMountOption(delta) {
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

function handleComponentMountButtonKeydown(event) {
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

function handleComponentMountListKeydown(event) {
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

function handleComponentMountListClick(event) {
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

function handleComponentMountListFocusOut() {
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

function getResistorValueOptionElements() {
  if (!resistorValuePickerList) {
    return [];
  }
  return Array.from(resistorValuePickerList.querySelectorAll('[role="option"]'));
}

function focusResistorValueOption(option) {
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

function openResistorValuePicker() {
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

function closeResistorValuePicker({ focusButton = false } = {}) {
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

function toggleResistorValuePicker() {
  if (resistorValuePickerOpen) {
    closeResistorValuePicker({ focusButton: false });
  } else {
    openResistorValuePicker();
  }
}

function moveResistorValueOption(delta) {
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

function handleResistorValueButtonKeydown(event) {
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

function handleResistorValueListKeydown(event) {
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

function handleResistorValueListClick(event) {
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

function handleResistorValueListFocusOut() {
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

function getCapacitorValueOptionElements() {
  if (!capacitorValuePickerList) {
    return [];
  }
  return Array.from(capacitorValuePickerList.querySelectorAll('[role="option"]'));
}

function focusCapacitorValueOption(option) {
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

function openCapacitorValuePicker() {
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

function closeCapacitorValuePicker({ focusButton = false } = {}) {
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

function toggleCapacitorValuePicker() {
  if (capacitorValuePickerOpen) {
    closeCapacitorValuePicker({ focusButton: false });
  } else {
    openCapacitorValuePicker();
  }
}

function moveCapacitorValueOption(delta) {
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

function handleCapacitorValueButtonKeydown(event) {
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

function handleCapacitorValueListKeydown(event) {
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

function handleCapacitorValueListClick(event) {
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

function handleCapacitorValueListFocusOut() {
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

function getDiodeValueOptionElements() {
  if (!diodeValuePickerList) {
    return [];
  }
  return Array.from(diodeValuePickerList.querySelectorAll('[role="option"]'));
}

function focusDiodeValueOption(option) {
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

function openDiodeValuePicker() {
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

function closeDiodeValuePicker({ focusButton = false } = {}) {
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

function toggleDiodeValuePicker() {
  if (diodeValuePickerOpen) {
    closeDiodeValuePicker({ focusButton: false });
  } else {
    openDiodeValuePicker();
  }
}

function moveDiodeValueOption(delta) {
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

function handleDiodeValueButtonKeydown(event) {
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

function handleDiodeValueListKeydown(event) {
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

function handleDiodeValueListClick(event) {
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

function handleDiodeValueListFocusOut() {
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

function getMosfetChannelOptionElements() {
  if (!mosfetChannelPickerList) {
    return [];
  }
  return Array.from(mosfetChannelPickerList.querySelectorAll('[role="option"]'));
}

function focusMosfetChannelOption(option) {
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

function openMosfetChannelPicker() {
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

function closeMosfetChannelPicker({ focusButton = false } = {}) {
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

function toggleMosfetChannelPicker() {
  if (mosfetChannelPickerOpen) {
    closeMosfetChannelPicker({ focusButton: false });
  } else {
    openMosfetChannelPicker();
  }
}

function moveMosfetChannelOption(delta) {
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

function handleMosfetChannelButtonKeydown(event) {
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

function handleMosfetChannelListKeydown(event) {
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

function handleMosfetChannelListClick(event) {
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

function handleMosfetChannelListFocusOut() {
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

function getMosfetPartOptionElements() {
  if (!mosfetPartPickerList) {
    return [];
  }
  return Array.from(mosfetPartPickerList.querySelectorAll('[role="option"]'));
}

function focusMosfetPartOption(option) {
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

function openMosfetPartPicker() {
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

function closeMosfetPartPicker({ focusButton = false } = {}) {
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

function toggleMosfetPartPicker() {
  if (mosfetPartPickerOpen) {
    closeMosfetPartPicker({ focusButton: false });
  } else {
    openMosfetPartPicker();
  }
}

function moveMosfetPartOption(delta) {
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

function handleMosfetPartButtonKeydown(event) {
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

function handleMosfetPartListKeydown(event) {
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

function handleMosfetPartListClick(event) {
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

function handleMosfetPartListFocusOut() {
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

function getPotentiometerValueOptionElements() {
  if (!potentiometerValuePickerList) {
    return [];
  }
  return Array.from(potentiometerValuePickerList.querySelectorAll('[role="option"]'));
}

function focusPotentiometerValueOption(option) {
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

function openPotentiometerValuePicker() {
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

function closePotentiometerValuePicker({ focusButton = false } = {}) {
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

function togglePotentiometerValuePicker() {
  if (potentiometerValuePickerOpen) {
    closePotentiometerValuePicker({ focusButton: false });
  } else {
    openPotentiometerValuePicker();
  }
}

function movePotentiometerValueOption(delta) {
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

function handlePotentiometerValueButtonKeydown(event) {
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

function handlePotentiometerValueListKeydown(event) {
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

function handlePotentiometerValueListClick(event) {
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

function handlePotentiometerValueListFocusOut() {
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

function getPotentiometerTaperOptionElements() {
  if (!potentiometerTaperPickerList) {
    return [];
  }
  return Array.from(potentiometerTaperPickerList.querySelectorAll('[role="option"]'));
}

function focusPotentiometerTaperOption(option) {
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

function openPotentiometerTaperPicker() {
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

function closePotentiometerTaperPicker({ focusButton = false } = {}) {
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

function togglePotentiometerTaperPicker() {
  if (potentiometerTaperPickerOpen) {
    closePotentiometerTaperPicker({ focusButton: false });
  } else {
    openPotentiometerTaperPicker();
  }
}

function movePotentiometerTaperOption(delta) {
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

function handlePotentiometerTaperButtonKeydown(event) {
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

function handlePotentiometerTaperListKeydown(event) {
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

function handlePotentiometerTaperListClick(event) {
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

function handlePotentiometerTaperListFocusOut() {
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

function getBearingTypeOptionElements() {
  if (!bearingTypePickerList) {
    return [];
  }
  return Array.from(bearingTypePickerList.querySelectorAll('[role="option"]'));
}

function focusBearingTypeOption(option) {
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

function openBearingTypePicker() {
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

function closeBearingTypePicker({ focusButton = false } = {}) {
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

function toggleBearingTypePicker() {
  if (bearingTypePickerOpen) {
    closeBearingTypePicker({ focusButton: false });
  } else {
    openBearingTypePicker();
  }
}

function moveBearingTypeOption(delta) {
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

function handleBearingTypeButtonKeydown(event) {
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

function handleBearingTypeListKeydown(event) {
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

function handleBearingTypeListClick(event) {
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

function handleBearingTypeListFocusOut() {
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


// Export functions needed by init.js
export {
  toggleComponentMountPicker,
  closeComponentMountPicker,
  handleComponentMountButtonKeydown,
  handleComponentMountListKeydown,
  handleComponentMountListClick,
  handleComponentMountListFocusOut,
  toggleResistorValuePicker,
  closeResistorValuePicker,
  handleResistorValueButtonKeydown,
  handleResistorValueListKeydown,
  handleResistorValueListClick,
  handleResistorValueListFocusOut,
  toggleCapacitorValuePicker,
  closeCapacitorValuePicker,
  handleCapacitorValueButtonKeydown,
  handleCapacitorValueListKeydown,
  handleCapacitorValueListClick,
  handleCapacitorValueListFocusOut,
  toggleDiodeValuePicker,
  closeDiodeValuePicker,
  handleDiodeValueButtonKeydown,
  handleDiodeValueListKeydown,
  handleDiodeValueListClick,
  handleDiodeValueListFocusOut,
  toggleMosfetChannelPicker,
  closeMosfetChannelPicker,
  handleMosfetChannelButtonKeydown,
  handleMosfetChannelListKeydown,
  handleMosfetChannelListClick,
  handleMosfetChannelListFocusOut,
  toggleMosfetPartPicker,
  closeMosfetPartPicker,
  handleMosfetPartButtonKeydown,
  handleMosfetPartListKeydown,
  handleMosfetPartListClick,
  handleMosfetPartListFocusOut,
  togglePotentiometerValuePicker,
  closePotentiometerValuePicker,
  handlePotentiometerValueButtonKeydown,
  handlePotentiometerValueListKeydown,
  handlePotentiometerValueListClick,
  handlePotentiometerValueListFocusOut,
  togglePotentiometerTaperPicker,
  closePotentiometerTaperPicker,
  handlePotentiometerTaperButtonKeydown,
  handlePotentiometerTaperListKeydown,
  handlePotentiometerTaperListClick,
  handlePotentiometerTaperListFocusOut,
  toggleBearingTypePicker,
  closeBearingTypePicker,
  handleBearingTypeButtonKeydown,
  handleBearingTypeListKeydown,
  handleBearingTypeListClick,
  handleBearingTypeListFocusOut,
};
