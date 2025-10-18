import { initTheme } from './theme.js';
import { setRandomDevelopmentWarning } from './warning-message.js';
import { fetchTodoItems, renderTodoList } from './todo/todo-renderer.js';

initTheme();

const developmentWarning = document.getElementById('development-warning');
if (developmentWarning) {
  setRandomDevelopmentWarning(developmentWarning);
}

const todoListContainer = document.querySelector('#todo-list-items');
const statusTabs = Array.from(
  document.querySelectorAll('#todo-status-filters [data-status]'),
);
const todoSearchInput = document.getElementById('todo-search');
const todoSearchClearButton = document.getElementById('todo-search-clear');
const categoryFilterContainer = document.getElementById('todo-category-filter');

let cachedTodoItems = [];
let activeStatus = 'all';
let activeCategory = 'all';
let searchQuery = '';
let categoryTabs = [];

const UNCATEGORIZED_CATEGORY = 'uncategorized';

const CATEGORY_VARIANT_MAP = new Map([
  ['all', 'primary'],
  ['bug', 'danger'],
  ['feature', 'primary'],
  ['new-feature', 'primary'],
  ['enhancement', 'info'],
  ['improvement', 'warning'],
  ['documentation', 'secondary'],
  [UNCATEGORIZED_CATEGORY, 'secondary']
]);

function getCategoryVariant(value) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!normalized) {
    return 'secondary';
  }

  return CATEGORY_VARIANT_MAP.get(normalized) || 'secondary';
}

function setActiveStatusTab(tab) {
  for (const statusTab of statusTabs) {
    const isActive = statusTab === tab;
    statusTab.setAttribute('aria-selected', String(isActive));
    statusTab.setAttribute('tabindex', isActive ? '0' : '-1');
    statusTab.classList.toggle('status-tab--active', isActive);
  }
}

function activateStatusTab(tab) {
  setActiveStatusTab(tab);
  activeStatus = (tab.getAttribute('data-status') || 'all').toLowerCase();
  applyFilters();
}

function getAdjacentStatusTab(currentTab, direction) {
  const currentIndex = statusTabs.indexOf(currentTab);
  if (currentIndex === -1) {
    return undefined;
  }

  const offset = direction === 'next' ? 1 : -1;
  const nextIndex = (currentIndex + offset + statusTabs.length) % statusTabs.length;
  return statusTabs[nextIndex];
}

function setActiveCategoryTab(tab) {
  for (const categoryTab of categoryTabs) {
    const isActive = categoryTab === tab;
    categoryTab.setAttribute('aria-selected', String(isActive));
    categoryTab.setAttribute('tabindex', isActive ? '0' : '-1');
    categoryTab.classList.toggle('status-tab--active', isActive);
  }
}

function activateCategoryTab(tab) {
  setActiveCategoryTab(tab);
  activeCategory = (tab.getAttribute('data-category') || 'all').toLowerCase();
  applyFilters();
}

