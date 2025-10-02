const STORAGE_KEY = 'gridfinity-label-usage-v1';
const MAX_ENTRIES = 400;

function supportsLocalStorage() {
  try {
    return typeof window !== 'undefined' && 'localStorage' in window && window.localStorage !== null;
  } catch (error) {
    console.warn('Local storage unavailable for usage stats', error);
    return false;
  }
}

function safeParse(json) {
  if (!json) {
    return [];
  }
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Unable to parse stored label usage stats', error);
    return [];
  }
}

function loadEntries() {
  if (!supportsLocalStorage()) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const entries = safeParse(raw);
    return entries.filter(entry => entry && typeof entry.timestamp === 'number' && entry.key);
  } catch (error) {
    console.warn('Unable to load label usage stats', error);
    return [];
  }
}

function saveEntries(entries) {
  if (!supportsLocalStorage()) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.warn('Unable to persist label usage stats', error);
  }
}

function normalizeSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return {};
  }
  const normalized = {};
  const keys = Object.keys(snapshot);
  keys.sort();
  for (const key of keys) {
    normalized[key] = snapshot[key];
  }
  return normalized;
}

function createLabelKey(snapshot) {
  const normalized = normalizeSnapshot(snapshot);
  return JSON.stringify(normalized);
}

function sanitizeEventType(eventType) {
  return eventType === 'print' ? 'print' : 'download';
}

function cloneSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return {};
  }
  try {
    return structuredClone(snapshot);
  } catch {
    return JSON.parse(JSON.stringify(snapshot));
  }
}

export function recordLabelUsage(eventType, details) {
  if (!details || typeof details !== 'object') {
    return;
  }
  const { snapshot, svgMarkup } = details;
  if (!snapshot || typeof svgMarkup !== 'string' || svgMarkup.length === 0) {
    return;
  }
  const entrySnapshot = cloneSnapshot(snapshot);
  const key = createLabelKey(entrySnapshot);
  const timestamp = Number.isFinite(details.timestamp) ? details.timestamp : Date.now();
  const entry = {
    key,
    snapshot: entrySnapshot,
    svgMarkup,
    timestamp,
    eventType: sanitizeEventType(eventType),
  };
  const entries = loadEntries();
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) {
    entries.splice(0, entries.length - MAX_ENTRIES);
  }
  saveEntries(entries);
}

export function getUsageEntries() {
  return loadEntries();
}

export function computeTopLabels(entries, periodStartMs, limit = 5) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return [];
  }
  const start = Number.isFinite(periodStartMs) ? Number(periodStartMs) : 0;
  const aggregated = new Map();
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const { timestamp, key } = entry;
    if (!Number.isFinite(timestamp) || timestamp < start || !key) {
      continue;
    }
    const group = aggregated.get(key) || {
      key,
      count: 0,
      latestTimestamp: 0,
      snapshot: null,
      svgMarkup: '',
      eventTypes: new Set(),
    };
    group.count += 1;
    if (timestamp > group.latestTimestamp) {
      group.latestTimestamp = timestamp;
      group.snapshot = entry.snapshot || group.snapshot;
      group.svgMarkup = typeof entry.svgMarkup === 'string' && entry.svgMarkup.length > 0
        ? entry.svgMarkup
        : group.svgMarkup;
    }
    if (entry.eventType) {
      group.eventTypes.add(entry.eventType);
    }
    aggregated.set(key, group);
  }
  const results = Array.from(aggregated.values());
  results.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return b.latestTimestamp - a.latestTimestamp;
  });
  return results.slice(0, Math.max(0, limit)).map(item => ({
    key: item.key,
    count: item.count,
    latestTimestamp: item.latestTimestamp,
    snapshot: item.snapshot,
    svgMarkup: item.svgMarkup,
    eventTypes: Array.from(item.eventTypes),
  }));
}
