import { initTheme } from './theme.js';
import { getUsageEntries, computeTopLabels } from './usage-stats.js';

const PERIOD_DEFINITIONS = [
  {
    id: 'today',
    title: 'Today',
    description: 'Labels generated since midnight.',
    start: startOfToday,
  },
  {
    id: 'week',
    title: 'This Week',
    description: 'Activity since the start of this week.',
    start: startOfWeek,
  },
  {
    id: 'month',
    title: 'This Month',
    description: 'Downloads or prints during the current month.',
    start: startOfMonth,
  },
  {
    id: 'year',
    title: 'This Year',
    description: 'Your most popular labels of the year.',
    start: startOfYear,
  },
];

const TOP_LABEL_LIMIT = 5;
const MAX_CUSTOM_GROUPS = 20;

document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  const entries = getUsageEntries();
  const summaryContainer = document.getElementById('stats-summary-cards');
  const emptyMessage = document.getElementById('stats-empty-message');
  const periodsContainer = document.getElementById('stats-periods');
  const hardwareSection = document.getElementById('stats-hardware-section');
  const hardwareTableBody = document.getElementById('stats-hardware-tbody');
  const customSection = document.getElementById('stats-custom-section');
  const customGrid = document.getElementById('stats-custom-grid');
  const customEmptyMessage = document.getElementById('stats-custom-empty');

  if (!Array.isArray(entries) || entries.length === 0) {
    if (summaryContainer) {
      summaryContainer.innerHTML = '';
    }
    if (emptyMessage) {
      emptyMessage.textContent =
        'No download or print activity recorded yet. Stats will populate after you export a label from this browser.';
    }
    return;
  }

  const summary = computeSummary(entries);

  if (summaryContainer) {
    renderSummary(summary, summaryContainer);
  }

  if (emptyMessage) {
    const lastActivity = summary.latestTimestamp
      ? ` Last recorded activity: ${formatTimestamp(summary.latestTimestamp)}.`
      : '';
    emptyMessage.textContent =
      'Stats are stored locally in this browser. Downloading or printing new labels updates the dashboard automatically.' +
      lastActivity;
  }

  if (hardwareSection && hardwareTableBody) {
    renderHardwareBreakdown(entries, hardwareSection, hardwareTableBody);
  }

  if (customSection && customGrid && customEmptyMessage) {
    renderCustomLabelGroups(entries, customSection, customGrid, customEmptyMessage);
  }

  if (periodsContainer) {
    periodsContainer.hidden = false;
    renderPeriods(entries, periodsContainer);
  }
});

function computeSummary(entries) {
  const uniqueKeys = new Set();
  let total = 0;
  let downloadCount = 0;
  let printCount = 0;
  let latestTimestamp = 0;

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    total += 1;
    if (entry.key) {
      uniqueKeys.add(entry.key);
    }
    if (entry.eventType === 'print') {
      printCount += 1;
    } else {
      downloadCount += 1;
    }
    if (Number.isFinite(entry.timestamp) && entry.timestamp > latestTimestamp) {
      latestTimestamp = entry.timestamp;
    }
  }

  return {
    total,
    downloadCount,
    printCount,
    uniqueLabelCount: uniqueKeys.size,
    latestTimestamp,
  };
}

function renderSummary(summary, container) {
  container.innerHTML = '';
  container.classList.remove('row', 'g-3');
  container.classList.add('stats-summary-grid');
  const cards = [
    {
      label: 'Total uses',
      value: formatNumber(summary.total),
      hint: 'Download and print events combined.',
    },
    {
      label: 'Downloads',
      value: formatNumber(summary.downloadCount),
    },
    {
      label: 'Prints',
      value: formatNumber(summary.printCount),
    },
    {
      label: 'Unique designs',
      value: formatNumber(summary.uniqueLabelCount),
    },
  ];

  for (const cardData of cards) {
    const card = document.createElement('article');
    card.className = 'stats-summary-card card shadow-sm h-100';

    const body = document.createElement('div');
    body.className = 'card-body';

    const labelEl = document.createElement('p');
    labelEl.className = 'stats-summary-label text-muted text-uppercase fw-semibold small mb-1';
    labelEl.textContent = cardData.label;
    body.append(labelEl);

    const valueEl = document.createElement('p');
    valueEl.className = 'stats-summary-value fs-2 fw-semibold mb-0';
    valueEl.textContent = cardData.value;
    body.append(valueEl);

    if (cardData.hint) {
      const hintEl = document.createElement('p');
      hintEl.className = 'text-muted small mb-0';
      hintEl.textContent = cardData.hint;
      body.append(hintEl);
    }

    card.append(body);
    container.append(card);
  }
}