function getAdjacentCategoryTab(currentTab, direction) {
  const currentIndex = categoryTabs.indexOf(currentTab);
  if (currentIndex === -1) {
    return undefined;
  }

  const offset = direction === 'next' ? 1 : -1;
  const nextIndex = (currentIndex + offset + categoryTabs.length) % categoryTabs.length;
  return categoryTabs[nextIndex];
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

function getItemCategories(item) {
  if (!item) {
    return [];
  }

  const rawValues = extractCategoryValues(item.category);
  const normalizedValues = new Set();
  for (const raw of rawValues) {
    const normalized = normalizeCategory(raw);
    if (normalized) {
      normalizedValues.add(normalized);
    }
  }

  return Array.from(normalizedValues);
}

function filterItemsByStatus(items, status) {
  if (status === 'all') {
    return items;
  }

  return items.filter((item) => {
    const itemStatus = typeof item.status === 'string' ? item.status.toLowerCase() : '';
    return itemStatus === status;
  });
}

function filterItemsByCategory(items, category) {
  if (category === 'all') {
    return items;
  }

  const matchUncategorized = category === UNCATEGORIZED_CATEGORY;

  return items.filter((item) => {
    const categories = getItemCategories(item);
    if (categories.length === 0) {
      return matchUncategorized;
    }

    if (matchUncategorized) {
      return false;
    }

    return categories.includes(category);
  });
}

function populateCategoryFilter(items) {
  if (!categoryFilterContainer) {
    return;
  }

  const categories = new Map();
  let hasUncategorized = false;

  for (const item of items) {
    const rawValues = extractCategoryValues(item.category);
    if (rawValues.length === 0) {
      hasUncategorized = true;
      continue;
    }

    for (const raw of rawValues) {
      const normalized = normalizeCategory(raw);
      if (!normalized || categories.has(normalized)) {
        continue;
      }

      categories.set(normalized, formatCategoryLabel(raw));
    }
  }

  if (hasUncategorized) {
    categories.set(UNCATEGORIZED_CATEGORY, 'Uncategorized');
  }

  const sortedCategories = Array.from(categories.entries()).sort(([, labelA], [, labelB]) =>
    labelA.localeCompare(labelB)
  );

  categoryFilterContainer.innerHTML = '';

  const createCategoryTab = (value, label) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'status-tab category-tab';
    tab.setAttribute('data-category', value);
    tab.setAttribute('data-variant', getCategoryVariant(value));
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', 'false');
    tab.setAttribute('aria-controls', 'todo-list-items');
    tab.setAttribute('tabindex', '-1');
    tab.textContent = label;
    return tab;
  };

  categoryFilterContainer.append(createCategoryTab('all', 'All'));

  for (const [value, label] of sortedCategories) {
    categoryFilterContainer.append(createCategoryTab(value, label));
  }

  categoryTabs = Array.from(
    categoryFilterContainer.querySelectorAll('[data-category]'),
  );

  const availableValues = new Set(
    categoryTabs.map((tab) => (tab.getAttribute('data-category') || '').toLowerCase()),
  );

  if (!availableValues.has(activeCategory)) {
    activeCategory = 'all';
  }

  const initiallyActiveTab =
    categoryTabs.find(
      (tab) => (tab.getAttribute('data-category') || '').toLowerCase() === activeCategory,
    ) || categoryTabs[0];

  if (initiallyActiveTab) {
    setActiveCategoryTab(initiallyActiveTab);
  }

  for (const tab of categoryTabs) {
    tab.addEventListener('click', () => {
      if (tab.getAttribute('aria-selected') === 'true') {
        return;
      }

      activateCategoryTab(tab);
    });

    tab.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown': {
          event.preventDefault();
          const nextTab = getAdjacentCategoryTab(tab, 'next');
          if (nextTab) {
            activateCategoryTab(nextTab);
            nextTab.focus();
          }
          break;
        }
        case 'ArrowLeft':
        case 'ArrowUp': {
          event.preventDefault();
          const previousTab = getAdjacentCategoryTab(tab, 'previous');
          if (previousTab) {
            activateCategoryTab(previousTab);
            previousTab.focus();
          }
          break;
        }
        case 'Home': {
          event.preventDefault();
          const firstTab = categoryTabs[0];
          if (firstTab) {
            activateCategoryTab(firstTab);
            firstTab.focus();
          }
          break;
        }
        case 'End': {
          event.preventDefault();
          const lastTab = categoryTabs[categoryTabs.length - 1];
          if (lastTab) {
            activateCategoryTab(lastTab);
            lastTab.focus();
          }
          break;
        }
        case ' ': // Space
        case 'Enter': {
          event.preventDefault();
          if (tab.getAttribute('aria-selected') !== 'true') {
            activateCategoryTab(tab);
          }
          break;
        }
        default:
          break;
      }
    });
  }
}

function fuzzyMatch(query, text) {
  if (!query) {
    return true;
  }

  const normalizedQuery = query.replace(/\s+/g, '').toLowerCase();
  const normalizedText = text.toLowerCase();

  if (normalizedQuery.length === 0) {
    return true;
  }

  let queryIndex = 0;
  for (const character of normalizedText) {
    if (character === normalizedQuery[queryIndex]) {
      queryIndex += 1;
      if (queryIndex === normalizedQuery.length) {
        return true;
      }
    }
  }

  return false;
}

function filterItemsByQuery(items, query) {
  if (!query) {
    return items;
  }

  return items.filter((item) => {
    const categoryLabels = extractCategoryValues(item.category);
    const searchableParts = [item.title, item.notes, item.status, ...categoryLabels]
      .filter((value) => typeof value === 'string' && value.trim().length > 0)
      .join(' ');

    if (searchableParts.length === 0) {
      return false;
    }

    return fuzzyMatch(query, searchableParts);
  });
}

