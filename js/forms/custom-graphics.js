/**
 * Custom icon and image handling functions
 * Extracted from forms.js
 */

import { state } from '../state.js';
import { elements } from '../dom-elements.js';
import { updatePreview, updateDownloadState } from '../render.js';

const {
  customGraphicSourceRadios,
  customImageFields,
  customIconFields
} = elements;

function syncThreadLengthInputIcon(nextType) {
  if (!lengthInputWrapper || !lengthInputIcon) {
    return;
  }
  const type = typeof nextType === 'string' ? nextType.trim() : state.hardwareType;
  const shouldShowIcon = type === 'Bolt' || type === 'Screw';
  if (!shouldShowIcon) {
    lengthInputIcon.hidden = true;
    lengthInputIcon.removeAttribute('src');
    lengthInputIcon.removeAttribute('data-hardware-type');
    lengthInputWrapper.classList.remove('has-icon');
    return;
  }

  const folder = hardwareImageFolders[type];
  if (!folder) {
    lengthInputIcon.hidden = true;
    lengthInputIcon.removeAttribute('src');
    lengthInputIcon.removeAttribute('data-hardware-type');
    lengthInputWrapper.classList.remove('has-icon');
    return;
  }

  const currentType = lengthInputIcon.dataset.hardwareType || '';
  if (currentType !== type) {
    lengthInputIcon.src = `images/${folder}/thread_length.svg`;
    lengthInputIcon.dataset.hardwareType = type;
  }

  lengthInputIcon.hidden = false;
  lengthInputWrapper.classList.add('has-icon');
}

function getFastenerHeadImagePath(option) {
  if (!option || !option.image) {
    return '';
  }
  const basePath = state.hardwareType === 'Screw' ? 'images/screws' : 'images/bolts/head';
  return `${basePath}/${option.image}.svg`;
}

function getOptionImage(optionElement) {
  if (!optionElement) {
    return '';
  }
  const rawImage = optionElement.dataset.img;
  if (typeof rawImage === 'string' && rawImage.trim()) {
    return rawImage.trim();
  }
  return hardwareTypeImageMap[optionElement.value] || '';
}

function normalizeCustomGraphicSource(value) {
  if (typeof value !== 'string') {
    return DEFAULT_CUSTOM_GRAPHIC_SOURCE;
  }
  const normalized = value.trim().toLowerCase();
  return CUSTOM_GRAPHIC_SOURCES.has(normalized) ? normalized : DEFAULT_CUSTOM_GRAPHIC_SOURCE;
}

function getCurrentIconStyle() {
  state.customIconStyle = DEFAULT_ICON_STYLE;
  return DEFAULT_ICON_STYLE;
}

function setIconSelectEnabled(enabled) {
  if (customIconSelect) {
    customIconSelect.disabled = !enabled;
  }
  if (customIconPickerButton) {
    customIconPickerButton.disabled = !enabled;
    if (!enabled) {
      customIconPickerButton.setAttribute('aria-expanded', 'false');
    }
  }
  if (customIconPickerList) {
    customIconPickerList.hidden = true;
  }
  if (customIconPicker) {
    customIconPicker.classList.toggle('is-disabled', !enabled);
  }
  if (!enabled && typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent('gridfinity:custom-icon-picker-close'));
  }
}

function setIconSearchEnabled(enabled) {
  if (!customIconSearchInput) {
    return;
  }
  customIconSearchInput.disabled = !enabled;
}

function setIconControlsBusy(isBusy) {
  if (customIconSelect) {
    if (isBusy) {
      customIconSelect.setAttribute('aria-busy', 'true');
    } else {
      customIconSelect.removeAttribute('aria-busy');
    }
  }
  if (customIconPickerButton) {
    if (isBusy) {
      customIconPickerButton.setAttribute('aria-busy', 'true');
    } else {
      customIconPickerButton.removeAttribute('aria-busy');
    }
  }
  if (isBusy && typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent('gridfinity:custom-icon-picker-close'));
  }
}

function findCustomIconOption(name) {
  if (!customIconSelect || !name) {
    return null;
  }
  const options = Array.from(customIconSelect.options);
  return options.find(option => option.value === name) || null;
}

function resetCustomIconSvgData() {
  customIconAssetRequestId += 1;
  state.customIconSvgData = '';
}

