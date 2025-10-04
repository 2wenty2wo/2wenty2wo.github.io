export const defaultLayoutPresets = {
  9: {
    padding_mm: 0.2,
    media_zone_width_pct: 38,
    media_zone_width_pct_min: 32,
    media_zone_width_pct_max: 44,
    media_zone_width_pct_max_user: 44.5,
    icon_layout: 'row',
    icon_padding_mm: 0,
    icon_gap_mm: 0,
    icon_min_mm: 3.2,
    media_text_gap_mm: 0,
    text_zone: {
      top_pct: 58,
      gap_mm: 0,
      alignment: 'middle',
      block_offset_mm: 0,
      horizontal_offset_mm: 0,
      main: {
        min_pt: 6.9,
        max_pt: 10,
        letter_spacing_adj: -0.3,
        font_weight: 700,
      },
      sub: {
        min_pt: 4.4,
        max_pt: 9,
        line_height_pct: 101,
      },
      compact_join_subtitles: false,
      compact_separator: ' \u00b7 ',
    },
    qr: {
      side_mm: 6.5,
      margin_mm: 0.5,
      location: 'top-right',
      max_pct_of_text_zone_width: 36,
    },
  },
  12: {
    padding_mm: 0.3,
    media_zone_width_pct: 48,
    media_zone_width_pct_min: 34,
    media_zone_width_pct_max: 48,
    media_zone_width_pct_max_user: 46.5,
    icon_layout: 'row',
    icon_padding_mm: 0,
    icon_gap_mm: 0,
    icon_min_mm: 4.2,
    media_text_gap_mm: 0,
    text_zone: {
      top_pct: 58,
      gap_mm: 0,
      alignment: 'middle',
      block_offset_mm: 0,
      horizontal_offset_mm: 0,
      main: {
        min_pt: 8.5,
        max_pt: 14,
        letter_spacing_adj: -0.3,
        font_weight: 700,
      },
      sub: {
        min_pt: 6.1,
        max_pt: 10.5,
        line_height_pct: 112,
      },
      compact_join_subtitles: false,
      compact_separator: ' \u00b7 ',
    },
    qr: {
      side_mm: 8.5,
      margin_mm: 0.9,
      location: 'top-right',
      max_pct_of_text_zone_width: 32,
    },
  },
  18: {
    padding_mm: 0,
    media_zone_width_pct: 32,
    media_zone_width_pct_min: 28,
    media_zone_width_pct_max: 36,
    media_zone_width_pct_max_user: 36,
    icon_layout: 'column',
    icon_padding_mm: 0.4,
    icon_gap_mm: 0.9,
    icon_min_mm: 6,
    media_text_gap_mm: 0.6,
    text_zone: {
      top_pct: 60,
      gap_mm: 0.8,
      alignment: 'middle',
      block_offset_mm: 0,
      horizontal_offset_mm: 0,
      main: {
        min_pt: 9.5,
        max_pt: 20,
        letter_spacing_adj: -0.35,
        font_weight: 700,
      },
      sub: {
        min_pt: 8,
        max_pt: 13,
        line_height_pct: 120,
      },
      compact_join_subtitles: false,
      compact_separator: ' \u00b7 ',
    },
    qr: {
      side_mm: 12,
      margin_mm: 0.9,
      location: 'top-right',
      max_pct_of_text_zone_width: 32,
    },
  },
  24: {
    padding_mm: 0.3,
    media_zone_width_pct: 37.5,
    media_zone_width_pct_min: 25,
    media_zone_width_pct_max: 38,
    media_zone_width_pct_max_user: 35.5,
    icon_layout: 'column',
    icon_padding_mm: 2.2,
    icon_gap_mm: 0,
    icon_min_mm: 7.5,
    media_text_gap_mm: 0,
    text_zone: {
      top_pct: 60,
      gap_mm: 1,
      alignment: 'middle',
      block_offset_mm: 0,
      horizontal_offset_mm: 0,
      main: {
        min_pt: 9.1,
        max_pt: 24,
        letter_spacing_adj: -0.35,
        font_weight: 700,
      },
      sub: {
        min_pt: 7,
        max_pt: 15,
        line_height_pct: 120,
      },
      compact_join_subtitles: true,
      compact_separator: ' \u00b7 ',
    },
    qr: {
      side_mm: 13,
      margin_mm: 0.8,
      location: 'top-right',
      max_pct_of_text_zone_width: 32,
    },
  },
};

