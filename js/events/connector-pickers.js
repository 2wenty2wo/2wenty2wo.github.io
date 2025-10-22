/**
 * Connector category and series picker event handlers
 * Extracted from events.js
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import * as forms from '../forms.js';
import { updatePreview, updateDownloadState } from '../render.js';

export function getConnectorCategoryOptionElements() {
  if (!connectorCategoryPickerList) {
    return [];
  }
  return Array.from(connectorCategoryPickerList.querySelectorAll('[role="option"]'));
}

export function getVisibleConnectorCategoryOptions() {
  return getConnectorCategoryOptionElements().filter(
    option => !option.hidden && option.style.display !== 'none',
  );
}

export function focusConnectorCategoryOption(option) {
  if (!option) {
    return;
  }
  const options = getVisibleConnectorCategoryOptions();
  options.forEach(opt => {
    opt.tabIndex = opt === option ? 0 : -1;
  });
  option.focus();
  if (typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' });
  }
}

export function openConnectorCategoryPicker() {
  if (!connectorCategoryPicker || !connectorCategoryPickerButton || !connectorCategoryPickerList) {
    return;
  }
  if (connectorCategoryPickerButton.disabled) {
    return;
  }
  if (connectorCategoryPickerOpen) {
    return;
  }
  connectorCategoryPickerOpen = true;
  connectorCategoryPicker.classList.add('is-open');
  connectorCategoryPickerList.hidden = false;
  connectorCategoryPickerButton.setAttribute('aria-expanded', 'true');
  syncConnectorCategoryPicker({ isValid: true });

  const visibleOptions = getVisibleConnectorCategoryOptions();
  if (visibleOptions.length === 0) {
    return;
  }
  const currentValue = typeof state.connectorCategory === 'string' ? state.connectorCategory : '';
  const selectedOption = visibleOptions.find(option => option.dataset.value === currentValue);
  focusConnectorCategoryOption(selectedOption || visibleOptions[0]);
}

export function closeConnectorCategoryPicker({ focusButton = false } = {}) {
  if (!connectorCategoryPicker || !connectorCategoryPickerButton || !connectorCategoryPickerList) {
    return;
  }
  if (!connectorCategoryPickerOpen) {
    if (focusButton && !connectorCategoryPickerButton.disabled) {
      connectorCategoryPickerButton.focus();
    }
    return;
  }
  connectorCategoryPickerOpen = false;
  connectorCategoryPicker.classList.remove('is-open');
  connectorCategoryPickerList.hidden = true;
  connectorCategoryPickerButton.setAttribute('aria-expanded', 'false');
  if (focusButton && !connectorCategoryPickerButton.disabled) {
    connectorCategoryPickerButton.focus();
  }
}

export function toggleConnectorCategoryPicker() {
  if (connectorCategoryPickerOpen) {
    closeConnectorCategoryPicker({ focusButton: false });
  } else {
    openConnectorCategoryPicker();
  }
}

export function moveConnectorCategoryOption(delta) {
  const options = getVisibleConnectorCategoryOptions();
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
  focusConnectorCategoryOption(options[nextIndex]);
}

export function handleConnectorCategoryButtonKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    openConnectorCategoryPicker();
    moveConnectorCategoryOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    openConnectorCategoryPicker();
    moveConnectorCategoryOption(-1);
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    toggleConnectorCategoryPicker();
    return;
  }
  if (key === 'Escape' && connectorCategoryPickerOpen) {
    event.preventDefault();
    closeConnectorCategoryPicker({ focusButton: true });
  }
}

export function handleConnectorCategoryListKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    moveConnectorCategoryOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    moveConnectorCategoryOption(-1);
    return;
  }
  if (key === 'Home') {
    event.preventDefault();
    const options = getVisibleConnectorCategoryOptions();
    if (options.length > 0) {
      focusConnectorCategoryOption(options[0]);
    }
    return;
  }
  if (key === 'End') {
    event.preventDefault();
    const options = getVisibleConnectorCategoryOptions();
    if (options.length > 0) {
      focusConnectorCategoryOption(options[options.length - 1]);
    }
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    const target = event.target;
    if (target && target instanceof HTMLElement) {
      const option = target.closest('[role="option"]');
      if (option) {
        setConnectorCategorySelection(option.dataset.value || '');
        closeConnectorCategoryPicker({ focusButton: true });
      }
    }
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closeConnectorCategoryPicker({ focusButton: true });
    return;
  }
  if (key === 'Tab') {
    closeConnectorCategoryPicker();
  }
}

export function handleConnectorCategoryListClick(event) {
  if (!connectorCategoryPickerList) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const option = target.closest('[role="option"]');
  if (!option || !connectorCategoryPickerList.contains(option)) {
    return;
  }
  event.preventDefault();
  setConnectorCategorySelection(option.dataset.value || '');
  closeConnectorCategoryPicker({ focusButton: true });
}

export function handleConnectorCategoryListFocusOut() {
  if (!connectorCategoryPickerOpen) {
    return;
  }
  setTimeout(() => {
    if (!connectorCategoryPickerOpen) {
      return;
    }
    if (!connectorCategoryPicker) {
      closeConnectorCategoryPicker();
      return;
    }
    const active = document.activeElement;
    if (!active || !connectorCategoryPicker.contains(active)) {
      closeConnectorCategoryPicker();
    }
  }, 0);
}

export function getConnectorSeriesOptionElements() {
  if (!connectorSeriesPickerList) {
    return [];
  }
  return Array.from(connectorSeriesPickerList.querySelectorAll('[role="option"]'));
}

export function getVisibleConnectorSeriesOptions() {
  return getConnectorSeriesOptionElements().filter(
    option => !option.hidden && option.style.display !== 'none',
  );
}

export function focusConnectorSeriesOption(option) {
  if (!option) {
    return;
  }
  const options = getVisibleConnectorSeriesOptions();
  options.forEach(opt => {
    opt.tabIndex = opt === option ? 0 : -1;
  });
  option.focus();
  if (typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' });
  }
}

export function openConnectorSeriesPicker() {
  if (
    !connectorSeriesPicker ||
    !connectorSeriesPickerButton ||
    !connectorSeriesPickerList ||
    state.hardwareType !== 'Connector'
  ) {
    return;
  }
  if (connectorSeriesPickerButton.disabled) {
    return;
  }
  if (connectorSeriesPickerOpen) {
    return;
  }
  connectorSeriesPickerOpen = true;
  connectorSeriesPicker.classList.add('is-open');
  connectorSeriesPickerList.hidden = false;
  connectorSeriesPickerButton.setAttribute('aria-expanded', 'true');
  syncConnectorSeriesPicker({ isValid: true });

  const visibleOptions = getVisibleConnectorSeriesOptions();
  if (visibleOptions.length === 0) {
    return;
  }
  const currentCode = typeof state.standardCode === 'string' ? state.standardCode : '';
  const selectedOption = visibleOptions.find(option => option.dataset.value === currentCode);
  focusConnectorSeriesOption(selectedOption || visibleOptions[0]);
}

export function closeConnectorSeriesPicker({ focusButton = false } = {}) {
  if (!connectorSeriesPicker || !connectorSeriesPickerButton || !connectorSeriesPickerList) {
    return;
  }
  if (!connectorSeriesPickerOpen) {
    if (focusButton && !connectorSeriesPickerButton.disabled) {
      connectorSeriesPickerButton.focus();
    }
    return;
  }
  connectorSeriesPickerOpen = false;
  connectorSeriesPicker.classList.remove('is-open');
  connectorSeriesPickerList.hidden = true;
  connectorSeriesPickerButton.setAttribute('aria-expanded', 'false');
  if (focusButton && !connectorSeriesPickerButton.disabled) {
    connectorSeriesPickerButton.focus();
  }
}

export function toggleConnectorSeriesPicker() {
  if (connectorSeriesPickerOpen) {
    closeConnectorSeriesPicker({ focusButton: false });
  } else {
    openConnectorSeriesPicker();
  }
}

export function moveConnectorSeriesOption(delta) {
  const options = getVisibleConnectorSeriesOptions();
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
  focusConnectorSeriesOption(options[nextIndex]);
}

export function handleConnectorSeriesButtonKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    openConnectorSeriesPicker();
    moveConnectorSeriesOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    openConnectorSeriesPicker();
    moveConnectorSeriesOption(-1);
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    toggleConnectorSeriesPicker();
    return;
  }
  if (key === 'Escape' && connectorSeriesPickerOpen) {
    event.preventDefault();
    closeConnectorSeriesPicker({ focusButton: true });
    return;
  }
  if (
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    (key.length === 1 || key === 'Backspace' || key === 'Delete')
  ) {
    handleStandardSelectKeydown(event);
    if (!connectorSeriesPickerOpen) {
      openConnectorSeriesPicker();
    }
    const options = getVisibleConnectorSeriesOptions();
    if (options.length > 0) {
      focusConnectorSeriesOption(options[0]);
    }
  }
}

export function handleConnectorSeriesListKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    moveConnectorSeriesOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    moveConnectorSeriesOption(-1);
    return;
  }
  if (key === 'Home') {
    event.preventDefault();
    const options = getVisibleConnectorSeriesOptions();
    if (options.length > 0) {
      focusConnectorSeriesOption(options[0]);
    }
    return;
  }
  if (key === 'End') {
    event.preventDefault();
    const options = getVisibleConnectorSeriesOptions();
    if (options.length > 0) {
      focusConnectorSeriesOption(options[options.length - 1]);
    }
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    const target = event.target;
    if (target && target instanceof HTMLElement) {
      const option = target.closest('[role="option"]');
      if (option) {
        setConnectorSeriesSelection(option.dataset.value || '');
        closeConnectorSeriesPicker({ focusButton: true });
      }
    }
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closeConnectorSeriesPicker({ focusButton: true });
    return;
  }
  if (key === 'Tab') {
    closeConnectorSeriesPicker();
    return;
  }
  if (
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    (key.length === 1 || key === 'Backspace' || key === 'Delete')
  ) {
    handleStandardSelectKeydown(event);
    const options = getVisibleConnectorSeriesOptions();
    if (options.length > 0) {
      focusConnectorSeriesOption(options[0]);
    }
  }
}

export function handleConnectorSeriesListClick(event) {
  if (!connectorSeriesPickerList) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const option = target.closest('[role="option"]');
  if (!option || !connectorSeriesPickerList.contains(option)) {
    return;
  }
  event.preventDefault();
  setConnectorSeriesSelection(option.dataset.value || '');
  closeConnectorSeriesPicker({ focusButton: true });
}

export function handleConnectorSeriesListFocusOut() {
  if (!connectorSeriesPickerOpen) {
    return;
  }
  setTimeout(() => {
    if (!connectorSeriesPickerOpen) {
      return;
    }
    if (!connectorSeriesPicker) {
      closeConnectorSeriesPicker();
      return;
    }
    const active = document.activeElement;
    if (!active || !connectorSeriesPicker.contains(active)) {
      closeConnectorSeriesPicker();
    }
  }, 0);
}