function refreshSelectedCustomIconAsset() {
  const style = DEFAULT_ICON_STYLE;
  const name = typeof state.customIconName === 'string' ? state.customIconName.trim() : '';
  resetCustomIconSvgData();
  if (!name) {
    return;
  }
  const requestId = customIconAssetRequestId;
  loadIconSvg(style, name)
    .then(result => {
      if (customIconAssetRequestId !== requestId) {
        return;
      }
      const currentStyle = normalizeIconStyle(state.customIconStyle || DEFAULT_ICON_STYLE);
      const currentName = typeof state.customIconName === 'string' ? state.customIconName.trim() : '';
      if (currentStyle !== style || currentName !== name) {
        return;
      }
      state.customIconSvgData = result && result.dataUrl ? result.dataUrl : '';
      updatePreview();
      updateDownloadState();
    })
    .catch(error => {
      if (customIconAssetRequestId !== requestId) {
        return;
      }
      const currentStyle = normalizeIconStyle(state.customIconStyle || DEFAULT_ICON_STYLE);
      const currentName = typeof state.customIconName === 'string' ? state.customIconName.trim() : '';
      if (currentStyle !== style || currentName !== name) {
        return;
      }
      console.error('Unable to load Font Awesome icon SVG', error);
      state.customIconSvgData = '';
      updatePreview();
      updateDownloadState();
    });
}

function syncCustomIconPickerDisplay() {
  if (!customIconPickerButton) {
    return;
  }
  const name = typeof state.customIconName === 'string' ? state.customIconName : '';
  const labelFromState = typeof state.customIconLabel === 'string' ? state.customIconLabel : '';
  const unicodeFromState = typeof state.customIconUnicode === 'string' ? state.customIconUnicode : '';
  let resolvedLabel = labelFromState;
  let resolvedUnicode = unicodeFromState;
  let resolvedStyle = normalizeIconStyle(state.customIconStyle || DEFAULT_ICON_STYLE);
  let resolvedGlyph = '';

  const option = name ? findCustomIconOption(name) : null;
  if (option) {
    if (!resolvedLabel) {
      resolvedLabel = option.dataset.label || option.textContent || name;
    }
    if (!resolvedUnicode) {
      resolvedUnicode = option.dataset.unicode || '';
    }
    if (option.dataset.style) {
      resolvedStyle = normalizeIconStyle(option.dataset.style);
    }
    if (option.dataset.glyph) {
      resolvedGlyph = option.dataset.glyph;
    }
  }

  if (!resolvedGlyph && resolvedUnicode) {
    resolvedGlyph = getGlyphFromUnicode(resolvedUnicode);
  }

  const labelElement = customIconPickerButton.querySelector('.bolt-drive-picker__current-label');
  const iconWrapper = customIconPickerButton.querySelector('.bolt-drive-picker__current-icon');
  const glyphElement = customIconPickerButton.querySelector('.bolt-drive-picker__current-icon-glyph');

  const styleLabel = resolvedStyle.charAt(0).toUpperCase() + resolvedStyle.slice(1);
  const buttonLabel = name
    ? `${(resolvedLabel || name).trim()} (${name}) · ${styleLabel}`
    : CUSTOM_ICON_PLACEHOLDER_TEXT;

  if (labelElement) {
    labelElement.textContent = buttonLabel;
  }

  if (glyphElement) {
    if (resolvedGlyph) {
      glyphElement.textContent = resolvedGlyph;
      applyGlyphFont(glyphElement, resolvedStyle);
    } else {
      glyphElement.textContent = '';
      glyphElement.style.fontFamily = '';
      glyphElement.style.fontWeight = '';
    }
  }

  if (iconWrapper) {
    iconWrapper.classList.toggle('is-empty', !resolvedGlyph);
  }

  if (customIconPickerList) {
    const items = Array.from(customIconPickerList.querySelectorAll('[role="option"]'));
    items.forEach(item => {
      const isSelected = item.dataset.value === name;
      item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      item.classList.toggle('is-selected', isSelected);
      item.tabIndex = -1;
    });
  }
}

function clearCustomIconPreview() {
  if (!customIconPreview) {
    return;
  }
  const previousIconClass = customIconPreview.dataset.iconClass;
  if (previousIconClass) {
    customIconPreview.classList.remove(previousIconClass);
    delete customIconPreview.dataset.iconClass;
  }
  Object.values(FONT_AWESOME_STYLE_CLASSES).forEach(cls => {
    customIconPreview.classList.remove(cls);
  });
  customIconPreview.classList.add('d-none');
}

