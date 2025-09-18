/*
 * Client side logic for this Gridfinity label generator.  This script
 * orchestrates form interactions, populates the drop‑down menus, updates
 * the live preview, generates optional QR codes, and creates printable
 * images on demand.  The code is written without any external framework
 * and aims to be as clear and concise as possible.
 */

(function() {
  // Basic configuration values.  Feel free to extend these lists to
  // support additional screw sizes, imperial standards, or alternate
  // hardware types in the future.
  const metricThreadSizes = [
    'M1', 'M1.2', 'M1.4', 'M1.6', 'M2', 'M2.5', 'M3', 'M3.5', 'M4',
    'M5', 'M6', 'M7', 'M8', 'M10', 'M12', 'M14', 'M16', 'M18', 'M20',
    'M22', 'M24', 'M30'
  ];
  const imperialThreadSizes = [
    '#4‑40', '#6‑32', '#8‑32', '#10‑24', '1/4‑20', '5/16‑18', '3/8‑16', '7/16‑14', '1/2‑13'
  ];
  const fuseValues = [
    '0.25', '0.5', '0.75', '1', '1.5', '2', '2.5', '3', '4', '5', '6', '7.5', '8', '10', '12',
    '15', '20', '25', '30', '40'
  ];
  // Hardware standards grouped by hardware category (Bolt, Screw, Nut,
  // Washer, Heat Insert).  Each entry contains both the standard code and a short
  // descriptive name so the dropdown can present meaningful context to
  // the user.  Only DIN/ISO standards provided by the user are included
  // here, organised by the hardware they apply to.
  const hardwareCatalog = {
    Bolt: [
      { code: 'DIN 11014', name: 'Hexagon Head Screw' },
      { code: 'DIN 15237', name: 'Slotted Raised Countersunk Head Screw' },
      { code: 'DIN 186', name: 'Square Head Bolt' },
      { code: 'DIN 21346', name: 'Slotted Pan Head Screw' },
      { code: 'DIN 22424', name: 'Slotted Pan Head Screw' },
      { code: 'DIN 25193', name: 'Slotted Pan Head Screw' },
      { code: 'DIN 261', name: 'Hexagon Head Screw' },
      { code: 'DIN 316', name: 'Wing Screw' },
      { code: 'DIN 34817', name: 'Pan Head Screw' },
      { code: 'DIN 404', name: 'Square Head Set Screw' },
      { code: 'DIN 444', name: 'Eye Bolt with Collar' },
      { code: 'DIN 464', name: 'Knurled Thumb Screw' },
      { code: 'DIN 478', name: 'Knurled Head Screw' },
      { code: 'DIN 479', name: 'Knurled Head Screw with Shoulder' },
      { code: 'DIN 480', name: 'Slotted Knurled Head Screw' },
      { code: 'DIN 561', name: 'Square Head Set Screw' },
      { code: 'DIN 564', name: 'Slotted Set Screw with Long Dog Point' },
      { code: 'DIN 580', name: 'Lifting Eye Bolt' },
      { code: 'DIN 5903', name: 'Slotted Pan Head Screw' },
      { code: 'DIN 603', name: 'Mushroom Head Square Neck Bolt' },
      { code: 'DIN 604', name: 'Square Head Bolt with Square Neck' },
      { code: 'DIN 605', name: 'Square Head Bolt with Round Neck' },
      { code: 'DIN 607', name: 'Round Head Square Neck Bolt' },
      { code: 'DIN 608', name: 'Round Head Square Neck Bolt' },
      { code: 'DIN 609', name: 'Fit Bolt with Hexagon Head' },
      { code: 'DIN 610', name: 'Fit Bolt with Round Head' },
      { code: 'DIN 653', name: 'Recessed Head Screw' },
      { code: 'DIN 6912', name: 'Hexagon Socket Head Cap Screw with Low Head' },
      { code: 'DIN 6914', name: 'High-Strength Hexagon Head Bolt' },
      { code: 'DIN 6921', name: 'Hexagon Flange Head Bolt' },
      { code: 'DIN 787', name: 'Round Head Screw with Square Neck' },
      { code: 'DIN 792', name: 'Square Head Bolt with Square Shoulder' },
      { code: 'DIN 7968', name: 'Hexagon Fit Bolt' },
      { code: 'DIN 7969', name: 'Hexagon Head Bolt with Hexagon Collar' },
      { code: 'DIN 7984', name: 'Hexagon Socket Head Cap Screw with Low Head' },
      { code: 'DIN 7990', name: 'Hexagon Head Bolt for Steel Structures' },
      { code: 'DIN 7991', name: 'Hexagon Socket Countersunk Head Cap Screw' },
      { code: 'DIN 7999', name: 'Cross Recessed Pan Head Tapping Screw' },
      { code: 'DIN 912', name: 'Hexagon Socket Head Cap Screw' },
      { code: 'DIN 931', name: 'Hexagon Head Bolt' },
      { code: 'DIN 933', name: 'Hexagon Head Screw' },
      { code: 'DIN 960', name: 'Hexagon Head Fit Bolt' },
      { code: 'DIN 961', name: 'Hexagon Head Fit Bolt' },
      { code: 'ISO 7379', name: 'Hexagon Socket Head Shoulder Screw' },
      { code: 'ISO 7380-1', name: 'Button Head Screw' },
      { code: 'ISO 7380-2', name: 'Button Head Screw with Collar' }
    ],
    Screw: [
      { code: 'DIN 571', name: 'Coach Screw (Wood Screw)' },
      { code: 'DIN 7995', name: 'Cross Recessed Pan Head Wood Screw' },
      { code: 'DIN 7996', name: 'Cross Recessed Countersunk Head Wood Screw' },
      { code: 'DIN 7997', name: 'Cross Recessed Raised Countersunk Head Wood Screw' },
      { code: 'DIN 95', name: 'Round Head Wood Screw' },
      { code: 'DIN 96', name: 'Raised Countersunk Head Wood Screw' },
      { code: 'DIN 97', name: 'Countersunk Head Wood Screw' }
    ],
    Nut: [
      { code: 'DIN 1478', name: 'Wing Nut' },
      { code: 'DIN 1479', name: 'Wing Nut' },
      { code: 'DIN 1480', name: 'Wing Nut' },
      { code: 'DIN 1587', name: 'Cap Nut' },
      { code: 'DIN 1804', name: 'Slotted Round Nut' },
      { code: 'DIN 1816', name: 'Square Weld Nut' },
      { code: 'DIN 315', name: 'Wing Nut' },
      { code: 'DIN 431', name: 'Square Nut' },
      { code: 'DIN 439', name: 'Hexagon Thin Nut' },
      { code: 'DIN 466', name: 'Square Nut' },
      { code: 'DIN 467', name: 'Knurled Nut' },
      { code: 'DIN 508', name: 'T-Slot Nut' },
      { code: 'DIN 546', name: 'Small Hexagon Nut' },
      { code: 'DIN 557', name: 'Square Nut' },
      { code: 'DIN 562', name: 'Square Thin Nut' },
      { code: 'DIN 582', name: 'Eye Nut' },
      { code: 'DIN 6330', name: 'Hexagon Nut' },
      { code: 'DIN 6331', name: 'Hexagon High Nut' },
      { code: 'DIN 6334', name: 'Hexagon High Nut' },
      { code: 'DIN 6915', name: 'High-Strength Hexagon Nut' },
      { code: 'DIN 6923', name: 'Hexagon Flange Nut' },
      { code: 'DIN 6925', name: 'Hexagon Weld Nut' },
      { code: 'DIN 6926', name: 'Prevailing Torque Type Hexagon Nut' },
      { code: 'DIN 6927', name: 'Prevailing Torque Type Hexagon Thin Nut' },
      { code: 'DIN 70852', name: 'Hexagon Nut with Flange' },
      { code: 'DIN 74361', name: 'Hexagon Nut with Flange' },
      { code: 'DIN 7965', name: 'Square Weld Nut' },
      { code: 'DIN 7967', name: 'Prevailing Torque Type Hexagon Nut' },
      { code: 'DIN 80701', name: 'Hexagon Nut' },
      { code: 'DIN 80705', name: 'Hexagon Nut' },
      { code: 'DIN 917', name: 'Cap Nut' },
      { code: 'DIN 928', name: 'Hexagon Weld Nut' },
      { code: 'DIN 929', name: 'Hexagon Weld Nut' },
      { code: 'DIN 934', name: 'Hexagon Nut' },
      { code: 'DIN 935', name: 'Castle Nut' },
      { code: 'DIN 936', name: 'Hexagon Thin Nut' },
      { code: 'DIN 937', name: 'Hexagon Thin Slotted Nut' },
      { code: 'DIN 979', name: 'Hexagon Slotted Nut' },
      { code: 'DIN 980', name: 'Prevailing Torque Type Hexagon Nut' },
      { code: 'DIN 981', name: 'Slotted Round Nut' },
      { code: 'DIN 982', name: 'Prevailing Torque Type Hexagon Nut' },
      { code: 'DIN 985', name: 'Prevailing Torque Type Hexagon Nut' },
      { code: 'DIN 986', name: 'Prevailing Torque Type Hexagon Thin Nut' },
      { code: 'ISO 7040', name: 'Prevailing Torque Type Hexagon Nut' }
    ],
    Washer: [
      { code: 'DIN 1052', name: 'Washer for Wood Construction' },
      { code: 'DIN 125', name: 'Plain Washer' },
      { code: 'DIN 127', name: 'Spring Lock Washer' },
      { code: 'DIN 128', name: 'Spring Lock Washer' },
      { code: 'DIN 137', name: 'Spring Lock Washer' },
      { code: 'DIN 1440', name: 'Plain Washer' },
      { code: 'DIN 1441', name: 'Plain Washer' },
      { code: 'DIN 2093', name: 'Disc Spring' },
      { code: 'DIN 25201', name: 'Wedge Lock Washer' },
      { code: 'DIN 432', name: 'Square Washer' },
      { code: 'DIN 433', name: 'Plain Washer' },
      { code: 'DIN 434', name: 'Square Taper Washer' },
      { code: 'DIN 435', name: 'Square Taper Washer' },
      { code: 'DIN 436', name: 'Square Washer' },
      { code: 'DIN 440', name: 'Plain Washer' },
      { code: 'DIN 462', name: 'Square Washer' },
      { code: 'DIN 463', name: 'Square Washer' },
      { code: 'DIN 5406', name: 'Tooth Lock Washer' },
      { code: 'DIN 6319', name: 'Spherical Washer' },
      { code: 'DIN 6340', name: 'Heavy Duty Plain Washer' },
      { code: 'DIN 6796', name: 'Conical Spring Washer' },
      { code: 'DIN 6797', name: 'Tooth Lock Washer' },
      { code: 'DIN 6798', name: 'Tooth Lock Washer' },
      { code: 'DIN 6916', name: 'High-Strength Structural Washer' },
      { code: 'DIN 6917', name: 'Square Taper Washer' },
      { code: 'DIN 6918', name: 'Square Taper Washer' },
      { code: 'DIN 70952', name: 'Plain Washer' },
      { code: 'DIN 7349', name: 'Heavy Duty Plain Washer' },
      { code: 'DIN 74361', name: 'Plain Washer' },
      { code: 'DIN 7603', name: 'Sealing Washer' },
      { code: 'DIN 7980', name: 'Spring Lock Washer' },
      { code: 'DIN 7989', name: 'Plain Washer' },
      { code: 'DIN 9021', name: 'Plain Washer' },
      { code: 'DIN 93', name: 'Tab Washer' },
      { code: 'DIN 988', name: 'Shim Ring' }
    ],
    'Heat Insert': [],
    Connector: [
      { code: 'JST-PH', name: '2.0 mm wire-to-board plug (PH series)' },
      { code: 'JST-XH', name: '2.5 mm wire-to-board plug (XH series)' },
      { code: 'JST-SH', name: '1.0 mm wire-to-board plug (SH series)' },
      { code: 'JST-GH', name: '1.25 mm wire-to-board plug (GH series)' },
      { code: 'JST-ZH', name: '1.5 mm wire-to-board plug (ZH series)' },
      { code: 'JST-VH', name: '3.96 mm wire-to-board plug (VH series)' },
      { code: 'JST-SM', name: '2.54 mm wire-to-wire plug (SM series)' },
      { code: 'JST-JWPF', name: '2.0 mm sealed connector (JWPF series)' },
      { code: 'JST-RCY', name: '2.54 mm battery connector (RCY series)' }
    ],
    Fuse: [
      { code: 'IEC 60127-2', name: 'Time-Lag Cartridge Fuse' },
      { code: 'IEC 60127-3', name: 'Fast-Acting Cartridge Fuse' },
      { code: 'UL 248-14', name: 'Supplementary Fuse' }
    ]
  };

  // Ratio of preview pixels per millimetre.  This value controls how
  // large the label appears onscreen.  The physical dimensions of the
  // downloaded image are independent of this ratio because html2canvas
  // rescaling is used at capture time.
  // Increase the on‑screen pixels per millimetre to better mirror the
  // intended proportions of the interface.  A higher value makes
  // the preview larger and the hardware illustrations more legible.
  const pxPerMm = 6;

  // Grab references to all relevant DOM nodes once at startup.
  const screwTypeContainer = document.getElementById('screw-type-container');
  const threadSizeContainer = document.getElementById('thread-size-container');
  const threadSizeSelect = document.getElementById('thread-size-select');
  const threadLengthRow = document.getElementById('thread-length-row');
  const lengthContainer = document.getElementById('length-container');
  const lengthInput = document.getElementById('length-input');
  const fuseTypeContainer = document.getElementById('fuse-type-container');
  const fuseValueContainer = document.getElementById('fuse-value-container');
  const glassOptionsContainer = document.getElementById('glass-options-container');
  const fuseValueSelect = document.getElementById('fuse-value-select');
  const glassSizeSelect = document.getElementById('glass-size-select');
  const glassSlowBlowCheckbox = document.getElementById('glass-slow-blow');
  const glassFastBlowCheckbox = document.getElementById('glass-fast-blow');
  const notesInput = document.getElementById('notes-input');
  const measurementSystemContainer = document.getElementById('measurement-system-container');
  const connectorNotesHint = document.getElementById('connector-notes-hint');
  const notesLabel = document.querySelector('label[for="notes-input"]');
  const defaultNotesLabel = notesLabel ? notesLabel.textContent : '';
  const defaultNotesPlaceholder = notesInput ? notesInput.getAttribute('placeholder') || '' : '';
  const standardSelect = document.getElementById('standard-select');
  const standardToggle = document.getElementById('standard-toggle');
  const imageToggle = document.getElementById('image-toggle');
  const qrcodeToggle = document.getElementById('qrcode-toggle');
  const widthRange = document.getElementById('width-range');
  const widthValueSpan = document.getElementById('width-value');
  const labelSizeDisplay = document.getElementById('label-size-display');
  const printAreaDisplay = document.getElementById('print-area-display');
  const previewContainer = document.getElementById('preview-container');
  const labelInner = document.getElementById('label-inner');
  const hardwareImageDiv = document.getElementById('hardware-image');
  const line1Div = document.getElementById('line1');
  const line2Div = document.getElementById('line2');
  const qrCanvas = document.getElementById('qr-canvas');
  const qrContentWrapper = document.getElementById('qr-content-wrapper');
  const qrContentInput = document.getElementById('qr-content-input');
  const downloadButton = document.getElementById('download-button');
  const printButton = document.getElementById('print-button');

  const hardwareTypeRadios = document.querySelectorAll('input[name="hardware-type"]');
  const systemTypeRadios = document.querySelectorAll('input[name="system-type"]');
  const screwTypeRadios = document.querySelectorAll('input[name="screw-type"]');
  const fuseTypeRadios = document.querySelectorAll('input[name="fuse-type"]');
  const heightRadios = document.querySelectorAll('input[name="label-height"]');

  // Keep track of current selections.  This state object drives the preview
  // and can be extended easily in the future.
  const state = {
    hardwareType: 'Screw',
    systemType: 'Metric',
    screwType: 'Bolt',
    fuseType: 'Glass',
    threadSize: '',
    length: '',
    fuseValue: '',
    glassSpeed: '',
    glassSize: '',
    notes: '',
    standard: '',
    showStandard: true,
    showImage: true,
    showQr: false,
    qrContent: '',
    widthMm: 55,
    heightMm: 12
  };

  const STANDARD_PLACEHOLDER_TEXT = 'Select standard… (type to filter, Esc clears)';
  const standardFilterState = {
    query: ''
  };

  /**
   * Populate the thread size <select> element based on the current
   * measurement system (metric or imperial).  Called whenever the
   * hardware or system selection changes.
   */
  function populateThreadSizes() {
    if (state.hardwareType === 'Fuse' || state.hardwareType === 'Connector') {
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
    // Clear existing options
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
    // Reset current selection
    state.threadSize = '';
    threadSizeSelect.value = '';
    updateDownloadState();
    updatePreview();
  }

  function populateFuseValues() {
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

  function updateGlassOptionVisibility({ resetIfHidden = false } = {}) {
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

  /**
   * Populate the hardware standard <select> element with the standards
   * relevant to the current hardware selection.
   */
  function populateStandards() {
    standardSelect.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';

    let standards = [];
    if (state.hardwareType === 'Screw') {
      const subset = hardwareCatalog[state.screwType];
      standards = Array.isArray(subset) ? subset : [];
    } else {
      const subset = hardwareCatalog[state.hardwareType];
      standards = Array.isArray(subset) ? subset : [];
    }

    standardFilterState.query = '';

    if (standards.length === 0) {
      placeholder.textContent = 'No standards available';
      placeholder.dataset.defaultText = placeholder.textContent;
      placeholder.disabled = false;
      placeholder.selected = true;
      standardSelect.appendChild(placeholder);
      standardSelect.disabled = true;
      standardSelect.title = '';
    } else {
      placeholder.textContent = STANDARD_PLACEHOLDER_TEXT;
      placeholder.dataset.defaultText = placeholder.textContent;
      placeholder.disabled = false;
      placeholder.selected = true;
      standardSelect.appendChild(placeholder);
      standards.forEach(entry => {
        const opt = document.createElement('option');
        opt.value = entry.code;
        opt.textContent = `${entry.code} — ${entry.name}`;
        opt.dataset.name = entry.name;
        standardSelect.appendChild(opt);
      });
      standardSelect.disabled = false;
      standardSelect.title = 'Type to filter standards (Esc clears filter)';
      filterStandardOptions('');
    }

    state.standard = '';
    standardSelect.value = '';
    standardSelect.selectedIndex = 0;
    updatePreview();
  }

  function filterStandardOptions(query) {
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

  function clearStandardFilter() {
    standardFilterState.query = '';
    if (!standardSelect || standardSelect.disabled) {
      return;
    }
    filterStandardOptions('');
  }

  function handleStandardSelectKeydown(event) {
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

  /**
   * Handle changes when the hardware type (Screw, Nut, Washer) changes.
   * Show or hide relevant form fields accordingly.
   */
  function onHardwareTypeChange() {
    const type = state.hardwareType;
    const showScrewFields = type === 'Screw';
    const showFuseFields = type === 'Fuse';
    const showConnectorFields = type === 'Connector';

    if (screwTypeContainer) {
      screwTypeContainer.style.display = showScrewFields ? '' : 'none';
    }
    if (lengthContainer) {
      lengthContainer.style.display = showScrewFields ? '' : 'none';
    }

    if (measurementSystemContainer) {
      const hideMeasurementSystem = showFuseFields || showConnectorFields;
      measurementSystemContainer.style.display = hideMeasurementSystem ? 'none' : '';
      measurementSystemContainer.setAttribute('aria-hidden', hideMeasurementSystem ? 'true' : 'false');
    }
    systemTypeRadios.forEach(radio => {
      radio.disabled = showFuseFields || showConnectorFields;
    });

    if (threadLengthRow) {
      const hideThreadLength = showFuseFields || showConnectorFields;
      threadLengthRow.classList.toggle(
        'single-column',
        !showScrewFields && !showFuseFields && !showConnectorFields
      );
      threadLengthRow.style.display = hideThreadLength ? 'none' : '';
    }
    if (threadSizeContainer) {
      threadSizeContainer.style.display = showFuseFields || showConnectorFields ? 'none' : '';
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
    if (notesLabel) {
      notesLabel.textContent = showConnectorFields ? 'Connector Details' : defaultNotesLabel;
    }
    if (notesInput) {
      if (showConnectorFields) {
        notesInput.placeholder = 'e.g., 3-pin JST-PH plug, 26 AWG leads';
        notesInput.required = true;
        notesInput.setAttribute('aria-required', 'true');
      } else {
        notesInput.placeholder = defaultNotesPlaceholder;
        notesInput.required = false;
        notesInput.setAttribute('aria-required', 'false');
      }
    }
    updateGlassOptionVisibility({ resetIfHidden: !showFuseFields });
    populateThreadSizes();
    populateStandards();
    updateDownloadState();
  }

  /**
   * Compose the hardware illustration as an inline SVG string.  We draw
   * simple shapes to represent bolts, screws, nuts and washers.  When
   * additional types are added, extend this function accordingly.  The
   * resulting markup is inserted into the preview.
   */
  function getHardwareIcon(iconHeight) {
    /*
     * Construct blueprint‑style illustrations for each hardware type.  We
     * avoid using any external icon libraries so that the artwork is
     * guaranteed to render in any environment.  Each icon is drawn in
     * a 100×100 viewBox and scaled down via CSS to the desired
     * height.  For screws and nuts two views are shown: a side view
     * followed by a top view.  Bolts and screws are distinguished by
     * their head shapes.  Nuts and washers use only geometric
     * primitives.  Strokes remain black with round endcaps to echo
     * classic mechanical drawings.
     */
    const color = '#000000';
    // Use a slightly thicker stroke for better visibility at small sizes
    const strokeWidth = 3;
    // Helper: assemble an SVG with a standard viewBox and styling
    function buildSvg(body) {
      return `<svg viewBox="0 0 100 100" style="height:${iconHeight}px; width:auto;" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
    }
    const pieces = [];
    // Determine which artwork to draw based on the current state
    const type = state.hardwareType;
    if (type === 'Screw') {
      if (state.screwType === 'Bolt') {
        // Bolt side: hex head on left, threaded shaft on right
        pieces.push(buildSvg(`
          <!-- Bolt side view -->
          <polygon points="5,50 20,30 40,30 55,50 40,70 20,70" />
          <rect x="55" y="42" width="35" height="16" />
          <line x1="55" y1="46" x2="90" y2="46" />
          <line x1="55" y1="54" x2="90" y2="54" />
          <line x1="55" y1="62" x2="90" y2="62" />
        `));
        // Bolt top: outer circle and hex cap; bolts typically do not have
        // cross or slot markings on their head.  Omitting the cross
        // emphasises the hex shape.
        pieces.push(buildSvg(`
          <!-- Bolt top view -->
          <circle cx="50" cy="50" r="45" />
          <polygon points="50,10 78,25 90,50 78,75 50,90 22,75 10,50 22,25" />
        `));
      } else {
        // Screw side: round head with slot and tapered threaded body
        pieces.push(buildSvg(`
          <!-- Screw side view -->
          <circle cx="25" cy="40" r="18" />
          <line x1="15" y1="40" x2="35" y2="40" />
          <rect x="35" y="45" width="40" height="12" />
          <polyline points="75,57 88,52 95,60" />
          <line x1="35" y1="48" x2="75" y2="48" />
          <line x1="35" y1="54" x2="75" y2="54" />
          <line x1="35" y1="60" x2="75" y2="60" />
        `));
        // Screw top: circle with single slot across
        pieces.push(buildSvg(`
          <!-- Screw top view -->
          <circle cx="50" cy="50" r="45" />
          <line x1="20" y1="50" x2="80" y2="50" />
        `));
      }
    } else if (type === 'Nut') {
      // Nut side: elongated hexagon
      pieces.push(buildSvg(`
        <!-- Nut side view -->
        <polygon points="5,50 20,32 40,32 60,50 40,68 20,68" />
      `));
      // Nut top: outer hex and inner hex ring
      pieces.push(buildSvg(`
        <!-- Nut top view -->
        <polygon points="5,50 20,32 40,32 60,50 40,68 20,68" />
        <polygon points="25,50 33,42 44,42 55,50 44,58 33,58" />
      `));
    } else if (type === 'Washer') {
      // Washer: simple ring
      pieces.push(buildSvg(`
        <!-- Washer -->
        <circle cx="50" cy="50" r="45" />
        <circle cx="50" cy="50" r="20" />
      `));
    } else if (type === 'Heat Insert') {
      // Heat insert: tapered body with knurling and a top view showing the bore
      pieces.push(buildSvg(`
        <!-- Heat insert side view -->
        <path d="M30 20H70L82 48 70 80H30L18 48Z" />
        <line x1="32" y1="30" x2="68" y2="30" />
        <line x1="28" y1="40" x2="72" y2="40" />
        <line x1="26" y1="50" x2="74" y2="50" />
        <line x1="28" y1="60" x2="72" y2="60" />
        <line x1="32" y1="70" x2="68" y2="70" />
      `));
      pieces.push(buildSvg(`
        <!-- Heat insert top view -->
        <circle cx="50" cy="50" r="42" />
        <polygon points="50,18 72,30 82,50 72,70 50,82 28,70 18,50 28,30" />
        <circle cx="50" cy="50" r="18" />
      `));
    } else if (type === 'Connector') {
      // Connector: pair of insulated crimp terminals, showing sleeve and mating end
      pieces.push(buildSvg(`
        <!-- Insulated crimp connectors -->
        <path d="M22 72L34 28H56L44 72Z" />
        <rect x="34" y="20" width="12" height="8" />
        <rect x="62" y="32" width="26" height="34" rx="8" />
        <polygon points="70,20 82,20 90,34 78,34" />
        <line x1="48" y1="52" x2="62" y2="46" />
        <line x1="46" y1="60" x2="60" y2="54" />
      `));
    } else if (type === 'Fuse') {
      if (state.fuseType === 'Glass') {
        pieces.push(buildSvg(`
          <!-- Glass fuse side view -->
          <rect x="18" y="42" width="64" height="16" rx="8" />
          <line x1="18" y1="42" x2="18" y2="58" />
          <line x1="82" y1="42" x2="82" y2="58" />
          <line x1="30" y1="50" x2="70" y2="50" />
        `));
      } else {
        pieces.push(buildSvg(`
          <!-- Blade fuse front view -->
          <rect x="22" y="28" width="56" height="40" rx="8" />
          <rect x="28" y="68" width="12" height="18" />
          <rect x="60" y="68" width="12" height="18" />
          <line x1="38" y1="44" x2="62" y2="44" />
          <line x1="38" y1="52" x2="62" y2="52" />
        `));
      }
    }
    return pieces.join('');
  }

  /**
   * Update the label preview area.  This function reads the state
   * object, computes the label dimensions, populates the texts and
   * optionally shows or hides the hardware icon and QR code.
   */
  function updatePreview() {
    // Compute the physical sizes and printable area
    const width = state.widthMm;
    const height = state.heightMm;
    const printableWidth = Math.max(0, width - 4); // 2mm margin each side
    const printableHeight = Math.max(0, height - 2); // 1mm margin top/bottom
    labelSizeDisplay.innerHTML = `${width}&nbsp;mm ×&nbsp;${height}&nbsp;mm (label size)`;
    printAreaDisplay.innerHTML = `${printableWidth}&nbsp;mm ×&nbsp;${printableHeight}&nbsp;mm (printable area)`;
    // Compute preview container dimensions in pixels
    const pxWidth = width * pxPerMm;
    const pxHeight = height * pxPerMm;
    previewContainer.style.width = pxWidth + 'px';
    previewContainer.style.height = pxHeight + 'px';
    // Compute inner label margins (2mm side margins, 1mm top/bottom)
    const marginX = 2 * pxPerMm;
    const marginY = 1 * pxPerMm;
    const innerWidthPx = Math.max(0, pxWidth - 2 * marginX);
    const innerHeightPx = Math.max(0, pxHeight - 2 * marginY);
    // Position and size the yellow label
    labelInner.style.width = innerWidthPx + 'px';
    labelInner.style.height = innerHeightPx + 'px';
    labelInner.style.left = marginX + 'px';
    labelInner.style.top = marginY + 'px';
    // Icon area: size artwork so that each SVG matches the printable height.
    // For screws and nuts two views are displayed side-by-side; when the
    // label is too narrow to accommodate their natural width they are scaled
    // down uniformly to preserve their aspect ratio.
    if (state.showImage) {
      const multiViewTypes = ['Screw', 'Nut', 'Heat Insert'];
      const iconCount = multiViewTypes.includes(state.hardwareType) ? 2 : 1;
      const iconGapPx = 8; // Match the CSS gap on .hardware-icon
      if (iconCount > 0) {
        let iconHeightPx = innerHeightPx;
        const maxStripWidth = innerWidthPx;
        const naturalStripWidth = iconCount * iconHeightPx + (iconCount - 1) * iconGapPx;
        if (naturalStripWidth > maxStripWidth) {
          const availablePerIcon = Math.floor((maxStripWidth - (iconCount - 1) * iconGapPx) / iconCount);
          iconHeightPx = Math.max(0, Math.min(iconHeightPx, availablePerIcon));
        }
        const finalStripWidth = Math.max(0, iconCount * iconHeightPx + (iconCount - 1) * iconGapPx);
        hardwareImageDiv.style.display = 'flex';
        hardwareImageDiv.style.maxWidth = finalStripWidth + 'px';
        hardwareImageDiv.style.flexBasis = finalStripWidth + 'px';
        hardwareImageDiv.style.flexShrink = '0';
        hardwareImageDiv.innerHTML = getHardwareIcon(iconHeightPx);
      } else {
        hardwareImageDiv.style.display = 'none';
        hardwareImageDiv.innerHTML = '';
        hardwareImageDiv.style.removeProperty('max-width');
        hardwareImageDiv.style.removeProperty('flex-basis');
        hardwareImageDiv.style.removeProperty('flex-shrink');
      }
    } else {
      hardwareImageDiv.style.display = 'none';
      hardwareImageDiv.innerHTML = '';
      hardwareImageDiv.style.removeProperty('max-width');
      hardwareImageDiv.style.removeProperty('flex-basis');
      hardwareImageDiv.style.removeProperty('flex-shrink');
    }
    // Compose line1: size × length or fuse information
    let line1 = '';
    if (state.hardwareType === 'Fuse') {
      const fuseParts = [];
      const fuseLabel = state.fuseType ? `${state.fuseType} Fuse` : 'Fuse';
      fuseParts.push(fuseLabel);
      if (state.fuseValue) {
        fuseParts.push(`${state.fuseValue} A`);
      }
      line1 = fuseParts.filter(Boolean).join(' — ');
    } else if (state.hardwareType === 'Connector') {
      if (state.notes) {
        line1 = state.notes;
      }
    } else {
      if (state.threadSize) {
        line1 = state.threadSize;
      }
      if (state.hardwareType === 'Screw' && state.length) {
        // Only append length if present
        line1 += line1 ? ` × ${state.length}` : state.length;
      }
    }
    const fallbackLabel = state.hardwareType === 'Fuse' ? 'Fuse' : state.hardwareType;
    line1Div.textContent = line1 || fallbackLabel;
    // Compose line2: standard, fuse characteristics and optional notes
    let line2 = '';
    if (state.hardwareType === 'Fuse') {
      const fuseDetails = [];
      if (state.showStandard && state.standard) {
        fuseDetails.push(state.standard);
      }
      if (state.fuseType === 'Glass') {
        if (state.glassSize) {
          fuseDetails.push(state.glassSize);
        }
        if (state.glassSpeed) {
          fuseDetails.push(state.glassSpeed);
        }
      }
      if (state.notes) {
        fuseDetails.push(state.notes);
      }
      line2 = fuseDetails.join(' • ');
    } else if (state.hardwareType === 'Connector') {
      if (state.showStandard && state.standard) {
        line2 = state.standard;
      }
    } else {
      if (state.showStandard && state.standard) {
        line2 = state.standard;
      }
      if (state.notes) {
        line2 += line2 ? ` • ${state.notes}` : state.notes;
      }
    }
    line2Div.textContent = line2;
    line2Div.style.display = line2 ? 'block' : 'none';
    // Adjust font sizes based on inner label height
    const primaryFontSize = Math.max(8, Math.floor(innerHeightPx * 0.45));
    const secondaryFontSize = Math.max(6, Math.floor(innerHeightPx * 0.2));
    line1Div.style.fontSize = primaryFontSize + 'px';
    line2Div.style.fontSize = secondaryFontSize + 'px';
    // Adjust layout so that text does not overlap with the QR code
    // QR code sizing
    // Only render a QR code when the user has entered explicit content in
    // the QR input field.  This prevents placeholder QR codes from appearing
    // as soon as the toggle is enabled.
    const qrContent = state.qrContent ? state.qrContent.trim() : '';

    if (state.showQr && qrContent) {
      // Determine a square size for the QR code (take 60% of inner height)
      const qrSize = Math.floor(innerHeightPx * 0.6);
      qrCanvas.width = qrSize;
      qrCanvas.height = qrSize;
      qrCanvas.style.width = qrSize + 'px';
      qrCanvas.style.height = qrSize + 'px';
      qrCanvas.style.right = pxPerMm + 'px'; // 1mm right margin
      qrCanvas.style.top = '50%';
      qrCanvas.style.transform = 'translateY(-50%)';
      qrCanvas.style.display = 'block';
      // Generate QR code into canvas.  Content includes line1 and line2
      // Clear previous QR
      const ctx = qrCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
      }
      try {
        QRCode.toCanvas(qrCanvas, qrContent, {
          margin: 1,
          width: qrSize,
          color: {
            dark: '#000',
            light: '#00000000' // transparent background
          }
        });
      } catch (err) {
        console.error('QR code generation failed', err);
      }
      const qrPadding = Math.max(6, qrSize + pxPerMm * 2);
      labelInner.style.paddingRight = qrPadding + 'px';
    } else {
      const ctx = qrCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
      }
      qrCanvas.style.display = 'none';
      labelInner.style.removeProperty('padding-right');
    }
  }

  /**
   * Show or hide the QR content input based on the QR toggle state.  When
   * visible, keep the input enabled and in sync with the stored value.
   */
  function updateQrContentVisibility(options = {}) {
    if (!qrContentWrapper || !qrContentInput) {
      return;
    }
    const { focus = false } = options;
    if (state.showQr) {
      qrContentWrapper.classList.remove('d-none');
      qrContentInput.disabled = false;
      qrContentInput.value = state.qrContent;
      if (focus) {
        qrContentInput.focus();
      }
    } else {
      qrContentWrapper.classList.add('d-none');
      qrContentInput.disabled = true;
    }
  }

  /**
   * Enable or disable the download button based on whether enough
   * information has been provided.  For screws, both size and length
   * must be specified.  For nuts, washers and heat inserts, only the
   * thread size is required.  For fuses, the amp rating is required.
   */
  function updateDownloadState() {
    let ready = false;
    if (state.hardwareType === 'Fuse') {
      ready = !!state.fuseValue;
    } else if (state.hardwareType === 'Connector') {
      ready = !!state.notes;
    } else if (state.hardwareType === 'Screw') {
      ready = !!state.threadSize && !!state.length;
    } else {
      ready = !!state.threadSize;
    }
    const disabled = !ready;
    downloadButton.disabled = disabled;
    if (printButton) {
      printButton.disabled = disabled;
    }
  }

  /**
   * Capture the label preview as an image and trigger a download.  The
   * resulting PNG file is sized to 300 DPI based on the selected
   * physical dimensions.  html2canvas is instructed to scale the
   * capture accordingly.
   */
  function downloadLabel() {
    // Compute the DPI scaling factor.  On most screens 96 px = 25.4 mm.
    const desiredDpi = 300;
    const baseDpi = 96;
    const scale = desiredDpi / baseDpi;
    html2canvas(previewContainer, {
      backgroundColor: null,
      scale
    }).then(canvas => {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      // Build a file name from the state, e.g., "M3x20_DIN11014.png"
      const fileParts = [];
      if (state.hardwareType === 'Fuse') {
        fileParts.push('Fuse');
        if (state.fuseType) {
          fileParts.push(state.fuseType);
        }
        if (state.fuseValue) {
          fileParts.push(`${state.fuseValue}A`);
        }
        if (state.fuseType === 'Glass') {
          if (state.glassSize) {
            fileParts.push(state.glassSize);
          }
          if (state.glassSpeed) {
            fileParts.push(state.glassSpeed);
          }
        }
      } else if (state.hardwareType === 'Connector') {
        fileParts.push('Connector');
        if (state.notes) {
          fileParts.push(state.notes);
        }
      } else {
        if (state.threadSize) {
          fileParts.push(state.threadSize);
        }
        if (state.hardwareType === 'Screw' && state.length) {
          fileParts.push(`x${state.length}`);
        }
      }
      if (state.standard) {
        fileParts.push(state.standard);
      }
      const safeName = fileParts
        .filter(Boolean)
        .map(part => part.replace(/[^a-zA-Z0-9]+/g, '_'))
        .join('_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
      link.download = `${safeName || 'label'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  /**
   * Create a printable view of the current label preview.  The preview is
   * rendered to a PNG at 300 DPI and injected into a lightweight popup
   * window which immediately triggers the browser's print dialog.
   */
  function printLabel() {
    const desiredDpi = 300;
    const baseDpi = 96;
    const scale = desiredDpi / baseDpi;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Please allow pop-ups to print the label.');
      return;
    }
    printWindow.opener = null;
    const doc = printWindow.document;
    doc.title = 'Print Label';
    const style = doc.createElement('style');
    style.textContent = 'html,body{margin:0;height:100%;font-family:system-ui,-apple-system,Segoe UI,sans-serif;}body{display:flex;align-items:center;justify-content:center;background:#fff;color:#111;} .status{padding:1rem;text-align:center;}';
    doc.head.appendChild(style);
    doc.body.innerHTML = '';
    const statusDiv = doc.createElement('div');
    statusDiv.className = 'status';
    statusDiv.textContent = 'Preparing print preview…';
    doc.body.appendChild(statusDiv);
    html2canvas(previewContainer, {
      backgroundColor: null,
      scale
    }).then(canvas => {
      const dataUrl = canvas.toDataURL('image/png');
      const img = doc.createElement('img');
      img.src = dataUrl;
      img.alt = 'Gridfinity label';
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.onload = () => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      };
      doc.body.innerHTML = '';
      doc.body.appendChild(img);
    }).catch(err => {
      console.error('Print preview generation failed', err);
      doc.body.innerHTML = '<div class="status">Unable to prepare the label for printing.</div>';
    });
  }

  /**
   * Attach all event listeners.  Doing this in one place makes it
   * clear how user interactions flow through the system.
   */
  function initEventHandlers() {
    hardwareTypeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          state.hardwareType = radio.value;
          onHardwareTypeChange();
        }
      });
    });

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
    // Thread size selection
    threadSizeSelect.addEventListener('change', () => {
      state.threadSize = threadSizeSelect.value;
      updateDownloadState();
      updatePreview();
    });
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
    // Length input
    lengthInput.addEventListener('input', () => {
      const v = lengthInput.value;
      state.length = v.trim();
      updateDownloadState();
      updatePreview();
    });
    // Notes
    notesInput.addEventListener('input', () => {
      state.notes = notesInput.value.trim();
      updateDownloadState();
      updatePreview();
    });
    // Standard select
    standardSelect.addEventListener('change', () => {
      const selectedOption = standardSelect.selectedOptions[0];
      if (selectedOption && selectedOption.value) {
        const displayName = selectedOption.dataset.name || selectedOption.textContent;
        state.standard = displayName;
      } else {
        state.standard = '';
      }
      updatePreview();
    });
    standardSelect.addEventListener('keydown', handleStandardSelectKeydown);
    standardSelect.addEventListener('blur', clearStandardFilter);
    // Toggles
    standardToggle.addEventListener('change', () => {
      state.showStandard = standardToggle.checked;
      updatePreview();
    });
    imageToggle.addEventListener('change', () => {
      state.showImage = imageToggle.checked;
      updatePreview();
    });
    qrcodeToggle.addEventListener('change', () => {
      state.showQr = qrcodeToggle.checked;
      updateQrContentVisibility({ focus: state.showQr });
      updatePreview();
    });
    if (qrContentInput) {
      qrContentInput.addEventListener('input', () => {
        state.qrContent = qrContentInput.value.trim();
        updatePreview();
      });
    }
    // Width range
    widthRange.addEventListener('input', () => {
      state.widthMm = parseInt(widthRange.value, 10);
      widthValueSpan.textContent = state.widthMm;
      updatePreview();
    });
    // Height radio buttons
    heightRadios.forEach(r => {
      r.addEventListener('change', () => {
        if (r.checked) {
          state.heightMm = parseInt(r.value, 10);
          updatePreview();
        }
      });
    });
    // Download and print buttons
    downloadButton.addEventListener('click', downloadLabel);
    if (printButton) {
      printButton.addEventListener('click', printLabel);
    }
  }

  /**
   * Initialise the app by populating drop‑downs, setting initial
   * visibility of form elements, assigning event handlers and
   * performing the first preview render.
   */
  function init() {
    populateFuseValues();
    onHardwareTypeChange();
    initEventHandlers();
    updateDownloadState();
    widthValueSpan.textContent = state.widthMm;
    updateQrContentVisibility();
    updatePreview();
  }

  // Wait until DOM content is loaded before initialising the app
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
