/*
 * Client side logic for the Gridfinity label generator clone.  This script
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
  // Generic list of hardware standards.  Real‑world applications may
  // restrict these lists per hardware type.  We provide a handful of
  // common DIN and ISO standards.
  const hardwareStandards = [
    'DIN 11014', 'DIN 912', 'DIN 933', 'DIN 7991', 'ISO 4032', 'ISO 4762', 'ISO 7380'
  ];

  // Ratio of preview pixels per millimetre.  This value controls how
  // large the label appears onscreen.  The physical dimensions of the
  // downloaded image are independent of this ratio because html2canvas
  // rescaling is used at capture time.
  // Increase the on‑screen pixels per millimetre to better mirror the
  // proportions of the original application.  A higher value makes
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
   * Populate the hardware standard <select> element.  Always uses
   * the same list for every hardware type.
   */
  function populateStandards() {
    standardSelect.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select standard…';
    standardSelect.appendChild(placeholder);
    hardwareStandards.forEach(st => {
      const opt = document.createElement('option');
      opt.value = st;
      opt.textContent = st;
      standardSelect.appendChild(opt);
    });
    state.standard = '';
    standardSelect.value = '';
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
    updatePreview();
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
     * primitives.  Strokes remain black with round endcaps to echo the
     * original application’s mechanical drawings.
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
    downloadButton.disabled = !(hasSize && hasLength);
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
      state.standard = standardSelect.value;
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
    // Download button
    downloadButton.addEventListener('click', downloadLabel);

    // Feedback button
    const feedbackButton = document.getElementById('feedback-button');
    if (feedbackButton) {
      feedbackButton.addEventListener('click', () => {
        alert('Thank you for your feedback!');
      });
    }
  }

  /**
   * Initialise the app by populating drop‑downs, setting initial
   * visibility of form elements, assigning event handlers and
   * performing the first preview render.
   */
  function init() {
    populateThreadSizes();
    populateStandards();
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