/**
 * Hardware Type Picker Event Handlers
 *
 * Manages the complex hardware type picker dialog with search, filtering,
 * and keyboard navigation capabilities.
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import {
  syncHardwareTypePicker,
  setHardwareTypeFilterCategory,
  setHardwareTypeSearchQuery,
  getHardwareTypePickerMode,
} from '../forms.js';

const {
  hardwareTypeSelect,
  hardwareTypePickerButton,
  hardwareTypePickerDialog,
  hardwareTypePickerFallback,
  hardwareTypePickerSurface,
  hardwareTypePickerSearch,
  hardwareTypePickerFilters,
} = elements;

// Module-level state
let hardwareTypePickerOpen = false;

const coarsePointerMediaQuery =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(hover: none) and (pointer: coarse)')
    : null;

export function isCoarsePointerDevice() {
  return Boolean(coarsePointerMediaQuery && coarsePointerMediaQuery.matches);
}

const HARDWARE_TYPE_SEARCH_DELAY = 120;
let hardwareTypePickerMode = 'dialog';
let hardwareTypeModalElement = null;
let hardwareTypePreviouslyFocusedElement = null;
let hardwareTypeSearchTimeoutId = 0;
let hardwareTypeTrapElements = [];
let hardwareTypeActiveOptionIndex = -1;

function updateHardwareTypePickerMode() {
  hardwareTypePickerMode = getHardwareTypePickerMode();
  hardwareTypeModalElement =
    hardwareTypePickerMode === 'dialog' ? hardwareTypePickerDialog : hardwareTypePickerFallback;
}

function getHardwareTypeOptionElements() {
  if (!hardwareTypePickerSurface) {
    return [];
  }
  return Array.from(
    hardwareTypePickerSurface.querySelectorAll('[data-hardware-type-option="true"]:not([hidden])'),
  );
}

function updateHardwareTypeActiveOptionFromDom() {
  const options = getHardwareTypeOptionElements();
  const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const activeOption = activeElement && options.includes(activeElement) ? activeElement : null;
  const tabIndexed = options.find(option => option.tabIndex === 0) || null;
  const selectedOption = options.find(option => option.classList.contains('is-selected')) || null;
  const fallbackOption = options[0] || null;
  const candidate = activeOption || tabIndexed || selectedOption || fallbackOption;

  hardwareTypeActiveOptionIndex = candidate ? options.indexOf(candidate) : -1;
  options.forEach((option, index) => {
    option.tabIndex = index === hardwareTypeActiveOptionIndex ? 0 : -1;
  });
}

function updateHardwareTypeTrapElements() {
  if (!hardwareTypePickerSurface) {
    hardwareTypeTrapElements = [];
    return;
  }
  const selector =
    'button:not([disabled]):not([hidden]), [href], input:not([disabled]):not([hidden]), select:not([disabled]):not([hidden]), textarea:not([disabled]):not([hidden]), [tabindex]:not([tabindex="-1"])';
  hardwareTypeTrapElements = Array.from(hardwareTypePickerSurface.querySelectorAll(selector));
}

function focusHardwareTypeOption(option) {
  if (!option) {
    return;
  }
  const options = getHardwareTypeOptionElements();
  options.forEach(opt => {
    opt.tabIndex = opt === option ? 0 : -1;
  });
  hardwareTypeActiveOptionIndex = options.indexOf(option);
  option.focus({ preventScroll: false });
  if (typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' });
  }
}

function focusHardwareTypeDefaultOption() {
  const options = getHardwareTypeOptionElements();
  if (options.length === 0) {
    hardwareTypeActiveOptionIndex = -1;
    return;
  }
  const currentValue = typeof state.hardwareType === 'string' ? state.hardwareType : '';
  const selected = options.find(option => option.dataset.value === currentValue) || options[0];
  focusHardwareTypeOption(selected);
}

function moveHardwareTypeOption(delta) {
  const options = getHardwareTypeOptionElements();
  if (options.length === 0) {
    return;
  }
  let index = hardwareTypeActiveOptionIndex;
  if (index < 0 || index >= options.length) {
    const currentValue = typeof state.hardwareType === 'string' ? state.hardwareType : '';
    index = options.findIndex(option => option.dataset.value === currentValue);
  }
  if (index < 0) {
    index = 0;
  }
  let nextIndex = index + delta;
  if (nextIndex < 0) {
    nextIndex = options.length - 1;
  } else if (nextIndex >= options.length) {
    nextIndex = 0;
  }
  focusHardwareTypeOption(options[nextIndex]);
}

export function openHardwareTypePicker() {
  if (!hardwareTypePickerButton || !hardwareTypePickerSurface) {
    return;
  }
  updateHardwareTypePickerMode();
  const modalRoot = hardwareTypeModalElement;
  if (!modalRoot || hardwareTypePickerOpen) {
    return;
  }
  hardwareTypePickerOpen = true;
  hardwareTypePreviouslyFocusedElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  hardwareTypePickerButton.setAttribute('aria-expanded', 'true');
  document.body.classList.add('part-type-picker-open');

  syncHardwareTypePicker();
  updateHardwareTypeActiveOptionFromDom();
  updateHardwareTypeTrapElements();

  if (hardwareTypePickerMode === 'dialog' && modalRoot instanceof HTMLDialogElement) {
    modalRoot.addEventListener('cancel', handleHardwareTypeDialogCancel);
    if (!modalRoot.open) {
      modalRoot.showModal();
    }
  } else {
    modalRoot.hidden = false;
    modalRoot.classList.add('is-open');
    modalRoot.setAttribute('aria-hidden', 'false');
  }

  if (hardwareTypePickerSearch && !isCoarsePointerDevice()) {
    hardwareTypePickerSearch.focus();
    hardwareTypePickerSearch.select();
  } else {
    if (hardwareTypePickerSearch) {
      hardwareTypePickerSearch.blur();
    }
    focusHardwareTypeDefaultOption();
  }
  updateHardwareTypeTrapElements();
}

export function closeHardwareTypePicker({ focusButton = true } = {}) {
  if (!hardwareTypePickerOpen) {
    return;
  }
  hardwareTypePickerOpen = false;
  if (hardwareTypeSearchTimeoutId) {
    window.clearTimeout(hardwareTypeSearchTimeoutId);
    hardwareTypeSearchTimeoutId = 0;
  }

  if (hardwareTypePickerButton) {
    hardwareTypePickerButton.setAttribute('aria-expanded', 'false');
  }

  const modalRoot = hardwareTypeModalElement || (hardwareTypePickerMode === 'dialog'
    ? hardwareTypePickerDialog
    : hardwareTypePickerFallback);

  if (hardwareTypePickerMode === 'dialog' && modalRoot instanceof HTMLDialogElement) {
    modalRoot.removeEventListener('cancel', handleHardwareTypeDialogCancel);
    if (modalRoot.open) {
      modalRoot.close();
    }
  } else if (modalRoot) {
    modalRoot.classList.remove('is-open');
    modalRoot.hidden = true;
    modalRoot.setAttribute('aria-hidden', 'true');
  }

  document.body.classList.remove('part-type-picker-open');
  hardwareTypeTrapElements = [];
  hardwareTypeActiveOptionIndex = -1;

  if (hardwareTypePickerSearch) {
    hardwareTypePickerSearch.blur();
  }

  const suppressFocusRestore = isCoarsePointerDevice();
  if (suppressFocusRestore) {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
  }

  if (!suppressFocusRestore && focusButton && hardwareTypePickerButton) {
    hardwareTypePickerButton.focus();
  } else if (!suppressFocusRestore && !focusButton && hardwareTypePreviouslyFocusedElement) {
    hardwareTypePreviouslyFocusedElement.focus();
  }
  hardwareTypePreviouslyFocusedElement = null;
  hardwareTypeModalElement = null;
}

function handleHardwareTypeDialogCancel(event) {
  event.preventDefault();
  closeHardwareTypePicker({ focusButton: true });
}

export function handleHardwareTypeFallbackClick(event) {
  if (!hardwareTypePickerOpen) {
    return;
  }
  if (event.target === hardwareTypePickerFallback) {
    event.preventDefault();
    closeHardwareTypePicker({ focusButton: true });
  }
}

function selectHardwareTypeOption(value) {
  if (!hardwareTypeSelect) {
    return;
  }
  const nextValue = typeof value === 'string' ? value.trim() : '';
  if (!nextValue) {
    closeHardwareTypePicker({ focusButton: true });
    return;
  }
  if (hardwareTypeSelect.value !== nextValue) {
    hardwareTypeSelect.value = nextValue;
    hardwareTypeSelect.dispatchEvent(new Event('input', { bubbles: true }));
    hardwareTypeSelect.dispatchEvent(new Event('change', { bubbles: true }));
  }
  closeHardwareTypePicker({ focusButton: true });
}

export function handleHardwareTypeOptionClick(event) {
  if (!hardwareTypePickerOpen) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const option = target.closest('[data-hardware-type-option="true"]');
  if (!option) {
    return;
  }
  event.preventDefault();
  const value = option.dataset.value || '';
  if (value) {
    selectHardwareTypeOption(value);
  }
}

function queueHardwareTypeSearchUpdate(value) {
  if (hardwareTypeSearchTimeoutId) {
    window.clearTimeout(hardwareTypeSearchTimeoutId);
  }
  hardwareTypeSearchTimeoutId = window.setTimeout(() => {
    hardwareTypeSearchTimeoutId = 0;
    setHardwareTypeSearchQuery(value);
    updateHardwareTypeActiveOptionFromDom();
    updateHardwareTypeTrapElements();
  }, HARDWARE_TYPE_SEARCH_DELAY);
}

export function handleHardwareTypeSearchInput() {
  if (!hardwareTypePickerSearch) {
    return;
  }
  queueHardwareTypeSearchUpdate(hardwareTypePickerSearch.value);
}

export function handleHardwareTypeSearchKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    focusHardwareTypeDefaultOption();
  }
}

export function handleHardwareTypeFilterClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const button = target.closest('.part-type-picker__filter');
  if (!button || !hardwareTypePickerFilters || !hardwareTypePickerFilters.contains(button)) {
    return;
  }
  event.preventDefault();
  const category = typeof button.dataset.category === 'string' ? button.dataset.category : '';
  setHardwareTypeFilterCategory(category);
  updateHardwareTypeActiveOptionFromDom();
  updateHardwareTypeTrapElements();
}

export function handleHardwareTypeSurfaceKeydown(event) {
  if (!hardwareTypePickerOpen) {
    return;
  }
  const target = event.target;
  const { key } = event;

  if (key === 'Tab' && hardwareTypeTrapElements.length > 0) {
    const first = hardwareTypeTrapElements[0];
    const last = hardwareTypeTrapElements[hardwareTypeTrapElements.length - 1];
    const active = document.activeElement;
    if (event.shiftKey) {
      if (active === first || !hardwareTypePickerSurface.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last || !hardwareTypePickerSurface.contains(active)) {
      event.preventDefault();
      first.focus();
    }
    return;
  }

  if (key === 'Escape') {
    event.preventDefault();
    closeHardwareTypePicker({ focusButton: true });
    return;
  }

  if (hardwareTypePickerSearch && target === hardwareTypePickerSearch) {
    if (key === 'ArrowDown') {
      event.preventDefault();
      focusHardwareTypeDefaultOption();
    }
    return;
  }

  if (target instanceof HTMLElement && target.dataset.hardwareTypeOption === 'true') {
    if (key === 'ArrowDown' || key === 'ArrowRight') {
      event.preventDefault();
      moveHardwareTypeOption(1);
      return;
    }
    if (key === 'ArrowUp' || key === 'ArrowLeft') {
      event.preventDefault();
      moveHardwareTypeOption(-1);
      return;
    }
    if (key === 'Home') {
      event.preventDefault();
      const options = getHardwareTypeOptionElements();
      if (options.length > 0) {
        focusHardwareTypeOption(options[0]);
      }
      return;
    }
    if (key === 'End') {
      event.preventDefault();
      const options = getHardwareTypeOptionElements();
      if (options.length > 0) {
        focusHardwareTypeOption(options[options.length - 1]);
      }
      return;
    }
    if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
      event.preventDefault();
      selectHardwareTypeOption(target.dataset.value || '');
      return;
    }
  }

  const isEditableTarget =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable);

  if (!isEditableTarget) {
    if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      if (hardwareTypePickerSearch) {
        hardwareTypePickerSearch.focus();
        hardwareTypePickerSearch.select();
        const nextValue = hardwareTypePickerSearch.value + key;
        hardwareTypePickerSearch.value = nextValue;
        const cursor = nextValue.length;
        hardwareTypePickerSearch.setSelectionRange(cursor, cursor);
        queueHardwareTypeSearchUpdate(nextValue);
      }
      return;
    }
    if (key === 'Backspace') {
      event.preventDefault();
      if (hardwareTypePickerSearch) {
        hardwareTypePickerSearch.focus();
        hardwareTypePickerSearch.select();
        const nextValue = hardwareTypePickerSearch.value.slice(0, -1);
        hardwareTypePickerSearch.value = nextValue;
        const cursor = nextValue.length;
        hardwareTypePickerSearch.setSelectionRange(cursor, cursor);
        queueHardwareTypeSearchUpdate(nextValue);
      }
    }
  }
}

export function handleHardwareTypeButtonKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown' || key === 'ArrowUp') {
    event.preventDefault();
    openHardwareTypePicker();
    moveHardwareTypeOption(key === 'ArrowDown' ? 1 : -1);
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    openHardwareTypePicker();
  }
}

export function updateHardwareTypePickerModeExport() {
  updateHardwareTypePickerMode();
}