function renderHardwareBreakdown(entries, section, tableBody) {
  const breakdown = aggregateByHardwareType(entries);
  if (breakdown.length === 0) {
    section.hidden = true;
    tableBody.innerHTML = '';
    return;
  }

  section.hidden = false;
  tableBody.innerHTML = '';

  for (const item of breakdown) {
    const row = document.createElement('tr');

    const typeCell = document.createElement('th');
    typeCell.scope = 'row';
    typeCell.textContent = item.label;
    row.append(typeCell);

    const totalCell = document.createElement('td');
    totalCell.className = 'text-end';
    totalCell.textContent = formatNumber(item.count);
    row.append(totalCell);

    const downloadCell = document.createElement('td');
    downloadCell.className = 'text-end';
    downloadCell.textContent = formatNumber(item.downloadCount);
    row.append(downloadCell);

    const printCell = document.createElement('td');
    printCell.className = 'text-end';
    printCell.textContent = formatNumber(item.printCount);
    row.append(printCell);

    const lastCell = document.createElement('td');
    lastCell.className = 'text-muted';
    lastCell.textContent = item.latestTimestamp ? formatTimestamp(item.latestTimestamp) : '—';
    row.append(lastCell);

    tableBody.append(row);
  }
}

function aggregateByHardwareType(entries) {
  const aggregated = new Map();

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const snapshot = entry.snapshot || {};
    const hardwareTypeRaw = typeof snapshot.hardwareType === 'string' ? snapshot.hardwareType.trim() : '';
    const hardwareType = hardwareTypeRaw || 'Unspecified';
    const key = hardwareType.toLowerCase();
    const group =
      aggregated.get(key) || {
        key,
        label: hardwareType,
        count: 0,
        downloadCount: 0,
        printCount: 0,
        latestTimestamp: 0,
      };

    group.count += 1;
    if (entry.eventType === 'print') {
      group.printCount += 1;
    } else {
      group.downloadCount += 1;
    }
    if (Number.isFinite(entry.timestamp) && entry.timestamp > group.latestTimestamp) {
      group.latestTimestamp = entry.timestamp;
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

  return results;
}

function renderCustomLabelGroups(entries, section, grid, emptyMessage) {
  const groups = collectCustomLabelGroups(entries);
  grid.innerHTML = '';
  const existingNotice = section.querySelector('.stats-custom-overflow');
  if (existingNotice) {
    existingNotice.remove();
  }

  if (groups.length === 0) {
    section.hidden = false;
    emptyMessage.hidden = false;
    return;
  }

  section.hidden = false;
  emptyMessage.hidden = true;

  for (const group of groups.slice(0, MAX_CUSTOM_GROUPS)) {
    grid.append(buildCustomLabelCard(group));
  }

  if (groups.length > MAX_CUSTOM_GROUPS) {
    const overflowNotice = document.createElement('p');
    overflowNotice.className = 'text-muted small mt-3 mb-0 stats-custom-overflow';
    overflowNotice.textContent = `Showing the ${MAX_CUSTOM_GROUPS} most-used custom designs.`;
    section.append(overflowNotice);
  }
}

function collectCustomLabelGroups(entries) {
  const groups = new Map();

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const snapshot = entry.snapshot || {};
    const hardwareType = typeof snapshot.hardwareType === 'string' ? snapshot.hardwareType.trim() : '';
    if (hardwareType.toLowerCase() !== 'custom') {
      continue;
    }
    const line1 = normalizeLine(snapshot.customLine1);
    const line2 = normalizeLine(snapshot.customLine2);
    const key = `${line1}|||${line2}`;
    const group =
      groups.get(key) || {
        line1,
        line2,
        count: 0,
        downloadCount: 0,
        printCount: 0,
        latestTimestamp: 0,
        svgMarkup: '',
        eventTypes: new Set(),
        notes: new Set(),
        sizes: new Set(),
        snapshot: null,
      };

    group.count += 1;
    if (entry.eventType === 'print') {
      group.printCount += 1;
    } else {
      group.downloadCount += 1;
    }
    group.eventTypes.add(entry.eventType === 'print' ? 'print' : 'download');

    const timestamp = Number.isFinite(entry.timestamp) ? entry.timestamp : 0;
    if (timestamp > group.latestTimestamp) {
      group.latestTimestamp = timestamp;
      group.svgMarkup = typeof entry.svgMarkup === 'string' ? entry.svgMarkup : group.svgMarkup;
      group.snapshot = entry.snapshot || group.snapshot;
    }

    const sizeLabel = formatDimensions(snapshot.widthMm, snapshot.heightMm);
    if (sizeLabel) {
      group.sizes.add(sizeLabel);
    }

    const note = normalizeLine(snapshot.notes);
    if (note) {
      group.notes.add(note);
    }

    groups.set(key, group);
  }

  const results = Array.from(groups.values());
  results.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return b.latestTimestamp - a.latestTimestamp;
  });

  return results;
}

