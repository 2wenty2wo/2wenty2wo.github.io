import { state, standardFilterState } from './state.js';
import { elements } from './dom-elements.js';
import {
  metricThreadSizes,
  imperialThreadSizes,
  fuseValues,
  bearingOptions,
  hardwareCatalog,
  connectorCatalog,
  STANDARD_PLACEHOLDER_TEXT,
  CONNECTOR_PLACEHOLDER_TEXT,
  findConnectorCategory
} from './data.js';
import { updatePreview, updateDownloadState } from './preview.js';

const {
  screwTypeContainer,
  threadSizeContainer,
  threadSizeSelect,
  threadLengthRow,
  lengthContainer,
  fuseTypeContainer,
  fuseValueContainer,
  glassOptionsContainer,
  fuseValueSelect,
  glassSizeSelect,
  glassSlowBlowCheckbox,
  glassFastBlowCheckbox,
  notesInput,
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
  customLine1Input,
  customLine2Input,
  notesField,
  standardField,
  notesLabel,
  defaultNotesLabel,
  defaultNotesPlaceholder,
  standardSelect,
  standardLabel,
  defaultStandardLabel,
  standardToggle,
  imageToggle,
  qrcodeToggle,
  hardwareTypeRadios,
  hardwareTypeSelect,
  hardwareTypeOptions,
  systemTypeRadios,
  screwTypeRadios,
  fuseTypeRadios,
  componentCategoryRadios,
  componentMountRadios
} = elements;

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
  bearingTypeSelect.value = state.bearingType || '';
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
  const example = category && category.example ? category.example : 'e.g., 3-pin JST-PH plug, 26 AWG leads';
  notesInput.placeholder = example;
}

export function populateThreadSizes() {
  if (
    state.hardwareType === 'Fuse' ||
    state.hardwareType === 'Connector' ||
    state.hardwareType === 'Custom' ||
    state.hardwareType === 'Bearing' ||
    state.hardwareType === 'Component'
  ) {
    if (threadSizeSelect) {
      threadSizeSelect.innerHTML = '';
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Not applicable';
      threadSizeSelect.appendChild(placeholder);
      threadSizeSelect.value = '';
      threadSizeSelect.disabled = true;
    }
    state.threadSize = '';
    updateDownloadState();
    updatePreview();
    return;
  }
  if (threadSizeSelect) {
    threadSizeSelect.disabled = false;
  }
  const list = state.systemType === 'Metric' ? metricThreadSizes : imperialThreadSizes;
  if (!threadSizeSelect) {
    return;
  }
  threadSizeSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select size…';
  threadSizeSelect.appendChild(placeholder);
  list.forEach(size => {
    const opt = document.createElement('option');
    opt.value = size;
    opt.textContent = size;
    threadSizeSelect.appendChild(opt);
  });
  state.threadSize = '';
  threadSizeSelect.value = '';
  updateDownloadState();
  updatePreview();
}

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

export function populateStandards() {
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
    standardSelect.selectedIndex = 0;
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
    standardSelect.selectedIndex = 0;
    updatePreview();
    return;
  }

  let standards = [];
  let placeholderText = STANDARD_PLACEHOLDER_TEXT;
  let noOptionsText = 'No standards available';
  let titleText = 'Type to filter standards (Esc clears filter)';
  if (state.hardwareType === 'Screw') {
    const subset = hardwareCatalog[state.screwType];
    standards = Array.isArray(subset) ? subset : [];
  } else if (state.hardwareType === 'Connector') {
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
  } else {
    placeholder.textContent = placeholderText;
    placeholder.dataset.defaultText = placeholder.textContent;
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
    filterStandardOptions('');
  }

  state.standard = '';
  state.standardCode = '';
  standardSelect.value = '';
  standardSelect.selectedIndex = 0;
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
    if (state.standard) {
      state.standard = '';
      state.standardCode = '';
      updatePreview();
    }
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
  if (hardwareTypeSelect) {
    hardwareTypeSelect.value = desiredType;
  }
  hardwareTypeRadios.forEach(radio => {
    radio.checked = radio.value === desiredType;
  });
}

export function onHardwareTypeChange() {
  const type = state.hardwareType;
  syncHardwareTypeControls(type);
  const showScrewFields = type === 'Screw';
  const showFuseFields = type === 'Fuse';
  const showConnectorFields = type === 'Connector';
  const showComponentFields = type === 'Component';
  const showCustomFields = type === 'Custom';
  const showBearingFields = type === 'Bearing';

  if (screwTypeContainer) {
    screwTypeContainer.style.display = showScrewFields ? '' : 'none';
  }
  if (lengthContainer) {
    lengthContainer.style.display = showScrewFields ? '' : 'none';
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
      showFuseFields || showConnectorFields || showCustomFields || showBearingFields || showComponentFields;
    measurementSystemContainer.style.display = hideMeasurementSystem ? 'none' : '';
    measurementSystemContainer.setAttribute('aria-hidden', hideMeasurementSystem ? 'true' : 'false');
  }
  systemTypeRadios.forEach(radio => {
    radio.disabled =
      showFuseFields || showConnectorFields || showCustomFields || showBearingFields || showComponentFields;
  });

  if (threadLengthRow) {
    const hideThreadLength =
      showFuseFields || showConnectorFields || showCustomFields || showBearingFields || showComponentFields;
    threadLengthRow.classList.toggle(
      'single-column',
      !showScrewFields &&
        !showFuseFields &&
        !showConnectorFields &&
        !showCustomFields &&
        !showBearingFields &&
        !showComponentFields
    );
    threadLengthRow.style.display = hideThreadLength ? 'none' : '';
  }
  if (threadSizeContainer) {
    threadSizeContainer.style.display =
      showFuseFields || showConnectorFields || showCustomFields || showBearingFields || showComponentFields
        ? 'none'
        : '';
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
  if (connectorNotesHint) {
    connectorNotesHint.classList.toggle('d-none', !showConnectorFields);
  }
  if (notesField) {
    notesField.classList.toggle('d-none', showCustomFields);
  }
  if (notesLabel) {
    if (showConnectorFields) {
      notesLabel.textContent = 'Connector Details';
    } else if (showComponentFields) {
      notesLabel.textContent = 'Component Notes';
    } else {
      notesLabel.textContent = defaultNotesLabel;
    }
  }
  if (standardField) {
    standardField.classList.toggle('d-none', showCustomFields || showBearingFields || showComponentFields);
  }
  if (standardLabel) {
    if (showConnectorFields) {
      standardLabel.textContent = 'Connector Series';
    } else {
      standardLabel.textContent = defaultStandardLabel;
    }
  }
  if (notesInput) {
    if (showConnectorFields) {
      notesInput.required = true;
      notesInput.setAttribute('aria-required', 'true');
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