const STORAGE_VERSION = 2;
const STORAGE_KEY = `gridfinity-layout-presets:v${STORAGE_VERSION}`;
const LEGACY_STORAGE_KEYS = ['gridfinity-layout-presets'];
const PARTS_KEY = '__parts';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    return window.localStorage;
  } catch (error) {
    console.warn('Unable to access layout preset storage.', error);
    return null;
  }
}

let overridesCache = null;

export function loadPresetOverrides() {
  if (overridesCache) {
    return overridesCache;
  }
  const storage = getStorage();
  if (!storage) {
    overridesCache = {};
    return overridesCache;
  }
  LEGACY_STORAGE_KEYS.forEach(key => {
    try {
      storage.removeItem(key);
    } catch (error) {
      console.warn(`Unable to clear legacy layout preset storage key: ${key}.`, error);
    }
  });
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      overridesCache = {};
      return overridesCache;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      overridesCache = parsed;
      return overridesCache;
    }
  } catch (error) {
    console.warn('Unable to parse layout preset overrides.', error);
  }
  overridesCache = {};
  return overridesCache;
}

export function savePresetOverrides(overrides) {
  overridesCache = overrides ? clone(overrides) : {};
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    LEGACY_STORAGE_KEYS.forEach(key => {
      storage.removeItem(key);
    });
    if (overridesCache && Object.keys(overridesCache).length > 0) {
      storage.setItem(STORAGE_KEY, JSON.stringify(overridesCache));
    } else {
      storage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Unable to persist layout presets.', error);
  }
}

export function clearPresetOverrides() {
  savePresetOverrides({});
  notifyPresetListeners(null, {});
}

function parseHeightValue(heightMm) {
  if (typeof heightMm === 'string') {
    const match = heightMm.match(/-?\d+(?:\.\d+)?/);
    if (match) {
      const parsed = Number.parseFloat(match[0]);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return Number(heightMm);
}

function resolveKey(heightMm) {
  const numeric = parseHeightValue(heightMm);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return '12';
  }
  const available = Object.keys(defaultLayoutPresets).map(Number);
  if (available.includes(numeric)) {
    return String(numeric);
  }
  let closest = available[0];
  let diff = Math.abs(numeric - closest);
  for (let i = 1; i < available.length; i += 1) {
    const candidate = available[i];
    const candidateDiff = Math.abs(numeric - candidate);
    if (candidateDiff < diff) {
      closest = candidate;
      diff = candidateDiff;
    }
  }
  return String(closest);
}

function getOverrideEntry(overrides, key) {
  const entry = overrides?.[key];
  if (!entry || typeof entry !== 'object') {
    return null;
  }
  return entry;
}

function extractBaseOverride(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }
  const { [PARTS_KEY]: _, ...base } = entry;
  return Object.keys(base).length > 0 ? base : null;
}

function extractPartOverride(entry, partType) {
  if (!entry || typeof entry !== 'object' || !partType) {
    return null;
  }
  const map = entry[PARTS_KEY];
  if (!map || typeof map !== 'object') {
    return null;
  }
  const partOverride = map[partType];
  if (!partOverride || typeof partOverride !== 'object') {
    return null;
  }
  return partOverride;
}

export function getPresetOverride(heightMm, options = {}) {
  const overrides = loadPresetOverrides();
  const key = resolveKey(heightMm);
  const entry = getOverrideEntry(overrides, key);
  const { partType = null } = options || {};
  const override = partType ? extractPartOverride(entry, partType) : extractBaseOverride(entry);
  return override ? clone(override) : null;
}

function deepMerge(base, override) {
  const merged = Array.isArray(base) ? [...base] : { ...base };
  Object.keys(override || {}).forEach(key => {
    if (key === PARTS_KEY) {
      if (override[key] && typeof override[key] === 'object') {
        merged[key] = deepMerge(base[key] || {}, override[key]);
      }
      return;
    }
    const value = override[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      merged[key] = deepMerge(base[key] || {}, value);
    } else {
      merged[key] = value;
    }
  });
  return merged;
}

export function getActiveLayoutPreset(heightMm, options = {}) {
  const key = resolveKey(heightMm);
  const base = defaultLayoutPresets[key] || defaultLayoutPresets['12'];
  const overrides = loadPresetOverrides();
  const entry = getOverrideEntry(overrides, key);
  let result = clone(base);
  const baseOverride = extractBaseOverride(entry);
  if (baseOverride) {
    result = deepMerge(result, baseOverride);
  }
  const { partType = null } = options || {};
  if (partType) {
    const partOverride = extractPartOverride(entry, partType);
    if (partOverride) {
      result = deepMerge(result, partOverride);
    }
  }
  return result;
}

