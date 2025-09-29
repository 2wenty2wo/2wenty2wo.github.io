import { state } from './state.js';
import { elements } from './dom-elements.js';
import {
  metricThreadSizes,
  imperialThreadSizes,
  fuseValues,
  bearingOptions,
  connectorCatalog,
  boltHeadOptions,
  boltDriveOptions,
  screwTypeOptions,
  electricalComponentTypes,
  componentMountOptions as componentMountOptionList,
  resistorValueOptions,
  capacitorValueOptions,
} from './data.js';

export const SHARE_QUERY_PARAM = 'label';

const FIELD_MAP = {
  hardwareType: 'ht',
  systemType: 'ms',
  fuseType: 'ft',
  threadSize: 'ts',
  length: 'ln',
  fuseValue: 'fv',
  glassSpeed: 'gs',
  glassSize: 'gz',
  notes: 'no',
  standard: 'sd',
  standardCode: 'sc',
  boltHead: 'bh',
  boltDrive: 'bv',
  showStandard: 'ss',
  showImage: 'si',
  showQr: 'sq',
  qrContent: 'qc',
  widthMm: 'w',
  heightMm: 'h',
  connectorCategory: 'cc',
  componentCategory: 'cmp',
  componentMount: 'cm',
  resistorValue: 'rv',
  capacitorValue: 'cv',
  bearingType: 'bt',
  bearingDetails: 'bd',
  customLine1: 'c1',
  customLine2: 'c2',
  customImageData: 'cid',
  customImageName: 'cin',
};

const REVERSE_FIELD_MAP = Object.entries(FIELD_MAP).reduce((acc, [key, code]) => {
  acc[code] = key;
  return acc;
}, {});

const hardwareTypeOptions = elements.hardwareTypeOptions || new Set();
const fuseTypeOptions = new Set(
  elements.fuseTypeSelect
    ? Array.from(elements.fuseTypeSelect.options, option => option.value).filter(Boolean)
    : [],
);
const ELECTRICAL_COMPONENT_TYPES = new Set(electricalComponentTypes);
const DEFAULT_COMPONENT_TYPE = electricalComponentTypes[0] || 'Resistor';
const componentCategoryOptions = new Set(electricalComponentTypes);
const componentMountOptions = new Set(componentMountOptionList.map(option => option.id));
const resistorValueOptionSet = new Set(resistorValueOptions.map(option => option.id));
const capacitorValueOptionSet = new Set(capacitorValueOptions.map(option => option.id));
const heightOptions = new Set(
  Array.isArray(elements.heightRadios)
    ? elements.heightRadios
        .map(radio => Number.parseInt(radio.value, 10))
        .filter(value => Number.isFinite(value))
    : [],
);
const glassSizeOptions = new Set(
  elements.glassSizeSelect
    ? Array.from(elements.glassSizeSelect.options)
        .map(option => option.value)
        .filter(value => value && value.trim().length > 0)
    : [],
);
const glassSpeedOptions = new Set(['Slow Blow (Time Delay)', 'Fast Blow']);
const metricThreadSet = new Set(metricThreadSizes);
const imperialThreadSet = new Set(imperialThreadSizes);
const allThreadSizes = new Set([...metricThreadSet, ...imperialThreadSet]);
const fuseValueOptions = new Set(fuseValues.map(value => String(value)));
const connectorCategoryOptions = new Set(connectorCatalog.map(category => category.id));
const bearingCodeOptions = new Set(bearingOptions.map(option => option.code));
const systemTypeOptions = new Set(['Metric', 'Imperial']);
const boltHeadIds = new Set(
  boltHeadOptions.concat(screwTypeOptions).map(option => option.id),
);
const boltDriveIds = new Set(boltDriveOptions.map(option => option.id));

function encodeToBase64Url(input) {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(input);
  let binary = '';
  encoded.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeFromBase64Url(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const paddingNeeded = normalized.length % 4;
  const padded =
    paddingNeeded === 0 ? normalized : normalized + '='.repeat((4 - paddingNeeded) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

function buildSharePayload(sourceState) {
  const payload = {};
  for (const [key, shortKey] of Object.entries(FIELD_MAP)) {
    const value = sourceState[key];
    if (typeof value === 'boolean' || typeof value === 'number') {
      payload[shortKey] = value;
      continue;
    }
    if (typeof value === 'string') {
      if (value.length > 0) {
        payload[shortKey] = value;
      }
    }
  }
  return payload;
}

function sanitizeLength(value) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }
  const str = String(value).trim();
  if (!str) {
    return '';
  }
  const numeric = Number.parseFloat(str);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }
  return str;
}

