const STATUS_STYLES = {
  todo: { label: 'To Do', className: 'text-bg-secondary' },
  'in-progress': { label: 'In Progress', className: 'text-bg-info' },
  'in-review': { label: 'In Review', className: 'text-bg-primary' },
  blocked: { label: 'Blocked', className: 'text-bg-warning' },
  done: { label: 'Done', className: 'text-bg-success' }
};

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

  const header = document.createElement('div');
  header.className = 'd-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2';

  const title = document.createElement('span');
  title.className = 'fw-semibold';
  title.textContent = item.title || 'Untitled task';

  const badge = createStatusBadge(item.status, normalizedStatus);

  header.append(title, badge);
  li.append(header);

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
