/**
 * Fastener Picker Event Handlers
 *
 * Manages event handlers for fastener-related pickers including:
 * - Bolt Drive
 * - Bolt Head
 * - Nut Type
 * - Washer Type
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import {
  setBoltDriveSelection,
  syncBoltDrivePicker,
  setBoltHeadSelection,
  syncBoltHeadPicker,
  setNutTypeSelection,
  syncNutTypePicker,
  setWasherTypeSelection,
  syncWasherTypePicker,
} from '../forms.js';

const {
  boltDrivePicker,
  boltDrivePickerButton,
  boltDrivePickerList,
  boltHeadPicker,
  boltHeadPickerButton,
  boltHeadPickerList,
  nutTypePicker,
  nutTypePickerButton,
  nutTypePickerList,
  washerTypePicker,
  washerTypePickerButton,
  washerTypePickerList,
} = elements;

// Module-level state
let boltDrivePickerOpen = false;
let boltHeadPickerOpen = false;
let nutTypePickerOpen = false;
let washerTypePickerOpen = false;

function getBoltDriveOptionElements() {
  if (!boltDrivePickerList) {
    return [];
  }
  return Array.from(boltDrivePickerList.querySelectorAll('[role="option"]'));
}

function focusBoltDriveOption(option) {
  if (!option) {
    return;
  }
  const options = getBoltDriveOptionElements();
  options.forEach(opt => {
    opt.tabIndex = opt === option ? 0 : -1;
  });
  option.focus();
  if (typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' });
  }
}

function openBoltDrivePicker() {
  if (!boltDrivePicker || !boltDrivePickerButton || !boltDrivePickerList) {
    return;
  }
  if (boltDrivePickerButton.disabled) {
    return;
  }
  if (boltDrivePickerOpen) {
    return;
  }
  boltDrivePickerOpen = true;
  boltDrivePicker.classList.add('is-open');
  boltDrivePickerList.hidden = false;
  boltDrivePickerButton.setAttribute('aria-expanded', 'true');
  syncBoltDrivePicker({ isValid: true });

  const options = getBoltDriveOptionElements();
  if (options.length === 0) {
    return;
  }
  const currentValue = typeof state.boltDrive === 'string' ? state.boltDrive : '';
  const selectedOption = options.find(option => option.dataset.value === currentValue);
  focusBoltDriveOption(selectedOption || options[0]);
}

function closeBoltDrivePicker({ focusButton = false } = {}) {
  if (!boltDrivePicker || !boltDrivePickerButton || !boltDrivePickerList) {
    return;
  }
  if (!boltDrivePickerOpen) {
    if (focusButton && !boltDrivePickerButton.disabled) {
      boltDrivePickerButton.focus();
    }
    return;
  }
  boltDrivePickerOpen = false;
  boltDrivePicker.classList.remove('is-open');
  boltDrivePickerList.hidden = true;
  boltDrivePickerButton.setAttribute('aria-expanded', 'false');
  if (focusButton && !boltDrivePickerButton.disabled) {
    boltDrivePickerButton.focus();
  }
}

function toggleBoltDrivePicker() {
  if (boltDrivePickerOpen) {
    closeBoltDrivePicker({ focusButton: false });
  } else {
    openBoltDrivePicker();
  }
}

function moveBoltDriveOption(delta) {
  if (!boltDrivePickerList) {
    return;
  }
  const options = getBoltDriveOptionElements();
  if (options.length === 0) {
    return;
  }
  const active = document.activeElement;
  const activeOption = active && boltDrivePickerList.contains(active)
    ? active.closest('[role="option"]')
    : null;
  let index = activeOption ? options.indexOf(activeOption) : -1;
  if (index === -1) {
    const currentValue = typeof state.boltDrive === 'string' ? state.boltDrive : '';
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
    focusBoltDriveOption(nextOption);
  }
}

function handleBoltDriveButtonKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    openBoltDrivePicker();
    moveBoltDriveOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    openBoltDrivePicker();
    moveBoltDriveOption(-1);
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    toggleBoltDrivePicker();
    return;
  }
  if (key === 'Escape' && boltDrivePickerOpen) {
    event.preventDefault();
    closeBoltDrivePicker({ focusButton: true });
  }
}

function handleBoltDriveListKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    moveBoltDriveOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    moveBoltDriveOption(-1);
    return;
  }
  if (key === 'Home') {
    event.preventDefault();
    const options = getBoltDriveOptionElements();
    if (options.length > 0) {
      focusBoltDriveOption(options[0]);
    }
    return;
  }
  if (key === 'End') {
    event.preventDefault();
    const options = getBoltDriveOptionElements();
    if (options.length > 0) {
      focusBoltDriveOption(options[options.length - 1]);
    }
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    const target = event.target;
    if (target && target instanceof HTMLElement) {
      const option = target.closest('[role="option"]');
      if (option) {
        setBoltDriveSelection(option.dataset.value || '');
        closeBoltDrivePicker({ focusButton: true });
      }
    }
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closeBoltDrivePicker({ focusButton: true });
    return;
  }
  if (key === 'Tab') {
    closeBoltDrivePicker();
  }
}

function handleBoltDriveListClick(event) {
  if (!boltDrivePickerList) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const option = target.closest('[role="option"]');
  if (!option || !boltDrivePickerList.contains(option)) {
    return;
  }
  event.preventDefault();
  setBoltDriveSelection(option.dataset.value || '');
  closeBoltDrivePicker({ focusButton: true });
}

function handleBoltDriveListFocusOut() {
  if (!boltDrivePickerOpen) {
    return;
  }
  setTimeout(() => {
    if (!boltDrivePickerOpen) {
      return;
    }
    if (!boltDrivePicker) {
      closeBoltDrivePicker();
      return;
    }
    const active = document.activeElement;
    if (!active || !boltDrivePicker.contains(active)) {
      closeBoltDrivePicker();
    }
  }, 0);
}

function getBoltHeadOptionElements() {
  if (!boltHeadPickerList) {
    return [];
  }
  return Array.from(boltHeadPickerList.querySelectorAll('[role="option"]'));
}

function focusBoltHeadOption(option) {
  if (!option) {
    return;
  }
  const options = getBoltHeadOptionElements();
  options.forEach(opt => {
    opt.tabIndex = opt === option ? 0 : -1;
  });
  option.focus();
  if (typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' });
  }
}

function openBoltHeadPicker() {
  if (!boltHeadPicker || !boltHeadPickerButton || !boltHeadPickerList) {
    return;
  }
  if (boltHeadPickerButton.disabled) {
    return;
  }
  if (boltHeadPickerOpen) {
    return;
  }
  boltHeadPickerOpen = true;
  boltHeadPicker.classList.add('is-open');
  boltHeadPickerList.hidden = false;
  boltHeadPickerButton.setAttribute('aria-expanded', 'true');
  syncBoltHeadPicker({ isValid: true });

  const options = getBoltHeadOptionElements();
  if (options.length === 0) {
    return;
  }
  const currentValue = typeof state.boltHead === 'string' ? state.boltHead : '';
  const selectedOption = options.find(option => option.dataset.value === currentValue);
  focusBoltHeadOption(selectedOption || options[0]);
}

function closeBoltHeadPicker({ focusButton = false } = {}) {
  if (!boltHeadPicker || !boltHeadPickerButton || !boltHeadPickerList) {
    return;
  }
  if (!boltHeadPickerOpen) {
    if (focusButton && !boltHeadPickerButton.disabled) {
      boltHeadPickerButton.focus();
    }
    return;
  }
  boltHeadPickerOpen = false;
  boltHeadPicker.classList.remove('is-open');
  boltHeadPickerList.hidden = true;
  boltHeadPickerButton.setAttribute('aria-expanded', 'false');
  if (focusButton && !boltHeadPickerButton.disabled) {
    boltHeadPickerButton.focus();
  }
}

function toggleBoltHeadPicker() {
  if (boltHeadPickerOpen) {
    closeBoltHeadPicker({ focusButton: false });
  } else {
    openBoltHeadPicker();
  }
}

function moveBoltHeadOption(delta) {
  if (!boltHeadPickerList) {
    return;
  }
  const options = getBoltHeadOptionElements();
  if (options.length === 0) {
    return;
  }
  const active = document.activeElement;
  const activeOption = active && boltHeadPickerList.contains(active)
    ? active.closest('[role="option"]')
    : null;
  let index = activeOption ? options.indexOf(activeOption) : -1;
  if (index === -1) {
    const currentValue = typeof state.boltHead === 'string' ? state.boltHead : '';
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
    focusBoltHeadOption(nextOption);
  }
}

function handleBoltHeadButtonKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    openBoltHeadPicker();
    moveBoltHeadOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    openBoltHeadPicker();
    moveBoltHeadOption(-1);
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    toggleBoltHeadPicker();
    return;
  }
  if (key === 'Escape' && boltHeadPickerOpen) {
    event.preventDefault();
    closeBoltHeadPicker({ focusButton: true });
  }
}

function handleBoltHeadListKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    moveBoltHeadOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    moveBoltHeadOption(-1);
    return;
  }
  if (key === 'Home') {
    event.preventDefault();
    const options = getBoltHeadOptionElements();
    if (options.length > 0) {
      focusBoltHeadOption(options[0]);
    }
    return;
  }
  if (key === 'End') {
    event.preventDefault();
    const options = getBoltHeadOptionElements();
    if (options.length > 0) {
      focusBoltHeadOption(options[options.length - 1]);
    }
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    const target = event.target;
    if (target && target instanceof HTMLElement) {
      const option = target.closest('[role="option"]');
      if (option) {
        setBoltHeadSelection(option.dataset.value || '');
        closeBoltHeadPicker({ focusButton: true });
      }
    }
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closeBoltHeadPicker({ focusButton: true });
    return;
  }
  if (key === 'Tab') {
    closeBoltHeadPicker();
  }
}

function handleBoltHeadListClick(event) {
  if (!boltHeadPickerList) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const option = target.closest('[role="option"]');
  if (!option || !boltHeadPickerList.contains(option)) {
    return;
  }
  event.preventDefault();
  setBoltHeadSelection(option.dataset.value || '');
  closeBoltHeadPicker({ focusButton: true });
}

function handleBoltHeadListFocusOut() {
  if (!boltHeadPickerOpen) {
    return;
  }
  setTimeout(() => {
    if (!boltHeadPickerOpen) {
      return;
    }
    if (!boltHeadPicker) {
      closeBoltHeadPicker();
      return;
    }
    const active = document.activeElement;
    if (!active || !boltHeadPicker.contains(active)) {
      closeBoltHeadPicker();
    }
  }, 0);
}

function getNutTypeOptionElements() {
  if (!nutTypePickerList) {
    return [];
  }
  return Array.from(nutTypePickerList.querySelectorAll('[role="option"]'));
}

function focusNutTypeOption(option) {
  if (!option) {
    return;
  }
  const options = getNutTypeOptionElements();
  options.forEach(opt => {
    opt.tabIndex = opt === option ? 0 : -1;
  });
  option.focus();
  if (typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' });
  }
}

function openNutTypePicker() {
  if (!nutTypePicker || !nutTypePickerButton || !nutTypePickerList) {
    return;
  }
  if (nutTypePickerButton.disabled) {
    return;
  }
  if (nutTypePickerOpen) {
    return;
  }
  nutTypePickerOpen = true;
  nutTypePicker.classList.add('is-open');
  nutTypePickerList.hidden = false;
  nutTypePickerButton.setAttribute('aria-expanded', 'true');
  syncNutTypePicker({ isValid: true });

  const options = getNutTypeOptionElements();
  if (options.length === 0) {
    return;
  }
  const currentValue = typeof state.nutType === 'string' ? state.nutType : '';
  const selectedOption = options.find(option => option.dataset.value === currentValue);
  focusNutTypeOption(selectedOption || options[0]);
}

function closeNutTypePicker({ focusButton = false } = {}) {
  if (!nutTypePicker || !nutTypePickerButton || !nutTypePickerList) {
    return;
  }
  if (!nutTypePickerOpen) {
    if (focusButton && !nutTypePickerButton.disabled) {
      nutTypePickerButton.focus();
    }
    return;
  }
  nutTypePickerOpen = false;
  nutTypePicker.classList.remove('is-open');
  nutTypePickerList.hidden = true;
  nutTypePickerButton.setAttribute('aria-expanded', 'false');
  if (focusButton && !nutTypePickerButton.disabled) {
    nutTypePickerButton.focus();
  }
}

function toggleNutTypePicker() {
  if (nutTypePickerOpen) {
    closeNutTypePicker({ focusButton: false });
  } else {
    openNutTypePicker();
  }
}

function moveNutTypeOption(delta) {
  if (!nutTypePickerList) {
    return;
  }
  const options = getNutTypeOptionElements();
  if (options.length === 0) {
    return;
  }
  const active = document.activeElement;
  const activeOption = active && nutTypePickerList.contains(active)
    ? active.closest('[role="option"]')
    : null;
  let index = activeOption ? options.indexOf(activeOption) : -1;
  if (index === -1) {
    const currentValue = typeof state.nutType === 'string' ? state.nutType : '';
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
    focusNutTypeOption(nextOption);
  }
}

function handleNutTypeButtonKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    openNutTypePicker();
    moveNutTypeOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    openNutTypePicker();
    moveNutTypeOption(-1);
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    toggleNutTypePicker();
    return;
  }
  if (key === 'Escape' && nutTypePickerOpen) {
    event.preventDefault();
    closeNutTypePicker({ focusButton: true });
  }
}

function handleNutTypeListKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    moveNutTypeOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    moveNutTypeOption(-1);
    return;
  }
  if (key === 'Home') {
    event.preventDefault();
    const options = getNutTypeOptionElements();
    if (options.length > 0) {
      focusNutTypeOption(options[0]);
    }
    return;
  }
  if (key === 'End') {
    event.preventDefault();
    const options = getNutTypeOptionElements();
    if (options.length > 0) {
      focusNutTypeOption(options[options.length - 1]);
    }
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    const target = event.target;
    if (target && target instanceof HTMLElement) {
      const option = target.closest('[role="option"]');
      if (option) {
        setNutTypeSelection(option.dataset.value || '');
        closeNutTypePicker({ focusButton: true });
      }
    }
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closeNutTypePicker({ focusButton: true });
    return;
  }
  if (key === 'Tab') {
    closeNutTypePicker();
  }
}

function handleNutTypeListClick(event) {
  if (!nutTypePickerList) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const option = target.closest('[role="option"]');
  if (!option || !nutTypePickerList.contains(option)) {
    return;
  }
  event.preventDefault();
  setNutTypeSelection(option.dataset.value || '');
  closeNutTypePicker({ focusButton: true });
}

function handleNutTypeListFocusOut() {
  if (!nutTypePickerOpen) {
    return;
  }
  setTimeout(() => {
    if (!nutTypePickerOpen) {
      return;
    }
    if (!nutTypePicker) {
      closeNutTypePicker();
      return;
    }
    const active = document.activeElement;
    if (!active || !nutTypePicker.contains(active)) {
      closeNutTypePicker();
    }
  }, 0);
}

function getWasherTypeOptionElements() {
  if (!washerTypePickerList) {
    return [];
  }
  return Array.from(washerTypePickerList.querySelectorAll('[role="option"]'));
}

function focusWasherTypeOption(option) {
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

function openWasherTypePicker() {
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

function closeWasherTypePicker({ focusButton = false } = {}) {
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

function toggleWasherTypePicker() {
  if (washerTypePickerOpen) {
    closeWasherTypePicker({ focusButton: false });
  } else {
    openWasherTypePicker();
  }
}

function moveWasherTypeOption(delta) {
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

function handleWasherTypeButtonKeydown(event) {
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

function handleWasherTypeListKeydown(event) {
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

function handleWasherTypeListClick(event) {
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

function handleWasherTypeListFocusOut() {
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


// Export functions needed by init.js
export {
  toggleBoltDrivePicker,
  closeBoltDrivePicker,
  handleBoltDriveButtonKeydown,
  handleBoltDriveListKeydown,
  handleBoltDriveListClick,
  handleBoltDriveListFocusOut,
  toggleBoltHeadPicker,
  closeBoltHeadPicker,
  handleBoltHeadButtonKeydown,
  handleBoltHeadListKeydown,
  handleBoltHeadListClick,
  handleBoltHeadListFocusOut,
  toggleNutTypePicker,
  closeNutTypePicker,
  handleNutTypeButtonKeydown,
  handleNutTypeListKeydown,
  handleNutTypeListClick,
  handleNutTypeListFocusOut,
  toggleWasherTypePicker,
  closeWasherTypePicker,
  handleWasherTypeButtonKeydown,
  handleWasherTypeListKeydown,
  handleWasherTypeListClick,
  handleWasherTypeListFocusOut,
};