function buildCustomLabelCard(group) {
  const card = document.createElement('article');
  card.className = 'stats-label-card card shadow-sm stats-custom-card';

  const previewWrapper = document.createElement('div');
  previewWrapper.className = 'stats-label-preview card-img-top stats-custom-preview';
  if (typeof group.svgMarkup === 'string' && group.svgMarkup.trim().length > 0) {
    previewWrapper.innerHTML = group.svgMarkup;
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'stats-label-placeholder text-muted';
    placeholder.textContent = 'Preview unavailable';
    previewWrapper.append(placeholder);
  }
  card.append(previewWrapper);

  const body = document.createElement('div');
  body.className = 'card-body d-flex flex-column gap-2';

  const titleEl = document.createElement('h3');
  titleEl.className = 'h5 mb-0';
  titleEl.textContent = group.line1 || 'Untitled custom label';
  body.append(titleEl);

  if (group.line2) {
    const subtitleEl = document.createElement('p');
    subtitleEl.className = 'text-muted mb-2';
    subtitleEl.textContent = group.line2;
    body.append(subtitleEl);
  }

  const usageEl = document.createElement('p');
  usageEl.className = 'fw-semibold mb-0';
  usageEl.textContent = formatCount(group.count);
  body.append(usageEl);

  const eventTypeEl = document.createElement('p');
  eventTypeEl.className = 'text-muted small mb-2';
  const eventTypeLabel = formatEventTypes(Array.from(group.eventTypes));
  const eventBreakdown = formatEventBreakdown(group.downloadCount, group.printCount);
  eventTypeEl.textContent = eventBreakdown ? `${eventTypeLabel} · ${eventBreakdown}` : eventTypeLabel;
  body.append(eventTypeEl);

  const detailsList = document.createElement('dl');
  detailsList.className = 'stats-detail-list mb-0';

  const sizeList = Array.from(group.sizes);
  if (sizeList.length > 0) {
    appendDetail(detailsList, 'Sizes used', formatList(sizeList));
  }

  if (group.latestTimestamp) {
    appendDetail(detailsList, 'Last activity', formatTimestamp(group.latestTimestamp));
  }

  const notes = Array.from(group.notes).slice(0, 4);
  if (notes.length > 0) {
    appendDetail(detailsList, 'Notes', notes.join(' · '));
  }

  if (detailsList.childElementCount > 0) {
    body.append(detailsList);
  }

  const snapshotSummary = buildSnapshotSummary(group.snapshot);
  if (snapshotSummary) {
    const details = document.createElement('details');
    details.className = 'stats-snapshot-details';

    const summary = document.createElement('summary');
    summary.className = 'stats-snapshot-summary';
    summary.textContent = 'View captured state';
    details.append(summary);

    const pre = document.createElement('pre');
    pre.className = 'stats-snapshot-json';
    pre.textContent = JSON.stringify(snapshotSummary, null, 2);
    details.append(pre);

    body.append(details);
  }

  card.append(body);
  return card;
}

function appendDetail(list, term, value) {
  if (!term || !value) {
    return;
  }
  const dt = document.createElement('dt');
  dt.className = 'stats-detail-term';
  dt.textContent = term;
  list.append(dt);

  const dd = document.createElement('dd');
  dd.className = 'stats-detail-description';
  dd.textContent = value;
  list.append(dd);
}

function buildSnapshotSummary(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return null;
  }
  const summary = {};
  for (const [key, value] of Object.entries(snapshot)) {
    if (key === 'customImageData' || key === 'customIconSvgData') {
      if (typeof value === 'string' && value.length > 0) {
        summary[key] = `[${value.length} characters omitted]`;
      }
      continue;
    }
    summary[key] = value;
  }
  return summary;
}

