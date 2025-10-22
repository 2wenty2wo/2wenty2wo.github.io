/**
 * Event handlers initialization
 * Extracted from events.js
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import * as forms from '../forms.js';
import {
  updatePreview,
  updateDownloadState,
  updateQrContentVisibility,
  updateTextOptionsVisibility,
} from '../render.js';
import { downloadLabel, printLabel, shareLabel } from '../actions.js';

// Import all event handlers from modules
import * as hardwareTypePicker from './hardware-type-picker.js';
import * as fuseTypePicker from './fuse-type-picker.js';
import * as threadSizePicker from './thread-size-picker.js';
import * as fuseValuePicker from './fuse-value-picker.js';
import * as switchPicker from './switch-picker.js';
import * as nutTypePicker from './nut-type-picker.js';
import * as washerTypePicker from './washer-type-picker.js';
import * as bearingPicker from './bearing-picker.js';
import * as boltPickers from './bolt-pickers.js';
import * as connectorPickers from './connector-pickers.js';
import * as componentPickers from './component-pickers.js';
import * as customPartPicker from './custom-part-picker.js';
import * as customGraphicsEvents from './custom-graphics-events.js';
import * as formEvents from './form-events.js';

const coarsePointerMediaQuery = window.matchMedia("(pointer: coarse)");

function isCoarsePointerDevice() {
  return Boolean(coarsePointerMediaQuery && coarsePointerMediaQuery.matches);
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
  if (switchTypePickerOpen && switchTypePicker) {
    if (!(target instanceof Node) || !switchTypePicker.contains(target)) {
      closeSwitchTypePicker();
    }
  }
  if (fuseValuePickerOpen && fuseValuePicker) {
    if (!(target instanceof Node) || !fuseValuePicker.contains(target)) {
      closeFuseValuePicker();
    }
  }
  if (glassSpeedPickerOpen && glassSpeedPicker) {
    if (!(target instanceof Node) || !glassSpeedPicker.contains(target)) {
      closeGlassSpeedPicker();
    }
  }
  if (glassSizePickerOpen && glassSizePicker) {
    if (!(target instanceof Node) || !glassSizePicker.contains(target)) {
      closeGlassSizePicker();
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
  if (mosfetChannelPickerOpen && mosfetChannelPicker) {
    if (!(target instanceof Node) || !mosfetChannelPicker.contains(target)) {
      closeMosfetChannelPicker();
    }
  }
  if (mosfetPartPickerOpen && mosfetPartPicker) {
    if (!(target instanceof Node) || !mosfetPartPicker.contains(target)) {
      closeMosfetPartPicker();
    }
  }
  if (mosfetChannelPickerOpen && mosfetChannelPicker) {
    if (!(target instanceof Node) || !mosfetChannelPicker.contains(target)) {
      closeMosfetChannelPicker();
    }
  }
  if (mosfetPartPickerOpen && mosfetPartPicker) {
    if (!(target instanceof Node) || !mosfetPartPicker.contains(target)) {
      closeMosfetPartPicker();
    }
  }
  if (bearingTypePickerOpen && bearingTypePicker) {
    if (!(target instanceof Node) || !bearingTypePicker.contains(target)) {
      closeBearingTypePicker();
    }
  }
  if (connectorCategoryPickerOpen && connectorCategoryPicker) {
    if (!(target instanceof Node) || !connectorCategoryPicker.contains(target)) {
      closeConnectorCategoryPicker();
    }
  }
  if (connectorSeriesPickerOpen && connectorSeriesPicker) {
    if (!(target instanceof Node) || !connectorSeriesPicker.contains(target)) {
      closeConnectorSeriesPicker();
    }
  }
  if (customIconPickerOpen && customIconPicker) {
    if (!(target instanceof Node) || !customIconPicker.contains(target)) {
      closeCustomIconPicker();
    }
  }
  if (customPartPickerOpen && customPartPicker) {
    if (!(target instanceof Node) || !customPartPicker.contains(target)) {
      closeCustomPartPicker();
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

  if (glassSpeedPickerButton && glassSpeedPickerList) {
    glassSpeedPickerButton.addEventListener('click', event => {
      event.preventDefault();
      toggleGlassSpeedPicker();
    });
    glassSpeedPickerButton.addEventListener('keydown', handleGlassSpeedButtonKeydown);
    glassSpeedPickerList.addEventListener('click', handleGlassSpeedListClick);
    glassSpeedPickerList.addEventListener('keydown', handleGlassSpeedListKeydown);
    glassSpeedPickerList.addEventListener('focusout', handleGlassSpeedListFocusOut);
  }

  if (glassSizePickerButton && glassSizePickerList) {
    glassSizePickerButton.addEventListener('click', event => {
      event.preventDefault();
      toggleGlassSizePicker();
    });
    glassSizePickerButton.addEventListener('keydown', handleGlassSizeButtonKeydown);
    glassSizePickerList.addEventListener('click', handleGlassSizeListClick);
    glassSizePickerList.addEventListener('keydown', handleGlassSizeListKeydown);
    glassSizePickerList.addEventListener('focusout', handleGlassSizeListFocusOut);
  }

  if (connectorCategorySelect) {
    connectorCategorySelect.addEventListener('change', () => {
      setConnectorCategorySelection(connectorCategorySelect.value);
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

  if (mosfetChannelSelect) {
    mosfetChannelSelect.addEventListener('change', () => {
      setMosfetChannelSelection(mosfetChannelSelect.value);
    });
  }

  if (mosfetChannelPickerButton && mosfetChannelPickerList) {
    mosfetChannelPickerButton.addEventListener('click', event => {
      event.preventDefault();
      toggleMosfetChannelPicker();
    });
    mosfetChannelPickerButton.addEventListener('keydown', handleMosfetChannelButtonKeydown);
    mosfetChannelPickerList.addEventListener('click', handleMosfetChannelListClick);
    mosfetChannelPickerList.addEventListener('keydown', handleMosfetChannelListKeydown);
    mosfetChannelPickerList.addEventListener('focusout', handleMosfetChannelListFocusOut);
  }

  if (mosfetPartSelect) {
    mosfetPartSelect.addEventListener('change', () => {
      setMosfetPartSelection(mosfetPartSelect.value);
    });
  }

  if (mosfetPartPickerButton && mosfetPartPickerList) {
    mosfetPartPickerButton.addEventListener('click', event => {
      event.preventDefault();
      toggleMosfetPartPicker();
    });
    mosfetPartPickerButton.addEventListener('keydown', handleMosfetPartButtonKeydown);
    mosfetPartPickerList.addEventListener('click', handleMosfetPartListClick);
    mosfetPartPickerList.addEventListener('keydown', handleMosfetPartListKeydown);
    mosfetPartPickerList.addEventListener('focusout', handleMosfetPartListFocusOut);
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

  if (potentiometerValueSelect) {
    potentiometerValueSelect.addEventListener('change', () => {
      setPotentiometerValueSelection(potentiometerValueSelect.value);
    });
  }

  if (potentiometerValuePickerButton && potentiometerValuePickerList) {
    potentiometerValuePickerButton.addEventListener('click', event => {
      event.preventDefault();
      togglePotentiometerValuePicker();
    });
    potentiometerValuePickerButton.addEventListener(
      'keydown',
      handlePotentiometerValueButtonKeydown,
    );
    potentiometerValuePickerList.addEventListener('click', handlePotentiometerValueListClick);
    potentiometerValuePickerList.addEventListener('keydown', handlePotentiometerValueListKeydown);
    potentiometerValuePickerList.addEventListener('focusout', handlePotentiometerValueListFocusOut);
  }

  if (potentiometerTaperSelect) {
    potentiometerTaperSelect.addEventListener('change', () => {
      setPotentiometerTaperSelection(potentiometerTaperSelect.value);
    });
  }

  if (potentiometerTaperPickerButton && potentiometerTaperPickerList) {
    potentiometerTaperPickerButton.addEventListener('click', event => {
      event.preventDefault();
      togglePotentiometerTaperPicker();
    });
    potentiometerTaperPickerButton.addEventListener(
      'keydown',
      handlePotentiometerTaperButtonKeydown,
    );
    potentiometerTaperPickerList.addEventListener('click', handlePotentiometerTaperListClick);
    potentiometerTaperPickerList.addEventListener('keydown', handlePotentiometerTaperListKeydown);
    potentiometerTaperPickerList.addEventListener('focusout', handlePotentiometerTaperListFocusOut);
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

  if (glassSpeedSelect) {
    glassSpeedSelect.addEventListener('change', () => {
      setGlassSpeedSelection(glassSpeedSelect.value);
    });
  }

  if (glassSizeSelect) {
    glassSizeSelect.addEventListener('change', () => {
      setGlassSizeSelection(glassSizeSelect.value);
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
      updateDownloadState();
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
        setCustomIconSelection({ name: '', unicode: '', label: '', style: 'solid' });
        closeCustomIconPicker();
        return;
      }
      setCustomIconSelection({
        name: selected.value,
        unicode: selected.dataset.unicode || '',
        label: selected.dataset.label || selected.textContent || selected.value,
        style: selected.dataset.style || 'solid',
      });
      closeCustomIconPicker();
    });
  }

  if (customPartSelect) {
    customPartSelect.addEventListener('change', () => {
      setCustomGraphicSource('parts');
      setCustomPartSelection(customPartSelect.value);
    });
  }

  if (customPartPickerButton && customPartPickerList) {
    customPartPickerButton.addEventListener('click', event => {
      event.preventDefault();
      toggleCustomPartPicker();
    });
    customPartPickerButton.addEventListener('keydown', handleCustomPartButtonKeydown);
    customPartPickerList.addEventListener('click', handleCustomPartListClick);
    customPartPickerList.addEventListener('keydown', handleCustomPartListKeydown);
    customPartPickerList.addEventListener('focusout', handleCustomPartListFocusOut);
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
      if (state.hardwareType === 'Connector') {
        setConnectorSeriesSelection(standardSelect.value);
        return;
      }
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
  if (switchTypeSelect) {
    switchTypeSelect.addEventListener('change', () => {
      setSwitchTypeSelection(switchTypeSelect.value);
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
  if (switchTypePickerButton && switchTypePickerList) {
    switchTypePickerButton.addEventListener('click', event => {
      event.preventDefault();
      toggleSwitchTypePicker();
    });
    switchTypePickerButton.addEventListener('keydown', handleSwitchTypeButtonKeydown);
    switchTypePickerList.addEventListener('click', handleSwitchTypeListClick);
    switchTypePickerList.addEventListener('keydown', handleSwitchTypeListKeydown);
    switchTypePickerList.addEventListener('focusout', handleSwitchTypeListFocusOut);
  }
  if (connectorCategoryPickerButton && connectorCategoryPickerList) {
    connectorCategoryPickerButton.addEventListener('click', event => {
      event.preventDefault();
      toggleConnectorCategoryPicker();
    });
    connectorCategoryPickerButton.addEventListener(
      'keydown',
      handleConnectorCategoryButtonKeydown,
    );
    connectorCategoryPickerList.addEventListener('click', handleConnectorCategoryListClick);
    connectorCategoryPickerList.addEventListener('keydown', handleConnectorCategoryListKeydown);
    connectorCategoryPickerList.addEventListener('focusout', handleConnectorCategoryListFocusOut);
  }
  if (connectorSeriesPickerButton && connectorSeriesPickerList) {
    connectorSeriesPickerButton.addEventListener('click', event => {
      event.preventDefault();
      toggleConnectorSeriesPicker();
    });
    connectorSeriesPickerButton.addEventListener('keydown', handleConnectorSeriesButtonKeydown);
    connectorSeriesPickerList.addEventListener('click', handleConnectorSeriesListClick);
    connectorSeriesPickerList.addEventListener('keydown', handleConnectorSeriesListKeydown);
    connectorSeriesPickerList.addEventListener('focusout', handleConnectorSeriesListFocusOut);
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
    switchTypePicker ||
    fuseValuePicker ||
    componentMountPicker ||
    resistorValuePicker ||
    capacitorValuePicker ||
    diodeValuePicker ||
    mosfetChannelPicker ||
    mosfetPartPicker ||
    potentiometerValuePicker ||
    potentiometerTaperPicker ||
    bearingTypePicker ||
    connectorCategoryPicker ||
    connectorSeriesPicker ||
    customIconPicker ||
    customPartPicker
  ) {
    document.addEventListener('pointerdown', handleDocumentPointer);
    document.addEventListener('focusin', handleDocumentFocusIn);
  }

  document.addEventListener('gridfinity:fuse-picker-close', () => {
    closeFuseTypePicker();
    closeFuseValuePicker();
  });

  document.addEventListener('gridfinity:switch-picker-close', () => {
    closeSwitchTypePicker();
  });

  document.addEventListener('gridfinity:component-picker-close', () => {
    closeComponentMountPicker();
    closeResistorValuePicker();
    closeCapacitorValuePicker();
    closeDiodeValuePicker();
    closeMosfetChannelPicker();
    closeMosfetPartPicker();
    closePotentiometerValuePicker();
    closePotentiometerTaperPicker();
  });

  document.addEventListener('gridfinity:custom-icon-picker-close', () => {
    closeCustomIconPicker();
  });

  if (textToggle) {
    textToggle.addEventListener('change', () => {
      state.showText = textToggle.checked;
      updateTextOptionsVisibility();
      updateDownloadState();
      updatePreview();
    });
  }

  if (textMainToggle) {
    textMainToggle.addEventListener('change', () => {
      state.showTextMain = textMainToggle.checked;
      updateDownloadState();
      updatePreview();
    });
  }

  if (textInfoToggle) {
    textInfoToggle.addEventListener('change', () => {
      state.showTextInfo = textInfoToggle.checked;
      updateDownloadState();
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