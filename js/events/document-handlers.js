/**
 * Document-level Event Handlers
 *
 * Manages document-level event handlers for closing pickers
 * when clicking outside or focusing elsewhere.
 */

import { elements } from '../dom-elements.js';
import {
  closeFuseTypePicker,
  closeThreadSizePicker,
  closeFuseValuePicker,
  closeGlassSpeedPicker,
  closeGlassSizePicker,
} from './fuse-pickers.js';
import {
  closeComponentMountPicker,
  closeResistorValuePicker,
  closeCapacitorValuePicker,
  closeDiodeValuePicker,
  closeMosfetChannelPicker,
  closeMosfetPartPicker,
  closePotentiometerValuePicker,
  closePotentiometerTaperPicker,
  closeBearingTypePicker,
} from './component-pickers.js';
import {
  closeBoltDrivePicker,
  closeBoltHeadPicker,
  closeNutTypePicker,
  closeWasherTypePicker,
} from './fastener-pickers.js';
import {
  closeSwitchTypePicker,
  closeConnectorCategoryPicker,
  closeConnectorSeriesPicker,
} from './connector-pickers.js';
import {
  closeCustomIconPicker,
  closeCustomPartPicker,
} from './custom-pickers.js';

const {
  fuseTypePicker,
  threadSizePicker,
  boltDrivePicker,
  boltHeadPicker,
  nutTypePicker,
  washerTypePicker,
  switchTypePicker,
  fuseValuePicker,
  glassSpeedPicker,
  glassSizePicker,
  componentMountPicker,
  resistorValuePicker,
  capacitorValuePicker,
  diodeValuePicker,
  mosfetChannelPicker,
  mosfetPartPicker,
  potentiometerValuePicker,
  potentiometerTaperPicker,
  bearingTypePicker,
  connectorCategoryPicker,
  connectorSeriesPicker,
  customIconPicker,
  customPartPicker,
} = elements;

function handleDocumentPointer(event) {
  const target = event.target;
  if (fuseTypePicker && (!(target instanceof Node) || !fuseTypePicker.contains(target))) {
    closeFuseTypePicker();
  }
  if (threadSizePicker && (!(target instanceof Node) || !threadSizePicker.contains(target))) {
    closeThreadSizePicker();
  }
  if (boltDrivePicker && (!(target instanceof Node) || !boltDrivePicker.contains(target))) {
    closeBoltDrivePicker();
  }
  if (boltHeadPicker && (!(target instanceof Node) || !boltHeadPicker.contains(target))) {
    closeBoltHeadPicker();
  }
  if (nutTypePicker && (!(target instanceof Node) || !nutTypePicker.contains(target))) {
    closeNutTypePicker();
  }
  if (washerTypePicker && (!(target instanceof Node) || !washerTypePicker.contains(target))) {
    closeWasherTypePicker();
  }
  if (switchTypePicker && (!(target instanceof Node) || !switchTypePicker.contains(target))) {
    closeSwitchTypePicker();
  }
  if (fuseValuePicker && (!(target instanceof Node) || !fuseValuePicker.contains(target))) {
    closeFuseValuePicker();
  }
  if (glassSpeedPicker && (!(target instanceof Node) || !glassSpeedPicker.contains(target))) {
    closeGlassSpeedPicker();
  }
  if (glassSizePicker && (!(target instanceof Node) || !glassSizePicker.contains(target))) {
    closeGlassSizePicker();
  }
  if (componentMountPicker && (!(target instanceof Node) || !componentMountPicker.contains(target))) {
    closeComponentMountPicker();
  }
  if (resistorValuePicker && (!(target instanceof Node) || !resistorValuePicker.contains(target))) {
    closeResistorValuePicker();
  }
  if (capacitorValuePicker && (!(target instanceof Node) || !capacitorValuePicker.contains(target))) {
    closeCapacitorValuePicker();
  }
  if (diodeValuePicker && (!(target instanceof Node) || !diodeValuePicker.contains(target))) {
    closeDiodeValuePicker();
  }
  if (mosfetChannelPicker && (!(target instanceof Node) || !mosfetChannelPicker.contains(target))) {
    closeMosfetChannelPicker();
  }
  if (mosfetPartPicker && (!(target instanceof Node) || !mosfetPartPicker.contains(target))) {
    closeMosfetPartPicker();
  }
  if (potentiometerValuePicker && (!(target instanceof Node) || !potentiometerValuePicker.contains(target))) {
    closePotentiometerValuePicker();
  }
  if (potentiometerTaperPicker && (!(target instanceof Node) || !potentiometerTaperPicker.contains(target))) {
    closePotentiometerTaperPicker();
  }
  if (bearingTypePicker && (!(target instanceof Node) || !bearingTypePicker.contains(target))) {
    closeBearingTypePicker();
  }
  if (connectorCategoryPicker && (!(target instanceof Node) || !connectorCategoryPicker.contains(target))) {
    closeConnectorCategoryPicker();
  }
  if (connectorSeriesPicker && (!(target instanceof Node) || !connectorSeriesPicker.contains(target))) {
    closeConnectorSeriesPicker();
  }
  if (customIconPicker && (!(target instanceof Node) || !customIconPicker.contains(target))) {
    closeCustomIconPicker();
  }
  if (customPartPicker && (!(target instanceof Node) || !customPartPicker.contains(target))) {
    closeCustomPartPicker();
  }
}