function getSortableRating(item) {
  if (!item || typeof item.rating !== 'number' || Number.isNaN(item.rating)) {
    return null;
  }

  return item.rating;
}

function applyFilters() {
  if (!todoListContainer) {
    return;
  }

  const itemsByStatus = filterItemsByStatus(cachedTodoItems, activeStatus);
  const itemsByCategory = filterItemsByCategory(itemsByStatus, activeCategory);
  const filteredItems = filterItemsByQuery(itemsByCategory, searchQuery);
  const hasActiveFilters =
    cachedTodoItems.length > 0 &&
    (activeStatus !== 'all' || activeCategory !== 'all' || searchQuery.length > 0);

  const emptyStateMessage = hasActiveFilters ? 'No to-do items match your filters.' : undefined;

  const sortedItems = filteredItems
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const ratingA = getSortableRating(a.item);
      const ratingB = getSortableRating(b.item);

      if (ratingA === null && ratingB === null) {
        return a.index - b.index;
      }

      if (ratingA === null) {
        return 1;
      }

      if (ratingB === null) {
        return -1;
      }

      if (ratingA === ratingB) {
        return a.index - b.index;
      }

      return ratingB - ratingA;
    })
    .map(({ item }) => item);

  renderTodoList(todoListContainer, sortedItems, emptyStateMessage);
}

async function initTodoList() {
  if (!todoListContainer || statusTabs.length === 0) {
    return;
  }

  try {
    cachedTodoItems = await fetchTodoItems();
  } catch (error) {
    console.error('Failed to load to-do items:', error);
    renderTodoList(todoListContainer, undefined);
    return;
  }

  populateCategoryFilter(cachedTodoItems);

  const initiallyActiveTab =
    statusTabs.find((tab) => tab.getAttribute('aria-selected') === 'true') ||
    statusTabs[0];

  if (initiallyActiveTab) {
    activeStatus = (initiallyActiveTab.getAttribute('data-status') || 'all').toLowerCase();
    setActiveStatusTab(initiallyActiveTab);
  }

  applyFilters();

  for (const tab of statusTabs) {
    tab.addEventListener('click', () => {
      if (tab.getAttribute('aria-selected') === 'true') {
        return;
      }

      activateStatusTab(tab);
    });

    tab.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown': {
          event.preventDefault();
          const nextTab = getAdjacentStatusTab(tab, 'next');
          if (nextTab) {
            activateStatusTab(nextTab);
            nextTab.focus();
          }
          break;
        }
        case 'ArrowLeft':
        case 'ArrowUp': {
          event.preventDefault();
          const previousTab = getAdjacentStatusTab(tab, 'previous');
          if (previousTab) {
            activateStatusTab(previousTab);
            previousTab.focus();
          }
          break;
        }
        case 'Home': {
          event.preventDefault();
          const firstTab = statusTabs[0];
          if (firstTab) {
            activateStatusTab(firstTab);
            firstTab.focus();
          }
          break;
        }
        case 'End': {
          event.preventDefault();
          const lastTab = statusTabs[statusTabs.length - 1];
          if (lastTab) {
            activateStatusTab(lastTab);
            lastTab.focus();
          }
          break;
        }
        case ' ': // Space
        case 'Enter': {
          event.preventDefault();
          if (tab.getAttribute('aria-selected') !== 'true') {
            activateStatusTab(tab);
          }
          break;
        }
        default:
          break;
      }
    });
  }

  if (todoSearchInput) {
    todoSearchInput.addEventListener('input', () => {
      const nextQuery = todoSearchInput.value.trim();
      if (nextQuery === searchQuery) {
        return;
      }

      searchQuery = nextQuery;
      applyFilters();
    });

    todoSearchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && todoSearchInput.value) {
        event.preventDefault();
        todoSearchInput.value = '';
        if (searchQuery !== '') {
          searchQuery = '';
          applyFilters();
        }
      }
    });
  }

  if (todoSearchClearButton) {
    todoSearchClearButton.addEventListener('click', () => {
      if (!todoSearchInput) {
        return;
      }

      if (todoSearchInput.value === '') {
        todoSearchInput.focus();
        return;
      }

      todoSearchInput.value = '';
      if (searchQuery !== '') {
        searchQuery = '';
        applyFilters();
      }
      todoSearchInput.focus();
    });
  }

}

initTodoList();
