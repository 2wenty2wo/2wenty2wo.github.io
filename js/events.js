import { state } from './state.js';
import { elements } from './dom-elements.js';
import {
  applyHardwareTypeSelection,
  populateThreadSizes,
  populateStandards,
  updateGlassOptionVisibility,
  updateConnectorCategoryUi,
  handleCustomImageFile,
  clearCustomImage,
  handleStandardSelectKeydown,
  clearStandardFilter,
  setBoltDriveSelection,
  setBoltHeadSelection,
  syncBoltDrivePicker,
  syncBoltHeadPicker,
  setNutTypeSelection,
  syncNutTypePicker,
} from './forms.js';
import { updatePreview, updateDownloadState, updateQrContentVisibility } from './render.js';
import { downloadLabel, printLabel, shareLabel } from './actions.js';

const {
  hardwareTypeRadios,
  hardwareTypeSelect,
  connectorCategorySelect,
  componentCategoryRadios,
  componentMountRadios,
  bearingTypeSelect,
  systemTypeRadios,
  fuseTypeRadios,
  threadSizeSelect,
  fuseValueSelect,
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

let boltDrivePickerOpen = false;
let boltHeadPickerOpen = false;
let nutTypePickerOpen = false;

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
}

function handleDocumentFocusIn(event) {
  const target = event.target;
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
        updateDownloadState();
        updatePreview();
      }
    });
  });

  componentMountRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        state.componentMount = radio.value;
        updateDownloadState();
        updatePreview();
      }
    });
  });

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

  fuseTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        const previousType = state.fuseType;
        state.fuseType = radio.value;
        const shouldReset = previousType === 'Glass' && state.fuseType !== 'Glass';
        updateGlassOptionVisibility({ resetIfHidden: shouldReset });
        updatePreview();
      }
    });
  });

  if (threadSizeSelect) {
    threadSizeSelect.addEventListener('change', () => {
      state.threadSize = threadSizeSelect.value;
      updateDownloadState();
      updatePreview();
    });
  }

  if (fuseValueSelect) {
    fuseValueSelect.addEventListener('change', () => {
      state.fuseValue = fuseValueSelect.value;
      updateDownloadState();
      updatePreview();
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
  if (boltDrivePicker || boltHeadPicker || nutTypePicker) {
    document.addEventListener('pointerdown', handleDocumentPointer);
    document.addEventListener('focusin', handleDocumentFocusIn);
  }

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
