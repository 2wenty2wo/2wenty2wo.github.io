import { state } from './state.js';
import { elements } from './dom-elements.js';
import {
  metricThreadSizes,
  imperialThreadSizes,
  electricalComponentTypes,
  hardwareImageFolders,
} from './data.js';
import { updatePreview, updateDownloadState } from './render.js';

const {
  threadSizeSelect,
  threadSizePicker,
  threadSizePickerButton,
  threadSizePickerList,
} = elements;

const THREAD_SIZE_PLACEHOLDER_TEXT = '\u00a0';
// Non-breaking space preserves control height without visible placeholder text.
const THREAD_SIZE_NOT_APPLICABLE_TEXT = 'Not applicable';

let validThreadSizes = new Set();
const ELECTRICAL_COMPONENT_TYPES = new Set(electricalComponentTypes);

function updateThreadSizePickerIcon() {
  if (!threadSizePickerButton) {
    return;
  }
  const iconWrapper = threadSizePickerButton.querySelector('.bolt-drive-picker__current-icon');
  const iconImage = threadSizePickerButton.querySelector('.bolt-drive-picker__current-icon-image');
  if (!iconWrapper || !iconImage) {
    return;
  }

  const folder = hardwareImageFolders[state.hardwareType];
  const shouldShowIcon = Boolean(folder) && !threadSizePickerButton.disabled;

  if (shouldShowIcon) {
    iconImage.src = `images/${folder}/thread_size.svg`;
    iconImage.hidden = false;
    iconWrapper.classList.remove('is-empty');
  } else {
    iconImage.hidden = true;
    iconImage.src = '';
    iconWrapper.classList.add('is-empty');
  }
}

function updateThreadSizePickerLabel(text) {
  if (!threadSizePickerButton) {
    return;
  }
  const label = threadSizePickerButton.querySelector('.bolt-drive-picker__current-label');
  if (label) {
    label.textContent = text;
  }
  updateThreadSizePickerIcon();
}

function buildThreadSizeOptionItem(value) {
  if (!threadSizePickerList) {
    return;
  }
  const item = document.createElement('li');
  item.className = 'bolt-drive-picker__option';
  item.dataset.value = value;
  item.setAttribute('role', 'option');
  item.tabIndex = -1;
  item.setAttribute('aria-selected', 'false');

  const icon = document.createElement('span');
  icon.className = 'bolt-drive-picker__option-icon is-empty';
  icon.setAttribute('aria-hidden', 'true');
  item.appendChild(icon);

  const label = document.createElement('span');
  label.className = 'bolt-drive-picker__option-label';
  label.textContent = value;
  item.appendChild(label);

  threadSizePickerList.appendChild(item);
}

export function syncThreadSizePicker({ isValid = true } = {}) {
  if (!threadSizeSelect) {
    return;
  }

  const currentValue = typeof state.threadSize === 'string' ? state.threadSize.trim() : '';
  const sanitizedValue = validThreadSizes.has(currentValue) ? currentValue : '';

  if (sanitizedValue !== currentValue) {
    state.threadSize = sanitizedValue;
  }

  threadSizeSelect.value = sanitizedValue;
  if (!sanitizedValue && threadSizeSelect.options.length > 0) {
    threadSizeSelect.selectedIndex = 0;
  }

  if (threadSizePickerButton) {
    const labelText = threadSizePickerButton.disabled
      ? THREAD_SIZE_NOT_APPLICABLE_TEXT
      : sanitizedValue || THREAD_SIZE_PLACEHOLDER_TEXT;
    updateThreadSizePickerLabel(labelText);

    if (isValid) {
      threadSizePickerButton.classList.remove('is-invalid');
      threadSizePickerButton.removeAttribute('aria-invalid');
    } else {
      threadSizePickerButton.classList.add('is-invalid');
      threadSizePickerButton.setAttribute('aria-invalid', 'true');
    }
  }

  if (threadSizePicker) {
    threadSizePicker.classList.toggle('is-invalid', !isValid);
  }

  if (threadSizePickerList) {
    const optionElements = Array.from(
      threadSizePickerList.querySelectorAll('[role="option"]'),
    );
    optionElements.forEach(optionElement => {
      const isSelected = optionElement.dataset.value === sanitizedValue;
      optionElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      optionElement.classList.toggle('is-selected', isSelected);
      optionElement.tabIndex = -1;
    });
  }
}

export function setThreadSizeSelection(nextValue, { triggerUpdate = true } = {}) {
  const desiredValue = typeof nextValue === 'string' ? nextValue.trim() : '';
  const sanitizedValue = desiredValue && validThreadSizes.has(desiredValue) ? desiredValue : '';
  const previousValue = typeof state.threadSize === 'string' ? state.threadSize : '';

  state.threadSize = sanitizedValue;
  syncThreadSizePicker({ isValid: true });

  if (triggerUpdate && previousValue !== sanitizedValue) {
    updateDownloadState();
    updatePreview();
  }
}

export function populateThreadSizes() {
  if (
    state.hardwareType === 'Fuse' ||
    state.hardwareType === 'Connector' ||
    state.hardwareType === 'Custom' ||
    state.hardwareType === 'Bearing' ||
    ELECTRICAL_COMPONENT_TYPES.has(state.hardwareType)
  ) {
    validThreadSizes = new Set();
    if (threadSizeSelect) {
      threadSizeSelect.innerHTML = '';
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = THREAD_SIZE_NOT_APPLICABLE_TEXT;
      placeholder.selected = true;
      threadSizeSelect.appendChild(placeholder);
      threadSizeSelect.disabled = true;
    }
    if (threadSizePickerList) {
      threadSizePickerList.innerHTML = '';
      threadSizePickerList.hidden = true;
    }
    if (threadSizePickerButton) {
      threadSizePickerButton.disabled = true;
      threadSizePickerButton.setAttribute('aria-expanded', 'false');
      updateThreadSizePickerLabel(THREAD_SIZE_NOT_APPLICABLE_TEXT);
    }
    if (threadSizePicker) {
      threadSizePicker.classList.remove('is-open');
    }
    state.threadSize = '';
    updateDownloadState();
    updatePreview();
    return;
  }

  const list = state.systemType === 'Metric' ? metricThreadSizes : imperialThreadSizes;
  validThreadSizes = new Set(list);

  if (!threadSizeSelect) {
    state.threadSize = '';
    updateDownloadState();
    updatePreview();
    return;
  }

  threadSizeSelect.disabled = false;
  threadSizeSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = THREAD_SIZE_PLACEHOLDER_TEXT;
  threadSizeSelect.appendChild(placeholder);

  list.forEach(size => {
    const opt = document.createElement('option');
    opt.value = size;
    opt.textContent = size;
    threadSizeSelect.appendChild(opt);
  });

  const previous = typeof state.threadSize === 'string' ? state.threadSize.trim() : '';
  const normalized = previous && validThreadSizes.has(previous) ? previous : '';
  state.threadSize = normalized;
  threadSizeSelect.value = normalized;
  if (!normalized) {
    placeholder.selected = true;
  }

  if (threadSizePickerList) {
    threadSizePickerList.innerHTML = '';
    list.forEach(size => {
      buildThreadSizeOptionItem(size);
    });
    threadSizePickerList.hidden = true;
  }
  if (threadSizePickerButton) {
    threadSizePickerButton.disabled = false;
    threadSizePickerButton.setAttribute('aria-expanded', 'false');
  }
  if (threadSizePicker) {
    threadSizePicker.classList.remove('is-open');
  }

  syncThreadSizePicker({ isValid: true });
  updateDownloadState();
  updatePreview();
}
