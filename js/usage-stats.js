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

function parseSnapshotString(value) {
  if (typeof value !== 'string') {
    return {};
  }
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.warn('Unable to parse snapshot from analytics payload', error);
    return {};
  }
}

const SHARED_ANALYTICS_ENDPOINT =
  (typeof window !== 'undefined' && window.GRIDFINITY_ANALYTICS_ENDPOINT) ||
  'https://analytics.gridfinitylabels.com/usage.json';

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

function extractRemoteEntries(payload) {
  if (!payload) {
    return null;
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  if (typeof payload === 'object') {
    if (Array.isArray(payload.entries)) {
      return payload.entries;
    }
    if (Array.isArray(payload.data)) {
      return payload.data;
    }
  }
  return null;
}

function normalizeRemoteEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const key = typeof entry.key === 'string'
    ? entry.key
    : typeof entry.labelKey === 'string'
      ? entry.labelKey
      : null;

  if (!key) {
    return null;
  }

  const timestampValue =
    entry.timestamp ?? entry.latestTimestamp ?? entry.updatedAt ?? entry.lastSeen ?? entry.lastTimestamp;
  const timestamp = Number(timestampValue);
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  const snapshot = entry.snapshot && typeof entry.snapshot === 'object'
    ? cloneSnapshot(entry.snapshot)
    : typeof entry.snapshot === 'string'
      ? cloneSnapshot(parseSnapshotString(entry.snapshot))
      : entry.data && typeof entry.data === 'object'
        ? cloneSnapshot(entry.data)
        : {};

  const svgMarkup = typeof entry.svgMarkup === 'string'
    ? entry.svgMarkup
    : typeof entry.svg === 'string'
      ? entry.svg
      : '';

  const eventType = sanitizeEventType(entry.eventType || entry.lastEventType || entry.type);

  return { key, snapshot, svgMarkup, timestamp, eventType };
}

export async function getUsageEntries() {
  let remoteError = null;

  try {
    const response = await fetch(SHARED_ANALYTICS_ENDPOINT, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`Analytics request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const rawEntries = extractRemoteEntries(payload);
    if (!Array.isArray(rawEntries)) {
      throw new Error('Analytics payload did not contain an entries array');
    }

    const normalizedEntries = rawEntries.map(normalizeRemoteEntry).filter(Boolean);

    if (normalizedEntries.length === 0 && rawEntries.length > 0) {
      throw new Error('Analytics payload did not include valid entries');
    }

    return { entries: normalizedEntries, source: 'remote', error: null };
  } catch (error) {
    remoteError = error instanceof Error ? error : new Error('Unknown analytics error');
    console.error('Unable to load global usage stats', remoteError);
  }

  const fallbackEntries = loadEntries();
  return { entries: fallbackEntries, source: 'local', error: remoteError };
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
