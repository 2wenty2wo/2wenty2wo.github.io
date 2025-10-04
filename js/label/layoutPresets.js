export const defaultLayoutPresets = {
  9: {
    padding_mm: 1.2,
    media_zone_width_pct: 34,
    media_zone_width_pct_min: 30,
    media_zone_width_pct_max: 38,
    media_zone_width_pct_max_user: 38,
    icon_layout: 'row',
    icon_gap_mm: 0.5,
    icon_min_mm: 3.2,
    text_zone: {
      top_pct: 58,
      gap_mm: 0.5,
      alignment: 'start',
      main: {
        min_pt: 7.5,
        max_pt: 11,
        letter_spacing_adj: -0.3,
        font_weight: 800,
      },
      sub: {
        min_pt: 6.8,
        max_pt: 8.5,
        line_height_pct: 110,
      },
      compact_join_subtitles: true,
      compact_separator: ' \u00b7 ',
    },
    qr: {
      side_mm: 7,
      margin_mm: 0.5,
      location: 'top-right',
      max_pct_of_text_zone_width: 35,
    },
  },
  12: {
    padding_mm: 1.4,
    media_zone_width_pct: 36,
    media_zone_width_pct_min: 32,
    media_zone_width_pct_max: 40,
    media_zone_width_pct_max_user: 40,
    icon_layout: 'row',
    icon_gap_mm: 0.7,
    icon_min_mm: 4.2,
    text_zone: {
      top_pct: 58,
      gap_mm: 0.6,
      alignment: 'start',
      main: {
        min_pt: 8.5,
        max_pt: 14,
        letter_spacing_adj: -0.3,
        font_weight: 800,
      },
      sub: {
        min_pt: 7.2,
        max_pt: 10.5,
        line_height_pct: 115,
      },
      compact_join_subtitles: true,
      compact_separator: ' \u00b7 ',
    },
    qr: {
      side_mm: 9,
      margin_mm: 0.6,
      location: 'top-right',
      max_pct_of_text_zone_width: 34,
    },
  },
  18: {
    padding_mm: 1.6,
    media_zone_width_pct: 32,
    media_zone_width_pct_min: 28,
    media_zone_width_pct_max: 36,
    media_zone_width_pct_max_user: 36,
    icon_layout: 'column',
    icon_gap_mm: 0.9,
    icon_min_mm: 6,
    text_zone: {
      top_pct: 60,
      gap_mm: 0.8,
      alignment: 'start',
      main: {
        min_pt: 9.5,
        max_pt: 20,
        letter_spacing_adj: -0.35,
        font_weight: 800,
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
    padding_mm: 1.8,
    media_zone_width_pct: 32,
    media_zone_width_pct_min: 26,
    media_zone_width_pct_max: 36,
    media_zone_width_pct_max_user: 36,
    icon_layout: 'column',
    icon_gap_mm: 1,
    icon_min_mm: 7.5,
    text_zone: {
      top_pct: 60,
      gap_mm: 1,
      alignment: 'start',
      main: {
        min_pt: 10,
        max_pt: 24,
        letter_spacing_adj: -0.35,
        font_weight: 800,
      },
      sub: {
        min_pt: 9,
        max_pt: 15,
        line_height_pct: 125,
      },
      compact_join_subtitles: false,
      compact_separator: ' \u00b7 ',
    },
    qr: {
      side_mm: 14,
      margin_mm: 1,
      location: 'top-right',
      max_pct_of_text_zone_width: 30,
    },
  },
};

const STORAGE_KEY = 'gridfinity-layout-presets';

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
  notifyPresetListeners();
}

function resolveKey(heightMm) {
  const numeric = Number(heightMm);
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

export function getPresetOverride(heightMm) {
  const overrides = loadPresetOverrides();
  const key = resolveKey(heightMm);
  const override = overrides[key];
  return override ? clone(override) : null;
}

function deepMerge(base, override) {
  const merged = Array.isArray(base) ? [...base] : { ...base };
  Object.keys(override || {}).forEach(key => {
    const value = override[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      merged[key] = deepMerge(base[key] || {}, value);
    } else {
      merged[key] = value;
    }
  });
  return merged;
}

export function getActiveLayoutPreset(heightMm) {
  const key = resolveKey(heightMm);
  const base = defaultLayoutPresets[key] || defaultLayoutPresets['12'];
  const override = getPresetOverride(key);
  if (!override) {
    return clone(base);
  }
  return deepMerge(clone(base), override);
}

export function setPresetOverride(heightMm, preset) {
  const overrides = loadPresetOverrides();
  const key = resolveKey(heightMm);
  if (preset) {
    overrides[key] = clone(preset);
  } else {
    delete overrides[key];
  }
  savePresetOverrides(overrides);
  notifyPresetListeners(key);
}

export function exportLayoutPresets(includeDefaults = false) {
  if (includeDefaults) {
    return JSON.stringify(defaultLayoutPresets, null, 2);
  }
  const overrides = loadPresetOverrides();
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

export function notifyPresetListeners(heightKey = null) {
  listeners.forEach(listener => {
    try {
      listener(heightKey);
    } catch (error) {
      console.error('Layout preset listener error.', error);
    }
  });
}