function sanitizeThreadSize(value, hardwareType) {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  if (
    hardwareType === 'Fuse' ||
    hardwareType === 'Connector' ||
    hardwareType === 'Custom' ||
    hardwareType === 'Bearing' ||
    ELECTRICAL_COMPONENT_TYPES.has(hardwareType)
  ) {
    return '';
  }
  return allThreadSizes.has(trimmed) ? trimmed : '';
}

function sanitizeFuseValue(value) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return '';
  }
  const normalized = String(value).trim();
  if (!normalized) {
    return '';
  }
  return fuseValueOptions.has(normalized) ? normalized : '';
}

function sanitizeGlassSpeed(value) {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  return glassSpeedOptions.has(trimmed) ? trimmed : '';
}

function sanitizeGlassSize(value) {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  return glassSizeOptions.has(trimmed) ? trimmed : '';
}

function sanitizeNotes(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().slice(0, 500);
}

function sanitizeShortText(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.slice(0, 200);
}

function sanitizeQrContent(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().slice(0, 500);
}

function sanitizeCustomImageName(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.slice(0, 200);
}

function sanitizeWidth(value) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  const clamped = Math.min(Math.max(numeric, 37), 100);
  return clamped;
}

function sanitizeHeight(value) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return heightOptions.has(numeric) ? numeric : null;
}

function expandPayload(payload) {
  const expanded = {};
  for (const [shortKey, value] of Object.entries(payload)) {
    const fullKey = REVERSE_FIELD_MAP[shortKey];
    if (fullKey) {
      expanded[fullKey] = value;
    }
  }
  return expanded;
}

function applyExpandedPayload(expanded) {
  const payloadComponentCategory =
    typeof expanded.componentCategory === 'string' &&
    componentCategoryOptions.has(expanded.componentCategory)
      ? expanded.componentCategory
      : '';

  if (typeof expanded.hardwareType === 'string') {
    const trimmedType = expanded.hardwareType.trim();
    let desiredType = trimmedType;
    if (!hardwareTypeOptions.has(trimmedType)) {
      if (trimmedType === 'Component') {
        desiredType = payloadComponentCategory || DEFAULT_COMPONENT_TYPE;
      }
    }
    if (hardwareTypeOptions.has(desiredType)) {
      state.hardwareType = desiredType;
    }
  }
  if (typeof expanded.systemType === 'string' && systemTypeOptions.has(expanded.systemType)) {
    state.systemType = expanded.systemType;
  }
  if (typeof expanded.fuseType === 'string' && fuseTypeOptions.has(expanded.fuseType)) {
    state.fuseType = expanded.fuseType;
  }
  if (
    typeof expanded.connectorCategory === 'string' &&
    connectorCategoryOptions.has(expanded.connectorCategory)
  ) {
    state.connectorCategory = expanded.connectorCategory;
  }
  if (payloadComponentCategory) {
    state.componentCategory = payloadComponentCategory;
  }
  if (
    typeof expanded.componentMount === 'string' &&
    componentMountOptions.has(expanded.componentMount)
  ) {
    state.componentMount = expanded.componentMount;
  }
  if (
    typeof expanded.resistorValue === 'string' &&
    resistorValueOptionSet.has(expanded.resistorValue)
  ) {
    state.resistorValue = expanded.resistorValue;
  }
  if (
    typeof expanded.capacitorValue === 'string' &&
    capacitorValueOptionSet.has(expanded.capacitorValue)
  ) {
    state.capacitorValue = expanded.capacitorValue;
  }
  if (typeof expanded.bearingType === 'string') {
    const trimmed = expanded.bearingType.trim();
    if (!trimmed) {
      state.bearingType = '';
      state.bearingDetails = '';
    } else if (bearingCodeOptions.has(trimmed)) {
      state.bearingType = trimmed;
    }
  }

  if (ELECTRICAL_COMPONENT_TYPES.has(state.hardwareType)) {
    state.componentCategory = state.hardwareType;
  } else {
    state.resistorValue = '';
    state.capacitorValue = '';
  }

  const activeCategory = state.componentCategory || state.hardwareType || '';
  if (activeCategory !== 'Resistor') {
    state.resistorValue = '';
  }
  if (activeCategory !== 'Capacitor') {
    state.capacitorValue = '';
  }

  const sanitizedThread = sanitizeThreadSize(expanded.threadSize, state.hardwareType);
  if (sanitizedThread !== null) {
    state.threadSize = sanitizedThread;
  }

  if (state.hardwareType === 'Bolt' || state.hardwareType === 'Screw') {
    const sanitizedLength = sanitizeLength(expanded.length);
    if (sanitizedLength !== null) {
      state.length = sanitizedLength;
    }
  } else {
    state.length = '';
  }

  if (state.hardwareType === 'Fuse') {
    const sanitizedFuse = sanitizeFuseValue(expanded.fuseValue);
    if (sanitizedFuse !== null) {
      state.fuseValue = sanitizedFuse;
    }
    if (state.fuseType === 'Glass') {
      const sanitizedSpeed = sanitizeGlassSpeed(expanded.glassSpeed);
      if (sanitizedSpeed !== null) {
        state.glassSpeed = sanitizedSpeed;
      }
      const sanitizedSize = sanitizeGlassSize(expanded.glassSize);
      if (sanitizedSize !== null) {
        state.glassSize = sanitizedSize;
      }
    } else {
      state.glassSpeed = '';
      state.glassSize = '';
    }
  } else {
    state.fuseValue = '';
    state.glassSpeed = '';
    state.glassSize = '';
  }

  if (typeof expanded.notes === 'string') {
    state.notes = sanitizeNotes(expanded.notes);
  }

  if (typeof expanded.standardCode === 'string') {
    state.standardCode = expanded.standardCode.trim().slice(0, 120);
  }
  if (typeof expanded.standard === 'string') {
    state.standard = sanitizeShortText(expanded.standard);
  }
  if (typeof expanded.boltHead === 'string') {
    const trimmedHead = expanded.boltHead.trim();
    state.boltHead = boltHeadIds.has(trimmedHead) ? trimmedHead : '';
  }
  if (typeof expanded.boltDrive === 'string') {
    const trimmedDrive = expanded.boltDrive.trim();
    state.boltDrive = boltDriveIds.has(trimmedDrive) ? trimmedDrive : '';
  }

  if (typeof expanded.showStandard === 'boolean') {
    state.showStandard = expanded.showStandard;
  }
  if (typeof expanded.showImage === 'boolean') {
    state.showImage = expanded.showImage;
  }
  if (typeof expanded.showQr === 'boolean') {
    state.showQr = expanded.showQr;
  }
  if (typeof expanded.qrContent === 'string') {
    state.qrContent = sanitizeQrContent(expanded.qrContent);
  }

  const width = sanitizeWidth(expanded.widthMm);
  if (width !== null) {
    state.widthMm = width;
  }
  const height = sanitizeHeight(expanded.heightMm);
  if (height !== null) {
    state.heightMm = height;
  }

  if (typeof expanded.bearingDetails === 'string') {
    state.bearingDetails = sanitizeShortText(expanded.bearingDetails);
  }

  if (typeof expanded.customLine1 === 'string') {
    state.customLine1 = expanded.customLine1.slice(0, 120);
  }
  if (typeof expanded.customLine2 === 'string') {
    state.customLine2 = expanded.customLine2.slice(0, 120);
  }
  if (typeof expanded.customImageData === 'string') {
    state.customImageData = expanded.customImageData;
  }
  if (typeof expanded.customImageName === 'string') {
    state.customImageName = sanitizeCustomImageName(expanded.customImageName);
  }
}

