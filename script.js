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
  // Hardware standards grouped by hardware category (Bolt, Screw, Nut,
  // Washer).  Each entry contains both the standard code and a short
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
  const hardwareTypeGroup = document.getElementById('hardware-type-group');
  const systemTypeGroup = document.getElementById('system-type-group');
  const screwTypeContainer = document.getElementById('screw-type-container');
  const screwTypeGroup = document.getElementById('screw-type-group');
  const threadSizeSelect = document.getElementById('thread-size-select');
  const lengthContainer = document.getElementById('length-container');
  const lengthInput = document.getElementById('length-input');
  const notesInput = document.getElementById('notes-input');
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
  const downloadButton = document.getElementById('download-button');
  const printButton = document.getElementById('print-button');

  // Height radio buttons: listen at parent level
  const heightRadios = document.querySelectorAll('input[name="label-height"]');

  // Keep track of current selections.  This state object drives the preview
  // and can be extended easily in the future.
  const state = {
    hardwareType: 'Screw',
    systemType: 'Metric',
    screwType: 'Bolt',
    threadSize: '',
    length: '',
    notes: '',
    standard: '',
    showStandard: true,
    showImage: true,
    showQr: false,
    widthMm: 55,
    heightMm: 12
  };

  /**
   * Populate the thread size <select> element based on the current
   * measurement system (metric or imperial).  Called whenever the
   * hardware or system selection changes.
   */
  function populateThreadSizes() {
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

    if (standards.length === 0) {
      placeholder.textContent = 'No standards available';
      placeholder.disabled = false;
      placeholder.selected = true;
      standardSelect.appendChild(placeholder);
      standardSelect.disabled = true;
    } else {
      placeholder.textContent = 'Select standard…';
      placeholder.disabled = false;
      placeholder.selected = true;
      standardSelect.appendChild(placeholder);
      standards.forEach(entry => {
        const opt = document.createElement('option');
        opt.value = entry.code;
        opt.textContent = `${entry.code} — ${entry.name}`;
        standardSelect.appendChild(opt);
      });
      standardSelect.disabled = false;
    }

    state.standard = '';
    standardSelect.value = '';
    standardSelect.selectedIndex = 0;
    updatePreview();
  }

  /**
   * Update the selected state when a segmented button is clicked.
   * At most one button within a group can be selected at any time.
   */
  function handleSegmentClick(event) {
    const btn = event.target.closest('.segment');
    if (!btn) return;
    const group = btn.parentNode;
    // Remove selection from siblings
    Array.from(group.children).forEach(el => el.classList.remove('selected'));
    btn.classList.add('selected');
    const val = btn.getAttribute('data-value');
    if (group.id === 'hardware-type-group') {
      state.hardwareType = val;
      onHardwareTypeChange();
    } else if (group.id === 'system-type-group') {
      state.systemType = val;
      populateThreadSizes();
    } else if (group.id === 'screw-type-group') {
      state.screwType = val;
      populateStandards();
    }
    updatePreview();
  }

  /**
   * Handle changes when the hardware type (Screw, Nut, Washer) changes.
   * Show or hide relevant form fields accordingly.
   */
  function onHardwareTypeChange() {
    const type = state.hardwareType;
    if (type === 'Screw') {
      screwTypeContainer.style.display = '';
      lengthContainer.style.display = '';
    } else {
      screwTypeContainer.style.display = 'none';
      lengthContainer.style.display = 'none';
    }
    populateThreadSizes();
    populateStandards();
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
      const iconCount = (state.hardwareType === 'Screw' || state.hardwareType === 'Nut') ? 2 : 1;
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
    // Compose line1: size × length (when applicable)
    let line1 = '';
    if (state.threadSize) {
      line1 = state.threadSize;
    }
    if (state.hardwareType === 'Screw' && state.length) {
      // Only append length if present
      line1 += line1 ? ` × ${state.length}` : state.length;
    }
    line1Div.textContent = line1;
    // Compose line2: standard and optional notes
    let line2 = '';
    if (state.showStandard && state.standard) {
      line2 = state.standard;
    }
    if (state.notes) {
      line2 += line2 ? ` • ${state.notes}` : state.notes;
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
    if (state.showQr) {
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
      const qrContent = line1 + (line2 ? '\n' + line2 : '');
      // Clear previous QR
      const ctx = qrCanvas.getContext('2d');
      ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
      try {
        QRCode.toCanvas(qrCanvas, qrContent || 'Gridfinity Label', {
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
    } else {
      qrCanvas.style.display = 'none';
    }
  }

  /**
   * Enable or disable the download button based on whether enough
   * information has been provided.  For screws, both size and length
   * must be specified.  For nuts and washers, only size is required.
   */
  function updateDownloadState() {
    const hasSize = !!state.threadSize;
    const hasLength = state.hardwareType === 'Screw' ? !!state.length : true;
    const disabled = !(hasSize && hasLength);
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
      const safeSize = state.threadSize.replace(/[^a-zA-Z0-9]/g, '');
      const safeLen = state.length ? `x${state.length}` : '';
      const safeStandard = state.standard ? '_' + state.standard.replace(/[^a-zA-Z0-9]/g, '') : '';
      link.download = `${safeSize}${safeLen}${safeStandard || ''}.png`;
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
    // Handle segmented buttons
    hardwareTypeGroup.addEventListener('click', handleSegmentClick);
    systemTypeGroup.addEventListener('click', handleSegmentClick);
    screwTypeGroup.addEventListener('click', handleSegmentClick);
    // Thread size selection
    threadSizeSelect.addEventListener('change', () => {
      state.threadSize = threadSizeSelect.value;
      updateDownloadState();
      updatePreview();
    });
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
      updatePreview();
    });
    // Standard select
    standardSelect.addEventListener('change', () => {
      const selectedOption = standardSelect.selectedOptions[0];
      if (selectedOption && selectedOption.value) {
        state.standard = selectedOption.textContent;
      } else {
        state.standard = '';
      }
      updatePreview();
    });
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
      updatePreview();
    });
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
          // Update visual selection on height buttons
          heightRadios.forEach(btn => {
            const label = btn.closest('label');
            if (label) {
              if (btn.checked) {
                label.classList.add('selected');
              } else {
                label.classList.remove('selected');
              }
            }
          });
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
    onHardwareTypeChange();
    initEventHandlers();
    updateDownloadState();
    updatePreview();
    // Set initial selected class on height buttons
    heightRadios.forEach(r => {
      const label = r.closest('label');
      if (label) {
        if (r.checked) {
          label.classList.add('selected');
        } else {
          label.classList.remove('selected');
        }
      }
    });
  }

  // Wait until DOM content is loaded before initialising the app
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();