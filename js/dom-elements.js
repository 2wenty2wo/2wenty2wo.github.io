const themeToggleButton = document.getElementById('theme-toggle');
const themeToggleIcon = themeToggleButton
  ? themeToggleButton.querySelector('.theme-toggle-icon')
  : null;
const themeToggleText = themeToggleButton
  ? themeToggleButton.querySelector('.theme-toggle-text')
  : null;

const threadSizeContainer = document.getElementById('thread-size-container');
const threadSizeSelect = document.getElementById('thread-size-select');
const threadSizePicker = document.getElementById('thread-size-picker');
const threadSizePickerButton = document.getElementById('thread-size-picker-button');
const threadSizePickerList = document.getElementById('thread-size-picker-list');
const threadLengthRow = document.getElementById('thread-length-row');
const lengthContainer = document.getElementById('length-container');
const lengthInput = document.getElementById('length-input');
const threadSizeMessage = document.getElementById('thread-size-message');
const lengthMessage = document.getElementById('length-message');
const nutTypeContainer = document.getElementById('nut-type-container');
const nutTypePicker = document.getElementById('nut-type-picker');
const nutTypePickerButton = document.getElementById('nut-type-picker-button');
const nutTypePickerList = document.getElementById('nut-type-picker-list');
const nutTypeSelect = document.getElementById('nut-type-select');
const nutTypeMessage = document.getElementById('nut-type-message');
const fuseSelectionRow = document.getElementById('fuse-selection-row');
const fuseTypeContainer = document.getElementById('fuse-type-container');
const fuseTypeSelect = document.getElementById('fuse-type-select');
const fuseTypePicker = document.getElementById('fuse-type-picker');
const fuseTypePickerButton = document.getElementById('fuse-type-picker-button');
const fuseTypePickerList = document.getElementById('fuse-type-picker-list');
const fuseValueContainer = document.getElementById('fuse-value-container');
const glassOptionsContainer = document.getElementById('glass-options-container');
const fuseValueSelect = document.getElementById('fuse-value-select');
const fuseValuePicker = document.getElementById('fuse-value-picker');
const fuseValuePickerButton = document.getElementById('fuse-value-picker-button');
const fuseValuePickerList = document.getElementById('fuse-value-picker-list');
const glassSizeSelect = document.getElementById('glass-size-select');
const glassSlowBlowCheckbox = document.getElementById('glass-slow-blow');
const glassFastBlowCheckbox = document.getElementById('glass-fast-blow');
const fuseValueMessage = document.getElementById('fuse-value-message');
const notesInput = document.getElementById('notes-input');
const measurementSystemContainer = document.getElementById('measurement-system-container');
const connectorCategoryContainer = document.getElementById('connector-category-container');
const connectorCategorySelect = document.getElementById('connector-category-select');
const connectorCategoryHelp = document.getElementById('connector-category-help');
const connectorNotesHint = document.getElementById('connector-notes-hint');
const connectorCategoryMessage = document.getElementById('connector-category-message');
const connectorNotesMessage = document.getElementById('connector-notes-message');
const componentCategoryContainer = document.getElementById('component-category-container');
const componentMountContainer = document.getElementById('component-mount-container');
const componentMountPicker = document.getElementById('component-mount-picker');
const componentMountPickerButton = document.getElementById('component-mount-picker-button');
const componentMountPickerList = document.getElementById('component-mount-picker-list');
const componentMountSelect = document.getElementById('component-mount-select');
const resistorValueField = document.getElementById('resistor-value-field');
const resistorValuePicker = document.getElementById('resistor-value-picker');
const resistorValuePickerButton = document.getElementById('resistor-value-picker-button');
const resistorValuePickerList = document.getElementById('resistor-value-picker-list');
const resistorValueSelect = document.getElementById('resistor-value-select');
const resistorValueMessage = document.getElementById('resistor-value-message');
const capacitorValueField = document.getElementById('capacitor-value-field');
const capacitorValuePicker = document.getElementById('capacitor-value-picker');
const capacitorValuePickerButton = document.getElementById('capacitor-value-picker-button');
const capacitorValuePickerList = document.getElementById('capacitor-value-picker-list');
const capacitorValueSelect = document.getElementById('capacitor-value-select');
const capacitorValueMessage = document.getElementById('capacitor-value-message');
const diodeValueField = document.getElementById('diode-value-field');
const diodeValuePicker = document.getElementById('diode-value-picker');
const diodeValuePickerButton = document.getElementById('diode-value-picker-button');
const diodeValuePickerList = document.getElementById('diode-value-picker-list');
const diodeValueSelect = document.getElementById('diode-value-select');
const diodeValueMessage = document.getElementById('diode-value-message');
const bearingOptionsContainer = document.getElementById('bearing-options-container');
const bearingTypePicker = document.getElementById('bearing-type-picker');
const bearingTypePickerButton = document.getElementById('bearing-type-picker-button');
const bearingTypePickerList = document.getElementById('bearing-type-picker-list');
const bearingTypeSelect = document.getElementById('bearing-type-select');
const bearingTypeMessage = document.getElementById('bearing-type-message');
const customFieldsContainer = document.getElementById('custom-fields');
const customImageInput = document.getElementById('custom-image-input');
const customImageClearButton = document.getElementById('custom-image-clear');
const customImageNameDisplay = document.getElementById('custom-image-name');
const customLine1Input = document.getElementById('custom-line1-input');
const customLine2Input = document.getElementById('custom-line2-input');
const customLine1Field = document.getElementById('custom-line1-field');
const customLine1Message = document.getElementById('custom-line1-message');
const notesField = document.getElementById('notes-field');
const standardField = document.getElementById('standard-field');
const standardFieldLabel = document.getElementById('standard-field-label');
const boltStandardGroup = document.getElementById('bolt-standard-group');
const boltHeadField = document.getElementById('bolt-head-field');
const boltDriveField = document.getElementById('bolt-drive-field');
const boltHeadLabel = document.querySelector('label[for="bolt-head-select"]');
const boltHeadPicker = document.getElementById('bolt-head-picker');
const boltHeadPickerButton = document.getElementById('bolt-head-picker-button');
const boltHeadPickerList = document.getElementById('bolt-head-picker-list');
const boltDrivePicker = document.getElementById('bolt-drive-picker');
const boltDrivePickerButton = document.getElementById('bolt-drive-picker-button');
const boltDrivePickerList = document.getElementById('bolt-drive-picker-list');
const boltHeadSelect = document.getElementById('bolt-head-select');
const boltDriveSelect = document.getElementById('bolt-drive-select');
const boltHeadMessage = document.getElementById('bolt-head-message');
const boltDriveMessage = document.getElementById('bolt-drive-message');
const notesLabel = document.querySelector('label[for="notes-input"]');
const defaultNotesLabel = notesLabel ? notesLabel.textContent : '';
const defaultNotesPlaceholder = notesInput ? notesInput.getAttribute('placeholder') || '' : '';
const standardSelect = document.getElementById('standard-select');
const standardLabel = standardFieldLabel;
const defaultStandardLabel = standardLabel ? standardLabel.textContent : '';
const standardToggle = document.getElementById('standard-toggle');
const imageToggle = document.getElementById('image-toggle');
const qrcodeToggle = document.getElementById('qrcode-toggle');
const widthRange = document.getElementById('width-range');
const widthValueSpan = document.getElementById('width-value');
const labelSizeDisplay = document.getElementById('label-size-display');
const printAreaDisplay = document.getElementById('print-area-display');
const previewContainer = document.getElementById('preview-container');
const previewViewport = previewContainer ? previewContainer.parentElement : null;
const previewPlaceholder = document.getElementById('preview-placeholder');
const previewStatusText = document.getElementById('preview-status-text');
const labelPreviewImage = document.getElementById('label-preview-image');
const qrContentWrapper = document.getElementById('qr-content-wrapper');
const qrContentInput = document.getElementById('qr-content-input');
const downloadButton = document.getElementById('download-button');
const shareButton = document.getElementById('share-button');
const printButton = document.getElementById('print-button');

