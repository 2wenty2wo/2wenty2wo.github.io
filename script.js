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
  const pxPerMm = 4; // adjust for comfortable preview sizing

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
  function getHardwareIcon() {
    // Use a dark gray stroke to better match the original blueprint style
    const color = '#4b5563';
    const strokeWidth = 3;
    // Use a 100×100 viewBox for consistent scaling
    switch (state.hardwareType) {
      case 'Screw': {
        // Distinguish bolt vs screw using the screwType property
        if (state.screwType === 'Bolt') {
          // Bolt: hex head and threaded shaft
          return `
            <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="30,10 70,10 90,40 70,70 30,70 10,40" stroke="${color}" fill="none" stroke-width="${strokeWidth}" />
              <rect x="35" y="70" width="30" height="20" stroke="${color}" fill="none" stroke-width="${strokeWidth}" />
              <line x1="30" y1="75" x2="70" y2="75" stroke="${color}" stroke-width="2" />
              <line x1="30" y1="82" x2="70" y2="82" stroke="${color}" stroke-width="2" />
              <line x1="30" y1="89" x2="70" y2="89" stroke="${color}" stroke-width="2" />
            </svg>
          `;
        }
        // Screw: round head with cross recess and threaded shaft
        return `
          <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="25" r="18" stroke="${color}" fill="none" stroke-width="${strokeWidth}" />
            <line x1="42" y1="25" x2="58" y2="25" stroke="${color}" stroke-width="${strokeWidth}" />
            <line x1="50" y1="17" x2="50" y2="33" stroke="${color}" stroke-width="${strokeWidth}" />
            <rect x="40" y="43" width="20" height="27" stroke="${color}" fill="none" stroke-width="${strokeWidth}" />
            <line x1="35" y1="50" x2="65" y2="50" stroke="${color}" stroke-width="2" />
            <line x1="35" y1="57" x2="65" y2="57" stroke="${color}" stroke-width="2" />
            <line x1="35" y1="64" x2="65" y2="64" stroke="${color}" stroke-width="2" />
          </svg>
        `;
      }
      case 'Nut': {
        // Nut: hexagon with hole in centre
        return `
          <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="30,10 70,10 90,40 70,70 30,70 10,40" stroke="${color}" fill="none" stroke-width="${strokeWidth}" />
            <circle cx="50" cy="40" r="12" stroke="${color}" fill="none" stroke-width="${strokeWidth}" />
          </svg>
        `;
      }
      case 'Washer': {
        // Washer: ring shape
        return `
          <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="28" stroke="${color}" fill="none" stroke-width="${strokeWidth}" />
            <circle cx="50" cy="50" r="12" stroke="${color}" fill="none" stroke-width="${strokeWidth}" />
          </svg>
        `;
      }
      default:
        return '';
    }
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
    // Set preview container dimensions in pixels
    const pxWidth = width * pxPerMm;
    const pxHeight = height * pxPerMm;
    previewContainer.style.width = pxWidth + 'px';
    previewContainer.style.height = pxHeight + 'px';
    // Icon
    if (state.showImage) {
      hardwareImageDiv.style.display = 'flex';
      hardwareImageDiv.innerHTML = getHardwareIcon();
    } else {
      hardwareImageDiv.style.display = 'none';
      hardwareImageDiv.innerHTML = '';
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
    // Adjust font sizes based on container height
    // Set primary line to occupy ~40% of height, secondary smaller
    const primaryFontSize = Math.max(8, Math.floor(pxHeight * 0.35));
    const secondaryFontSize = Math.max(6, Math.floor(pxHeight * 0.18));
    line1Div.style.fontSize = primaryFontSize + 'px';
    line2Div.style.fontSize = secondaryFontSize + 'px';
    // Layout: ensure text block does not overlap QR code
    previewContainer.style.position = 'relative';
    // QR code
    if (state.showQr) {
      qrCanvas.style.display = 'block';
      // Generate QR code into canvas.  Content includes line1 and line2
      const qrContent = line1 + (line2 ? '\n' + line2 : '');
      // Clear previous QR
      const ctx = qrCanvas.getContext('2d');
      ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
      // Generate new QR.  Use smaller version for preview; html2canvas will
      // upscale appropriately for download.
      try {
        QRCode.toCanvas(qrCanvas, qrContent || 'Gridfinity Label', {
          margin: 1,
          width: qrCanvas.width,
          color: {
            dark: '#000',
            light: '#FFFFFF00' // transparent background
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