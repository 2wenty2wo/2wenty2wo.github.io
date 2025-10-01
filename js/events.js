import { state } from './state.js';
import { elements } from './dom-elements.js';
import {
  applyHardwareTypeSelection,
  populateThreadSizes,
  populateStandards,
  updateConnectorCategoryUi,
  handleCustomImageFile,
  clearCustomImage,
  setCustomGraphicSource,
  setCustomIconStyle,
  setCustomIconSelection,
  refreshCustomIconOptions,
  handleStandardSelectKeydown,
  clearStandardFilter,
  setThreadSizeSelection,
  syncThreadSizePicker,
  setBoltDriveSelection,
  setBoltHeadSelection,
  syncBoltDrivePicker,
  syncBoltHeadPicker,
  setNutTypeSelection,
  syncNutTypePicker,
  setWasherTypeSelection,
  syncWasherTypePicker,
  syncHardwareTypePicker,
  setHardwareTypeFilterCategory,
  setHardwareTypeSearchQuery,
  getHardwareTypePickerMode,
  setFuseTypeSelection,
  syncFuseTypePicker,
  setFuseValueSelection,
  syncFuseValuePicker,
  setComponentMountSelection,
  setResistorValueSelection,
  setCapacitorValueSelection,
  setDiodeValueSelection,
  updateComponentValueUi,
  setBearingTypeSelection,
  syncBearingTypePicker,
} from './forms.js';
import { updatePreview, updateDownloadState, updateQrContentVisibility } from './render.js';
import { downloadLabel, printLabel, shareLabel } from './actions.js';

const {
  hardwareTypeRadios,
  hardwareTypeSelect,
  hardwareTypePicker,
  hardwareTypePickerButton,
  hardwareTypePickerDialog,
  hardwareTypePickerFallback,
  hardwareTypePickerSurface,
  hardwareTypePickerCloseButton,
  hardwareTypePickerSearch,
  hardwareTypePickerFilters,
  connectorCategorySelect,
  componentCategoryRadios,
  componentMountSelect,
  componentMountPicker,
  componentMountPickerButton,
  componentMountPickerList,
  resistorValueSelect,
  resistorValuePicker,
  resistorValuePickerButton,
  resistorValuePickerList,
  capacitorValueSelect,
  capacitorValuePicker,
  capacitorValuePickerButton,
  capacitorValuePickerList,
  diodeValueSelect,
  diodeValuePicker,
  diodeValuePickerButton,
  diodeValuePickerList,
  bearingTypeSelect,
  bearingTypePicker,
  bearingTypePickerButton,
  bearingTypePickerList,
  systemTypeRadios,
  fuseTypeSelect,
  fuseTypePicker,
  fuseTypePickerButton,
  fuseTypePickerList,
  threadSizeSelect,
  threadSizePicker,
  threadSizePickerButton,
  threadSizePickerList,
  fuseValueSelect,
  fuseValuePicker,
  fuseValuePickerButton,
  fuseValuePickerList,
  glassSlowBlowCheckbox,
  glassFastBlowCheckbox,
  glassSizeSelect,
  lengthInput,
  notesInput,
  customGraphicSourceRadios,
  customIconStyleSelect,
  customIconSearchInput,
  customIconSelect,
  customIconPicker,
  customIconPickerButton,
  customIconPickerList,
  customLine1Input,
  customLine2Input,
  customImageInput,
  customImageClearButton,
  boltHeadSelect,
  boltHeadPicker,
  boltHeadPickerButton,
  boltHeadPickerList,
  boltDriveSelect,
  boltDrivePicker,
  boltDrivePickerButton,
  boltDrivePickerList,
  nutTypeSelect,
  nutTypePicker,
  nutTypePickerButton,
  nutTypePickerList,
  washerTypeSelect,
  washerTypePicker,
  washerTypePickerButton,
  washerTypePickerList,
  standardSelect,
  standardToggle,
  imageToggle,
  qrcodeToggle,
  qrContentInput,
  widthRange,
  widthValueSpan,
  heightRadios,
  downloadButton,
  shareButton,
  printButton,
} = elements;

let hardwareTypePickerOpen = false;
let fuseTypePickerOpen = false;

