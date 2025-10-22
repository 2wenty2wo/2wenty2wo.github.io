/**
 * forms/index.js
 * Re-exports all form-related functions from modular files
 */

// Thread sizes (already modular)
export { populateThreadSizes, syncThreadSizePicker, setThreadSizeSelection } from '../threadSizes.js';

// switches
export {
  syncSwitchTypePicker,
  setSwitchTypeSelection,
  populateSwitchTypePicker
} from './switches.js';

// fuses
export {
  syncFuseTypePicker,
  setFuseTypeSelection,
  populateFuseTypePicker,
  syncFuseValuePicker,
  setFuseValueSelection,
  populateFuseValues,
  populateGlassSpeedOptions,
  populateGlassSizeOptions,
  syncGlassSpeedPicker,
  syncGlassSizePicker,
  setGlassSpeedSelection,
  setGlassSizeSelection,
  updateGlassOptionVisibility
} from './fuses.js';

// connectors
export {
  syncConnectorSeriesPicker,
  setConnectorSeriesSelection,
  syncConnectorCategoryPicker,
  setConnectorCategorySelection,
  populateConnectorCategories,
  updateConnectorCategoryUi
} from './connectors.js';

// fasteners
export {
  syncBoltDrivePicker,
  setBoltDriveSelection,
  syncBoltHeadPicker,
  setBoltHeadSelection,
  syncNutTypePicker,
  setNutTypeSelection,
  populateNutTypeOptions,
  syncWasherTypePicker,
  setWasherTypeSelection,
  populateWasherTypeOptions,
  syncBearingTypePicker,
  setBearingTypeSelection,
  populateBearingOptions
} from './fasteners.js';

// electronic components
export {
  populateComponentMountPicker,
  syncComponentMountPicker,
  setComponentMountSelection,
  populateResistorValues,
  updateComponentValueUi,
  syncResistorValuePicker,
  setResistorValueSelection,
  populateCapacitorValues,
  populateDiodeValues,
  populateMosfetChannels,
  populateMosfetParts,
  syncCapacitorValuePicker,
  setCapacitorValueSelection,
  syncDiodeValuePicker,
  setDiodeValueSelection,
  syncMosfetChannelPicker,
  setMosfetChannelSelection,
  syncMosfetPartPicker,
  setMosfetPartSelection,
  populatePotentiometerValues,
  populatePotentiometerTapers,
  syncPotentiometerValuePicker,
  syncPotentiometerTaperPicker,
  setPotentiometerValueSelection,
  setPotentiometerTaperSelection
} from './electronic-components.js';

// custom parts
export {
  populateCustomPartPicker,
  syncCustomPartPicker,
  setCustomPartSelection
} from './custom-parts.js';

// custom graphics
export {
  setCustomGraphicSource,
  setCustomIconSelection,
  ensureCustomIconAsset,
  updateCustomImageUi,
  clearCustomImage,
  handleCustomImageFile
} from './custom-graphics.js';

// hardware type
export {
  getHardwareTypePickerMode,
  setHardwareTypeFilterCategory,
  setHardwareTypeSearchQuery,
  populateHardwareTypePicker,
  syncHardwareTypePicker,
  onHardwareTypeChange,
  applyHardwareTypeSelection
} from './hardware-type.js';

// standards
export {
  populateStandards,
  filterStandardOptions,
  clearStandardFilter,
  handleStandardSelectKeydown
} from './standards.js';
