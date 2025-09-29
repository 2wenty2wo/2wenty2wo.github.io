import { state } from './state.js';
import { elements } from './dom-elements.js';
import {
  applyHardwareTypeSelection,
  populateThreadSizes,
  populateStandards,
  updateConnectorCategoryUi,
  handleCustomImageFile,
  clearCustomImage,
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
  syncHardwareTypePicker,
  setFuseTypeSelection,
  syncFuseTypePicker,
  setFuseValueSelection,
  syncFuseValuePicker,
  setComponentMountSelection,
  setResistorValueSelection,
  updateComponentValueUi,
} from './forms.js';
import { updatePreview, updateDownloadState, updateQrContentVisibility } from './render.js';
import { downloadLabel, printLabel, shareLabel } from './actions.js';

const {
  hardwareTypeRadios,
  hardwareTypeSelect,
  hardwareTypePicker,
  hardwareTypePickerButton,
  hardwareTypePickerList,
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
  bearingTypeSelect,
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
let threadSizePickerOpen = false;
let boltDrivePickerOpen = false;
let boltHeadPickerOpen = false;
let nutTypePickerOpen = false;
let fuseValuePickerOpen = false;
let componentMountPickerOpen = false;
let resistorValuePickerOpen = false;

function getHardwareTypeOptionElements() {
  if (!hardwareTypePickerList) {
    return [];
  }
  return Array.from(hardwareTypePickerList.querySelectorAll('[role="option"]'));
}

function focusHardwareTypeOption(option) {
  if (!option) {
    return;
  }
  const options = getHardwareTypeOptionElements();
  options.forEach(opt => {
    opt.tabIndex = opt === option ? 0 : -1;
  });
  option.focus();
  if (typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' });
  }
}

function openHardwareTypePicker() {
  if (!hardwareTypePicker || !hardwareTypePickerButton || !hardwareTypePickerList) {
    return;
  }
  if (hardwareTypePickerButton.disabled) {
    return;
  }
  if (hardwareTypePickerOpen) {
    return;
  }
  hardwareTypePickerOpen = true;
  hardwareTypePicker.classList.add('is-open');
  hardwareTypePickerList.hidden = false;
  hardwareTypePickerButton.setAttribute('aria-expanded', 'true');
  syncHardwareTypePicker();

  const options = getHardwareTypeOptionElements();
  if (options.length === 0) {
    return;
  }
  const currentValue = typeof state.hardwareType === 'string' ? state.hardwareType : '';
  const selectedOption = options.find(option => option.dataset.value === currentValue);
  focusHardwareTypeOption(selectedOption || options[0]);
}

function closeHardwareTypePicker({ focusButton = false } = {}) {
  if (!hardwareTypePicker || !hardwareTypePickerButton || !hardwareTypePickerList) {
    return;
  }
  if (!hardwareTypePickerOpen) {
    if (focusButton && !hardwareTypePickerButton.disabled) {
      hardwareTypePickerButton.focus();
    }
    return;
  }
  hardwareTypePickerOpen = false;
  hardwareTypePicker.classList.remove('is-open');
  hardwareTypePickerList.hidden = true;
  hardwareTypePickerButton.setAttribute('aria-expanded', 'false');
  if (focusButton && !hardwareTypePickerButton.disabled) {
    hardwareTypePickerButton.focus();
  }
}

function toggleHardwareTypePicker() {
  if (hardwareTypePickerOpen) {
    closeHardwareTypePicker({ focusButton: false });
  } else {
    openHardwareTypePicker();
  }
}

function moveHardwareTypeOption(delta) {
  if (!hardwareTypePickerList) {
    return;
  }
  const options = getHardwareTypeOptionElements();
  if (options.length === 0) {
    return;
  }
  const active = document.activeElement;
  const activeOption = active && hardwareTypePickerList.contains(active)
    ? active.closest('[role="option"]')
    : null;
  let index = activeOption ? options.indexOf(activeOption) : -1;
  if (index === -1) {
    const currentValue = typeof state.hardwareType === 'string' ? state.hardwareType : '';
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
    focusHardwareTypeOption(nextOption);
  }
}

function handleHardwareTypeButtonKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    openHardwareTypePicker();
    moveHardwareTypeOption(1);
    return;
  }
  if (key === 'ArrowUp') {
    event.preventDefault();
    openHardwareTypePicker();
    moveHardwareTypeOption(-1);
    return;
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
    event.preventDefault();
    toggleHardwareTypePicker();
    return;
  }
  if (key === 'Escape' && hardwareTypePickerOpen) {
    event.preventDefault();
    closeHardwareTypePicker({ focusButton: true });
  }
}