function handleDocumentFocusIn(event) {
  const target = event.target;
  if (fuseTypePicker && (!(target instanceof Node) || !fuseTypePicker.contains(target))) {
    closeFuseTypePicker();
  }
  if (threadSizePicker && (!(target instanceof Node) || !threadSizePicker.contains(target))) {
    closeThreadSizePicker();
  }
  if (boltDrivePicker && (!(target instanceof Node) || !boltDrivePicker.contains(target))) {
    closeBoltDrivePicker();
  }
  if (boltHeadPicker && (!(target instanceof Node) || !boltHeadPicker.contains(target))) {
    closeBoltHeadPicker();
  }
  if (nutTypePicker && (!(target instanceof Node) || !nutTypePicker.contains(target))) {
    closeNutTypePicker();
  }
  if (washerTypePicker && (!(target instanceof Node) || !washerTypePicker.contains(target))) {
    closeWasherTypePicker();
  }
  if (switchTypePicker && (!(target instanceof Node) || !switchTypePicker.contains(target))) {
    closeSwitchTypePicker();
  }
  if (fuseValuePicker && (!(target instanceof Node) || !fuseValuePicker.contains(target))) {
    closeFuseValuePicker();
  }
  if (glassSpeedPicker && (!(target instanceof Node) || !glassSpeedPicker.contains(target))) {
    closeGlassSpeedPicker();
  }
  if (glassSizePicker && (!(target instanceof Node) || !glassSizePicker.contains(target))) {
    closeGlassSizePicker();
  }
  if (componentMountPicker && (!(target instanceof Node) || !componentMountPicker.contains(target))) {
    closeComponentMountPicker();
  }
  if (resistorValuePicker && (!(target instanceof Node) || !resistorValuePicker.contains(target))) {
    closeResistorValuePicker();
  }
  if (capacitorValuePicker && (!(target instanceof Node) || !capacitorValuePicker.contains(target))) {
    closeCapacitorValuePicker();
  }
  if (diodeValuePicker && (!(target instanceof Node) || !diodeValuePicker.contains(target))) {
    closeDiodeValuePicker();
  }
  if (mosfetChannelPicker && (!(target instanceof Node) || !mosfetChannelPicker.contains(target))) {
    closeMosfetChannelPicker();
  }
  if (mosfetPartPicker && (!(target instanceof Node) || !mosfetPartPicker.contains(target))) {
    closeMosfetPartPicker();
  }
  if (potentiometerValuePicker && (!(target instanceof Node) || !potentiometerValuePicker.contains(target))) {
    closePotentiometerValuePicker();
  }
  if (potentiometerTaperPicker && (!(target instanceof Node) || !potentiometerTaperPicker.contains(target))) {
    closePotentiometerTaperPicker();
  }
  if (bearingTypePicker && (!(target instanceof Node) || !bearingTypePicker.contains(target))) {
    closeBearingTypePicker();
  }
  if (connectorCategoryPicker && (!(target instanceof Node) || !connectorCategoryPicker.contains(target))) {
    closeConnectorCategoryPicker();
  }
  if (connectorSeriesPicker && (!(target instanceof Node) || !connectorSeriesPicker.contains(target))) {
    closeConnectorSeriesPicker();
  }
  if (customIconPicker && (!(target instanceof Node) || !customIconPicker.contains(target))) {
    closeCustomIconPicker();
  }
  if (customPartPicker && (!(target instanceof Node) || !customPartPicker.contains(target))) {
    closeCustomPartPicker();
  }
}

// Export functions needed by init.js
export {
  handleDocumentPointer,
  handleDocumentFocusIn,
};