function hasNonPartKeys(entry) {
  if (!entry || typeof entry !== 'object') {
    return false;
  }
  return Object.keys(entry).some(key => key !== PARTS_KEY);
}

function clonePartsMap(parts) {
  if (!parts || typeof parts !== 'object') {
    return null;
  }
  const cloned = {};
  Object.keys(parts).forEach(key => {
    const value = parts[key];
    if (value !== undefined) {
      cloned[key] = clone(value);
    }
  });
  return Object.keys(cloned).length > 0 ? cloned : null;
}

export function setPresetOverride(heightMm, preset, options = {}) {
  const overrides = loadPresetOverrides();
  const key = resolveKey(heightMm);
  const entry = getOverrideEntry(overrides, key) ? clone(overrides[key]) : {};
  const { partType = null } = options || {};
  if (partType) {
    const parts = entry[PARTS_KEY] && typeof entry[PARTS_KEY] === 'object' ? { ...entry[PARTS_KEY] } : {};
    if (preset && Object.keys(preset).length > 0) {
      parts[partType] = clone(preset);
    } else {
      delete parts[partType];
    }
    const cleanedParts = clonePartsMap(parts);
    if (cleanedParts) {
      entry[PARTS_KEY] = cleanedParts;
    } else {
      delete entry[PARTS_KEY];
    }
    if (!hasNonPartKeys(entry) && !entry[PARTS_KEY]) {
      delete overrides[key];
    } else {
      overrides[key] = entry;
    }
  } else if (preset && Object.keys(preset).length > 0) {
    const sanitized = clone(preset);
    delete sanitized[PARTS_KEY];
    const parts = entry[PARTS_KEY] && typeof entry[PARTS_KEY] === 'object' ? entry[PARTS_KEY] : null;
    const nextEntry = clone(sanitized);
    if (parts && Object.keys(parts).length > 0) {
      nextEntry[PARTS_KEY] = parts;
    }
    overrides[key] = nextEntry;
  } else {
    if (entry[PARTS_KEY]) {
      overrides[key] = { [PARTS_KEY]: entry[PARTS_KEY] };
    } else {
      delete overrides[key];
    }
  }
  savePresetOverrides(overrides);
  notifyPresetListeners(key, { partType });
}

export function exportLayoutPresets(includeDefaults = false) {
  const overrides = loadPresetOverrides();
  if (includeDefaults) {
    const merged = {};
    const overrideKeys = overrides ? Object.keys(overrides) : [];
    const mergedKeys = new Set([...Object.keys(defaultLayoutPresets), ...overrideKeys]);
    mergedKeys.forEach(key => {
      const hasDefault = Object.hasOwn(defaultLayoutPresets, key);
      const hasOverride = overrides ? Object.hasOwn(overrides, key) : false;
      if (hasDefault) {
        const base = clone(defaultLayoutPresets[key]);
        if (hasOverride) {
          const overrideEntry = overrides[key];
          const baseOverride = extractBaseOverride(overrideEntry);
          const parts = clonePartsMap(overrideEntry?.[PARTS_KEY]);
          const mergedEntry = baseOverride ? deepMerge(base, baseOverride) : base;
          if (parts) {
            mergedEntry[PARTS_KEY] = parts;
          }
          merged[key] = mergedEntry;
        } else {
          merged[key] = base;
        }
      } else if (hasOverride) {
        merged[key] = clone(overrides[key]);
      }
    });
    return JSON.stringify(merged, null, 2);
  }
  if (!overrides || Object.keys(overrides).length === 0) {
    return JSON.stringify({}, null, 2);
  }
  return JSON.stringify(overrides, null, 2);
}

export function importLayoutPresets(json, merge = false) {
  if (typeof json !== 'string') {
    throw new Error('Preset import expects a JSON string.');
  }
  const parsed = JSON.parse(json);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid preset JSON.');
  }
  if (merge) {
    const overrides = loadPresetOverrides();
    savePresetOverrides(deepMerge(overrides, parsed));
  } else {
    savePresetOverrides(parsed);
  }
}

const listeners = new Set();

export function subscribePresetChanges(listener) {
  if (typeof listener !== 'function') {
    return () => {};
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyPresetListeners(heightKey = null, options = {}) {
  listeners.forEach(listener => {
    try {
      listener(heightKey, options);
    } catch (error) {
      console.error('Layout preset listener error.', error);
    }
  });
}