function normalizeLine(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function formatDimensions(width, height) {
  const widthNumber = Number(width);
  const heightNumber = Number(height);
  if (Number.isFinite(widthNumber) && Number.isFinite(heightNumber)) {
    return `${widthNumber} × ${heightNumber} mm`;
  }
  if (Number.isFinite(widthNumber)) {
    return `${widthNumber} mm wide`;
  }
  if (Number.isFinite(heightNumber)) {
    return `${heightNumber} mm tall`;
  }
  return '';
}

function formatList(items) {
  const filtered = items.map(item => item && item.trim()).filter(Boolean);
  if (filtered.length === 0) {
    return '';
  }
  if (typeof Intl !== 'undefined' && typeof Intl.ListFormat === 'function') {
    try {
      const formatter = new Intl.ListFormat(undefined, { style: 'short', type: 'conjunction' });
      return formatter.format(filtered);
    } catch {
      // Fallback to join below.
    }
  }
  return filtered.join(', ');
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return '0';
  }
  if (typeof Intl !== 'undefined' && typeof Intl.NumberFormat === 'function') {
    try {
      return new Intl.NumberFormat().format(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function formatEventBreakdown(downloadCount, printCount) {
  const parts = [];
  if (Number.isFinite(downloadCount) && downloadCount > 0) {
    const label = downloadCount === 1 ? 'download' : 'downloads';
    parts.push(`${formatNumber(downloadCount)} ${label}`);
  }
  if (Number.isFinite(printCount) && printCount > 0) {
    const label = printCount === 1 ? 'print' : 'prints';
    parts.push(`${formatNumber(printCount)} ${label}`);
  }
  return parts.join(' · ');
}

function renderPeriods(entries, container) {
  container.innerHTML = '';
  const now = new Date();
  for (const definition of PERIOD_DEFINITIONS) {
    const section = buildPeriodSection(entries, definition, now);
    container.append(section);
  }
}

function buildPeriodSection(entries, definition, referenceDate) {
  const section = document.createElement('section');
  section.className = 'stats-period-section mb-5';
  section.setAttribute('data-period', definition.id);

  const header = document.createElement('div');
  header.className = 'd-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3';

  const headingWrapper = document.createElement('div');
  const titleEl = document.createElement('h2');
  titleEl.className = 'h4 mb-1';
  titleEl.textContent = definition.title;
  headingWrapper.append(titleEl);

  if (definition.description) {
    const descriptionEl = document.createElement('p');
    descriptionEl.className = 'text-muted small mb-0';
    descriptionEl.textContent = definition.description;
    headingWrapper.append(descriptionEl);
  }

  header.append(headingWrapper);
  section.append(header);

  const startTimestamp = definition.start(referenceDate);
  const topLabels = computeTopLabels(entries, startTimestamp, TOP_LABEL_LIMIT);

  if (!topLabels || topLabels.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'text-muted fst-italic';
    emptyState.textContent = 'No labels generated in this period yet.';
    section.append(emptyState);
    return section;
  }

  const grid = document.createElement('div');
  grid.className = 'stats-label-grid';

  for (const label of topLabels) {
    grid.append(buildLabelCard(label));
  }

  section.append(grid);
  return section;
}

function buildLabelCard(label) {
  const card = document.createElement('article');
  card.className = 'stats-label-card card shadow-sm';

  const previewWrapper = document.createElement('div');
  previewWrapper.className = 'stats-label-preview card-img-top';
  if (typeof label.svgMarkup === 'string' && label.svgMarkup.trim().length > 0) {
    previewWrapper.innerHTML = label.svgMarkup;
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'stats-label-placeholder text-muted';
    placeholder.textContent = 'Preview unavailable';
    previewWrapper.append(placeholder);
  }
  card.append(previewWrapper);

  const body = document.createElement('div');
  body.className = 'card-body';

  const countEl = document.createElement('p');
  countEl.className = 'fw-semibold mb-1';
  countEl.textContent = formatCount(label.count);
  body.append(countEl);

  const typeEl = document.createElement('p');
  typeEl.className = 'text-muted mb-1';
  typeEl.textContent = formatEventTypes(label.eventTypes);
  body.append(typeEl);

  if (Number.isFinite(label.latestTimestamp)) {
    const lastUsed = document.createElement('p');
    lastUsed.className = 'text-muted small mb-0';
    lastUsed.textContent = `Last activity: ${formatTimestamp(label.latestTimestamp)}`;
    body.append(lastUsed);
  }

  card.append(body);
  return card;
}

function formatCount(count) {
  if (!Number.isFinite(count) || count <= 0) {
    return '0 uses';
  }
  return count === 1 ? '1 use' : `${count} uses`;
}

function formatEventTypes(types) {
  const normalized = Array.isArray(types) ? types : [];
  const hasDownload = normalized.includes('download');
  const hasPrint = normalized.includes('print');
  if (hasDownload && hasPrint) {
    return 'Downloads & Prints';
  }
  if (hasDownload) {
    return 'Downloads';
  }
  if (hasPrint) {
    return 'Prints';
  }
  return 'Activity';
}

function formatTimestamp(timestamp) {
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return '';
  }
}

function startOfToday(referenceDate) {
  const date = new Date(referenceDate);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function startOfWeek(referenceDate) {
  const date = new Date(referenceDate);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = (day + 6) % 7; // Monday as the first day of the week
  date.setDate(date.getDate() - diff);
  return date.getTime();
}

function startOfMonth(referenceDate) {
  const date = new Date(referenceDate);
  date.setHours(0, 0, 0, 0);
  date.setDate(1);
  return date.getTime();
}

function startOfYear(referenceDate) {
  const date = new Date(referenceDate);
  date.setHours(0, 0, 0, 0);
  date.setMonth(0, 1);
  return date.getTime();
}
