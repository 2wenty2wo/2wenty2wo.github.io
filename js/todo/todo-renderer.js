const STATUS_STYLES = {
  todo: { label: 'To Do', className: 'text-bg-secondary' },
  'in-progress': { label: 'In Progress', className: 'text-bg-info' },
  done: { label: 'Done', className: 'text-bg-success' }
};

const CATEGORY_STYLES = {
  bug: { label: 'Bug', className: 'text-bg-danger' },
  feature: { label: 'Feature', className: 'text-bg-primary' },
  'new-feature': { label: 'New Feature', className: 'text-bg-primary' },
  enhancement: { label: 'Enhancement', className: 'text-bg-info' },
  improvement: { label: 'Improvement', className: 'text-bg-warning' },
  documentation: { label: 'Documentation', className: 'text-bg-secondary' }
};

const UNCATEGORIZED_CATEGORY = 'uncategorized';

function normalizeCategory(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim().toLowerCase();
  if (trimmed.length === 0) {
    return '';
  }

  return trimmed.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function formatCategoryLabel(value) {
  if (typeof value !== 'string') {
    return 'Uncategorized';
  }

  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter((segment) => segment.length > 0)
    .map((segment) => segment[0].toUpperCase() + segment.slice(1))
    .join(' ');
}

function extractCategoryValues(category) {
  if (Array.isArray(category)) {
    return category
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter((value) => value.length > 0);
  }

  if (typeof category === 'string') {
    const trimmed = category.trim();
    return trimmed ? [trimmed] : [];
  }

  return [];
}

function createCategoryBadge(category) {
  const normalized = normalizeCategory(category);
  const badge = document.createElement('span');
  badge.className = 'badge rounded-pill';

  const style = CATEGORY_STYLES[normalized];
  if (style) {
    badge.className += ` ${style.className}`;
    badge.textContent = style.label;
  } else {
    badge.className += ' badge-category-default';
    badge.textContent = formatCategoryLabel(category);
  }

  badge.setAttribute('data-category', normalized || UNCATEGORIZED_CATEGORY);
  return badge;
}

function createStatusBadge(status, normalizedStatus) {
  const normalized =
    normalizedStatus ?? (typeof status === 'string' ? status.toLowerCase() : '');
  const style = STATUS_STYLES[normalized] || { label: status || 'Unknown', className: 'text-bg-dark' };
  const badge = document.createElement('span');
  badge.className = `badge rounded-pill ${style.className}`;
  badge.textContent = style.label;
  badge.setAttribute('data-status', normalized || 'unknown');
  return badge;
}

function createTodoListItem(item) {
  const li = document.createElement('li');
  li.className = 'list-group-item py-3';
  li.setAttribute('data-todo-id', item.id || '');

  const normalizedStatus = typeof item.status === 'string' ? item.status.trim().toLowerCase() : '';
  li.dataset.status = normalizedStatus || 'unknown';

  const rawCategories = extractCategoryValues(item.category);
  const uniqueCategories = [];
  const seenCategories = new Set();
  for (const raw of rawCategories) {
    const normalizedCategory = normalizeCategory(raw);
    if (!normalizedCategory || seenCategories.has(normalizedCategory)) {
      continue;
    }

    seenCategories.add(normalizedCategory);
    uniqueCategories.push(raw);
  }

  li.dataset.categories =
    uniqueCategories.length > 0
      ? Array.from(seenCategories).join(',')
      : UNCATEGORIZED_CATEGORY;

  const header = document.createElement('div');
  header.className = 'd-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2';

  const title = document.createElement('span');
  title.className = 'fw-semibold';
  title.textContent = item.title || 'Untitled task';

  const badge = createStatusBadge(item.status, normalizedStatus);

  header.append(title, badge);
  li.append(header);

  if (uniqueCategories.length > 0) {
    const categoryList = document.createElement('div');
    categoryList.className = 'todo-item-categories d-flex flex-wrap gap-2 mt-2';

    const visuallyHiddenLabel = document.createElement('span');
    visuallyHiddenLabel.className = 'visually-hidden';
    visuallyHiddenLabel.textContent = 'Categories:';
    categoryList.append(visuallyHiddenLabel);

    for (const category of uniqueCategories) {
      categoryList.append(createCategoryBadge(category));
    }

    li.append(categoryList);
  }

  if (item.notes) {
    const notes = document.createElement('p');
    notes.className = 'mb-1 mt-2 text-body-secondary';
    notes.textContent = item.notes;
    li.append(notes);
  }

  if (item.lastUpdated) {
    const meta = document.createElement('small');
    meta.className = 'text-muted';
    meta.textContent = `Last updated ${item.lastUpdated}`;
    li.append(meta);
  }

  return li;
}

function showMessage(listElement, message, variant = 'secondary') {
  const li = document.createElement('li');
  li.className = `list-group-item text-${variant}`;
  li.textContent = message;
  listElement.append(li);
}

export async function fetchTodoItems() {
  const response = await fetch('data/todo-items.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const items = await response.json();
  if (!Array.isArray(items)) {
    throw new TypeError('Expected the to-do list response to be an array.');
  }

  return items;
}

export function renderTodoList(container, items, emptyStateMessage) {
  if (!container) {
    return;
  }

  container.innerHTML = '';
  container.setAttribute('aria-busy', 'true');

  try {
    if (!Array.isArray(items)) {
      throw new TypeError('To-do items must be provided as an array.');
    }

    if (items.length === 0) {
      const message = emptyStateMessage || 'No to-do items are currently listed.';
      showMessage(container, message);
      return;
    }

    const fragment = document.createDocumentFragment();
    for (const item of items) {
      fragment.append(createTodoListItem(item));
    }
    container.append(fragment);
  } catch (error) {
    console.error('Failed to render to-do list:', error);
    showMessage(
      container,
      'We were unable to load the to-do list. Please try again later or check back soon.',
      'danger',
    );
  } finally {
    container.setAttribute('aria-busy', 'false');
  }
}
