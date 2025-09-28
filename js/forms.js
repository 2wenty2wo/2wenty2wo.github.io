import { state, standardFilterState } from './state.js';
import { elements } from './dom-elements.js';
import {
  fuseValues,
  fuseTypeOptions,
  bearingOptions,
  boltHeadOptions,
  boltDriveOptions,
  nutTypeOptions,
  hardwareCatalog,
  hardwareTypeImageMap,
  connectorCatalog,
  STANDARD_PLACEHOLDER_TEXT,
  CONNECTOR_PLACEHOLDER_TEXT,
  findConnectorCategory,
} from './data.js';
import { updatePreview, updateDownloadState } from './render.js';
import { populateThreadSizes } from './threadSizes.js';

const {
  threadSizeContainer,
  threadLengthRow,
  lengthContainer,
  fuseSelectionRow,
  fuseTypeContainer,
  fuseTypeSelect,
  fuseTypePicker,
  fuseTypePickerButton,
  fuseTypePickerList,
  fuseValueContainer,
  glassOptionsContainer,
  fuseValueSelect,
  glassSizeSelect,
  glassSlowBlowCheckbox,
  glassFastBlowCheckbox,
  notesInput,
  nutTypeContainer,
  nutTypePicker,
  nutTypePickerButton,
  nutTypePickerList,
  nutTypeSelect,
  measurementSystemContainer,
  connectorCategoryContainer,
  connectorCategorySelect,
  connectorCategoryHelp,
  connectorNotesHint,
  componentCategoryContainer,
  componentMountContainer,
  bearingOptionsContainer,
  bearingTypeSelect,
  customFieldsContainer,
  customImageInput,
  customImageClearButton,
  customImageNameDisplay,
  notesField,
  standardField,
  boltStandardGroup,
  boltHeadPicker,
  boltHeadPickerButton,
  boltHeadPickerList,
  boltDrivePicker,
  boltDrivePickerButton,
  boltDrivePickerList,
  boltHeadSelect,
  boltDriveSelect,
  notesLabel,
  defaultNotesLabel,
  defaultNotesPlaceholder,
  standardSelect,
  standardLabel,
  defaultStandardLabel,
  hardwareTypeRadios,
  hardwareTypeSelect,
  hardwareTypePickerButton,
  hardwareTypePickerList,
  hardwareTypeOptions,
  systemTypeRadios,
  componentCategoryRadios,
  componentMountRadios,
} = elements;

const HARDWARE_TYPE_PLACEHOLDER_TEXT = 'Select hardware…';
const BOLT_DRIVE_PLACEHOLDER_TEXT = 'Select drive…';
const BOLT_HEAD_PLACEHOLDER_TEXT = 'Select head…';
const validBoltDriveIds = new Set(boltDriveOptions.map(option => option.id));
const validBoltHeadIds = new Set(boltHeadOptions.map(option => option.id));
const NUT_TYPE_PLACEHOLDER_TEXT = 'Select type…';
const validNutTypeIds = new Set(nutTypeOptions.map(option => option.id));
const FUSE_TYPE_PLACEHOLDER_TEXT = 'Select fuse type…';
const DEFAULT_FUSE_TYPE = 'Glass';
const validFuseTypeIds = new Set(fuseTypeOptions.map(option => option.id));

function createHardwareTypeOption(optionElement) {
  if (!hardwareTypePickerList) {
    return;
  }
  const value = optionElement.value;
  if (!value) {
    return;
  }

  const item = document.createElement('li');
  item.className = 'bolt-drive-picker__option';
  item.dataset.value = value;
  item.setAttribute('role', 'option');
  item.setAttribute('aria-selected', 'false');
  item.tabIndex = -1;

  const icon = document.createElement('span');
  icon.className = 'bolt-drive-picker__option-icon';

  const imageSrc = hardwareTypeImageMap[value];
  if (imageSrc) {
    const image = document.createElement('img');
    image.className = 'bolt-drive-picker__option-icon-image';
    if (value === 'Bolt') {
      image.classList.add('is-rotated-90');
    }
    image.src = imageSrc;
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';
    icon.appendChild(image);
  } else {
    icon.classList.add('is-empty');
  }

  const label = document.createElement('span');
  label.className = 'bolt-drive-picker__option-label';
  label.textContent = optionElement.textContent.trim();

  item.appendChild(icon);
  item.appendChild(label);

  hardwareTypePickerList.appendChild(item);
}

export function populateHardwareTypePicker() {
  if (!hardwareTypePickerList) {
    return;
  }

  hardwareTypePickerList.innerHTML = '';

  if (!hardwareTypeSelect) {
    return;
  }

  const children = Array.from(hardwareTypeSelect.children);
  children.forEach(child => {
    if (!child || !(child instanceof Element)) {
      return;
    }
    const tagName = child.tagName.toLowerCase();
    if (tagName === 'optgroup') {
      const optionElements = Array.from(child.children).filter(
        option => option instanceof HTMLOptionElement,
      );
      if (optionElements.length === 0) {
        return;
      }
      const header = document.createElement('li');
      header.className = 'bolt-drive-picker__group';
      header.textContent = child.label;
      header.setAttribute('role', 'presentation');
      hardwareTypePickerList.appendChild(header);
      optionElements.forEach(option => {
        createHardwareTypeOption(option);
      });
      return;
    }
    if (tagName === 'option') {
      createHardwareTypeOption(child);
    }
  });

  if (hardwareTypePickerButton) {
    hardwareTypePickerButton.disabled = false;
    hardwareTypePickerButton.setAttribute('aria-expanded', 'false');
  }
  hardwareTypePickerList.hidden = true;

  syncHardwareTypePicker();
}

