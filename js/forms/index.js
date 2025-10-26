/**
 * Forms Module Index
 *
 * Re-exports all form handling functions from submodules to maintain
 * backward compatibility with the original forms.js API.
 */

// Re-export from bearing-picker module
export {
  syncBearingTypePicker,
  setBearingTypeSelection,
  populateBearingOptions,
} from './bearing-picker.js';

// Re-export from component-mount module
export {
  populateComponentMountPicker,
  syncComponentMountPicker,
  setComponentMountSelection,
} from './component-mount.js';

// Re-export from custom-part-picker module
export {
  populateCustomPartPicker,
  syncCustomPartPicker,
  setCustomPartSelection,
} from './custom-part-picker.js';

// Re-export everything else from forms-core
export * from './forms-core.js';
