/**
 * Custom Icon and Part Picker Event Handlers
 *
 * Manages event handlers for custom pickers including:
 * - Custom Icon
 * - Custom Part
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import {
  setCustomIconSelection,
  setCustomPartSelection,
  setCustomGraphicSource,
  syncCustomPartPicker,
} from '../forms.js';

const {
  customIconPicker,
  customIconPickerButton,
  customIconPickerList,
  customPartPicker,
  customPartPickerButton,
  customPartPickerList,
} = elements;

// Module-level state
let customIconPickerOpen = false;
let customPartPickerOpen = false;

function getCustomIconOptionElements() {
  if (!customIconPickerList) {
    return [];
  }
  return Array.from(customIconPickerList.querySelectorAll('[role="option"]'));
}

function focusCustomIconOption(option) {
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

function openCustomIconPicker() {
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

function closeCustomIconPicker({ focusButton = false } = {}) {
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

function toggleCustomIconPicker() {
  if (customIconPickerOpen) {
    closeCustomIconPicker({ focusButton: false });
  } else {
    openCustomIconPicker();
  }
}

function moveCustomIconOption(delta) {
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

function handleCustomIconButtonKeydown(event) {
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

function handleCustomIconListKeydown(event) {
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

function handleCustomIconListClick(event) {
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

function handleCustomIconListFocusOut() {
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

function getCustomPartOptionElements() {
  if (!customPartPickerList) {
    return [];
  }
  return Array.from(customPartPickerList.querySelectorAll('[role="option"]'));
}

function focusCustomPartOption(option) {
  if (!option) {
    return;
  }
  const options = getCustomPartOptionElements();
  options.forEach(opt => {
    opt.tabIndex = opt === option ? 0 : -1;
  });
  option.focus();
  if (typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' });
  }
}

function openCustomPartPicker() {
  if (!customPartPicker || !customPartPickerButton || !customPartPickerList) {
    return;
  }
  if (customPartPickerButton.disabled) {
    return;
  }
  if (customPartPickerOpen) {
    return;
  }
  customPartPickerOpen = true;
  customPartPicker.classList.add('is-open');
  customPartPickerList.hidden = false;
  customPartPickerButton.setAttribute('aria-expanded', 'true');
  syncCustomPartPicker({ isValid: true });

  const options = getCustomPartOptionElements();
  if (options.length === 0) {
    return;
  }
  const currentValue = typeof state.customPartId === 'string' ? state.customPartId : '';
  const selectedOption = options.find(option => option.dataset.value === currentValue);
  focusCustomPartOption(selectedOption || options[0]);
}

function closeCustomPartPicker({ focusButton = false } = {}) {
  if (!customPartPicker || !customPartPickerButton || !customPartPickerList) {
    return;
  }
  if (!customPartPickerOpen) {
    if (focusButton && !customPartPickerButton.disabled) {
      customPartPickerButton.focus();
    }
    return;
  }
  customPartPickerOpen = false;
  customPartPicker.classList.remove('is-open');
  customPartPickerList.hidden = true;
  customPartPickerButton.setAttribute('aria-expanded', 'false');
  if (focusButton && !customPartPickerButton.disabled) {
    customPartPickerButton.focus();
  }
}

function toggleCustomPartPicker() {
  if (customPartPickerOpen) {
    closeCustomPartPicker({ focusButton: false });
  } else {
    openCustomPartPicker();
  }
}

function moveCustomPartOption(delta) {
  if (!customPartPickerList) {
    return;
  }
  const options = getCustomPartOptionElements();
  if (options.length === 0) {
    return;
  }
  const active = document.activeElement;
  const activeOption = active && customPartPickerList.contains(active)
    ? active.closest('[role="option"]')
    : null;
  let index = activeOption ? options.indexOf(activeOption) : -1;
  if (index === -1) {
    const currentValue = typeof state.customPartId === 'string' ? state.customPartId : '';
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
    focusCustomPartOption(nextOption);
  }
}

function handleCustomPartButtonKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    openCustomPartPicker();
    moveCustomPartOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    openCustomPartPicker();
    moveCustomPartOption(-1);
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    toggleCustomPartPicker();
  }
}

function handleCustomPartListKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    moveCustomPartOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    moveCustomPartOption(-1);
    return;
  }
  if (key === 'Home') {
    event.preventDefault();
    const options = getCustomPartOptionElements();
    if (options.length > 0) {
      focusCustomPartOption(options[0]);
    }
    return;
  }
  if (key === 'End') {
    event.preventDefault();
    const options = getCustomPartOptionElements();
    if (options.length > 0) {
      focusCustomPartOption(options[options.length - 1]);
    }
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    const target = event.target;
    if (target && target instanceof HTMLElement) {
      const option = target.closest('[role="option"]');
      if (option) {
        setCustomGraphicSource('parts');
        setCustomPartSelection(option.dataset.value || '');
        closeCustomPartPicker({ focusButton: true });
      }
    }
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closeCustomPartPicker({ focusButton: true });
    return;
  }
  if (key === 'Tab') {
    closeCustomPartPicker();
  }
}

function handleCustomPartListClick(event) {
  if (!customPartPickerList) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const option = target.closest('[role="option"]');
  if (!option || !customPartPickerList.contains(option)) {
    return;
  }
  event.preventDefault();
  setCustomGraphicSource('parts');
  setCustomPartSelection(option.dataset.value || '');
  closeCustomPartPicker({ focusButton: true });
}

function handleCustomPartListFocusOut() {
  if (!customPartPickerOpen) {
    return;
  }
  setTimeout(() => {
    if (!customPartPickerOpen) {
      return;
    }
    if (!customPartPicker) {
      closeCustomPartPicker();
      return;
    }
    const active = document.activeElement;
    if (!active || !customPartPicker.contains(active)) {
      closeCustomPartPicker();
    }
  }, 0);
}


// Export functions needed by init.js
export {
  toggleCustomIconPicker,
  closeCustomIconPicker,
  handleCustomIconButtonKeydown,
  handleCustomIconListKeydown,
  handleCustomIconListClick,
  handleCustomIconListFocusOut,
  toggleCustomPartPicker,
  closeCustomPartPicker,
  handleCustomPartButtonKeydown,
  handleCustomPartListKeydown,
  handleCustomPartListClick,
  handleCustomPartListFocusOut,
};