export function syncHardwareTypePicker() {
  const currentValue = typeof state.hardwareType === 'string' ? state.hardwareType : '';
  const sanitizedValue = hardwareTypeOptions.has(currentValue) ? currentValue : '';

  if (hardwareTypeSelect) {
    hardwareTypeSelect.value = sanitizedValue || hardwareTypeSelect.value;
  }

  if (hardwareTypePickerButton) {
    const label = hardwareTypePickerButton.querySelector('.bolt-drive-picker__current-label');
    const iconWrapper = hardwareTypePickerButton.querySelector('.bolt-drive-picker__current-icon');
    const iconImage = hardwareTypePickerButton.querySelector(
      '.bolt-drive-picker__current-icon-image',
    );

    let optionLabel = HARDWARE_TYPE_PLACEHOLDER_TEXT;
    if (sanitizedValue && hardwareTypeSelect) {
      const match = Array.from(hardwareTypeSelect.options).find(
        option => option.value === sanitizedValue,
      );
      if (match) {
        optionLabel = match.textContent.trim() || HARDWARE_TYPE_PLACEHOLDER_TEXT;
      }
    }

    if (label) {
      label.textContent = optionLabel;
    }

    if (iconWrapper && iconImage) {
      const imageSrc = sanitizedValue ? hardwareTypeImageMap[sanitizedValue] : '';
      iconImage.classList.remove('is-rotated-90');
      if (imageSrc) {
        iconImage.src = imageSrc;
        iconImage.hidden = false;
        if (sanitizedValue === 'Bolt') {
          iconImage.classList.add('is-rotated-90');
        }
        iconWrapper.classList.remove('is-empty');
      } else {
        iconImage.hidden = true;
        iconImage.removeAttribute('src');
        iconWrapper.classList.add('is-empty');
      }
    }
  }

  if (hardwareTypePickerList) {
    const optionItems = Array.from(
      hardwareTypePickerList.querySelectorAll('[role="option"]'),
    );
    optionItems.forEach(item => {
      const isSelected = item.dataset.value === sanitizedValue;
      item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      item.classList.toggle('is-selected', isSelected);
      item.tabIndex = -1;
    });
  }
}

export function syncFuseTypePicker({ isValid = true } = {}) {
  const currentValue = typeof state.fuseType === 'string' ? state.fuseType : '';
  const sanitizedValue = validFuseTypeIds.has(currentValue) ? currentValue : DEFAULT_FUSE_TYPE;

  if (sanitizedValue !== currentValue) {
    state.fuseType = sanitizedValue;
  }

  if (fuseTypeSelect) {
    fuseTypeSelect.value = sanitizedValue;
  }

  const selectedOption = fuseTypeOptions.find(option => option.id === sanitizedValue) || null;

  if (fuseTypePickerButton) {
    const label = fuseTypePickerButton.querySelector('.bolt-drive-picker__current-label');
    const iconWrapper = fuseTypePickerButton.querySelector('.bolt-drive-picker__current-icon');
    const iconImage = fuseTypePickerButton.querySelector('.bolt-drive-picker__current-icon-image');

    if (label) {
      label.textContent = selectedOption ? selectedOption.label : FUSE_TYPE_PLACEHOLDER_TEXT;
    }

    if (iconWrapper && iconImage) {
      if (selectedOption && selectedOption.image) {
        iconImage.src = selectedOption.image;
        iconImage.hidden = false;
        iconWrapper.classList.remove('is-empty');
      } else {
        iconImage.hidden = true;
        iconImage.removeAttribute('src');
        iconWrapper.classList.add('is-empty');
      }
    }

    if (isValid) {
      fuseTypePickerButton.classList.remove('is-invalid');
      fuseTypePickerButton.removeAttribute('aria-invalid');
    } else {
      fuseTypePickerButton.classList.add('is-invalid');
      fuseTypePickerButton.setAttribute('aria-invalid', 'true');
    }
  }

  if (fuseTypePicker) {
    fuseTypePicker.classList.toggle('is-invalid', !isValid);
  }

  if (fuseTypePickerList) {
    const optionElements = Array.from(
      fuseTypePickerList.querySelectorAll('[role="option"]'),
    );
    optionElements.forEach(optionElement => {
      const isSelected = optionElement.dataset.value === sanitizedValue;
      optionElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      optionElement.classList.toggle('is-selected', isSelected);
      optionElement.tabIndex = -1;
    });
  }
}

export function setFuseTypeSelection(nextId, { triggerUpdate = true } = {}) {
  const desiredValue = typeof nextId === 'string' ? nextId.trim() : '';
  const sanitizedValue = validFuseTypeIds.has(desiredValue) ? desiredValue : DEFAULT_FUSE_TYPE;
  const previousValue = validFuseTypeIds.has(state.fuseType)
    ? state.fuseType
    : DEFAULT_FUSE_TYPE;

  state.fuseType = sanitizedValue;
  syncFuseTypePicker({ isValid: true });

  const shouldResetGlassOptions = previousValue === 'Glass' && sanitizedValue !== 'Glass';
  updateGlassOptionVisibility({ resetIfHidden: shouldResetGlassOptions });

  if (triggerUpdate && previousValue !== sanitizedValue) {
    updateDownloadState();
    updatePreview();
  }
}

export function populateFuseTypePicker() {
  if (!fuseTypeSelect) {
    state.fuseType = DEFAULT_FUSE_TYPE;
    return;
  }

  const previousType = typeof state.fuseType === 'string' ? state.fuseType : DEFAULT_FUSE_TYPE;

  fuseTypeSelect.innerHTML = '';
  if (fuseTypePickerList) {
    fuseTypePickerList.innerHTML = '';
  }

  fuseTypeOptions.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.id;
    opt.textContent = option.label;
    fuseTypeSelect.appendChild(opt);

    if (fuseTypePickerList) {
      const item = document.createElement('li');
      item.className = 'bolt-drive-picker__option';
      item.dataset.value = option.id;
      item.setAttribute('role', 'option');
      item.tabIndex = -1;

      const icon = document.createElement('span');
      icon.className = 'bolt-drive-picker__option-icon';

      if (option.image) {
        const image = document.createElement('img');
        image.className = 'bolt-drive-picker__option-icon-image';
        image.src = option.image;
        image.alt = '';
        image.loading = 'lazy';
        image.decoding = 'async';
        icon.appendChild(image);
      } else {
        icon.classList.add('is-empty');
      }

      const label = document.createElement('span');
      label.className = 'bolt-drive-picker__option-label';
      label.textContent = option.label;

      item.appendChild(icon);
      item.appendChild(label);

      fuseTypePickerList.appendChild(item);
    }
  });

  const sanitizedValue = validFuseTypeIds.has(previousType) ? previousType : DEFAULT_FUSE_TYPE;
  state.fuseType = sanitizedValue;
  fuseTypeSelect.value = sanitizedValue;
  fuseTypeSelect.disabled = false;

  if (fuseTypePickerButton) {
    fuseTypePickerButton.disabled = false;
    fuseTypePickerButton.setAttribute('aria-expanded', 'false');
  }
  if (fuseTypePickerList) {
    fuseTypePickerList.hidden = true;
  }

  syncFuseTypePicker({ isValid: true });
}

