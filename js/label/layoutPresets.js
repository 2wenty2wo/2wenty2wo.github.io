export const defaultLayoutPresets = {
  9: {
    padding_mm: 0,
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
        wrap_mode: 'fit',
      },
      sub: {
        min_pt: 4.4,
        max_pt: 9,
        line_height_pct: 101,
        subtitle1_wrap_mode: 'wrap',
        subtitle2_wrap_mode: 'wrap',
        subtitle3_wrap_mode: 'wrap',
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
    padding_mm: 0,
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
      block_offset_mm: 0.1,
      horizontal_offset_mm: 0,
      main: {
        min_pt: 8.5,
        max_pt: 14,
        letter_spacing_adj: -0.3,
        font_weight: 700,
        wrap_mode: 'fit',
      },
      sub: {
        min_pt: 6.1,
        max_pt: 10.5,
        line_height_pct: 112,
        subtitle1_wrap_mode: 'wrap',
        subtitle2_wrap_mode: 'wrap',
        subtitle3_wrap_mode: 'wrap',
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
    __parts: {
      Switch: {
        __sub_parts: {
          'switch-type:microswitch-roller': {
            text_zone: {
              main: {
                wrap_mode: 'wrap',
              },
            },
          },
        },
      },
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
      block_offset_mm: 0.5,
      horizontal_offset_mm: 0,
      main: {
        min_pt: 9.5,
        max_pt: 20,
        letter_spacing_adj: -0.35,
        font_weight: 700,
        wrap_mode: 'fit',
      },
      sub: {
        min_pt: 8,
        max_pt: 13,
        line_height_pct: 120,
        subtitle1_wrap_mode: 'wrap',
        subtitle2_wrap_mode: 'wrap',
        subtitle3_wrap_mode: 'wrap',
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
    __parts: {
      Switch: {
        __sub_parts: {
          'switch-type:microswitch-roller': {
            text_zone: {
              main: {
                wrap_mode: 'wrap',
              },
            },
            media_zone_width_pct_max_user: 50,
          },
        },
      },
    },
  },
  24: {
    padding_mm: 0,
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
      block_offset_mm: 0.9,
      horizontal_offset_mm: 0,
      main: {
        min_pt: 9.1,
        max_pt: 24,
        letter_spacing_adj: -0.35,
        font_weight: 700,
        wrap_mode: 'fit',
      },
      sub: {
        min_pt: 7,
        max_pt: 15,
        line_height_pct: 120,
        subtitle1_wrap_mode: 'wrap',
        subtitle2_wrap_mode: 'wrap',
        subtitle3_wrap_mode: 'wrap',
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
    __parts: {
      Switch: {
        __sub_parts: {
          'switch-type:microswitch-roller': {
            text_zone: {
              main: {
                wrap_mode: 'wrap',
              },
            },
            media_zone_width_pct_max_user: 50,
            media_zone_width_pct_max: 38,
            icon_padding_mm: 0.4,
          },
        },
      },
    },
  },
};

const STORAGE_VERSION = 3;
const STORAGE_KEY = `gridfinity-layout-presets:v${STORAGE_VERSION}`;
const LEGACY_STORAGE_KEYS = ['gridfinity-layout-presets'];
const PARTS_KEY = '__parts';
const SUB_PARTS_KEY = '__sub_parts';

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
  const base = { ...entry };
  delete base[PARTS_KEY];
  return Object.keys(base).length > 0 ? base : null;
}

function getPartEntry(entry, partType) {
  if (!entry || typeof entry !== 'object' || !partType) {
    return null;
  }
  const map = entry[PARTS_KEY];
  if (!map || typeof map !== 'object') {
    return null;
  }
  const partEntry = map[partType];
  if (!partEntry || typeof partEntry !== 'object') {
    return null;
  }
  return partEntry;
}

function extractPartOverride(entry, partType) {
  const partEntry = getPartEntry(entry, partType);
  if (!partEntry) {
    return null;
  }
  const { [SUB_PARTS_KEY]: _ignored, ...rest } = partEntry;
  void _ignored;
  return Object.keys(rest).length > 0 ? rest : null;
}

function extractSubPartOverride(entry, partType, subPartType) {
  if (!subPartType) {
    return null;
  }
  const partEntry = getPartEntry(entry, partType);
  if (!partEntry) {
    return null;
  }
  const subParts = partEntry[SUB_PARTS_KEY];
  if (!subParts || typeof subParts !== 'object') {
    return null;
  }
  const override = subParts[subPartType];
  if (!override || typeof override !== 'object') {
    return null;
  }
  return override;
}

export function getPresetOverride(heightMm, options = {}) {
  const overrides = loadPresetOverrides();
  const key = resolveKey(heightMm);
  const entry = getOverrideEntry(overrides, key);
  const { partType = null, subPartType = null } = options || {};
  let override = null;
  if (partType) {
    override = subPartType
      ? extractSubPartOverride(entry, partType, subPartType)
      : extractPartOverride(entry, partType);
  } else {
    override = extractBaseOverride(entry);
  }
  return override ? clone(override) : null;
}

function deepMerge(base, override) {
  const merged = Array.isArray(base) ? [...base] : { ...base };
  Object.keys(override || {}).forEach(key => {
    if (key === PARTS_KEY || key === SUB_PARTS_KEY) {
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
  const { partType = null, subPartType = null } = options || {};
  if (partType) {
    const partOverride = extractPartOverride(entry, partType);
    if (partOverride) {
      result = deepMerge(result, partOverride);
    }
    if (subPartType) {
      const subOverride = extractSubPartOverride(entry, partType, subPartType);
      if (subOverride) {
        result = deepMerge(result, subOverride);
      }
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

function cloneSubPartsMap(subParts) {
  if (!subParts || typeof subParts !== 'object') {
    return null;
  }
  const cloned = {};
  Object.keys(subParts).forEach(key => {
    const value = subParts[key];
    if (value && typeof value === 'object' && Object.keys(value).length > 0) {
      cloned[key] = clone(value);
    }
  });
  return Object.keys(cloned).length > 0 ? cloned : null;
}

function sanitizePartEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }
  const { [SUB_PARTS_KEY]: subPartsRaw, ...rest } = entry;
  const sanitized = {};
  Object.keys(rest).forEach(key => {
    const value = rest[key];
    if (value !== undefined) {
      sanitized[key] = clone(value);
    }
  });
  const subParts = cloneSubPartsMap(subPartsRaw);
  if (subParts) {
    sanitized[SUB_PARTS_KEY] = subParts;
  }
  return Object.keys(sanitized).length > 0 ? sanitized : null;
}

function clonePartsMap(parts) {
  if (!parts || typeof parts !== 'object') {
    return null;
  }
  const cloned = {};
  Object.keys(parts).forEach(key => {
    const entry = sanitizePartEntry(parts[key]);
    if (entry) {
      cloned[key] = entry;
    }
  });
  return Object.keys(cloned).length > 0 ? cloned : null;
}

export function setPresetOverride(heightMm, preset, options = {}) {
  const overrides = loadPresetOverrides();
  const key = resolveKey(heightMm);
  const entry = getOverrideEntry(overrides, key) ? clone(overrides[key]) : {};
  const { partType = null, subPartType = null } = options || {};
  if (partType) {
    const parts = entry[PARTS_KEY] && typeof entry[PARTS_KEY] === 'object' ? { ...entry[PARTS_KEY] } : {};
    let partEntry = sanitizePartEntry(parts[partType]) || {};
    if (subPartType) {
      const subParts = partEntry[SUB_PARTS_KEY]
        ? { ...partEntry[SUB_PARTS_KEY] }
        : {};
      if (preset && Object.keys(preset).length > 0) {
        subParts[subPartType] = clone(preset);
      } else {
        delete subParts[subPartType];
      }
      const cleanedSubParts = cloneSubPartsMap(subParts);
      if (cleanedSubParts) {
        partEntry[SUB_PARTS_KEY] = cleanedSubParts;
      } else {
        delete partEntry[SUB_PARTS_KEY];
      }
    } else if (preset && Object.keys(preset).length > 0) {
      const sanitized = clone(preset);
      delete sanitized[PARTS_KEY];
      delete sanitized[SUB_PARTS_KEY];
      const existingSubParts = partEntry[SUB_PARTS_KEY]
        ? cloneSubPartsMap(partEntry[SUB_PARTS_KEY])
        : null;
      const nextEntry = clone(sanitized);
      if (existingSubParts) {
        nextEntry[SUB_PARTS_KEY] = existingSubParts;
      }
      partEntry = nextEntry;
    } else {
      if (partEntry[SUB_PARTS_KEY]) {
        const cleaned = cloneSubPartsMap(partEntry[SUB_PARTS_KEY]);
        if (cleaned) {
          Object.keys(partEntry).forEach(key => {
            if (key !== SUB_PARTS_KEY) {
              delete partEntry[key];
            }
          });
          partEntry[SUB_PARTS_KEY] = cleaned;
        } else {
          Object.keys(partEntry).forEach(key => delete partEntry[key]);
        }
      } else {
        Object.keys(partEntry).forEach(key => delete partEntry[key]);
      }
    }
    if (Object.keys(partEntry).length > 0) {
      parts[partType] = partEntry;
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
    delete sanitized[SUB_PARTS_KEY];
    const parts = entry[PARTS_KEY] && typeof entry[PARTS_KEY] === 'object' ? entry[PARTS_KEY] : null;
    const nextEntry = clone(sanitized);
    if (parts && Object.keys(parts).length > 0) {
      nextEntry[PARTS_KEY] = clonePartsMap(parts);
    }
    overrides[key] = nextEntry;
  } else {
    if (entry[PARTS_KEY]) {
      const cleanedParts = clonePartsMap(entry[PARTS_KEY]);
      if (cleanedParts) {
        overrides[key] = { [PARTS_KEY]: cleanedParts };
      } else {
        delete overrides[key];
      }
    } else {
      delete overrides[key];
    }
  }
  savePresetOverrides(overrides);
  notifyPresetListeners(key, { partType, subPartType });
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
