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
const TODO_VOTE_ENDPOINT_ATTRIBUTE = 'data-todo-vote-endpoint';
const DEFAULT_TODO_VOTE_FUNCTION_ENDPOINT = '/api/todo-votes';
let cachedTodoVoteEndpoint = null;
const TODO_VOTE_STORAGE_KEY = 'todoVotes';

let cachedUserVotes = null;
let voteLabelIdCounter = 0;

function getTodoVoteFunctionEndpoint() {
  if (cachedTodoVoteEndpoint) {
    return cachedTodoVoteEndpoint;
  }

  if (typeof document !== 'undefined' && document.documentElement) {
    const configuredEndpoint = document.documentElement.getAttribute(
      TODO_VOTE_ENDPOINT_ATTRIBUTE
    );

    if (typeof configuredEndpoint === 'string') {
      const trimmedEndpoint = configuredEndpoint.trim();
      if (trimmedEndpoint.length > 0) {
        cachedTodoVoteEndpoint = trimmedEndpoint;
        return cachedTodoVoteEndpoint;
      }
    }
  }

  cachedTodoVoteEndpoint = DEFAULT_TODO_VOTE_FUNCTION_ENDPOINT;
  return cachedTodoVoteEndpoint;
}

function normalizeIdForAttribute(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim().toLowerCase();
  if (trimmed.length === 0) {
    return '';
  }

  return trimmed.replace(/[^a-z0-9]+/g, '-');
}

function getStoredVotes() {
  if (cachedUserVotes) {
    return cachedUserVotes;
  }

  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    cachedUserVotes = {};
    return cachedUserVotes;
  }

  try {
    const raw = window.localStorage.getItem(TODO_VOTE_STORAGE_KEY);
    if (!raw) {
      cachedUserVotes = {};
      return cachedUserVotes;
    }

    const parsed = JSON.parse(raw);
    cachedUserVotes = typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (error) {
    console.warn('Failed to parse stored to-do votes:', error);
    cachedUserVotes = {};
  }

  return cachedUserVotes;
}

function persistStoredVotes(votes) {
  cachedUserVotes = votes;

  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }

  try {
    const keys = Object.keys(votes || {});
    if (keys.length === 0) {
      window.localStorage.removeItem(TODO_VOTE_STORAGE_KEY);
    } else {
      window.localStorage.setItem(TODO_VOTE_STORAGE_KEY, JSON.stringify(votes));
    }
  } catch (error) {
    console.warn('Failed to persist to-do votes:', error);
  }
}