export function syncBoltDrivePicker({ isValid = true } = {}) {
  if (!boltDriveSelect) {
    return;
  }

  const currentValue = typeof state.boltDrive === 'string' ? state.boltDrive : '';
  const sanitizedValue = validBoltDriveIds.has(currentValue) ? currentValue : '';
  if (sanitizedValue !== currentValue) {
    state.boltDrive = sanitizedValue;
  }

  boltDriveSelect.value = sanitizedValue;
  if (!sanitizedValue) {
    if (boltDriveSelect.options.length > 0) {
      boltDriveSelect.selectedIndex = 0;
    }
  }

  const selectedOption = sanitizedValue
    ? boltDriveOptions.find(option => option.id === sanitizedValue) || null
    : null;

  if (boltDrivePickerButton) {
    const label = boltDrivePickerButton.querySelector('.bolt-drive-picker__current-label');
    const iconWrapper = boltDrivePickerButton.querySelector('.bolt-drive-picker__current-icon');
    const iconImage = boltDrivePickerButton.querySelector('.bolt-drive-picker__current-icon-image');

    if (label) {
      label.textContent = selectedOption ? selectedOption.label : BOLT_DRIVE_PLACEHOLDER_TEXT;
    }

    if (iconWrapper && iconImage) {
      if (selectedOption) {
        iconImage.src = `images/bolts/drive/${selectedOption.image}.svg`;
        iconImage.hidden = false;
        iconWrapper.classList.remove('is-empty');
      } else {
        iconImage.hidden = true;
        iconImage.removeAttribute('src');
        iconWrapper.classList.add('is-empty');
      }
    }

    if (isValid) {
      boltDrivePickerButton.classList.remove('is-invalid');
      boltDrivePickerButton.removeAttribute('aria-invalid');
    } else {
      boltDrivePickerButton.classList.add('is-invalid');
      boltDrivePickerButton.setAttribute('aria-invalid', 'true');
    }
  }

  if (boltDrivePicker) {
    boltDrivePicker.classList.toggle('is-invalid', !isValid);
  }

  if (boltDrivePickerList) {
    const optionElements = Array.from(
      boltDrivePickerList.querySelectorAll('[role="option"]'),
    );
    optionElements.forEach(optionElement => {
      const isSelected = optionElement.dataset.value === sanitizedValue;
      optionElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      optionElement.classList.toggle('is-selected', isSelected);
      optionElement.tabIndex = -1;
    });
  }
}

export function setBoltDriveSelection(nextId, { triggerUpdate = true } = {}) {
  const desiredValue = typeof nextId === 'string' ? nextId.trim() : '';
  const sanitizedValue = validBoltDriveIds.has(desiredValue) ? desiredValue : '';
  const previousValue = typeof state.boltDrive === 'string' ? state.boltDrive : '';

  state.boltDrive = sanitizedValue;
  syncBoltDrivePicker({ isValid: true });

  if (triggerUpdate && previousValue !== sanitizedValue) {
    updatePreview();
    updateDownloadState();
  }
}

export function syncBoltHeadPicker({ isValid = true } = {}) {
  if (!boltHeadSelect) {
    return;
  }

  const currentValue = typeof state.boltHead === 'string' ? state.boltHead : '';
  const sanitizedValue = validBoltHeadIds.has(currentValue) ? currentValue : '';
  if (sanitizedValue !== currentValue) {
    state.boltHead = sanitizedValue;
  }

  boltHeadSelect.value = sanitizedValue;
  if (!sanitizedValue && boltHeadSelect.options.length > 0) {
    boltHeadSelect.selectedIndex = 0;
  }

  const selectedOption = sanitizedValue
    ? boltHeadOptions.find(option => option.id === sanitizedValue) || null
    : null;

  if (boltHeadPickerButton) {
    const label = boltHeadPickerButton.querySelector('.bolt-drive-picker__current-label');
    const iconWrapper = boltHeadPickerButton.querySelector('.bolt-drive-picker__current-icon');
    const iconImage = boltHeadPickerButton.querySelector(
      '.bolt-drive-picker__current-icon-image',
    );

    if (label) {
      label.textContent = selectedOption ? selectedOption.label : BOLT_HEAD_PLACEHOLDER_TEXT;
    }

    if (iconWrapper && iconImage) {
      if (selectedOption) {
        iconImage.src = `images/bolts/head/${selectedOption.image}.svg`;
        iconImage.hidden = false;
        iconWrapper.classList.remove('is-empty');
      } else {
        iconImage.hidden = true;
        iconImage.removeAttribute('src');
        iconWrapper.classList.add('is-empty');
      }
    }

    if (isValid) {
      boltHeadPickerButton.classList.remove('is-invalid');
      boltHeadPickerButton.removeAttribute('aria-invalid');
    } else {
      boltHeadPickerButton.classList.add('is-invalid');
      boltHeadPickerButton.setAttribute('aria-invalid', 'true');
    }
  }

  if (boltHeadPicker) {
    boltHeadPicker.classList.toggle('is-invalid', !isValid);
  }

  if (boltHeadPickerList) {
    const optionElements = Array.from(
      boltHeadPickerList.querySelectorAll('[role="option"]'),
    );
    optionElements.forEach(optionElement => {
      const isSelected = optionElement.dataset.value === sanitizedValue;
      optionElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      optionElement.classList.toggle('is-selected', isSelected);
      optionElement.tabIndex = -1;
    });
  }
}

export function setBoltHeadSelection(nextId, { triggerUpdate = true } = {}) {
  const desiredValue = typeof nextId === 'string' ? nextId.trim() : '';
  const sanitizedValue = validBoltHeadIds.has(desiredValue) ? desiredValue : '';
  const previousValue = typeof state.boltHead === 'string' ? state.boltHead : '';

  state.boltHead = sanitizedValue;
  syncBoltHeadPicker({ isValid: true });

  if (triggerUpdate && previousValue !== sanitizedValue) {
    updatePreview();
    updateDownloadState();
  }
}