const hardwareTypeRadios = Array.from(document.querySelectorAll('input[name="hardware-type"]'));
const hardwareTypeSelect = document.getElementById('hardware-type-select');
const hardwareTypePicker = document.getElementById('hardware-type-picker');
const hardwareTypePickerButton = document.getElementById('hardware-type-picker-button');
const hardwareTypePickerDialog = document.getElementById('hardware-type-picker-dialog');
const hardwareTypePickerFallback = document.getElementById('hardware-type-picker-fallback');
const hardwareTypePickerSurface = hardwareTypePickerDialog
  ? hardwareTypePickerDialog.querySelector('[data-part-type-dialog-surface]')
  : null;
const hardwareTypePickerCloseButton = hardwareTypePicker
  ? hardwareTypePicker.querySelector('[data-part-type-picker-close]')
  : null;
const hardwareTypePickerSearch = document.getElementById('hardware-type-picker-search');
const hardwareTypePickerFilters = document.getElementById('hardware-type-picker-filters');
const hardwareTypePickerRecentSection = document.getElementById('hardware-type-picker-recent-section');
const hardwareTypePickerRecent = document.getElementById('hardware-type-picker-recent');
const hardwareTypePickerList = document.getElementById('hardware-type-picker-list');
const hardwareTypePickerEmpty = document.getElementById('hardware-type-picker-empty');
const hardwareTypeOptions = new Set(
  hardwareTypeRadios
    .map(radio => radio.value)
    .concat(
      hardwareTypeSelect ? Array.from(hardwareTypeSelect.options, option => option.value) : [],
    )
    .filter(Boolean),
);
const systemTypeRadios = Array.from(document.querySelectorAll('input[name="system-type"]'));
const heightRadios = Array.from(document.querySelectorAll('input[name="label-height"]'));
const componentCategoryRadios = Array.from(
  document.querySelectorAll('input[name="component-category"]'),
);
const componentCategoryMessage = document.getElementById('component-category-message');
const componentMountMessage = document.getElementById('component-mount-message');
const formStatusMessage = document.getElementById('form-status-message');

