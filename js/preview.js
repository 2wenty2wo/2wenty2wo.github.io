import { state } from './state.js';
import { elements } from './dom-elements.js';
import { pxPerMm, hardwareImageFolders, findConnectorCategory } from './data.js';
import { loadHtml2Canvas, loadQrCodeLibrary } from './lazy-loaders.js';

const {
  labelSizeDisplay,
  printAreaDisplay,
  previewContainer,
  labelInner,
  hardwareImageDiv,
  textBlockDiv,
  line1Div,
  line2Div,
  previewPlaceholder,
  qrCanvas,
  qrContentWrapper,
  qrContentInput,
  downloadButton,
  printButton,
  threadSizeSelect,
  threadSizeContainer,
  lengthInput,
  lengthContainer,
  fuseValueSelect,
  fuseValueContainer,
  connectorCategorySelect,
  connectorCategoryContainer,
  notesInput,
  notesField,
  bearingTypeSelect,
  bearingOptionsContainer,
  componentCategoryContainer,
  componentCategoryRadios,
  componentMountContainer,
  componentMountRadios,
  customLine1Input,
  customLine1Field,
  threadSizeMessage,
  lengthMessage,
  fuseValueMessage,
  connectorCategoryMessage,
  connectorNotesMessage,
  bearingTypeMessage,
  componentCategoryMessage,
  componentMountMessage,
  customLine1Message,
  formStatusMessage
} = elements;

let qrRenderRequestId = 0;

function setMessageVisibility(messageElement, message, show) {
  if (!messageElement) {
    return;
  }
  const normalizedMessage = typeof message === 'string' ? message : '';
  const trimmedMessage = normalizedMessage.trim();
  const shouldShow = Boolean(show && trimmedMessage.length > 0);
  if (shouldShow) {
    messageElement.textContent = trimmedMessage;
    messageElement.classList.remove('d-none');
    messageElement.setAttribute('aria-hidden', 'false');
  } else {
    messageElement.textContent = '';
    messageElement.classList.add('d-none');
    messageElement.setAttribute('aria-hidden', 'true');
  }
}

function updateInputFieldState({ input, container, messageElement, valid, message }) {
  if (input) {
    if (valid) {
      input.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
    } else {
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
    }
  }
  if (container) {
    container.classList.toggle('field-invalid', !valid);
  }
  const normalizedMessage = typeof message === 'string' ? message : '';
  const trimmedMessage = normalizedMessage.trim();
  const shouldShowMessage = !valid && trimmedMessage.length > 0;
  setMessageVisibility(messageElement, normalizedMessage, shouldShowMessage);
}

function updateRadioGroupFeedback({ radios, container, messageElement, valid, message }) {
  if (Array.isArray(radios)) {
    radios.forEach(radio => {
      if (!radio) {
        return;
      }
      if (valid) {
        radio.removeAttribute('aria-invalid');
      } else {
        radio.setAttribute('aria-invalid', 'true');
      }
    });
  }
  if (container) {
    container.classList.toggle('field-invalid', !valid);
  }
  const normalizedMessage = typeof message === 'string' ? message : '';
  const trimmedMessage = normalizedMessage.trim();
  const shouldShowMessage = !valid && trimmedMessage.length > 0;
  setMessageVisibility(messageElement, normalizedMessage, shouldShowMessage);
}

function formatRequirementSummary(requirements) {
  if (!Array.isArray(requirements) || requirements.length === 0) {
    return '';
  }
  if (requirements.length === 1) {
    return requirements[0];
  }
  const allButLast = requirements.slice(0, -1);
  const last = requirements[requirements.length - 1];
  return `${allButLast.join(', ')} and ${last}`;
}