export function syncNutTypePicker({ isValid = true } = {}) {
  if (!nutTypeSelect) {
    return;
  }

  const currentValue = typeof state.nutType === 'string' ? state.nutType : '';
  const sanitizedValue = validNutTypeIds.has(currentValue) ? currentValue : '';
  if (sanitizedValue !== currentValue) {
    state.nutType = sanitizedValue;
  }

  nutTypeSelect.value = sanitizedValue;
  if (!sanitizedValue && nutTypeSelect.options.length > 0) {
    nutTypeSelect.selectedIndex = 0;
  }

  const selectedOption = sanitizedValue
    ? nutTypeOptions.find(option => option.id === sanitizedValue) || null
    : null;

  if (nutTypePickerButton) {
    const label = nutTypePickerButton.querySelector('.bolt-drive-picker__current-label');
    const iconWrapper = nutTypePickerButton.querySelector('.bolt-drive-picker__current-icon');
    const iconImage = nutTypePickerButton.querySelector('.bolt-drive-picker__current-icon-image');

    if (label) {
      label.textContent = selectedOption ? selectedOption.label : NUT_TYPE_PLACEHOLDER_TEXT;
    }

    if (iconWrapper && iconImage) {
      if (selectedOption) {
        iconImage.src = `images/nuts/${selectedOption.image}.svg`;
        iconImage.hidden = false;
        iconWrapper.classList.remove('is-empty');
      } else {
        iconImage.hidden = true;
        iconImage.removeAttribute('src');
        iconWrapper.classList.add('is-empty');
      }
    }

    if (isValid) {
      nutTypePickerButton.classList.remove('is-invalid');
      nutTypePickerButton.removeAttribute('aria-invalid');
    } else {
      nutTypePickerButton.classList.add('is-invalid');
      nutTypePickerButton.setAttribute('aria-invalid', 'true');
    }
  }

  if (nutTypePicker) {
    nutTypePicker.classList.toggle('is-invalid', !isValid);
  }

  if (nutTypePickerList) {
    const optionElements = Array.from(
      nutTypePickerList.querySelectorAll('[role="option"]'),
    );
    optionElements.forEach(optionElement => {
      const isSelected = optionElement.dataset.value === sanitizedValue;
      optionElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      optionElement.classList.toggle('is-selected', isSelected);
      optionElement.tabIndex = -1;
    });
  }
}

export function setNutTypeSelection(nextId, { triggerUpdate = true } = {}) {
  const desiredValue = typeof nextId === 'string' ? nextId.trim() : '';
  const sanitizedValue = validNutTypeIds.has(desiredValue) ? desiredValue : '';
  const previousValue = typeof state.nutType === 'string' ? state.nutType : '';

  state.nutType = sanitizedValue;
  syncNutTypePicker({ isValid: true });

  if (triggerUpdate && previousValue !== sanitizedValue) {
    updatePreview();
    updateDownloadState();
  }
}

export function populateNutTypeOptions() {
  if (!nutTypeSelect) {
    state.nutType = '';
    return;
  }

  const previousType = typeof state.nutType === 'string' ? state.nutType : '';

  nutTypeSelect.innerHTML = '';
  if (nutTypePickerList) {
    nutTypePickerList.innerHTML = '';
  }

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = NUT_TYPE_PLACEHOLDER_TEXT;
  placeholder.disabled = true;
  placeholder.selected = !previousType;
  nutTypeSelect.appendChild(placeholder);

  nutTypeOptions.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.id;
    opt.textContent = option.label;
    nutTypeSelect.appendChild(opt);

    if (nutTypePickerList) {
      const item = document.createElement('li');
      item.className = 'bolt-drive-picker__option';
      item.dataset.value = option.id;
      item.setAttribute('role', 'option');
      item.tabIndex = -1;

      const icon = document.createElement('span');
      icon.className = 'bolt-drive-picker__option-icon';

      const image = document.createElement('img');
      image.className = 'bolt-drive-picker__option-icon-image';
      image.src = `images/nuts/${option.image}.svg`;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      icon.appendChild(image);

      const label = document.createElement('span');
      label.className = 'bolt-drive-picker__option-label';
      label.textContent = option.label;

      item.appendChild(icon);
      item.appendChild(label);

      nutTypePickerList.appendChild(item);
    }
  });

  const sanitizedValue = validNutTypeIds.has(previousType) ? previousType : '';
  state.nutType = sanitizedValue;
  nutTypeSelect.value = sanitizedValue;
  if (!sanitizedValue) {
    placeholder.selected = true;
  }

  nutTypeSelect.disabled = false;
  nutTypeSelect.title = 'Select nut style';
  nutTypeSelect.setAttribute('aria-required', 'true');

  if (nutTypePickerButton) {
    nutTypePickerButton.disabled = false;
    nutTypePickerButton.setAttribute('aria-expanded', 'false');
  }
  if (nutTypePickerList) {
    nutTypePickerList.hidden = true;
  }

  syncNutTypePicker({ isValid: true });
}

export function populateConnectorCategories() {
  if (!connectorCategorySelect) {
    return;
  }
  connectorCategorySelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select connector category…';
  placeholder.disabled = true;
  placeholder.selected = !state.connectorCategory;
  connectorCategorySelect.appendChild(placeholder);
  connectorCatalog.forEach(category => {
    const opt = document.createElement('option');
    opt.value = category.id;
    opt.textContent = category.label;
    connectorCategorySelect.appendChild(opt);
  });
  connectorCategorySelect.value = state.connectorCategory || '';
}

export function populateBearingOptions() {
  if (!bearingTypeSelect) {
    return;
  }
  bearingTypeSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select bearing…';
  placeholder.disabled = true;
  placeholder.selected = !state.bearingType;
  bearingTypeSelect.appendChild(placeholder);
  bearingOptions.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.code;
    opt.textContent = `${option.code} — ${option.description}`;
    opt.dataset.description = option.description;
    bearingTypeSelect.appendChild(opt);
  });
  const validCodes = new Set(bearingOptions.map(option => option.code));
  const desired = typeof state.bearingType === 'string' ? state.bearingType : '';
  if (desired && validCodes.has(desired)) {
    bearingTypeSelect.value = desired;
    const selectedOption = bearingOptions.find(option => option.code === desired);
    state.bearingDetails = selectedOption ? selectedOption.description : state.bearingDetails;
  } else {
    bearingTypeSelect.value = '';
    state.bearingType = '';
    state.bearingDetails = '';
  }
}

function ensureConnectorCategory() {
  if (!state.connectorCategory) {
    const first = connectorCatalog[0];
    if (first) {
      state.connectorCategory = first.id;
    }
  }
  if (connectorCategorySelect) {
    connectorCategorySelect.value = state.connectorCategory || '';
  }
}

export function updateConnectorCategoryUi() {
  if (!notesInput) {
    return;
  }
  if (state.hardwareType !== 'Connector') {
    if (connectorCategoryHelp) {
      connectorCategoryHelp.textContent = '';
      connectorCategoryHelp.classList.add('d-none');
    }
    notesInput.placeholder = defaultNotesPlaceholder;
    return;
  }
  const category = findConnectorCategory(state.connectorCategory);
  if (connectorCategorySelect) {
    connectorCategorySelect.value = state.connectorCategory || '';
  }
  if (connectorCategoryHelp) {
    if (category && category.help) {
      connectorCategoryHelp.textContent = category.help;
      connectorCategoryHelp.classList.remove('d-none');
    } else {
      connectorCategoryHelp.textContent = '';
      connectorCategoryHelp.classList.add('d-none');
    }
  }
  const example =
    category && category.example ? category.example : 'e.g., 3-pin JST-PH plug, 26 AWG leads';
  notesInput.placeholder = example;
}