function handleHardwareTypeListKeydown(event) {
  const { key } = event;
  if (key === 'ArrowDown') {
    event.preventDefault();
    moveHardwareTypeOption(1);
    return;
  }
  if (key === 'ArrowUp') {
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
    const target = event.target;
    if (target && target instanceof HTMLElement) {
      const option = target.closest('[role="option"]');
      if (option) {
        applyHardwareTypeSelection(option.dataset.value || '');
        closeHardwareTypePicker({ focusButton: true });
      }
    }
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    closeHardwareTypePicker({ focusButton: true });
    return;
  }
  if (key === 'Tab') {
    closeHardwareTypePicker();
  }
}

function handleHardwareTypeListClick(event) {
  if (!hardwareTypePickerList) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const option = target.closest('[role="option"]');
  if (!option || !hardwareTypePickerList.contains(option)) {
    return;
  }
  event.preventDefault();
  applyHardwareTypeSelection(option.dataset.value || '');
  closeHardwareTypePicker({ focusButton: true });
}

function handleHardwareTypeListFocusOut() {
  if (!hardwareTypePickerOpen) {
    return;
  }
  setTimeout(() => {
    if (!hardwareTypePickerOpen) {
      return;
    }
    if (!hardwareTypePicker) {
      closeHardwareTypePicker();
      return;
    }
    const active = document.activeElement;
    if (!active || !hardwareTypePicker.contains(active)) {
      closeHardwareTypePicker();
    }
  }, 0);
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

function handleDocumentPointer(event) {
  const target = event.target;
  if (hardwareTypePickerOpen && hardwareTypePicker) {
    if (!(target instanceof Node) || !hardwareTypePicker.contains(target)) {
      closeHardwareTypePicker();
    }
  }
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
}

function handleDocumentFocusIn(event) {
  const target = event.target;
  if (hardwareTypePickerOpen && hardwareTypePicker) {
    if (!(target instanceof Node) || !hardwareTypePicker.contains(target)) {
      closeHardwareTypePicker();
    }
  }
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

  if (hardwareTypePickerButton && hardwareTypePickerList) {
    hardwareTypePickerButton.addEventListener('click', event => {
      event.preventDefault();
      toggleHardwareTypePicker();
    });
    hardwareTypePickerButton.addEventListener('keydown', handleHardwareTypeButtonKeydown);
    hardwareTypePickerList.addEventListener('click', handleHardwareTypeListClick);
    hardwareTypePickerList.addEventListener('keydown', handleHardwareTypeListKeydown);
    hardwareTypePickerList.addEventListener('focusout', handleHardwareTypeListFocusOut);
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

  if (bearingTypeSelect) {
    bearingTypeSelect.addEventListener('change', () => {
      const value = bearingTypeSelect.value;
      const selectedOption = bearingTypeSelect.selectedOptions[0];
      state.bearingType = value;
      state.bearingDetails =
        selectedOption && selectedOption.dataset.description
          ? selectedOption.dataset.description
          : '';
      updateDownloadState();
      updatePreview();
    });
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
  if (
    hardwareTypePicker ||
    fuseTypePicker ||
    threadSizePicker ||
    boltDrivePicker ||
    boltHeadPicker ||
    nutTypePicker ||
    fuseValuePicker ||
    componentMountPicker ||
    resistorValuePicker
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
