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
  const normalizedHeight = Number.isFinite(iconHeight) && iconHeight > 0 ? iconHeight : 0;
  const imgStyle = normalizedHeight > 0 ? ` style="height:${normalizedHeight}px; width:auto;"` : '';
  function escapeHtmlAttribute(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  function buildImgMarkup(src, alt) {
    if (!src) {
      return '';
    }
    const safeAlt = escapeHtmlAttribute(alt || 'Hardware illustration');
    return `<img src="${src}" alt="${safeAlt}" class="hardware-fallback-image" loading="lazy" decoding="async"${imgStyle}>`;
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
    const styleAttr = Number.isFinite(height) && height > 0 ? ` style="height:${height}px; width:auto;"` : '';
    return `<img src="images/connectors/${matchedCandidate.file}" alt="${escapeHtmlAttribute(altText)}" class="hardware-fallback-image" loading="lazy" decoding="async"${styleAttr}>`;
  }
  const type = state.hardwareType;
  if (type === 'Connector') {
    const matchedMarkup = getConnectorSeriesIconMarkup(normalizedHeight);
    if (matchedMarkup) {
      return { markup: matchedMarkup, count: 1 };
    }
    return null;
  }
  const fallbackIcons = [];
  if (type === 'Screw') {
    const isBolt = state.screwType === 'Bolt';
    const variantFolder = isBolt ? 'socket_head' : 'button_head';
    const label = isBolt ? 'Bolt' : 'Screw';
    fallbackIcons.push(
      {
        src: `images/bolts/${variantFolder}/side.svg`,
        alt: `${label} side profile illustration`
      },
      {
        src: `images/bolts/${variantFolder}/head.svg`,
        alt: `${label} head view illustration`
      }
    );
  } else if (type === 'Nut') {
    fallbackIcons.push(
      { src: 'images/nuts/hex_nut.svg', alt: 'Hex nut illustration' },
      { src: 'images/nuts/square_nut.svg', alt: 'Square nut illustration' }
    );
  } else if (type === 'Washer') {
    fallbackIcons.push({ src: 'images/washers/M5.svg', alt: 'Flat washer illustration' });
  }
  if (fallbackIcons.length > 0) {
    return {
      markup: fallbackIcons.map(icon => buildImgMarkup(icon.src, icon.alt)).join(''),
      count: fallbackIcons.length
    };
  }
  return null;
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
  const safeWidthMm = Number.isFinite(width) && width > 0 ? width : 1;
  const safeHeightMm = Number.isFinite(height) && height > 0 ? height : 1;
  document.documentElement.style.setProperty('--label-width-mm', `${safeWidthMm}mm`);
  document.documentElement.style.setProperty('--label-height-mm', `${safeHeightMm}mm`);
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
      qrCanvas.style.removeProperty('margin-right');
      qrCanvas.style.removeProperty('margin-left');
    }
    labelInner.style.removeProperty('--label-padding-inline-start');
    labelInner.style.removeProperty('--label-padding-inline-end');
    labelInner.style.removeProperty('--label-gap');
    labelInner.style.removeProperty('--label-padding-y');
    labelInner.style.removeProperty('--label-padding-x');
    return;
  }

  if (previewPlaceholder) {
    previewPlaceholder.style.display = 'none';
    previewPlaceholder.setAttribute('aria-hidden', 'true');
  }
  labelInner.style.display = 'flex';
  const mmToPx = mm => Math.max(0, Math.round(mm * pxPerMm));
  const widthMm = Number.isFinite(width) ? width : 0;
  const heightMm = Number.isFinite(height) ? height : 0;
  const longestEdgeMm = Math.max(widthMm, heightMm, 0);
  const baseScale = Math.sqrt(Math.max(longestEdgeMm, 1) / 40);
  const paddingScale = Math.max(1, Math.min(baseScale, 1.35));
  const verticalScale = Math.max(1, Math.min(baseScale, 1.2));
  const gapScale = Math.max(1, Math.min(baseScale, 1.15));
  let horizontalPaddingBaselineMm = 1.5;
  let minHorizontalPaddingMm = 1.2;
  if (heightMm <= 12) {
    const normalizedHeight = Math.max(0, Math.min(heightMm, 12));
    const heightRatio = normalizedHeight / 12;
    const minBaselineMm = 1.0;
    const maxBaselineMm = 1.35;
    horizontalPaddingBaselineMm = minBaselineMm + (maxBaselineMm - minBaselineMm) * heightRatio;
    minHorizontalPaddingMm = 0.9;
  }
  const basePaddingX = Math.max(
    mmToPx(horizontalPaddingBaselineMm * paddingScale),
    mmToPx(minHorizontalPaddingMm)
  );
  const basePaddingY = Math.max(mmToPx(1.0 * verticalScale), mmToPx(0.8));
  const baseGap = Math.max(mmToPx(0.8 * gapScale), mmToPx(0.6));
  let paddingLeftPx = basePaddingX;
  let paddingRightPx = basePaddingX;
  let paddingY = basePaddingY;
  let gapPx = baseGap;
  let hardwareWidthPx = 0;
  let hardwareVisible = false;

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
      hardwareWidthPx = displaySize;
      hardwareVisible = true;
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
        const iconGapPx = 8;
        const initialFallback = getHardwareIcon(innerHeightPx);
        const iconCount = initialFallback && Number.isFinite(initialFallback.count)
          ? Math.max(0, initialFallback.count)
          : 0;
        if (iconCount > 0) {
          let iconHeightPx = innerHeightPx;
          const maxStripWidth = innerWidthPx;
          const naturalStripWidth = iconCount * iconHeightPx + (iconCount - 1) * iconGapPx;
          if (naturalStripWidth > maxStripWidth) {
            const availablePerIcon = Math.floor((maxStripWidth - (iconCount - 1) * iconGapPx) / iconCount);
            iconHeightPx = Math.max(0, Math.min(iconHeightPx, availablePerIcon));
          }
          const finalFallback = iconHeightPx === innerHeightPx
            ? initialFallback
            : getHardwareIcon(iconHeightPx);
          const finalCount = finalFallback && Number.isFinite(finalFallback.count)
            ? Math.max(0, finalFallback.count)
            : iconCount;
          const markup = finalFallback ? finalFallback.markup : '';
          if (finalCount > 0 && markup) {
            const finalStripWidth = Math.max(0, finalCount * iconHeightPx + (finalCount - 1) * iconGapPx);
            hardwareImageDiv.style.display = 'flex';
            hardwareImageDiv.style.maxWidth = finalStripWidth + 'px';
            hardwareImageDiv.style.flexBasis = finalStripWidth + 'px';
            hardwareImageDiv.style.flexShrink = '0';
            hardwareImageDiv.style.removeProperty('min-height');
            hardwareImageDiv.innerHTML = markup;
            hardwareWidthPx = finalStripWidth;
            hardwareVisible = true;
            return;
          }
        }
        hardwareImageDiv.style.display = 'none';
        hardwareImageDiv.innerHTML = '';
        hardwareImageDiv.style.removeProperty('max-width');
        hardwareImageDiv.style.removeProperty('flex-basis');
        hardwareImageDiv.style.removeProperty('flex-shrink');
        hardwareImageDiv.style.removeProperty('min-height');
        hardwareWidthPx = 0;
        hardwareVisible = false;
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
          hardwareWidthPx = maxWidthForPhoto;
          hardwareVisible = true;

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
          hardwareWidthPx = 0;
          hardwareVisible = false;
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
    hardwareWidthPx = 0;
    hardwareVisible = false;
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
      const standardCode = (state.standardCode || '').trim();
      const noteText = state.notes;
      const isPreInsulatedCrimp = state.connectorCategory === 'pre-insulated-crimp';
      let connectorColour = '';
      if (isPreInsulatedCrimp && standardCode) {
        const firstToken = standardCode.split(/\s+/)[0] || '';
        connectorColour = firstToken.replace(/[\s,;]+$/g, '');
      }
      if (seriesLabel) {
        line1 = seriesLabel;
      } else if (categoryLabel) {
        line1 = categoryLabel;
      } else if (noteText) {
        line1 = noteText;
      }
      connectorLine2Parts = [];
      if (seriesLabel) {
        if (isPreInsulatedCrimp && connectorColour) {
          connectorLine2Parts.push(connectorColour);
        } else if (categoryLabel && seriesLabel !== categoryLabel) {
          connectorLine2Parts.push(categoryLabel);
        }
      } else if (categoryLabel && line1 !== categoryLabel) {
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
  let qrVisible = false;
  let qrEstimatedSizePx = 0;
  let desiredQrEdgeClearancePx = 0;

  if (state.showQr && qrContent && qrCanvas) {
    const qrSafetyMarginPx = Math.max(2, Math.round(mmToPx(0.5)));
    const maxQrExtentPx = Math.max(0, Math.floor(innerHeightPx - qrSafetyMarginPx * 2));
    qrEstimatedSizePx = Math.max(1, maxQrExtentPx);
    const minimumEdgeClearancePx = Math.max(mmToPx(1), 1);
    desiredQrEdgeClearancePx = Math.max(mmToPx(1.2), minimumEdgeClearancePx);
    qrCanvas.width = qrEstimatedSizePx;
    qrCanvas.height = qrEstimatedSizePx;
    qrCanvas.style.width = qrEstimatedSizePx + 'px';
    qrCanvas.style.height = qrEstimatedSizePx + 'px';
    qrCanvas.style.display = 'block';
    qrCanvas.style.removeProperty('right');
    qrCanvas.style.removeProperty('top');
    qrCanvas.style.removeProperty('transform');
    qrCanvas.style.marginLeft = '0px';
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
          const qrMarginModules = 1;
          let moduleCount = null;
          const createFn = qrCodeLib && typeof qrCodeLib.create === 'function' ? qrCodeLib.create : null;
          if (createFn) {
            try {
              const qrMatrix = createFn.call(qrCodeLib, latestContent);
              if (qrMatrix && qrMatrix.modules && Number.isFinite(qrMatrix.modules.size)) {
                moduleCount = Math.max(0, qrMatrix.modules.size);
              }
            } catch (creationError) {
              console.error('QR code matrix generation failed', creationError);
            }
          }

          const totalModules = moduleCount && moduleCount > 0 ? moduleCount + qrMarginModules * 2 : null;
          let modulePixelSize = 0;
          let qrPixelSize = qrEstimatedSizePx;
          if (totalModules && totalModules > 0) {
            modulePixelSize = Math.max(1, Math.floor(maxQrExtentPx / totalModules));
            qrPixelSize = Math.max(1, modulePixelSize * totalModules);
          }

          if (qrPixelSize > 0) {
            qrCanvas.width = qrPixelSize;
            qrCanvas.height = qrPixelSize;
            qrCanvas.style.width = qrPixelSize + 'px';
            qrCanvas.style.height = qrPixelSize + 'px';
          }

          const renderOptions = {
            margin: qrMarginModules,
            color: {
              dark: '#000',
              light: '#00000000'
            }
          };

          if (modulePixelSize > 0 && totalModules && totalModules > 0) {
            renderOptions.scale = modulePixelSize;
          } else {
            renderOptions.width = qrPixelSize;
          }

          renderFn.call(qrCodeLib, qrCanvas, latestContent, renderOptions);
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
          qrCanvas.style.removeProperty('margin-right');
          qrCanvas.style.removeProperty('margin-left');
        }
        console.error('QR code library failed to load', err);
      });
    qrVisible = true;
  } else if (qrCanvas) {
    const ctx = qrCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
    }
    qrCanvas.style.display = 'none';
    qrCanvas.style.removeProperty('margin-right');
    qrCanvas.style.removeProperty('margin-left');
  }

  const itemsCount = 1 + (hardwareVisible ? 1 : 0) + (qrVisible ? 1 : 0);
  const gapCount = Math.max(0, itemsCount - 1);
  gapPx = Math.max(0, gapPx);
  const minGapPx = gapCount > 0 ? Math.max(mmToPx(0.35), 1) : 0;
  const minPaddingBaseMm = heightMm <= 12 ? 0.7 : 0.9;
  const minPaddingBasePx = Math.max(mmToPx(minPaddingBaseMm), 2);
  const minPaddingLeftPx = Math.max(2, Math.min(paddingLeftPx, minPaddingBasePx));
  const minPaddingRightTargetPx = qrVisible
    ? Math.max(minPaddingBasePx, desiredQrEdgeClearancePx)
    : minPaddingBasePx;
  const minPaddingRightPx = Math.max(2, Math.min(paddingRightPx, minPaddingRightTargetPx));
  const minTextWidthPx = Math.max(mmToPx(10), Math.floor(innerHeightPx * 1.45));

  const computeAvailableTextWidth = () => {
    const effectiveRightPadding = qrVisible
      ? Math.max(paddingRightPx, desiredQrEdgeClearancePx)
      : paddingRightPx;
    const qrWidthContribution = qrVisible ? qrEstimatedSizePx : 0;
    return innerWidthPx - (
      paddingLeftPx +
      effectiveRightPadding +
      gapPx * gapCount +
      hardwareWidthPx +
      qrWidthContribution
    );
  };

  let availableTextWidth = computeAvailableTextWidth();
  let adjustmentIterations = 0;
  const maxAdjustmentIterations = 80;
  while (
    availableTextWidth < minTextWidthPx &&
    adjustmentIterations < maxAdjustmentIterations &&
    (gapPx > minGapPx || paddingLeftPx > minPaddingLeftPx || paddingRightPx > minPaddingRightPx)
  ) {
    if (gapPx > minGapPx) {
      gapPx = Math.max(minGapPx, gapPx - 1);
    } else if (paddingLeftPx >= paddingRightPx && paddingLeftPx > minPaddingLeftPx) {
      paddingLeftPx = Math.max(minPaddingLeftPx, paddingLeftPx - 1);
    } else if (paddingRightPx > minPaddingRightPx) {
      paddingRightPx = Math.max(minPaddingRightPx, paddingRightPx - 1);
    } else if (paddingLeftPx > minPaddingLeftPx) {
      paddingLeftPx = Math.max(minPaddingLeftPx, paddingLeftPx - 1);
    } else {
      break;
    }
    availableTextWidth = computeAvailableTextWidth();
    adjustmentIterations += 1;
  }

  if (qrCanvas) {
    if (qrVisible) {
      const marginRightPx = Math.max(0, desiredQrEdgeClearancePx - paddingRightPx);
      qrCanvas.style.marginRight = marginRightPx + 'px';
      qrCanvas.style.marginLeft = '0px';
    } else {
      qrCanvas.style.marginRight = '0px';
      qrCanvas.style.marginLeft = '0px';
    }
  }

  const averagePaddingX = Math.round((paddingLeftPx + paddingRightPx) / 2);
  labelInner.style.setProperty('--label-padding-x', `${averagePaddingX}px`);
  labelInner.style.setProperty('--label-padding-y', `${paddingY}px`);
  labelInner.style.setProperty('--label-padding-inline-start', `${paddingLeftPx}px`);
  labelInner.style.setProperty('--label-padding-inline-end', `${paddingRightPx}px`);
  labelInner.style.setProperty('--label-gap', `${gapPx}px`);

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