export { populateThreadSizes };

export function populateFuseValues() {
  if (!fuseValueSelect) {
    return;
  }
  fuseValueSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select value…';
  fuseValueSelect.appendChild(placeholder);
  fuseValues.forEach(value => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = `${value} A`;
    fuseValueSelect.appendChild(opt);
  });
  fuseValueSelect.value = state.fuseValue || '';
}

export function updateGlassOptionVisibility({ resetIfHidden = false } = {}) {
  const shouldShow = state.hardwareType === 'Fuse' && state.fuseType === 'Glass';
  if (glassOptionsContainer) {
    glassOptionsContainer.classList.toggle('d-none', !shouldShow);
  }
  if (shouldShow) {
    if (glassSizeSelect) {
      glassSizeSelect.value = state.glassSize || '';
    }
    if (glassSlowBlowCheckbox && glassFastBlowCheckbox) {
      glassSlowBlowCheckbox.checked = state.glassSpeed.startsWith('Slow');
      glassFastBlowCheckbox.checked = state.glassSpeed.startsWith('Fast');
    }
  } else if (resetIfHidden) {
    state.glassSpeed = '';
    state.glassSize = '';
    if (glassSlowBlowCheckbox) {
      glassSlowBlowCheckbox.checked = false;
    }
    if (glassFastBlowCheckbox) {
      glassFastBlowCheckbox.checked = false;
    }
    if (glassSizeSelect) {
      glassSizeSelect.value = '';
    }
  }
}

export function updateCustomImageUi() {
  const hasImage = !!state.customImageData;
  if (customImageClearButton) {
    customImageClearButton.disabled = !hasImage;
  }
  if (customImageNameDisplay) {
    if (state.customImageName) {
      customImageNameDisplay.textContent = state.customImageName;
      customImageNameDisplay.classList.remove('d-none');
    } else {
      customImageNameDisplay.textContent = '';
      customImageNameDisplay.classList.add('d-none');
    }
  }
}

export function clearCustomImage({ resetInput = true } = {}) {
  state.customImageData = '';
  state.customImageName = '';
  if (resetInput && customImageInput) {
    customImageInput.value = '';
  }
  updateCustomImageUi();
  updatePreview();
  updateDownloadState();
}

export function handleCustomImageFile(file) {
  if (!file) {
    return;
  }
  const isImage = !file.type || file.type.startsWith('image/');
  if (!isImage) {
    alert('Please select an image file (PNG, JPG, SVG, GIF).');
    if (customImageInput) {
      customImageInput.value = '';
    }
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const result = typeof reader.result === 'string' ? reader.result : '';
    state.customImageData = result;
    state.customImageName = file.name || 'Custom image';
    updateCustomImageUi();
    updatePreview();
    updateDownloadState();
    if (customImageInput) {
      customImageInput.value = '';
    }
  };
  reader.onerror = () => {
    console.error('Unable to load custom image', reader.error);
    clearCustomImage({ resetInput: false });
  };
  reader.readAsDataURL(file);
}

function populateBoltOptions() {
  if (!boltHeadSelect || !boltDriveSelect) {
    return;
  }

  const previousHead = typeof state.boltHead === 'string' ? state.boltHead : '';
  const previousDrive = typeof state.boltDrive === 'string' ? state.boltDrive : '';

  boltHeadSelect.innerHTML = '';
  boltDriveSelect.innerHTML = '';
  if (boltHeadPickerList) {
    boltHeadPickerList.innerHTML = '';
  }
  if (boltDrivePickerList) {
    boltDrivePickerList.innerHTML = '';
  }

  const headPlaceholder = document.createElement('option');
  headPlaceholder.value = '';
  headPlaceholder.textContent = BOLT_HEAD_PLACEHOLDER_TEXT;
  headPlaceholder.disabled = true;
  headPlaceholder.selected = !previousHead;
  boltHeadSelect.appendChild(headPlaceholder);

  const drivePlaceholder = document.createElement('option');
  drivePlaceholder.value = '';
  drivePlaceholder.textContent = BOLT_DRIVE_PLACEHOLDER_TEXT;
  drivePlaceholder.disabled = true;
  drivePlaceholder.selected = !previousDrive;
  boltDriveSelect.appendChild(drivePlaceholder);

  boltHeadOptions.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.id;
    opt.textContent = option.label;
    boltHeadSelect.appendChild(opt);

    if (boltHeadPickerList) {
      const item = document.createElement('li');
      item.className = 'bolt-drive-picker__option';
      item.dataset.value = option.id;
      item.setAttribute('role', 'option');
      item.tabIndex = -1;

      const icon = document.createElement('span');
      icon.className = 'bolt-drive-picker__option-icon';

      const image = document.createElement('img');
      image.className = 'bolt-drive-picker__option-icon-image';
      image.src = `images/bolts/head/${option.image}.svg`;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      icon.appendChild(image);

      const label = document.createElement('span');
      label.className = 'bolt-drive-picker__option-label';
      label.textContent = option.label;

      item.appendChild(icon);
      item.appendChild(label);

      boltHeadPickerList.appendChild(item);
    }
  });

  boltDriveOptions.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.id;
    opt.textContent = option.label;
    boltDriveSelect.appendChild(opt);

    if (boltDrivePickerList) {
      const item = document.createElement('li');
      item.className = 'bolt-drive-picker__option';
      item.dataset.value = option.id;
      item.setAttribute('role', 'option');
      item.tabIndex = -1;

      const icon = document.createElement('span');
      icon.className = 'bolt-drive-picker__option-icon';

      const image = document.createElement('img');
      image.className = 'bolt-drive-picker__option-icon-image';
      image.src = `images/bolts/drive/${option.image}.svg`;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      icon.appendChild(image);

      const label = document.createElement('span');
      label.className = 'bolt-drive-picker__option-label';
      label.textContent = option.label;

      item.appendChild(icon);
      item.appendChild(label);

      boltDrivePickerList.appendChild(item);
    }
  });

  setBoltHeadSelection(previousHead, { triggerUpdate: false });
  setBoltDriveSelection(previousDrive, { triggerUpdate: false });

  boltHeadSelect.disabled = false;
  boltHeadSelect.title = 'Select head style';
  boltHeadSelect.setAttribute('aria-required', 'true');

  boltDriveSelect.disabled = false;
  boltDriveSelect.title = 'Select drive style';
  boltDriveSelect.setAttribute('aria-required', 'true');

  if (boltHeadPickerButton) {
    boltHeadPickerButton.disabled = false;
    boltHeadPickerButton.setAttribute('aria-expanded', 'false');
  }
  if (boltHeadPickerList) {
    boltHeadPickerList.hidden = true;
  }
  if (boltDrivePickerButton) {
    boltDrivePickerButton.disabled = false;
    boltDrivePickerButton.setAttribute('aria-expanded', 'false');
  }
  if (boltDrivePickerList) {
    boltDrivePickerList.hidden = true;
  }
}