const coarsePointerMediaQuery =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(hover: none) and (pointer: coarse)')
    : null;

function isCoarsePointerDevice() {
  return Boolean(coarsePointerMediaQuery && coarsePointerMediaQuery.matches);
}
let threadSizePickerOpen = false;
let boltDrivePickerOpen = false;
let boltHeadPickerOpen = false;
let nutTypePickerOpen = false;
let washerTypePickerOpen = false;
let fuseValuePickerOpen = false;
let componentMountPickerOpen = false;
let resistorValuePickerOpen = false;
let capacitorValuePickerOpen = false;
let diodeValuePickerOpen = false;
let bearingTypePickerOpen = false;
let customIconPickerOpen = false;

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

function openHardwareTypePicker() {
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

function closeHardwareTypePicker({ focusButton = true } = {}) {
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

function handleHardwareTypeFallbackClick(event) {
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

function handleHardwareTypeOptionClick(event) {
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

function handleHardwareTypeSearchInput() {
  if (!hardwareTypePickerSearch) {
    return;
  }
  queueHardwareTypeSearchUpdate(hardwareTypePickerSearch.value);
}

function handleHardwareTypeSearchKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    focusHardwareTypeDefaultOption();
  }
}

function handleHardwareTypeFilterClick(event) {
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

function handleHardwareTypeSurfaceKeydown(event) {
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

function handleHardwareTypeButtonKeydown(event) {
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
          style: option.dataset.style || (customIconStyleSelect ? customIconStyleSelect.value : undefined),
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
    style: option.dataset.style || (customIconStyleSelect ? customIconStyleSelect.value : undefined),
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

function handleDocumentPointer(event) {
  const target = event.target;
  if (fuseTypePickerOpen && fuseTypePicker) {
    if (!(target instanceof Node) || !fuseTypePicker.contains(target)) {
      closeFuseTypePicker();
    }
  }
  if (threadSizePickerOpen && threadSizePicker) {
    if (!(target instanceof Node) || !threadSizePicker.contains(target)) {
      closeThreadSizePicker();
    }
  }
  if (boltDrivePickerOpen && boltDrivePicker) {
    if (!(target instanceof Node) || !boltDrivePicker.contains(target)) {
      closeBoltDrivePicker();
    }
  }
  if (boltHeadPickerOpen && boltHeadPicker) {
    if (!(target instanceof Node) || !boltHeadPicker.contains(target)) {
      closeBoltHeadPicker();
    }
  }
  if (nutTypePickerOpen && nutTypePicker) {
    if (!(target instanceof Node) || !nutTypePicker.contains(target)) {
      closeNutTypePicker();
    }
  }
  if (washerTypePickerOpen && washerTypePicker) {
    if (!(target instanceof Node) || !washerTypePicker.contains(target)) {
      closeWasherTypePicker();
    }
  }
  if (fuseValuePickerOpen && fuseValuePicker) {
    if (!(target instanceof Node) || !fuseValuePicker.contains(target)) {
      closeFuseValuePicker();
    }
  }
  if (componentMountPickerOpen && componentMountPicker) {
    if (!(target instanceof Node) || !componentMountPicker.contains(target)) {
      closeComponentMountPicker();
    }
  }
  if (resistorValuePickerOpen && resistorValuePicker) {
    if (!(target instanceof Node) || !resistorValuePicker.contains(target)) {
      closeResistorValuePicker();
    }
  }
  if (capacitorValuePickerOpen && capacitorValuePicker) {
    if (!(target instanceof Node) || !capacitorValuePicker.contains(target)) {
      closeCapacitorValuePicker();
    }
  }
  if (diodeValuePickerOpen && diodeValuePicker) {
    if (!(target instanceof Node) || !diodeValuePicker.contains(target)) {
      closeDiodeValuePicker();
    }
  }
  if (bearingTypePickerOpen && bearingTypePicker) {
    if (!(target instanceof Node) || !bearingTypePicker.contains(target)) {
      closeBearingTypePicker();
    }
  }
  if (customIconPickerOpen && customIconPicker) {
    if (!(target instanceof Node) || !customIconPicker.contains(target)) {
      closeCustomIconPicker();
    }
  }
}

function handleDocumentFocusIn(event) {
  const target = event.target;
  if (fuseTypePickerOpen && fuseTypePicker) {
    if (!(target instanceof Node) || !fuseTypePicker.contains(target)) {
      closeFuseTypePicker();
    }
  }
  if (threadSizePickerOpen && threadSizePicker) {
    if (!(target instanceof Node) || !threadSizePicker.contains(target)) {
      closeThreadSizePicker();
    }
  }
  if (boltDrivePickerOpen && boltDrivePicker) {
    if (!(target instanceof Node) || !boltDrivePicker.contains(target)) {
      closeBoltDrivePicker();
    }
  }
  if (boltHeadPickerOpen && boltHeadPicker) {
    if (!(target instanceof Node) || !boltHeadPicker.contains(target)) {
      closeBoltHeadPicker();
    }
  }
  if (nutTypePickerOpen && nutTypePicker) {
    if (!(target instanceof Node) || !nutTypePicker.contains(target)) {
      closeNutTypePicker();
    }
  }
  if (fuseValuePickerOpen && fuseValuePicker) {
    if (!(target instanceof Node) || !fuseValuePicker.contains(target)) {
      closeFuseValuePicker();
    }
  }
  if (componentMountPickerOpen && componentMountPicker) {
    if (!(target instanceof Node) || !componentMountPicker.contains(target)) {
      closeComponentMountPicker();
    }
  }
  if (resistorValuePickerOpen && resistorValuePicker) {
    if (!(target instanceof Node) || !resistorValuePicker.contains(target)) {
      closeResistorValuePicker();
    }
  }
  if (capacitorValuePickerOpen && capacitorValuePicker) {
    if (!(target instanceof Node) || !capacitorValuePicker.contains(target)) {
      closeCapacitorValuePicker();
    }
  }
  if (diodeValuePickerOpen && diodeValuePicker) {
    if (!(target instanceof Node) || !diodeValuePicker.contains(target)) {
      closeDiodeValuePicker();
    }
  }
  if (bearingTypePickerOpen && bearingTypePicker) {
    if (!(target instanceof Node) || !bearingTypePicker.contains(target)) {
      closeBearingTypePicker();
    }
  }
  if (customIconPickerOpen && customIconPicker) {
    if (!(target instanceof Node) || !customIconPicker.contains(target)) {
      closeCustomIconPicker();
    }
  }
}

export function initEventHandlers() {
  hardwareTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        applyHardwareTypeSelection(radio.value);
      }
    });
  });

  if (hardwareTypeSelect) {
    const handleSelectChange = () => {
      applyHardwareTypeSelection(hardwareTypeSelect.value);
    };
    hardwareTypeSelect.addEventListener('change', handleSelectChange);
    hardwareTypeSelect.addEventListener('input', handleSelectChange);
  }

  updateHardwareTypePickerMode();

  if (hardwareTypePickerButton) {
    hardwareTypePickerButton.addEventListener('click', event => {
      event.preventDefault();
      openHardwareTypePicker();
    });
    hardwareTypePickerButton.addEventListener('keydown', handleHardwareTypeButtonKeydown);
  }

  if (hardwareTypePickerCloseButton) {
    hardwareTypePickerCloseButton.addEventListener('click', event => {
      event.preventDefault();
      closeHardwareTypePicker({ focusButton: true });
    });
  }

  if (hardwareTypePickerSearch) {
    hardwareTypePickerSearch.addEventListener('input', handleHardwareTypeSearchInput);
    hardwareTypePickerSearch.addEventListener('keydown', handleHardwareTypeSearchKeydown);
  }

  if (hardwareTypePickerFilters) {
    hardwareTypePickerFilters.addEventListener('click', handleHardwareTypeFilterClick);
  }

  if (hardwareTypePickerSurface) {
    hardwareTypePickerSurface.addEventListener('keydown', handleHardwareTypeSurfaceKeydown);
    hardwareTypePickerSurface.addEventListener('click', handleHardwareTypeOptionClick);
  }

  if (hardwareTypePickerFallback) {
    hardwareTypePickerFallback.addEventListener('click', handleHardwareTypeFallbackClick);
  }

  if (fuseTypePickerButton && fuseTypePickerList) {
    fuseTypePickerButton.addEventListener('click', event => {
      event.preventDefault();
      toggleFuseTypePicker();
    });
    fuseTypePickerButton.addEventListener('keydown', handleFuseTypeButtonKeydown);
    fuseTypePickerList.addEventListener('click', handleFuseTypeListClick);
    fuseTypePickerList.addEventListener('keydown', handleFuseTypeListKeydown);
    fuseTypePickerList.addEventListener('focusout', handleFuseTypeListFocusOut);
  }

  if (threadSizePickerButton && threadSizePickerList) {
    threadSizePickerButton.addEventListener('click', event => {
      event.preventDefault();
      toggleThreadSizePicker();
    });
    threadSizePickerButton.addEventListener('keydown', handleThreadSizeButtonKeydown);
    threadSizePickerList.addEventListener('click', handleThreadSizeListClick);
    threadSizePickerList.addEventListener('keydown', handleThreadSizeListKeydown);
    threadSizePickerList.addEventListener('focusout', handleThreadSizeListFocusOut);
  }

  if (fuseValuePickerButton && fuseValuePickerList) {
    fuseValuePickerButton.addEventListener('click', event => {
      event.preventDefault();
      toggleFuseValuePicker();
    });
    fuseValuePickerButton.addEventListener('keydown', handleFuseValueButtonKeydown);
    fuseValuePickerList.addEventListener('click', handleFuseValueListClick);
    fuseValuePickerList.addEventListener('keydown', handleFuseValueListKeydown);
    fuseValuePickerList.addEventListener('focusout', handleFuseValueListFocusOut);
  }

  if (connectorCategorySelect) {
    connectorCategorySelect.addEventListener('change', () => {
      state.connectorCategory = connectorCategorySelect.value;
      updateConnectorCategoryUi();
      populateStandards();
      updateDownloadState();
      updatePreview();
    });
  }

  componentCategoryRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        state.componentCategory = radio.value;
        updateComponentValueUi({ resetIfHidden: true });
        updateDownloadState();
        updatePreview();
      }
    });
  });

  if (componentMountSelect) {
    componentMountSelect.addEventListener('change', () => {
      setComponentMountSelection(componentMountSelect.value);
    });
  }

  if (componentMountPickerButton && componentMountPickerList) {
    componentMountPickerButton.addEventListener('click', event => {
      event.preventDefault();
      toggleComponentMountPicker();
    });
    componentMountPickerButton.addEventListener('keydown', handleComponentMountButtonKeydown);
    componentMountPickerList.addEventListener('click', handleComponentMountListClick);
    componentMountPickerList.addEventListener('keydown', handleComponentMountListKeydown);
    componentMountPickerList.addEventListener('focusout', handleComponentMountListFocusOut);
  }

  if (resistorValueSelect) {
    resistorValueSelect.addEventListener('change', () => {
      setResistorValueSelection(resistorValueSelect.value);
    });
  }

  if (resistorValuePickerButton && resistorValuePickerList) {
    resistorValuePickerButton.addEventListener('click', event => {
      event.preventDefault();
      toggleResistorValuePicker();
    });
    resistorValuePickerButton.addEventListener('keydown', handleResistorValueButtonKeydown);
    resistorValuePickerList.addEventListener('click', handleResistorValueListClick);
    resistorValuePickerList.addEventListener('keydown', handleResistorValueListKeydown);
    resistorValuePickerList.addEventListener('focusout', handleResistorValueListFocusOut);
  }

  if (diodeValueSelect) {
    diodeValueSelect.addEventListener('change', () => {
      setDiodeValueSelection(diodeValueSelect.value);
    });
  }

  if (diodeValuePickerButton && diodeValuePickerList) {
    diodeValuePickerButton.addEventListener('click', event => {
      event.preventDefault();
      toggleDiodeValuePicker();
    });
    diodeValuePickerButton.addEventListener('keydown', handleDiodeValueButtonKeydown);
    diodeValuePickerList.addEventListener('click', handleDiodeValueListClick);
    diodeValuePickerList.addEventListener('keydown', handleDiodeValueListKeydown);
    diodeValuePickerList.addEventListener('focusout', handleDiodeValueListFocusOut);
  }

  if (capacitorValueSelect) {
    capacitorValueSelect.addEventListener('change', () => {
      setCapacitorValueSelection(capacitorValueSelect.value);
    });
  }

  if (capacitorValuePickerButton && capacitorValuePickerList) {
    capacitorValuePickerButton.addEventListener('click', event => {
      event.preventDefault();
      toggleCapacitorValuePicker();
    });
    capacitorValuePickerButton.addEventListener('keydown', handleCapacitorValueButtonKeydown);
    capacitorValuePickerList.addEventListener('click', handleCapacitorValueListClick);
    capacitorValuePickerList.addEventListener('keydown', handleCapacitorValueListKeydown);
    capacitorValuePickerList.addEventListener('focusout', handleCapacitorValueListFocusOut);
  }

  if (bearingTypeSelect) {
    bearingTypeSelect.addEventListener('change', () => {
      setBearingTypeSelection(bearingTypeSelect.value);
    });
  }

  if (bearingTypePickerButton && bearingTypePickerList) {
    bearingTypePickerButton.addEventListener('click', event => {
      event.preventDefault();
      toggleBearingTypePicker();
    });
    bearingTypePickerButton.addEventListener('keydown', handleBearingTypeButtonKeydown);
    bearingTypePickerList.addEventListener('click', handleBearingTypeListClick);
    bearingTypePickerList.addEventListener('keydown', handleBearingTypeListKeydown);
    bearingTypePickerList.addEventListener('focusout', handleBearingTypeListFocusOut);
  }

  systemTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        state.systemType = radio.value;
        populateThreadSizes();
      }
    });
  });

  if (fuseTypeSelect) {
    fuseTypeSelect.addEventListener('change', () => {
      setFuseTypeSelection(fuseTypeSelect.value);
    });
  }

  if (threadSizeSelect) {
    threadSizeSelect.addEventListener('change', () => {
      setThreadSizeSelection(threadSizeSelect.value);
    });
  }

  if (fuseValueSelect) {
    fuseValueSelect.addEventListener('change', () => {
      setFuseValueSelection(fuseValueSelect.value);
    });
  }

  if (glassSlowBlowCheckbox) {
    glassSlowBlowCheckbox.addEventListener('change', () => {
      if (!glassSlowBlowCheckbox.checked) {
        if (!glassFastBlowCheckbox || !glassFastBlowCheckbox.checked) {
          state.glassSpeed = '';
        }
      } else {
        state.glassSpeed = 'Slow Blow (Time Delay)';
        if (glassFastBlowCheckbox) {
          glassFastBlowCheckbox.checked = false;
        }
      }
      updatePreview();
    });
  }

  if (glassFastBlowCheckbox) {
    glassFastBlowCheckbox.addEventListener('change', () => {
      if (!glassFastBlowCheckbox.checked) {
        if (!glassSlowBlowCheckbox || !glassSlowBlowCheckbox.checked) {
          state.glassSpeed = '';
        }
      } else {
        state.glassSpeed = 'Fast Blow';
        if (glassSlowBlowCheckbox) {
          glassSlowBlowCheckbox.checked = false;
        }
      }
      updatePreview();
    });
  }

  if (glassSizeSelect) {
    glassSizeSelect.addEventListener('change', () => {
      state.glassSize = glassSizeSelect.value;
      updatePreview();
    });
  }

  if (lengthInput) {
    lengthInput.addEventListener('input', () => {
      const v = lengthInput.value;
      state.length = v.trim();
      updateDownloadState();
      updatePreview();
    });
  }

  if (notesInput) {
    notesInput.addEventListener('input', () => {
      state.notes = notesInput.value.trim();
      updateDownloadState();
      updatePreview();
    });
  }

  if (customLine1Input) {
    customLine1Input.addEventListener('input', () => {
      state.customLine1 = customLine1Input.value;
      updateDownloadState();
      updatePreview();
    });
  }

  if (customLine2Input) {
    customLine2Input.addEventListener('input', () => {
      state.customLine2 = customLine2Input.value;
      updatePreview();
    });
  }

  if (Array.isArray(customGraphicSourceRadios)) {
    customGraphicSourceRadios.forEach(radio => {
      if (!radio) {
        return;
      }
      radio.addEventListener('change', () => {
        if (radio.checked) {
          setCustomGraphicSource(radio.value);
        }
      });
    });
  }

  if (customIconStyleSelect) {
    customIconStyleSelect.addEventListener('change', () => {
      setCustomIconStyle(customIconStyleSelect.value);
    });
  }

  if (customIconSearchInput) {
    let iconSearchTimeoutId = 0;
    const scheduleIconSearch = () => {
      if (typeof window !== 'undefined' && typeof window.clearTimeout === 'function' && typeof window.setTimeout === 'function') {
        if (iconSearchTimeoutId) {
          window.clearTimeout(iconSearchTimeoutId);
        }
        iconSearchTimeoutId = window.setTimeout(() => {
          refreshCustomIconOptions({ preserveSelection: true });
        }, 120);
      } else {
        refreshCustomIconOptions({ preserveSelection: true });
      }
    };
    customIconSearchInput.addEventListener('input', scheduleIconSearch);
  }

  if (customIconSelect) {
    customIconSelect.addEventListener('change', () => {
      const selected = customIconSelect.selectedOptions[0];
      if (!selected) {
        setCustomIconSelection({ name: '', unicode: '', label: '', style: customIconStyleSelect ? customIconStyleSelect.value : undefined });
        closeCustomIconPicker();
        return;
      }
      setCustomIconSelection({
        name: selected.value,
        unicode: selected.dataset.unicode || '',
        label: selected.dataset.label || selected.textContent || selected.value,
        style: selected.dataset.style || (customIconStyleSelect ? customIconStyleSelect.value : undefined),
      });
      closeCustomIconPicker();
    });
  }

  if (customImageInput) {
    customImageInput.addEventListener('change', () => {
      const file =
        customImageInput.files && customImageInput.files[0] ? customImageInput.files[0] : null;
      handleCustomImageFile(file);
    });
  }

  if (customImageClearButton) {
    customImageClearButton.addEventListener('click', () => {
      clearCustomImage();
    });
  }

  if (standardSelect) {
    standardSelect.addEventListener('change', () => {
      const selectedOption = standardSelect.selectedOptions[0];
      if (selectedOption && selectedOption.value) {
        const displayName = selectedOption.dataset.name || selectedOption.textContent;
        state.standard = displayName;
        state.standardCode = selectedOption.value;
      } else {
        state.standard = '';
        state.standardCode = '';
      }
      updateDownloadState();
      updatePreview();
    });
    standardSelect.addEventListener('keydown', handleStandardSelectKeydown);
    standardSelect.addEventListener('blur', clearStandardFilter);
  }

  if (nutTypeSelect) {
    nutTypeSelect.addEventListener('change', () => {
      setNutTypeSelection(nutTypeSelect.value);
    });
  }
  if (washerTypeSelect) {
    washerTypeSelect.addEventListener('change', () => {
      setWasherTypeSelection(washerTypeSelect.value);
    });
  }

  if (boltHeadSelect) {
    boltHeadSelect.addEventListener('change', () => {
      setBoltHeadSelection(boltHeadSelect.value);
    });
  }

  if (boltDriveSelect) {
    boltDriveSelect.addEventListener('change', () => {
      setBoltDriveSelection(boltDriveSelect.value);
    });
  }

  if (boltHeadPickerButton && boltHeadPickerList) {
    boltHeadPickerButton.addEventListener('click', event => {
      event.preventDefault();
      toggleBoltHeadPicker();
    });
    boltHeadPickerButton.addEventListener('keydown', handleBoltHeadButtonKeydown);
    boltHeadPickerList.addEventListener('click', handleBoltHeadListClick);
    boltHeadPickerList.addEventListener('keydown', handleBoltHeadListKeydown);
    boltHeadPickerList.addEventListener('focusout', handleBoltHeadListFocusOut);
  }
  if (boltDrivePickerButton && boltDrivePickerList) {
    boltDrivePickerButton.addEventListener('click', event => {
      event.preventDefault();
      toggleBoltDrivePicker();
    });
    boltDrivePickerButton.addEventListener('keydown', handleBoltDriveButtonKeydown);
    boltDrivePickerList.addEventListener('click', handleBoltDriveListClick);
    boltDrivePickerList.addEventListener('keydown', handleBoltDriveListKeydown);
    boltDrivePickerList.addEventListener('focusout', handleBoltDriveListFocusOut);
  }
  if (nutTypePickerButton && nutTypePickerList) {
    nutTypePickerButton.addEventListener('click', event => {
      event.preventDefault();
      toggleNutTypePicker();
    });
    nutTypePickerButton.addEventListener('keydown', handleNutTypeButtonKeydown);
    nutTypePickerList.addEventListener('click', handleNutTypeListClick);
    nutTypePickerList.addEventListener('keydown', handleNutTypeListKeydown);
    nutTypePickerList.addEventListener('focusout', handleNutTypeListFocusOut);
  }
  if (washerTypePickerButton && washerTypePickerList) {
    washerTypePickerButton.addEventListener('click', event => {
      event.preventDefault();
      toggleWasherTypePicker();
    });
    washerTypePickerButton.addEventListener('keydown', handleWasherTypeButtonKeydown);
    washerTypePickerList.addEventListener('click', handleWasherTypeListClick);
    washerTypePickerList.addEventListener('keydown', handleWasherTypeListKeydown);
    washerTypePickerList.addEventListener('focusout', handleWasherTypeListFocusOut);
  }
  if (customIconPickerButton && customIconPickerList) {
    customIconPickerButton.addEventListener('click', event => {
      event.preventDefault();
      toggleCustomIconPicker();
    });
    customIconPickerButton.addEventListener('keydown', handleCustomIconButtonKeydown);
    customIconPickerList.addEventListener('click', handleCustomIconListClick);
    customIconPickerList.addEventListener('keydown', handleCustomIconListKeydown);
    customIconPickerList.addEventListener('focusout', handleCustomIconListFocusOut);
  }
  if (
    hardwareTypePicker ||
    fuseTypePicker ||
    threadSizePicker ||
    boltDrivePicker ||
    boltHeadPicker ||
    nutTypePicker ||
    washerTypePicker ||
    fuseValuePicker ||
    componentMountPicker ||
    resistorValuePicker ||
    capacitorValuePicker ||
    diodeValuePicker ||
    bearingTypePicker ||
    customIconPicker
  ) {
    document.addEventListener('pointerdown', handleDocumentPointer);
    document.addEventListener('focusin', handleDocumentFocusIn);
  }

  document.addEventListener('gridfinity:fuse-picker-close', () => {
    closeFuseTypePicker();
    closeFuseValuePicker();
  });

  document.addEventListener('gridfinity:component-picker-close', () => {
    closeComponentMountPicker();
    closeResistorValuePicker();
    closeCapacitorValuePicker();
  });

  document.addEventListener('gridfinity:custom-icon-picker-close', () => {
    closeCustomIconPicker();
  });

  if (standardToggle) {
    standardToggle.addEventListener('change', () => {
      state.showStandard = standardToggle.checked;
      updatePreview();
    });
  }

  if (imageToggle) {
    imageToggle.addEventListener('change', () => {
      state.showImage = imageToggle.checked;
      updatePreview();
    });
  }

  if (qrcodeToggle) {
    qrcodeToggle.addEventListener('change', () => {
      state.showQr = qrcodeToggle.checked;
      updateQrContentVisibility({ focus: state.showQr });
      updatePreview();
    });
  }

  if (qrContentInput) {
    qrContentInput.addEventListener('input', () => {
      state.qrContent = qrContentInput.value.trim();
      updatePreview();
    });
  }

  if (widthRange) {
    widthRange.addEventListener('input', () => {
      state.widthMm = parseInt(widthRange.value, 10);
      if (widthValueSpan) {
        widthValueSpan.textContent = state.widthMm;
      }
      updatePreview();
    });
  }

  heightRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        state.heightMm = parseInt(radio.value, 10);
        updatePreview();
      }
    });
  });

  if (downloadButton) {
    downloadButton.addEventListener('click', downloadLabel);
  }
  if (shareButton) {
    shareButton.addEventListener('click', () => {
      void shareLabel();
    });
  }
  if (printButton) {
    printButton.addEventListener('click', printLabel);
  }
}