export const elements = {
  themeToggleButton,
  themeToggleIcon,
  themeToggleText,
  threadSizeContainer,
  threadSizeSelect,
  threadSizePicker,
  threadSizePickerButton,
  threadSizePickerList,
  threadLengthRow,
  lengthContainer,
  lengthInput,
  threadSizeMessage,
  lengthMessage,
  nutTypeContainer,
  nutTypePicker,
  nutTypePickerButton,
  nutTypePickerList,
  nutTypeSelect,
  nutTypeMessage,
  fuseSelectionRow,
  fuseTypeContainer,
  fuseTypeSelect,
  fuseTypePicker,
  fuseTypePickerButton,
  fuseTypePickerList,
  fuseValueContainer,
  glassOptionsContainer,
  fuseValueSelect,
  fuseValuePicker,
  fuseValuePickerButton,
  fuseValuePickerList,
  glassSizeSelect,
  glassSlowBlowCheckbox,
  glassFastBlowCheckbox,
  fuseValueMessage,
  notesInput,
  measurementSystemContainer,
  connectorCategoryContainer,
  connectorCategorySelect,
  connectorCategoryHelp,
  connectorNotesHint,
  connectorCategoryMessage,
  connectorNotesMessage,
  componentCategoryContainer,
  componentMountContainer,
  componentMountPicker,
  componentMountPickerButton,
  componentMountPickerList,
  componentMountSelect,
  resistorValueField,
  resistorValuePicker,
  resistorValuePickerButton,
  resistorValuePickerList,
  resistorValueSelect,
  resistorValueMessage,
  capacitorValueField,
  capacitorValuePicker,
  capacitorValuePickerButton,
  capacitorValuePickerList,
  capacitorValueSelect,
  capacitorValueMessage,
  diodeValueField,
  diodeValuePicker,
  diodeValuePickerButton,
  diodeValuePickerList,
  diodeValueSelect,
  diodeValueMessage,
  bearingOptionsContainer,
  bearingTypePicker,
  bearingTypePickerButton,
  bearingTypePickerList,
  bearingTypeSelect,
  bearingTypeMessage,
  customFieldsContainer,
  customImageInput,
  customImageClearButton,
  customImageNameDisplay,
  customLine1Input,
  customLine2Input,
  customLine1Field,
  customLine1Message,
  notesField,
  standardField,
  standardFieldLabel,
  boltStandardGroup,
  boltHeadField,
  boltDriveField,
  boltHeadLabel,
  boltHeadPicker,
  boltHeadPickerButton,
  boltHeadPickerList,
  boltDrivePicker,
  boltDrivePickerButton,
  boltDrivePickerList,
  boltHeadSelect,
  boltDriveSelect,
  boltHeadMessage,
  boltDriveMessage,
  notesLabel,
  defaultNotesLabel,
  defaultNotesPlaceholder,
  standardSelect,
  standardLabel,
  defaultStandardLabel,
  standardToggle,
  imageToggle,
  qrcodeToggle,
  widthRange,
  widthValueSpan,
  labelSizeDisplay,
  printAreaDisplay,
  previewViewport,
  previewContainer,
  previewPlaceholder,
  previewStatusText,
  labelPreviewImage,
  qrContentWrapper,
  qrContentInput,
  downloadButton,
  shareButton,
  printButton,
  hardwareTypeRadios,
  hardwareTypeSelect,
  hardwareTypePicker,
  hardwareTypePickerButton,
  hardwareTypePickerDialog,
  hardwareTypePickerFallback,
  hardwareTypePickerSurface,
  hardwareTypePickerCloseButton,
  hardwareTypePickerSearch,
  hardwareTypePickerFilters,
  hardwareTypePickerRecentSection,
  hardwareTypePickerRecent,
  hardwareTypePickerList,
  hardwareTypePickerEmpty,
  hardwareTypeOptions,
  systemTypeRadios,
  heightRadios,
  componentCategoryRadios,
  componentCategoryMessage,
  componentMountMessage,
  formStatusMessage,
};