export function populateStandards() {
  const previousCode = typeof state.standardCode === 'string' ? state.standardCode : '';

  if (state.hardwareType === 'Bolt') {
    standardFilterState.query = '';
    if (standardSelect) {
      standardSelect.innerHTML = '';
      standardSelect.disabled = true;
      standardSelect.title = '';
      standardSelect.value = '';
    }
    state.standard = '';
    state.standardCode = '';
    populateBoltOptions();
    updatePreview();
    return;
  }

  if (state.hardwareType === 'Nut') {
    if (standardSelect) {
      standardSelect.innerHTML = '';
      standardSelect.disabled = true;
      standardSelect.title = '';
      standardSelect.value = '';
    }
    state.standard = '';
    state.standardCode = '';
    populateNutTypeOptions();
    updatePreview();
    return;
  }

  if (!standardSelect) {
    return;
  }

  standardSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';

  if (state.hardwareType === 'Component') {
    placeholder.textContent = 'Not used for component labels';
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.dataset.defaultText = placeholder.textContent;
    standardSelect.appendChild(placeholder);
    standardSelect.disabled = true;
    standardSelect.title = '';
    state.standard = '';
    state.standardCode = '';
    standardSelect.value = '';
    updatePreview();
    return;
  }

  if (state.hardwareType === 'Custom') {
    placeholder.textContent = 'Not used for custom labels';
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.dataset.defaultText = placeholder.textContent;
    standardSelect.appendChild(placeholder);
    standardSelect.disabled = true;
    standardSelect.title = '';
    state.standard = '';
    state.standardCode = '';
    standardSelect.value = '';
    updatePreview();
    return;
  }

  if (state.hardwareType === 'Fuse') {
    placeholder.textContent = 'Not used for fuse labels';
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.dataset.defaultText = placeholder.textContent;
    standardSelect.appendChild(placeholder);
    standardSelect.disabled = true;
    standardSelect.title = '';
    state.standard = '';
    state.standardCode = '';
    standardSelect.value = '';
    updatePreview();
    return;
  }

  let standards = [];
  let placeholderText = STANDARD_PLACEHOLDER_TEXT;
  let noOptionsText = 'No standards available';
  let titleText = 'Type to filter standards (Esc clears filter)';
  if (state.hardwareType === 'Connector') {
    const category = findConnectorCategory(state.connectorCategory);
    standards = category && Array.isArray(category.series) ? category.series : [];
    placeholderText = CONNECTOR_PLACEHOLDER_TEXT;
    noOptionsText = 'No connector series available';
    titleText = 'Type to filter connector series (Esc clears filter)';
  } else {
    const subset = hardwareCatalog[state.hardwareType];
    standards = Array.isArray(subset) ? subset : [];
  }

  standardFilterState.query = '';

  if (standards.length === 0) {
    placeholder.textContent = noOptionsText;
    placeholder.dataset.defaultText = placeholder.textContent;
    placeholder.disabled = false;
    placeholder.selected = true;
    standardSelect.appendChild(placeholder);
    standardSelect.disabled = true;
    standardSelect.title = '';
    state.standard = '';
    state.standardCode = '';
    updatePreview();
    return;
  }

  placeholder.textContent = placeholderText;
  placeholder.dataset.defaultText = placeholderText;
  placeholder.disabled = false;
  placeholder.selected = true;
  standardSelect.appendChild(placeholder);
  standards.forEach(entry => {
    const opt = document.createElement('option');
    opt.value = entry.code;
    if (state.hardwareType === 'Connector') {
      const display = entry.name ? `${entry.code} — ${entry.name}` : entry.code;
      opt.textContent = display;
      opt.dataset.name = entry.name || entry.code;
    } else {
      opt.textContent = `${entry.code} — ${entry.name}`;
      opt.dataset.name = entry.name;
    }
    standardSelect.appendChild(opt);
  });
  standardSelect.disabled = false;
  standardSelect.title = titleText;

  const availableOption = previousCode
    ? Array.from(standardSelect.options).find(option => option.value === previousCode)
    : null;

  if (availableOption && availableOption.value) {
    standardSelect.value = availableOption.value;
    const displayName = availableOption.dataset.name || availableOption.textContent || '';
    state.standardCode = availableOption.value;
    state.standard = displayName;
  } else {
    standardSelect.value = '';
    placeholder.selected = true;
    state.standard = '';
    state.standardCode = '';
  }

  filterStandardOptions('');
  updatePreview();
}

export function filterStandardOptions(query) {
  if (!standardSelect || standardSelect.disabled) {
    return;
  }
  const normalized = (query || '').trim().toLowerCase();
  let selectionCleared = false;
  let matchesFound = false;
  Array.from(standardSelect.options).forEach(option => {
    if (!option.value) {
      option.hidden = false;
      option.style.display = '';
      return;
    }
    const code = option.value.toLowerCase();
    const name = (option.dataset.name || '').toLowerCase();
    const matches = !normalized || code.includes(normalized) || name.includes(normalized);
    option.hidden = !matches;
    option.style.display = matches ? '' : 'none';
    if (matches) {
      matchesFound = true;
    } else if (option.selected) {
      selectionCleared = true;
    }
  });

  if (selectionCleared) {
    standardSelect.value = '';
    if (state.standard || state.standardCode) {
      state.standard = '';
      state.standardCode = '';
      updatePreview();
    }
    updateDownloadState();
  }

  const placeholder = standardSelect.querySelector('option[value=""]');
  if (placeholder) {
    const defaultText = placeholder.dataset.defaultText || STANDARD_PLACEHOLDER_TEXT;
    if (!normalized) {
      placeholder.textContent = defaultText;
      placeholder.disabled = false;
      placeholder.style.display = '';
      placeholder.hidden = false;
      if (!standardSelect.value) {
        placeholder.selected = true;
      }
    } else if (!matchesFound) {
      placeholder.textContent = 'No matches found';
      placeholder.disabled = true;
      placeholder.style.display = '';
      placeholder.hidden = false;
      placeholder.selected = true;
    } else {
      placeholder.textContent = defaultText;
      placeholder.disabled = false;
      placeholder.style.display = '';
      placeholder.hidden = false;
    }
  }
}