export function serializeStateToQuery() {
  try {
    const payload = buildSharePayload(state);
    if (Object.keys(payload).length === 0) {
      return '';
    }
    const json = JSON.stringify(payload);
    return encodeToBase64Url(json);
  } catch (error) {
    console.error('Failed to encode share state', error);
    return '';
  }
}

export function buildShareUrl() {
  if (typeof window === 'undefined' || typeof window.location === 'undefined') {
    return '';
  }
  const encoded = serializeStateToQuery();
  if (!encoded) {
    return '';
  }
  const url = new URL(window.location.href);
  url.searchParams.set(SHARE_QUERY_PARAM, encoded);
  return url.toString();
}

export function hydrateStateFromUrl() {
  if (typeof window === 'undefined' || typeof window.location === 'undefined') {
    return { hydrated: false };
  }
  let encoded = '';
  try {
    const currentUrl = new URL(window.location.href);
    encoded = currentUrl.searchParams.get(SHARE_QUERY_PARAM) || '';
  } catch (error) {
    console.warn('Unable to inspect current URL for share parameter', error);
    return { hydrated: false };
  }
  if (!encoded) {
    return { hydrated: false };
  }

  try {
    const json = decodeFromBase64Url(encoded);
    const payload = JSON.parse(json);
    if (!payload || typeof payload !== 'object') {
      return { hydrated: false };
    }
    const expanded = expandPayload(payload);
    applyExpandedPayload(expanded);
    return { hydrated: true };
  } catch (error) {
    console.warn('Failed to hydrate state from share URL', error);
    return { hydrated: false };
  }
}
