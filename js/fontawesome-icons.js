const ICONS_ENDPOINT =
  'https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/metadata/icons.json';

const VALID_STYLES = ['solid', 'regular', 'brands'];

let metadataPromise = null;
let metadataCache = null;
const iconListCache = new Map();

function normalizeStyle(style) {
  if (typeof style !== 'string') {
    return 'solid';
  }
  const trimmed = style.trim().toLowerCase();
  return VALID_STYLES.includes(trimmed) ? trimmed : 'solid';
}

async function loadMetadata() {
  if (metadataCache) {
    return metadataCache;
  }
  if (!metadataPromise) {
    metadataPromise = fetch(ICONS_ENDPOINT)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load Font Awesome metadata: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        metadataCache = data && typeof data === 'object' ? data : {};
        return metadataCache;
      })
      .catch(error => {
        metadataPromise = null;
        throw error;
      });
  }
  return metadataPromise;
}

function buildIconCollection(style, metadata) {
  const icons = [];
  const index = new Map();
  const entries = Object.entries(metadata || {});
  entries.forEach(([name, details]) => {
    if (!details || typeof details !== 'object') {
      return;
    }
    const freeStyles = Array.isArray(details.free) ? details.free : [];
    if (!freeStyles.includes(style)) {
      return;
    }
    const unicode = typeof details.unicode === 'string' ? details.unicode.trim() : '';
    if (!unicode) {
      return;
    }
    const label =
      typeof details.label === 'string' && details.label.trim().length > 0
        ? details.label.trim()
        : name;
    const searchTerms = Array.isArray(details.search && details.search.terms)
      ? details.search.terms
      : [];
    const aliasNames = Array.isArray(details.aliases && details.aliases.names)
      ? details.aliases.names
      : [];
    const keywords = searchTerms.concat(aliasNames).filter(term => typeof term === 'string');
    const iconRecord = {
      name,
      label,
      unicode,
      keywords,
      style,
    };
    icons.push(iconRecord);
    index.set(name, iconRecord);
  });
  icons.sort((a, b) => {
    const labelCompare = a.label.localeCompare(b.label, undefined, {
      sensitivity: 'base',
    });
    if (labelCompare !== 0) {
      return labelCompare;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
  return { icons, index };
}

async function ensureCollection(style) {
  const normalized = normalizeStyle(style);
  if (iconListCache.has(normalized)) {
    return iconListCache.get(normalized);
  }
  const metadata = await loadMetadata();
  const collection = buildIconCollection(normalized, metadata);
  iconListCache.set(normalized, collection);
  return collection;
}

export function getValidIconStyles() {
  return [...VALID_STYLES];
}

export async function loadIconsForStyle(style) {
  return ensureCollection(style);
}

export async function findIcon(style, name) {
  const collection = await ensureCollection(style);
  if (!name) {
    return null;
  }
  const normalizedName = String(name).trim();
  if (!normalizedName) {
    return null;
  }
  return collection.index.get(normalizedName) || null;
}

export function filterIcons(icons, query) {
  if (!Array.isArray(icons)) {
    return [];
  }
  const normalizedQuery = typeof query === 'string' ? query.trim().toLowerCase() : '';
  if (!normalizedQuery) {
    return icons;
  }
  return icons.filter(icon => {
    if (!icon || typeof icon !== 'object') {
      return false;
    }
    const nameMatch = icon.name.toLowerCase().includes(normalizedQuery);
    if (nameMatch) {
      return true;
    }
    const labelMatch = icon.label.toLowerCase().includes(normalizedQuery);
    if (labelMatch) {
      return true;
    }
    if (Array.isArray(icon.keywords)) {
      return icon.keywords.some(keyword => {
        if (typeof keyword !== 'string') {
          return false;
        }
        return keyword.toLowerCase().includes(normalizedQuery);
      });
    }
    return false;
  });
}

export function normalizeIconStyle(style) {
  return normalizeStyle(style);
}