function applyValidationFeedback(disabled) {
  const requirements = [];
  const hardwareType = state.hardwareType;
  const screwLabel = (state.screwType || 'screw').toLowerCase();

  const needsThreadSize = !['Fuse', 'Connector', 'Custom', 'Bearing', 'Component'].includes(hardwareType);
  const threadValid = !needsThreadSize || Boolean(state.threadSize);
  updateInputFieldState({
    input: threadSizeSelect,
    container: threadSizeContainer,
    messageElement: threadSizeMessage,
    valid: threadValid
  });
  if (!threadValid) {
    requirements.push('select a thread size');
  }

  const needsLength = hardwareType === 'Screw';
  const lengthValue = Number.parseFloat(state.length);
  const lengthValid = !needsLength || (Number.isFinite(lengthValue) && lengthValue > 0);
  updateInputFieldState({
    input: lengthInput,
    container: lengthContainer,
    messageElement: lengthMessage,
    valid: lengthValid
  });
  if (!lengthValid) {
    requirements.push(`enter the ${screwLabel} length`);
  }

  const needsFuseValue = hardwareType === 'Fuse';
  const fuseValid = !needsFuseValue || Boolean(state.fuseValue);
  updateInputFieldState({
    input: fuseValueSelect,
    container: fuseValueContainer,
    messageElement: fuseValueMessage,
    valid: fuseValid
  });
  if (!fuseValid) {
    requirements.push('choose a fuse value');
  }

  const isConnector = hardwareType === 'Connector';
  const connectorCategoryValid = !isConnector || Boolean(state.connectorCategory);
  updateInputFieldState({
    input: connectorCategorySelect,
    container: connectorCategoryContainer,
    messageElement: connectorCategoryMessage,
    valid: connectorCategoryValid
  });
  if (!connectorCategoryValid) {
    requirements.push('choose a connector category');
  }

  const connectorNotesValid = true;
  updateInputFieldState({
    input: notesInput,
    container: notesField,
    messageElement: connectorNotesMessage,
    valid: connectorNotesValid
  });

  const needsBearingSelection = hardwareType === 'Bearing';
  const bearingValid = !needsBearingSelection || Boolean(state.bearingType);
  updateInputFieldState({
    input: bearingTypeSelect,
    container: bearingOptionsContainer,
    messageElement: bearingTypeMessage,
    valid: bearingValid
  });
  if (!bearingValid) {
    requirements.push('select a bearing');
  }

  const needsComponentSelection = hardwareType === 'Component';
  const componentCategoryValid = !needsComponentSelection || Boolean(state.componentCategory);
  updateRadioGroupFeedback({
    radios: componentCategoryRadios,
    container: componentCategoryContainer,
    messageElement: componentCategoryMessage,
    valid: componentCategoryValid
  });
  if (!componentCategoryValid) {
    requirements.push('choose a component type');
  }

  const componentMountValid = !needsComponentSelection || Boolean(state.componentMount);
  updateRadioGroupFeedback({
    radios: componentMountRadios,
    container: componentMountContainer,
    messageElement: componentMountMessage,
    valid: componentMountValid
  });
  if (!componentMountValid) {
    requirements.push('choose a mounting style');
  }

  const needsCustomTitle = hardwareType === 'Custom';
  const customTitle = (state.customLine1 || '').trim();
  const customTitleValid = !needsCustomTitle || customTitle.length > 0;
  updateInputFieldState({
    input: customLine1Input,
    container: customLine1Field,
    messageElement: customLine1Message,
    valid: customTitleValid
  });
  if (!customTitleValid) {
    requirements.push('add a custom label title');
  }

  if (formStatusMessage) {
    if (disabled) {
      const summary = requirements.length > 0 ? formatRequirementSummary(requirements) : 'complete the required fields';
      formStatusMessage.textContent = `To enable Download and Print, ${summary}.`;
      formStatusMessage.classList.remove('d-none');
    } else {
      formStatusMessage.textContent = '';
      formStatusMessage.classList.add('d-none');
    }
  }
}