function setCustomIconPreview(style, iconName) {
  if (!customIconPreview) {
    return;
  }
  clearCustomIconPreview();
  const styleClass = FONT_AWESOME_STYLE_CLASSES[style] || FONT_AWESOME_STYLE_CLASSES.solid;
  customIconPreview.classList.remove('d-none');
  customIconPreview.classList.add(styleClass);
  const iconClass = `fa-${iconName}`;
  customIconPreview.classList.add(iconClass);
  customIconPreview.dataset.iconClass = iconClass;
}

function setCustomIconStatus(message, { isError = false, isLoading = false } = {}) {
  if (!customIconStatus) {
    return;
  }
  const normalized = typeof message === 'string' ? message : '';
  customIconStatus.textContent = normalized;
  customIconStatus.classList.remove('text-danger', 'fw-semibold', 'text-muted');
  if (isError) {
    customIconStatus.classList.add('text-danger', 'fw-semibold');
  } else if (isLoading) {
    customIconStatus.classList.add('text-muted');
  }
}

function applyCustomGraphicInfoDisplay() {
  const source = normalizeCustomGraphicSource(state.customGraphicSource);
  const style = getCurrentIconStyle();
  if (customImageNameDisplay) {
    let displayText = '';
    if (source === 'image' && state.customImageName) {
      displayText = state.customImageName;
    } else if (source === 'icon' && state.customIconName) {
      const label = state.customIconLabel || state.customIconName;
      displayText = label;
    } else if (source === 'parts' && state.customPartId) {
      const partOption = getCustomPartOption(state.customPartId);
      displayText = partOption ? partOption.label : state.customPartId;
    }
    if (displayText) {
      customImageNameDisplay.textContent = displayText;
      customImageNameDisplay.classList.remove('d-none');
    } else {
      customImageNameDisplay.textContent = '';
      customImageNameDisplay.classList.add('d-none');
    }
  }
  if (source === 'icon' && state.customIconName && state.customIconUnicode) {
    setCustomIconPreview(style, state.customIconName);
  } else {
    clearCustomIconPreview();
  }
  if (source === 'parts') {
    syncCustomPartPicker({ isValid: true });
  }
  if (customIconSelect) {
    if (source === 'icon' && state.customIconName) {
      customIconSelect.value = state.customIconName;
    } else if (source !== 'icon') {
      customIconSelect.value = '';
      customIconSelect.selectedIndex = -1;
    }
  }
  syncCustomIconPickerDisplay();
}

export function setCustomGraphicSource(source, options = {}) {
  const normalized = normalizeCustomGraphicSource(source);
  const previous = normalizeCustomGraphicSource(state.customGraphicSource);
  state.customGraphicSource = normalized;
  if (normalized === 'icon' && !state.customIconStyle) {
    state.customIconStyle = DEFAULT_ICON_STYLE;
  }
  updateCustomImageUi();
  if (normalized === 'icon' && previous !== 'icon') {
    refreshCustomIconOptions({ preserveSelection: true });
    if (state.customIconName) {
      refreshSelectedCustomIconAsset();
    }
  }
  if (options.triggerUpdate !== false) {
    updateDownloadState();
    updatePreview();
  }
}

export function setCustomIconSelection(icon = {}) {
  const style = DEFAULT_ICON_STYLE;
  const name = typeof icon.name === 'string' ? icon.name : '';
  const unicode = typeof icon.unicode === 'string' ? icon.unicode : '';
  const label = typeof icon.label === 'string' && icon.label.trim().length > 0 ? icon.label : name;
  state.customGraphicSource = 'icon';
  state.customIconStyle = style;
  state.customIconName = name;
  state.customIconUnicode = unicode;
  state.customIconLabel = label;
  refreshSelectedCustomIconAsset();
  applyCustomGraphicInfoDisplay();
  if (!state.customIconUnicode && state.customIconName) {
    findIcon(style, state.customIconName)
      .then(record => {
        if (!record) {
          return;
        }
        if (state.customIconName !== record.name) {
          return;
        }
        state.customIconUnicode = record.unicode;
        state.customIconLabel = record.label;
        applyCustomGraphicInfoDisplay();
        updatePreview();
        updateDownloadState();
      })
      .catch(error => {
        console.error('Unable to resolve Font Awesome icon', error);
      });
  }
  updateCustomImageUi();
  updateDownloadState();
  updatePreview();
}

export function ensureCustomIconAsset() {
  if (state.customGraphicSource !== 'icon') {
    return;
  }
  if (!state.customIconName) {
    resetCustomIconSvgData();
    return;
  }
  if (state.customIconSvgData) {
    return;
  }
  refreshSelectedCustomIconAsset();
}

