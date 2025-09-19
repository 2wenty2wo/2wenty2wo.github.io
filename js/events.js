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
  clearStandardFilter
} from './forms.js';
import { updatePreview, updateDownloadState, updateQrContentVisibility } from './preview.js';
import { downloadLabel, printLabel } from './actions.js';

const {
  hardwareTypeRadios,
  hardwareTypeSelect,
  connectorCategorySelect,
  componentCategoryRadios,
  componentMountRadios,
  bearingTypeSelect,
  systemTypeRadios,
  screwTypeRadios,
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
  standardSelect,
  standardToggle,
  imageToggle,
  qrcodeToggle,
  qrContentInput,
  widthRange,
  widthValueSpan,
  heightRadios,
  downloadButton,
  printButton
} = elements;

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
      state.bearingDetails = selectedOption && selectedOption.dataset.description ? selectedOption.dataset.description : '';
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

  screwTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        state.screwType = radio.value;
        populateStandards();
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
      const file = customImageInput.files && customImageInput.files[0] ? customImageInput.files[0] : null;
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
      updatePreview();
    });
    standardSelect.addEventListener('keydown', handleStandardSelectKeydown);
    standardSelect.addEventListener('blur', clearStandardFilter);
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
  if (printButton) {
    printButton.addEventListener('click', printLabel);
  }
}