function normalizeStandardCode(code) {
  return (code || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getHardwareImageInfo() {
  let catalogKey = state.hardwareType;
  if (state.hardwareType === 'Screw') {
    catalogKey = state.screwType;
  }
  if (!catalogKey) {
    return null;
  }
  const folder = hardwareImageFolders[catalogKey];
  if (!folder) {
    return null;
  }
  const code = (state.standardCode || '').trim();
  if (!code) {
    return null;
  }
  const filename = normalizeStandardCode(code);
  if (!filename) {
    return null;
  }
  const standardName = (state.standard || '').trim();
  const altPieces = [];
  if (code) {
    altPieces.push(code);
  }
  if (standardName && standardName.toLowerCase() !== code.toLowerCase()) {
    altPieces.push(standardName);
  }
  if (state.screwType === 'Bolt') {
    const baseSource = code || standardName || 'Bolt';
    const normalizedBase = baseSource.toLowerCase().trim().replace(/\s+/g, ' ');
    let boltLabel = normalizedBase
      ? normalizedBase.charAt(0).toUpperCase() + normalizedBase.slice(1)
      : 'Bolt';
    if (!/bolt\b/i.test(boltLabel)) {
      boltLabel = `${boltLabel} bolt`;
    }
    boltLabel = boltLabel.trim();
    return {
      type: 'boltSvg',
      headSrc: `images/${folder}/${filename}/head.svg`,
      sideSrc: `images/${folder}/${filename}/side.svg`,
      headAlt: `${boltLabel} — head view`,
      sideAlt: `${boltLabel} — side view`
    };
  }
  const src = `images/${folder}/${filename}.png`;
  const altBase = altPieces.length > 0 ? altPieces.join(' — ') : '';
  return {
    type: 'photo',
    src,
    alt: altBase ? `${altBase} reference illustration` : 'Hardware reference illustration'
  };
}

function getHardwareIcon(iconHeight) {
  const color = '#000000';
  const strokeWidth = 3;
  function buildSvg(body) {
    return `<svg viewBox="0 0 100 100" style="height:${iconHeight}px; width:auto;" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  }
  function escapeHtmlAttribute(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  function getConnectorSeriesIconMarkup(height) {
    const categoryId = state.connectorCategory;
    if (!categoryId) {
      return null;
    }
    const standardCode = (state.standardCode || '').trim();
    const normalizedCode = standardCode.toLowerCase();
    const connectorCategory = findConnectorCategory(categoryId);
    const categoryLabel = connectorCategory ? connectorCategory.label : '';
    const iconCandidates = {
      'pre-insulated-crimp': [
        {
          patterns: [/ring terminal/],
          file: 'ring_terminal.svg',
          altLabel: 'ring terminal'
        },
        {
          patterns: [/fork terminal/, /spade/],
          file: 'fork_terminal.svg',
          altLabel: 'fork terminal'
        },
        {
          patterns: [/butt splice/],
          file: 'butt_connector.svg',
          altLabel: 'butt splice'
        }
      ],
      'bootlace-ferrule': [
        {
          patterns: [/bootlace ferrule/],
          file: 'bootlace_ferrule.svg',
          altLabel: 'bootlace ferrule'
        }
      ]
    };
    const candidates = iconCandidates[categoryId];
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return null;
    }
    const matchedCandidate = candidates.find(candidate => {
      if (!Array.isArray(candidate.patterns)) {
        return false;
      }
      return candidate.patterns.some(pattern => pattern.test(normalizedCode));
    }) || (categoryId === 'bootlace-ferrule' && candidates[0]);
    if (!matchedCandidate) {
      return null;
    }
    const altPieces = [];
    if (standardCode) {
      altPieces.push(standardCode);
    } else if (matchedCandidate.altLabel) {
      altPieces.push(matchedCandidate.altLabel);
    }
    if (categoryLabel && (!standardCode || categoryLabel.toLowerCase().indexOf(standardCode.toLowerCase()) === -1)) {
      altPieces.push(categoryLabel);
    }
    const altTextBase = altPieces.length > 0 ? altPieces.join(' — ') : 'Connector';
    const altText = `${altTextBase} illustration`;
    return `<img src="images/connectors/${matchedCandidate.file}" alt="${escapeHtmlAttribute(altText)}" style="height:${height}px; width:auto;" loading="lazy" decoding="async">`;
  }
  const pieces = [];
  const type = state.hardwareType;
  if (type === 'Screw') {
    if (state.screwType === 'Bolt') {
      pieces.push(buildSvg(`
          <!-- Bolt side view -->
          <polygon points="5,50 20,30 40,30 55,50 40,70 20,70" />
          <rect x="55" y="42" width="35" height="16" />
          <line x1="55" y1="46" x2="90" y2="46" />
          <line x1="55" y1="54" x2="90" y2="54" />
          <line x1="55" y1="62" x2="90" y2="62" />
        `));
      pieces.push(buildSvg(`
          <!-- Bolt top view -->
          <circle cx="50" cy="50" r="45" />
          <polygon points="50,10 78,25 90,50 78,75 50,90 22,75 10,50 22,25" />
        `));
    } else {
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
      pieces.push(buildSvg(`
          <!-- Screw top view -->
          <circle cx="50" cy="50" r="45" />
          <line x1="20" y1="50" x2="80" y2="50" />
        `));
    }
  } else if (type === 'Nut') {
    pieces.push(buildSvg(`
        <!-- Nut side view -->
        <polygon points="5,50 20,32 40,32 60,50 40,68 20,68" />
      `));
    pieces.push(buildSvg(`
        <!-- Nut top view -->
        <polygon points="5,50 20,32 40,32 60,50 40,68 20,68" />
        <polygon points="25,50 33,42 44,42 55,50 44,58 33,58" />
      `));
  } else if (type === 'Washer') {
    pieces.push(buildSvg(`
        <!-- Washer -->
        <circle cx="50" cy="50" r="45" />
        <circle cx="50" cy="50" r="20" />
      `));
  } else if (type === 'Heat Insert') {
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
  } else if (type === 'Bearing') {
    const ballStroke = Math.max(1, strokeWidth - 1);
    pieces.push(buildSvg(`
        <!-- Bearing front view -->
        <circle cx="50" cy="50" r="45" />
        <circle cx="50" cy="50" r="30" />
        <circle cx="50" cy="50" r="15" />
        <g stroke-width="${ballStroke}">
          <circle cx="50" cy="20" r="6" />
          <circle cx="74" cy="32" r="6" />
          <circle cx="80" cy="58" r="6" />
          <circle cx="64" cy="78" r="6" />
          <circle cx="36" cy="78" r="6" />
          <circle cx="20" cy="58" r="6" />
          <circle cx="26" cy="32" r="6" />
        </g>
      `));
    pieces.push(buildSvg(`
        <!-- Bearing side profile -->
        <rect x="22" y="28" width="56" height="44" rx="18" />
        <rect x="32" y="34" width="36" height="32" rx="14" />
        <line x1="22" y1="50" x2="78" y2="50" />
      `));
  } else if (type === 'Connector') {
    const connectorIconMarkup = getConnectorSeriesIconMarkup(iconHeight);
    if (connectorIconMarkup) {
      pieces.push(connectorIconMarkup);
    } else {
      pieces.push(buildSvg(`
          <!-- Insulated crimp connectors -->
          <path d="M22 72L34 28H56L44 72Z" />
          <rect x="34" y="20" width="12" height="8" />
          <rect x="62" y="32" width="26" height="34" rx="8" />
          <polygon points="70,20 82,20 90,34 78,34" />
          <line x1="48" y1="52" x2="62" y2="46" />
          <line x1="46" y1="60" x2="60" y2="54" />
        `));
    }
  } else if (type === 'Component') {
    const category = state.componentCategory;
    const mount = state.componentMount;
    if (category === 'Capacitor') {
      pieces.push(buildSvg(`
          <!-- Capacitor symbol -->
          <line x1="18" y1="50" x2="36" y2="50" />
          <line x1="36" y1="30" x2="36" y2="70" />
          <line x1="64" y1="30" x2="64" y2="70" />
          <line x1="64" y1="50" x2="82" y2="50" />
        `));
    } else if (category === 'Diode') {
      pieces.push(buildSvg(`
          <!-- Diode symbol -->
          <line x1="18" y1="50" x2="36" y2="50" />
          <polygon points="36,30 68,50 36,70" />
          <line x1="68" y1="30" x2="68" y2="70" />
          <line x1="68" y1="50" x2="82" y2="50" />
        `));
    } else {
      pieces.push(buildSvg(`
          <!-- Resistor symbol -->
          <line x1="14" y1="50" x2="28" y2="50" />
          <polyline points="28,50 36,38 44,62 52,38 60,62 68,38 76,62" />
          <line x1="76" y1="50" x2="90" y2="50" />
        `));
    }

    if (mount === 'SMD') {
      pieces.push(buildSvg(`
          <!-- SMD package -->
          <rect x="20" y="32" width="60" height="36" rx="10" />
          <rect x="8" y="38" width="12" height="24" rx="4" />
          <rect x="80" y="38" width="12" height="24" rx="4" />
        `));
    } else {
      pieces.push(buildSvg(`
          <!-- Through-hole package -->
          <rect x="26" y="28" width="48" height="28" rx="8" />
          <line x1="32" y1="56" x2="32" y2="72" />
          <line x1="68" y1="56" x2="68" y2="72" />
          <circle cx="32" cy="74" r="6" />
          <circle cx="68" cy="74" r="6" />
        `));
    }
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

function applyTextFitting(primaryFontSize, secondaryFontSize) {
  if (!textBlockDiv || !line1Div) {
    return;
  }

  line1Div.style.fontSize = primaryFontSize + 'px';
  if (line2Div) {
    line2Div.style.fontSize = secondaryFontSize + 'px';
  }

  const availableWidth = textBlockDiv.clientWidth;
  const availableHeight = labelInner ? labelInner.clientHeight : textBlockDiv.clientHeight;
  if (availableWidth <= 0 || availableHeight <= 0) {
    return;
  }

  const hasLine2 = Boolean(
    line2Div &&
      line2Div.style.display !== 'none' &&
      line2Div.textContent &&
      line2Div.textContent.trim()
  );

  let line1Size = primaryFontSize;
  let line2Size = secondaryFontSize;

  const absolutePrimaryMin = 4;
  const absoluteSecondaryMin = 3.5;
  let minLine1 = Math.min(primaryFontSize, 6);
  minLine1 = Math.max(absolutePrimaryMin, minLine1);
  let minLine2 = 0;
  if (hasLine2) {
    minLine2 = Math.min(secondaryFontSize, 5);
    minLine2 = Math.max(absoluteSecondaryMin, minLine2);
  }

  const tolerance = 0.5;
  let iterations = 0;
  const maxIterations = 200;
  while (iterations < maxIterations) {
    let adjusted = false;

    if (line1Div.scrollWidth - tolerance > availableWidth && line1Size > minLine1) {
      line1Size = Math.max(minLine1, line1Size - 0.5);
      line1Div.style.fontSize = line1Size + 'px';
      adjusted = true;
    }

    if (hasLine2 && line2Div.scrollWidth - tolerance > availableWidth && line2Size > minLine2) {
      line2Size = Math.max(minLine2, line2Size - 0.5);
      line2Div.style.fontSize = line2Size + 'px';
      adjusted = true;
    }

    if (textBlockDiv.scrollHeight - tolerance > availableHeight) {
      if (line1Size > minLine1 && (!hasLine2 || line1Size >= line2Size || line2Size <= minLine2)) {
        line1Size = Math.max(minLine1, line1Size - 0.5);
        line1Div.style.fontSize = line1Size + 'px';
        adjusted = true;
      } else if (hasLine2 && line2Size > minLine2) {
        line2Size = Math.max(minLine2, line2Size - 0.5);
        line2Div.style.fontSize = line2Size + 'px';
        adjusted = true;
      }
    }

    if (!adjusted) {
      break;
    }

    iterations += 1;
  }
}

export function isLabelReady() {
  if (state.hardwareType === 'Fuse') {
    return Boolean(state.fuseValue);
  }
  if (state.hardwareType === 'Connector') {
    return Boolean(state.connectorCategory);
  }
  if (state.hardwareType === 'Custom') {
    return Boolean(state.customLine1 && state.customLine1.trim());
  }
  if (state.hardwareType === 'Bearing') {
    return Boolean(state.bearingType);
  }
  if (state.hardwareType === 'Component') {
    return Boolean(state.componentCategory && state.componentMount);
  }
  if (state.hardwareType === 'Screw') {
    return Boolean(state.threadSize && state.length);
  }
  return Boolean(state.threadSize);
}

export function updateDownloadState() {
  const ready = isLabelReady();
  const disabled = !ready;
  if (downloadButton) {
    downloadButton.disabled = disabled;
    const downloadActionLabel = 'Download label as a PNG image';
    downloadButton.setAttribute('aria-label', downloadActionLabel);
    downloadButton.title = disabled
      ? 'Complete the label details to enable downloading.'
      : downloadActionLabel;
  }
  if (printButton) {
    printButton.disabled = disabled;
    const printActionLabel = 'Open a print-ready preview of the label';
    printButton.setAttribute('aria-label', printActionLabel);
    printButton.title = disabled
      ? 'Complete the label details to enable printing.'
      : printActionLabel;
  }
  applyValidationFeedback(disabled);
}

export function updateQrContentVisibility(options = {}) {
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

export function updatePreview() {
  if (!previewContainer || !labelInner || !labelSizeDisplay || !printAreaDisplay) {
    return;
  }
  const width = state.widthMm;
  const height = state.heightMm;
  const printableWidth = width;
  const printableHeight = height;
  labelSizeDisplay.innerHTML = `${width}&nbsp;mm ×&nbsp;${height}&nbsp;mm (label size)`;
  printAreaDisplay.innerHTML = `${printableWidth}&nbsp;mm ×&nbsp;${printableHeight}&nbsp;mm (print-ready image size)`;
  const pxWidth = width * pxPerMm;
  const pxHeight = height * pxPerMm;
  previewContainer.style.width = pxWidth + 'px';
  previewContainer.style.height = pxHeight + 'px';
  const innerWidthPx = pxWidth;
  const innerHeightPx = pxHeight;
  labelInner.style.width = innerWidthPx + 'px';
  labelInner.style.height = innerHeightPx + 'px';
  labelInner.style.left = '0px';
  labelInner.style.top = '0px';
  const readyForPreview = isLabelReady();

  if (!readyForPreview) {
    if (previewPlaceholder) {
      previewPlaceholder.style.display = 'flex';
      previewPlaceholder.setAttribute('aria-hidden', 'false');
    }
    labelInner.style.display = 'none';
    hardwareImageDiv.style.display = 'none';
    hardwareImageDiv.innerHTML = '';
    hardwareImageDiv.style.removeProperty('max-width');
    hardwareImageDiv.style.removeProperty('flex-basis');
    hardwareImageDiv.style.removeProperty('flex-shrink');
    hardwareImageDiv.style.removeProperty('min-height');
    line1Div.textContent = '';
    line2Div.textContent = '';
    line2Div.style.display = 'none';
    if (qrCanvas) {
      const ctx = qrCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
      }
      qrCanvas.style.display = 'none';
    }
    labelInner.style.setProperty('--label-padding-right-extra', '0px');
    return;
  }

  if (previewPlaceholder) {
    previewPlaceholder.style.display = 'none';
    previewPlaceholder.setAttribute('aria-hidden', 'true');
  }
  labelInner.style.display = 'flex';
  const basePaddingX = Math.max(10, Math.round(innerHeightPx * 0.22));
  const basePaddingY = Math.max(6, Math.round(innerHeightPx * 0.16));
  const baseGap = Math.max(8, Math.round(innerHeightPx * 0.12));
  const accentWidth = Math.min(Math.max(6, Math.round(innerHeightPx * 0.1)), Math.round(basePaddingX * 0.85));
  labelInner.style.setProperty('--label-padding-x', `${basePaddingX}px`);
  labelInner.style.setProperty('--label-padding-y', `${basePaddingY}px`);
  labelInner.style.setProperty('--label-gap', `${baseGap}px`);
  labelInner.style.setProperty('--label-accent-width', `${accentWidth}px`);
  labelInner.style.setProperty('--label-padding-right-extra', '0px');

  if (state.showImage) {
    if (state.hardwareType === 'Custom') {
      const targetSize = Math.max(0, innerHeightPx);
      const displaySize = Math.max(32, targetSize);
      hardwareImageDiv.style.display = 'flex';
      hardwareImageDiv.style.maxWidth = displaySize + 'px';
      hardwareImageDiv.style.flexBasis = displaySize + 'px';
      hardwareImageDiv.style.flexShrink = '0';
      hardwareImageDiv.style.minHeight = displaySize + 'px';
      hardwareImageDiv.innerHTML = '';
      if (state.customImageData) {
        const img = document.createElement('img');
        img.src = state.customImageData;
        img.alt = state.customImageName || 'Custom image';
        img.className = 'custom-image-preview';
        img.style.maxHeight = displaySize + 'px';
        img.style.maxWidth = displaySize + 'px';
        hardwareImageDiv.appendChild(img);
      } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'custom-image-placeholder';
        placeholder.textContent = 'Add image';
        placeholder.style.height = displaySize + 'px';
        hardwareImageDiv.appendChild(placeholder);
      }
    } else {
      const renderFallbackIcon = () => {
        const multiViewTypes = ['Screw', 'Nut', 'Heat Insert', 'Bearing', 'Component'];
        const iconCount = multiViewTypes.includes(state.hardwareType) ? 2 : 1;
        const iconGapPx = 8;
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
          hardwareImageDiv.style.removeProperty('min-height');
          hardwareImageDiv.innerHTML = getHardwareIcon(iconHeightPx);
        } else {
          hardwareImageDiv.style.display = 'none';
          hardwareImageDiv.innerHTML = '';
          hardwareImageDiv.style.removeProperty('max-width');
          hardwareImageDiv.style.removeProperty('flex-basis');
          hardwareImageDiv.style.removeProperty('flex-shrink');
          hardwareImageDiv.style.removeProperty('min-height');
        }
      };

      const photoInfo = getHardwareImageInfo();
      if (photoInfo && innerHeightPx > 0 && innerWidthPx > 0) {
        const maxWidthForPhoto = Math.max(0, Math.min(innerHeightPx, innerWidthPx * 0.45));
        if (maxWidthForPhoto > 0) {
          hardwareImageDiv.style.display = 'flex';
          hardwareImageDiv.style.maxWidth = maxWidthForPhoto + 'px';
          hardwareImageDiv.style.flexBasis = maxWidthForPhoto + 'px';
          hardwareImageDiv.style.flexShrink = '0';
          hardwareImageDiv.style.removeProperty('min-height');
          hardwareImageDiv.innerHTML = '';

          if (photoInfo.type === 'boltSvg') {
            let fallbackTriggered = false;
            const handleMissingAsset = () => {
              if (fallbackTriggered) {
                return;
              }
              fallbackTriggered = true;
              renderFallbackIcon();
            };
            const boltGroup = document.createElement('div');
            boltGroup.className = 'bolt-image-group';
            boltGroup.style.maxHeight = innerHeightPx + 'px';
            hardwareImageDiv.appendChild(boltGroup);
            const boltImages = [
              {
                src: photoInfo.headSrc,
                alt: photoInfo.headAlt,
                className: 'hardware-photo bolt-head-view'
              },
              {
                src: photoInfo.sideSrc,
                alt: photoInfo.sideAlt,
                className: 'hardware-photo bolt-side-view'
              }
            ];
            let maxWidthPerImage = Math.floor(maxWidthForPhoto / boltImages.length);
            if (!Number.isFinite(maxWidthPerImage) || maxWidthPerImage <= 0) {
              maxWidthPerImage = maxWidthForPhoto;
            }
            boltImages.forEach(imageInfo => {
              if (fallbackTriggered) {
                return;
              }
              if (!imageInfo.src) {
                handleMissingAsset();
                return;
              }
              const boltImg = document.createElement('img');
              boltImg.src = imageInfo.src;
              boltImg.alt = imageInfo.alt;
              boltImg.className = imageInfo.className;
              boltImg.decoding = 'async';
              boltImg.loading = 'lazy';
              boltImg.style.maxHeight = innerHeightPx + 'px';
              boltImg.style.maxWidth = maxWidthPerImage + 'px';
              boltImg.addEventListener('error', handleMissingAsset);
              boltGroup.appendChild(boltImg);
            });
          } else {
            const img = document.createElement('img');
            img.src = photoInfo.src;
            img.alt = photoInfo.alt;
            img.className = 'hardware-photo';
            img.decoding = 'async';
            img.loading = 'lazy';
            img.style.maxHeight = innerHeightPx + 'px';
            img.style.maxWidth = maxWidthForPhoto + 'px';
            hardwareImageDiv.appendChild(img);
          }
        } else {
          hardwareImageDiv.style.display = 'none';
          hardwareImageDiv.innerHTML = '';
          hardwareImageDiv.style.removeProperty('max-width');
          hardwareImageDiv.style.removeProperty('flex-basis');
          hardwareImageDiv.style.removeProperty('flex-shrink');
          hardwareImageDiv.style.removeProperty('min-height');
        }
      } else {
        renderFallbackIcon();
      }
    }
  } else {
    hardwareImageDiv.style.display = 'none';
    hardwareImageDiv.innerHTML = '';
    hardwareImageDiv.style.removeProperty('max-width');
    hardwareImageDiv.style.removeProperty('flex-basis');
    hardwareImageDiv.style.removeProperty('flex-shrink');
    hardwareImageDiv.style.removeProperty('min-height');
  }

  if (state.hardwareType === 'Custom') {
    const topLine = (state.customLine1 || '').trim();
    const bottomLine = (state.customLine2 || '').trim();
    line1Div.textContent = topLine || 'Custom Label';
    line2Div.textContent = bottomLine;
    line2Div.style.display = bottomLine ? 'block' : 'none';
  } else {
    let line1 = '';
    let connectorLine2Parts = null;
    if (state.hardwareType === 'Fuse') {
      const fuseParts = [];
      const fuseLabel = state.fuseType ? `${state.fuseType} Fuse` : 'Fuse';
      fuseParts.push(fuseLabel);
      if (state.fuseValue) {
        fuseParts.push(`${state.fuseValue} A`);
      }
      line1 = fuseParts.filter(Boolean).join(' — ');
    } else if (state.hardwareType === 'Connector') {
      const category = findConnectorCategory(state.connectorCategory);
      const categoryLabel = category ? category.label : '';
      const seriesLabel = state.showStandard && state.standard ? state.standard : '';
      const noteText = state.notes;
      if (seriesLabel) {
        line1 = seriesLabel;
      } else if (categoryLabel) {
        line1 = categoryLabel;
      } else if (noteText) {
        line1 = noteText;
      }
      connectorLine2Parts = [];
      if (seriesLabel && categoryLabel && seriesLabel !== categoryLabel) {
        connectorLine2Parts.push(categoryLabel);
      }
      if (!seriesLabel && categoryLabel && line1 !== categoryLabel) {
        connectorLine2Parts.push(categoryLabel);
      }
      if (noteText && line1 !== noteText) {
        connectorLine2Parts.push(noteText);
      }
    } else if (state.hardwareType === 'Bearing') {
      if (state.bearingType) {
        line1 = state.bearingType;
      }
    } else if (state.hardwareType === 'Component') {
      const componentParts = [];
      if (state.componentCategory) {
        componentParts.push(state.componentCategory);
      }
      if (state.componentMount) {
        componentParts.push(state.componentMount);
      }
      line1 = componentParts.join(' — ');
    } else {
      if (state.threadSize) {
        line1 = state.threadSize;
      }
      if (state.hardwareType === 'Screw' && state.length) {
        line1 += line1 ? ` × ${state.length}` : state.length;
      }
    }
    const fallbackLabel = state.hardwareType === 'Fuse' ? 'Fuse' : state.hardwareType;
    line1Div.textContent = line1 || fallbackLabel;
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
      if (connectorLine2Parts && connectorLine2Parts.length > 0) {
        line2 = connectorLine2Parts.join(' • ');
      }
    } else if (state.hardwareType === 'Bearing') {
      const bearingDetails = [];
      if (state.showStandard && state.bearingDetails) {
        bearingDetails.push(state.bearingDetails);
      }
      if (state.notes) {
        bearingDetails.push(state.notes);
      }
      line2 = bearingDetails.join(' • ');
    } else if (state.hardwareType === 'Component') {
      if (state.notes) {
        line2 = state.notes;
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
  }

  const primaryFontSize = Math.max(8, Math.floor(innerHeightPx * 0.45));
  const secondaryFontSize = Math.max(6, Math.floor(innerHeightPx * 0.2));
  const qrContent = state.qrContent ? state.qrContent.trim() : '';

  if (state.showQr && qrContent && qrCanvas) {
    const qrSize = Math.floor(innerHeightPx * 0.6);
    qrCanvas.width = qrSize;
    qrCanvas.height = qrSize;
    qrCanvas.style.width = qrSize + 'px';
    qrCanvas.style.height = qrSize + 'px';
    const qrOffset = Math.max(pxPerMm, Math.round(basePaddingX * 0.5));
    qrCanvas.style.right = qrOffset + 'px';
    qrCanvas.style.top = '50%';
    qrCanvas.style.transform = 'translateY(-50%)';
    qrCanvas.style.display = 'block';
    const ctx = qrCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
    }

    const requestId = ++qrRenderRequestId;
    loadQrCodeLibrary()
      .then(qrCodeLib => {
        if (qrRenderRequestId !== requestId) {
          return;
        }
        const latestContent = state.qrContent ? state.qrContent.trim() : '';
        if (!state.showQr || !latestContent || !qrCanvas) {
          return;
        }
        const renderFn = qrCodeLib && typeof qrCodeLib.toCanvas === 'function' ? qrCodeLib.toCanvas : null;
        if (!renderFn) {
          throw new Error('QR code library is missing the toCanvas function.');
        }
        try {
          renderFn.call(qrCodeLib, qrCanvas, latestContent, {
            margin: 1,
            width: qrSize,
            color: {
              dark: '#000',
              light: '#00000000'
            }
          });
        } catch (err) {
          console.error('QR code generation failed', err);
        }
      })
      .catch(err => {
        if (qrRenderRequestId === requestId && qrCanvas) {
          const qrContext = qrCanvas.getContext('2d');
          if (qrContext) {
            qrContext.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
          }
          qrCanvas.style.display = 'none';
          labelInner.style.setProperty('--label-padding-right-extra', '0px');
        }
        console.error('QR code library failed to load', err);
      });

    const qrPadding = Math.max(basePaddingX, Math.round(qrSize + pxPerMm * 1.5));
    const extraRight = Math.max(0, qrPadding - basePaddingX);
    labelInner.style.setProperty('--label-padding-right-extra', `${extraRight}px`);
  } else if (qrCanvas) {
    const ctx = qrCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
    }
    qrCanvas.style.display = 'none';
    labelInner.style.setProperty('--label-padding-right-extra', '0px');
  }

  applyTextFitting(primaryFontSize, secondaryFontSize);
}

export async function renderLabelCanvas() {
  if (!previewContainer || !labelInner) {
    throw new Error('Label preview is not available.');
  }

  const printableWidthMm = state.widthMm;
  const printableHeightMm = state.heightMm;
  const exportDpi = 300;
  const pixelsPerMmAtExportDpi = exportDpi / 25.4;
  const scale = pixelsPerMmAtExportDpi / pxPerMm;

  const containerWidth = previewContainer.offsetWidth || previewContainer.clientWidth;
  const containerHeight = previewContainer.offsetHeight || previewContainer.clientHeight;
  if (!containerWidth || !containerHeight) {
    throw new Error('Label preview has no measurable size.');
  }

  const html2canvas = await loadHtml2Canvas();
  const canvas = await html2canvas(previewContainer, {
    backgroundColor: null,
    scale,
    width: containerWidth,
    height: containerHeight,
    scrollX: 0,
    scrollY: 0
  });

  const containerRect = previewContainer.getBoundingClientRect();
  const innerRect = labelInner.getBoundingClientRect();
  const ratioX = canvas.width / containerWidth;
  const ratioY = canvas.height / containerHeight;
  const cropX = Math.max(0, Math.floor((innerRect.left - containerRect.left) * ratioX));
  const cropY = Math.max(0, Math.floor((innerRect.top - containerRect.top) * ratioY));
  const cropWidth = Math.max(1, Math.ceil(innerRect.width * ratioX));
  const cropHeight = Math.max(1, Math.ceil(innerRect.height * ratioY));
  const sourceWidth = Math.min(cropWidth, canvas.width - cropX);
  const sourceHeight = Math.min(cropHeight, canvas.height - cropY);

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error('Computed label dimensions are invalid.');
  }

  const outputCanvas = document.createElement('canvas');
  const targetWidthPx = Math.max(1, Math.round(printableWidthMm * pixelsPerMmAtExportDpi));
  const targetHeightPx = Math.max(1, Math.round(printableHeightMm * pixelsPerMmAtExportDpi));
  outputCanvas.width = targetWidthPx;
  outputCanvas.height = targetHeightPx;
  const ctx = outputCanvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(
      canvas,
      cropX,
      cropY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      outputCanvas.width,
      outputCanvas.height
    );
  }
  return outputCanvas;
}