export function clearStandardFilter() {
  standardFilterState.query = '';
  if (!standardSelect || standardSelect.disabled) {
    return;
  }
  filterStandardOptions('');
}

export function handleStandardSelectKeydown(event) {
  if (!standardSelect || standardSelect.disabled) {
    return;
  }

  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  const key = event.key;

  if (key === 'Escape') {
    if (standardFilterState.query) {
      event.preventDefault();
      clearStandardFilter();
    }
    return;
  }

  if (key === 'Backspace') {
    if (standardFilterState.query) {
      event.preventDefault();
      standardFilterState.query = standardFilterState.query.slice(0, -1);
      filterStandardOptions(standardFilterState.query);
    }
    return;
  }

  if (key === 'Delete') {
    if (standardFilterState.query) {
      event.preventDefault();
      clearStandardFilter();
    }
    return;
  }

  if (key.length === 1) {
    event.preventDefault();
    standardFilterState.query += key.toLowerCase();
    filterStandardOptions(standardFilterState.query);
  }
}

function syncHardwareTypeControls(nextType) {
  const desiredType = nextType || state.hardwareType;
  const sanitizedType = hardwareTypeOptions.has(desiredType) ? desiredType : '';

  if (hardwareTypeSelect && sanitizedType) {
    hardwareTypeSelect.value = sanitizedType;
  }

  hardwareTypeRadios.forEach(radio => {
    radio.checked = radio.value === sanitizedType;
  });

  syncHardwareTypePicker();
}

