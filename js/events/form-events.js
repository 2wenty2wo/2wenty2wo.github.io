/**
 * General form event handlers
 * Extracted from events.js
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import { updatePreview, updateDownloadState } from '../render.js';

export function handleDocumentFocusIn(event) {
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