export function updateCustomImageUi() {
  const source = normalizeCustomGraphicSource(state.customGraphicSource);
  state.customGraphicSource = source;
  if (Array.isArray(customGraphicSourceRadios)) {
    customGraphicSourceRadios.forEach(radio => {
      if (!radio) {
        return;
      }
      radio.checked = radio.value === source;
    });
  }
  if (customImageFields) {
    customImageFields.classList.toggle('d-none', source !== 'image');
  }
  if (customIconFields) {
    customIconFields.classList.toggle('d-none', source !== 'icon');
  }
  if (customPartFields) {
    customPartFields.classList.toggle('d-none', source !== 'parts');
  }
  const hasImage = source === 'image' && Boolean(state.customImageData);
  const hasIcon =
    source === 'icon' && Boolean(state.customIconUnicode || state.customIconSvgData);
  const hasPart = source === 'parts' && Boolean(state.customPartId);
  if (customImageClearButton) {
    let label = 'Clear selection';
    if (source === 'icon') {
      label = 'Remove icon';
    } else if (source === 'parts') {
      label = 'Remove part icon';
    } else {
      label = 'Remove image';
    }
    customImageClearButton.disabled = !(hasImage || hasIcon || hasPart);
    customImageClearButton.textContent = label;
    customImageClearButton.setAttribute('aria-label', label);
  }
  if (source === 'icon') {
    const style = getCurrentIconStyle();
    const needsRefresh =
      !lastIconCollection ||
      lastIconCollection.style !== style ||
      !customIconSelect ||
      customIconSelect.options.length === 0;
    if (needsRefresh) {
      refreshCustomIconOptions({ preserveSelection: true });
    } else {
      setIconControlsBusy(false);
      const enableSelect =
        !!customIconSelect && !customIconSelect.disabled && customIconSelect.options.length > 0;
      setIconSelectEnabled(enableSelect);
      setIconSearchEnabled(true);
    }
  } else if (source === 'parts') {
    setIconControlsBusy(false);
    setIconSelectEnabled(false);
    setIconSearchEnabled(false);
    setCustomIconStatus('');
    syncCustomPartPicker({ isValid: true });
  } else {
    setIconControlsBusy(false);
    setIconSelectEnabled(false);
    setIconSearchEnabled(false);
    setCustomIconStatus('');
  }
  if (source === 'image' && state.customImageName && customImageNameDisplay) {
    customImageNameDisplay.textContent = state.customImageName;
    customImageNameDisplay.classList.remove('d-none');
  }
  if (source === 'image' && !state.customImageName && customImageNameDisplay) {
    customImageNameDisplay.textContent = '';
    customImageNameDisplay.classList.add('d-none');
  }
  applyCustomGraphicInfoDisplay();
}

export function clearCustomImage({ resetInput = true } = {}) {
  const source = normalizeCustomGraphicSource(state.customGraphicSource);
  if (source === 'icon') {
    resetCustomIconSvgData();
    state.customIconName = '';
    state.customIconUnicode = '';
    state.customIconLabel = '';
    if (customIconSelect) {
      customIconSelect.value = '';
      customIconSelect.selectedIndex = -1;
    }
  } else if (source === 'parts') {
    state.customPartId = '';
    syncCustomPartPicker({ isValid: true });
  } else {
    state.customImageData = '';
    state.customImageName = '';
    if (resetInput && customImageInput) {
      customImageInput.value = '';
    }
  }
  updateCustomImageUi();
  updatePreview();
  updateDownloadState();
}

export function handleCustomImageFile(file) {
  if (!file) {
    return;
  }
  const isImage = !file.type || file.type.startsWith('image/');
  if (!isImage) {
    alert('Please select an image file (PNG, JPG, SVG, GIF).');
    if (customImageInput) {
      customImageInput.value = '';
    }
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const result = typeof reader.result === 'string' ? reader.result : '';
    state.customGraphicSource = 'image';
    state.customIconName = '';
    state.customIconUnicode = '';
    state.customIconLabel = '';
    resetCustomIconSvgData();
    state.customImageData = result;
    state.customImageName = file.name || 'Custom image';
    updateCustomImageUi();
    updatePreview();
    updateDownloadState();
    if (customImageInput) {
      customImageInput.value = '';
    }
  };
  reader.onerror = () => {
    console.error('Unable to load custom image', reader.error);
    clearCustomImage({ resetInput: false });
  };
  reader.readAsDataURL(file);
}