function getStoredVote(todoId) {
  const votes = getStoredVotes();
  if (!todoId || !votes) {
    return 0;
  }

  const value = votes[todoId];
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function setStoredVote(todoId, vote) {
  if (!todoId) {
    return;
  }

  const votes = { ...getStoredVotes() };
  if (vote === 0) {
    delete votes[todoId];
  } else {
    votes[todoId] = vote;
  }

  persistStoredVotes(votes);
}

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

function createVoteControls(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const todoId = item.id;
  if (!todoId) {
    return null;
  }

  const container = document.createElement('div');
  container.className = 'todo-vote-controls d-flex align-items-center gap-2 mt-3';

  let ratingAvailable = typeof item.rating === 'number' && Number.isFinite(item.rating);
  let displayedRating = ratingAvailable ? item.rating : 0;
  let currentVote = getStoredVote(todoId);
  if (currentVote !== 1 && currentVote !== -1) {
    currentVote = 0;
  }

  const idSuffix = normalizeIdForAttribute(String(todoId));
  voteLabelIdCounter += 1;
  const scoreLabelId = idSuffix
    ? `todo-score-${idSuffix}-${voteLabelIdCounter}`
    : `todo-score-item-${voteLabelIdCounter}`;

  const scoreLabel = document.createElement('span');
  scoreLabel.className = 'visually-hidden';
  scoreLabel.id = scoreLabelId;
  scoreLabel.textContent = 'Net score';
  container.append(scoreLabel);

  const scoreValue = document.createElement('span');
  scoreValue.className = 'todo-vote-score fw-semibold';
  scoreValue.setAttribute('role', 'status');
  scoreValue.setAttribute('aria-live', 'polite');
  scoreValue.setAttribute('aria-atomic', 'true');
  scoreValue.setAttribute('aria-labelledby', scoreLabelId);

  function updateScoreDisplay() {
    const normalizedRating = ratingAvailable ? displayedRating : 0;
    scoreValue.textContent = String(normalizedRating);
    scoreValue.setAttribute('aria-label', `Net score: ${normalizedRating}`);
  }

  updateScoreDisplay();

  const upvoteButton = document.createElement('button');
  upvoteButton.type = 'button';
  upvoteButton.className = 'btn btn-sm todo-vote-button btn-outline-success';
  upvoteButton.setAttribute('aria-label', 'Upvote this to-do item');
  upvoteButton.setAttribute('aria-pressed', 'false');
  upvoteButton.textContent = '';

  const upvoteIcon = document.createElement('i');
  upvoteIcon.className = 'fa-solid fa-thumbs-up';
  upvoteIcon.setAttribute('aria-hidden', 'true');
  upvoteButton.append(upvoteIcon);

  const upvoteLabel = document.createElement('span');
  upvoteLabel.className = 'visually-hidden';
  upvoteLabel.textContent = 'Upvote this to-do item';
  upvoteButton.append(upvoteLabel);

  const downvoteButton = document.createElement('button');
  downvoteButton.type = 'button';
  downvoteButton.className = 'btn btn-sm todo-vote-button btn-outline-danger';
  downvoteButton.setAttribute('aria-label', 'Downvote this to-do item');
  downvoteButton.setAttribute('aria-pressed', 'false');
  downvoteButton.textContent = '';

  const downvoteIcon = document.createElement('i');
  downvoteIcon.className = 'fa-solid fa-thumbs-down';
  downvoteIcon.setAttribute('aria-hidden', 'true');
  downvoteButton.append(downvoteIcon);

  const downvoteLabel = document.createElement('span');
  downvoteLabel.className = 'visually-hidden';
  downvoteLabel.textContent = 'Downvote this to-do item';
  downvoteButton.append(downvoteLabel);

  function setButtonState(button, isActive, activeClass, inactiveClass) {
    button.classList.toggle(activeClass, isActive);
    button.classList.toggle(inactiveClass, !isActive);
    button.setAttribute('aria-pressed', String(isActive));
  }

  function updateButtonStates() {
    setButtonState(upvoteButton, currentVote === 1, 'btn-success', 'btn-outline-success');
    setButtonState(downvoteButton, currentVote === -1, 'btn-danger', 'btn-outline-danger');
  }

  updateButtonStates();

  function setButtonsDisabled(disabled) {
    upvoteButton.disabled = disabled;
    downvoteButton.disabled = disabled;
  }

  let isSubmitting = false;

  async function handleVote(targetVote) {
    if (isSubmitting) {
      return;
    }

    const nextVote = currentVote === targetVote ? 0 : targetVote;
    const previousVote = currentVote;
    const previousRating = displayedRating;
    const previousAvailability = ratingAvailable;

    currentVote = nextVote;
    if (!ratingAvailable) {
      ratingAvailable = true;
      displayedRating = nextVote;
    } else {
      displayedRating = displayedRating - previousVote + nextVote;
    }

    updateButtonStates();
    updateScoreDisplay();
    setStoredVote(todoId, nextVote);

    isSubmitting = true;
    setButtonsDisabled(true);

    try {
      await submitTodoVote(todoId, nextVote);

      if (typeof document !== 'undefined' && document) {
        document.dispatchEvent(
          new CustomEvent('todo:vote', {
            detail: { id: todoId, rating: displayedRating }
          })
        );
      }
    } catch (error) {
      console.error('Failed to submit vote for to-do item:', error);
      currentVote = previousVote;
      ratingAvailable = previousAvailability;
      displayedRating = previousAvailability ? previousRating : 0;
      updateButtonStates();
      updateScoreDisplay();
      setStoredVote(todoId, previousVote);
    } finally {
      isSubmitting = false;
      setButtonsDisabled(false);
    }
  }

  upvoteButton.addEventListener('click', () => {
    handleVote(1);
  });

  downvoteButton.addEventListener('click', () => {
    handleVote(-1);
  });

  container.append(upvoteButton, scoreValue, downvoteButton);
  return container;
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
  header.className =
    'd-flex flex-column flex-md-row align-items-start justify-content-between gap-2';

  const title = document.createElement('span');
  title.className = 'fw-semibold';
  title.textContent = item.title || 'Untitled task';

  const badge = createStatusBadge(item.status, normalizedStatus);
  const headerRight = document.createElement('div');
  headerRight.className = 'd-flex flex-column align-items-end gap-2';
  headerRight.append(badge);

  const voteControls = createVoteControls(item);
  if (voteControls) {
    headerRight.append(voteControls);
  }

  header.append(title, headerRight);
  li.append(header);

  if (uniqueCategories.length > 0) {
    const categoryList = document.createElement('div');
    categoryList.className = 'todo-item-categories d-flex flex-wrap gap-2 mt-1';

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
    notes.className = 'todo-item-notes mb-1 mt-1 text-body-secondary';
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

async function submitTodoVote(todoId, vote) {
  if (!todoId) {
    return;
  }

  const endpoint = getTodoVoteFunctionEndpoint();

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ todoId, vote }),
  });

  if (response.ok) {
    return;
  }

  let errorMessage = `Request failed with status ${response.status}`;
  try {
    const payload = await response.json();
    if (payload && typeof payload.error === 'string' && payload.error.trim().length > 0) {
      errorMessage += `: ${payload.error}`;
    }
  } catch {
    try {
      const text = await response.text();
      if (text.trim().length > 0) {
        errorMessage += `: ${text.trim()}`;
      }
    } catch (innerError) {
      console.debug('Unable to extract error details from vote response:', innerError);
    }
  }

  throw new Error(errorMessage);
}

async function fetchTodoVotes() {
  const endpoint = getTodoVoteFunctionEndpoint();

  const response = await fetch(endpoint, {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Vote request failed with status ${response.status}`);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Failed to parse vote aggregates response as JSON.');
  }

  const votes = payload?.votes;
  if (!votes || typeof votes !== 'object' || Array.isArray(votes)) {
    return {};
  }

  return votes;
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

  let voteAggregates;
  try {
    voteAggregates = await fetchTodoVotes();
  } catch (error) {
    console.warn('Unable to fetch to-do vote aggregates:', error);
  }

  if (!voteAggregates) {
    return items.map((item) => {
      if (!item || typeof item !== 'object') {
        return item;
      }

      const existingRating =
        typeof item.rating === 'number' && Number.isFinite(item.rating) ? item.rating : 0;

      return { ...item, rating: existingRating };
    });
  }

  return items.map((item) => {
    if (!item || typeof item !== 'object') {
      return item;
    }

    const aggregate = voteAggregates[item.id];
    const rating =
      aggregate && typeof aggregate.score === 'number' && Number.isFinite(aggregate.score)
        ? aggregate.score
        : 0;

    return { ...item, rating };
  });
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