export function onHardwareTypeChange() {
  const type = state.hardwareType;
  syncHardwareTypeControls(type);
  const requiresThreadDetails = type === 'Bolt' || type === 'Screw';
  const showFuseFields = type === 'Fuse';
  const showConnectorFields = type === 'Connector';
  const showComponentFields = type === 'Component';
  const showCustomFields = type === 'Custom';
  const showBearingFields = type === 'Bearing';
  const showBoltFields = type === 'Bolt';
  const showNutFields = type === 'Nut';

  if (lengthContainer) {
    lengthContainer.style.display = requiresThreadDetails ? '' : 'none';
  }

  if (bearingOptionsContainer) {
    const hidden = !showBearingFields;
    bearingOptionsContainer.classList.toggle('d-none', hidden);
    bearingOptionsContainer.setAttribute('aria-hidden', hidden ? 'true' : 'false');
  }
  if (bearingTypeSelect) {
    bearingTypeSelect.disabled = !showBearingFields;
    if (showBearingFields) {
      bearingTypeSelect.value = state.bearingType || '';
    }
  }

  if (customFieldsContainer) {
    customFieldsContainer.classList.toggle('d-none', !showCustomFields);
  }
  if (connectorCategoryContainer) {
    const hidden = !showConnectorFields;
    connectorCategoryContainer.classList.toggle('d-none', hidden);
    connectorCategoryContainer.setAttribute('aria-hidden', hidden ? 'true' : 'false');
  }
  if (componentCategoryContainer) {
    const hidden = !showComponentFields;
    componentCategoryContainer.classList.toggle('d-none', hidden);
    componentCategoryContainer.setAttribute('aria-hidden', hidden ? 'true' : 'false');
  }
  if (componentMountContainer) {
    const hidden = !showComponentFields;
    componentMountContainer.classList.toggle('d-none', hidden);
    componentMountContainer.setAttribute('aria-hidden', hidden ? 'true' : 'false');
  }
  if (componentCategoryRadios) {
    const desiredCategory = state.componentCategory || 'Resistor';
    componentCategoryRadios.forEach(radio => {
      radio.disabled = !showComponentFields;
      if (showComponentFields) {
        radio.checked = radio.value === desiredCategory;
      }
    });
    if (showComponentFields) {
      const activeCategory = componentCategoryRadios.find(radio => radio.checked);
      if (activeCategory) {
        state.componentCategory = activeCategory.value;
      }
    }
  }
  if (componentMountRadios) {
    const desiredMount = state.componentMount || 'Through-Hole';
    componentMountRadios.forEach(radio => {
      radio.disabled = !showComponentFields;
      if (showComponentFields) {
        radio.checked = radio.value === desiredMount;
      }
    });
    if (showComponentFields) {
      const activeMount = componentMountRadios.find(radio => radio.checked);
      if (activeMount) {
        state.componentMount = activeMount.value;
      }
    }
  }

  if (measurementSystemContainer) {
    const hideMeasurementSystem =
      showFuseFields ||
      showConnectorFields ||
      showCustomFields ||
      showBearingFields ||
      showComponentFields;
    measurementSystemContainer.style.display = hideMeasurementSystem ? 'none' : '';
    measurementSystemContainer.setAttribute(
      'aria-hidden',
      hideMeasurementSystem ? 'true' : 'false',
    );
  }
  systemTypeRadios.forEach(radio => {
    radio.disabled =
      showFuseFields ||
      showConnectorFields ||
      showCustomFields ||
      showBearingFields ||
      showComponentFields;
  });

  if (threadLengthRow) {
    const hideThreadLength =
      showFuseFields ||
      showConnectorFields ||
      showCustomFields ||
      showBearingFields ||
      showComponentFields;
    threadLengthRow.classList.toggle(
      'single-column',
      !requiresThreadDetails &&
        !showFuseFields &&
        !showConnectorFields &&
        !showCustomFields &&
        !showBearingFields &&
        !showComponentFields &&
        !showNutFields,
    );
    threadLengthRow.style.display = hideThreadLength ? 'none' : '';
  }
  if (threadSizeContainer) {
    threadSizeContainer.style.display =
      showFuseFields ||
      showConnectorFields ||
      showCustomFields ||
      showBearingFields ||
      showComponentFields
        ? 'none'
        : '';
  }
  if (fuseSelectionRow) {
    fuseSelectionRow.classList.toggle('d-none', !showFuseFields);
  }
  if (fuseTypeSelect) {
    fuseTypeSelect.disabled = !showFuseFields;
    if (showFuseFields) {
      const desiredType = validFuseTypeIds.has(state.fuseType)
        ? state.fuseType
        : DEFAULT_FUSE_TYPE;
      fuseTypeSelect.value = desiredType;
    }
  }
  if (fuseTypePickerButton) {
    fuseTypePickerButton.disabled = !showFuseFields;
    if (!showFuseFields) {
      fuseTypePickerButton.setAttribute('aria-expanded', 'false');
    }
  }
  if (fuseTypePickerList) {
    fuseTypePickerList.hidden = !showFuseFields;
  }
  if (!showFuseFields && fuseTypePicker) {
    fuseTypePicker.classList.remove('is-open');
  }
  if (!showFuseFields) {
    document.dispatchEvent(new CustomEvent('gridfinity:fuse-picker-close'));
  }
  if (fuseTypeContainer) {
    fuseTypeContainer.classList.toggle('d-none', !showFuseFields);
  }
  if (fuseValueContainer) {
    fuseValueContainer.classList.toggle('d-none', !showFuseFields);
  }
  if (fuseValueSelect) {
    fuseValueSelect.disabled = !showFuseFields;
    if (showFuseFields) {
      fuseValueSelect.value = state.fuseValue || '';
    }
  }
  if (showFuseFields) {
    syncFuseTypePicker();
  }
  if (connectorNotesHint) {
    connectorNotesHint.classList.toggle('d-none', !showConnectorFields);
  }
  if (notesField) {
    notesField.classList.toggle('d-none', showCustomFields);
  }
  if (notesLabel) {
    if (showConnectorFields) {
      notesLabel.textContent = 'Connector Details (optional)';
    } else if (showComponentFields) {
      notesLabel.textContent = 'Component Notes';
    } else {
      notesLabel.textContent = defaultNotesLabel;
    }
  }
  if (standardField) {
    standardField.classList.toggle(
      'd-none',
      showCustomFields || showBearingFields || showComponentFields || showFuseFields || showNutFields,
    );
  }
  if (standardLabel) {
    if (showConnectorFields) {
      standardLabel.textContent = 'Connector Series';
    } else {
      standardLabel.textContent = defaultStandardLabel;
    }
    standardLabel.setAttribute('for', showBoltFields ? 'bolt-head-select' : 'standard-select');
  }
  if (standardSelect) {
    const hideStandardSelect = showBoltFields || showFuseFields || showNutFields;
    standardSelect.classList.toggle('d-none', hideStandardSelect);
    if (hideStandardSelect) {
      standardSelect.disabled = true;
      standardSelect.setAttribute('aria-hidden', 'true');
      standardSelect.setAttribute('aria-required', 'false');
    } else {
      standardSelect.setAttribute('aria-hidden', 'false');
      standardSelect.removeAttribute('aria-required');
    }
  }
  if (boltStandardGroup) {
    boltStandardGroup.classList.toggle('d-none', !showBoltFields);
    boltStandardGroup.setAttribute('aria-hidden', showBoltFields ? 'false' : 'true');
  }
  if (boltHeadSelect) {
    boltHeadSelect.disabled = !showBoltFields;
    if (!showBoltFields) {
      boltHeadSelect.removeAttribute('aria-required');
      boltHeadSelect.title = '';
    }
  }
  if (boltHeadPickerButton) {
    boltHeadPickerButton.disabled = !showBoltFields;
    if (!showBoltFields) {
      boltHeadPickerButton.setAttribute('aria-expanded', 'false');
    }
  }
  if (boltHeadPickerList) {
    boltHeadPickerList.hidden = true;
  }
  if (boltHeadPicker) {
    boltHeadPicker.classList.toggle('is-disabled', !showBoltFields);
  }
  if (boltDriveSelect) {
    boltDriveSelect.disabled = !showBoltFields;
    if (!showBoltFields) {
      boltDriveSelect.removeAttribute('aria-required');
      boltDriveSelect.title = '';
    }
  }
  if (boltDrivePickerButton) {
    boltDrivePickerButton.disabled = !showBoltFields;
    if (!showBoltFields) {
      boltDrivePickerButton.setAttribute('aria-expanded', 'false');
    }
  }
  if (boltDrivePickerList) {
    boltDrivePickerList.hidden = true;
  }
  if (boltDrivePicker) {
    boltDrivePicker.classList.toggle('is-disabled', !showBoltFields);
  }
  if (!showBoltFields) {
    syncBoltHeadPicker({ isValid: true });
    syncBoltDrivePicker({ isValid: true });
  }
  if (nutTypeContainer) {
    const hidden = !showNutFields;
    nutTypeContainer.classList.toggle('d-none', hidden);
    nutTypeContainer.setAttribute('aria-hidden', hidden ? 'true' : 'false');
  }
  if (nutTypeSelect) {
    nutTypeSelect.disabled = !showNutFields;
    if (!showNutFields) {
      nutTypeSelect.removeAttribute('aria-required');
      nutTypeSelect.title = '';
    }
  }
  if (nutTypePickerButton) {
    nutTypePickerButton.disabled = !showNutFields;
    if (!showNutFields) {
      nutTypePickerButton.setAttribute('aria-expanded', 'false');
    }
  }
  if (nutTypePickerList) {
    nutTypePickerList.hidden = true;
  }
  if (nutTypePicker) {
    nutTypePicker.classList.toggle('is-disabled', !showNutFields);
  }
  if (!showNutFields) {
    state.nutType = '';
    syncNutTypePicker({ isValid: true });
  }
  if (notesInput) {
    if (showConnectorFields) {
      notesInput.required = false;
      notesInput.setAttribute('aria-required', 'false');
      updateConnectorCategoryUi();
    } else {
      notesInput.placeholder = defaultNotesPlaceholder;
      notesInput.required = false;
      notesInput.setAttribute('aria-required', 'false');
      if (showComponentFields) {
        notesInput.placeholder = 'Value, tolerance, voltage rating (optional)';
      }
    }
  }
  if (showConnectorFields) {
    ensureConnectorCategory();
    updateConnectorCategoryUi();
  } else if (connectorCategoryHelp) {
    connectorCategoryHelp.textContent = '';
    connectorCategoryHelp.classList.add('d-none');
  }
  if (showCustomFields) {
    updateCustomImageUi();
  }
  updateGlassOptionVisibility({ resetIfHidden: !showFuseFields });
  populateThreadSizes();
  populateStandards();
  updateDownloadState();
}

export function applyHardwareTypeSelection(nextType) {
  if (typeof nextType !== 'string') {
    syncHardwareTypeControls();
    return;
  }
  const trimmed = nextType.trim();
  if (!trimmed || !hardwareTypeOptions.has(trimmed)) {
    syncHardwareTypeControls();
    return;
  }
  if (trimmed === state.hardwareType) {
    syncHardwareTypeControls(trimmed);
    return;
  }
  state.hardwareType = trimmed;
  onHardwareTypeChange();
}
