import { initTheme } from './theme.js';
import { setRandomDevelopmentWarning } from './warning-message.js';
import { fetchTodoItems, renderTodoList } from './todo/todo-renderer.js';

initTheme();

const developmentWarning = document.getElementById('development-warning');
if (developmentWarning) {
  setRandomDevelopmentWarning(developmentWarning);
}

const todoListContainer = document.querySelector('#todo-list-items');
const filterTabs = Array.from(
  document.querySelectorAll('#todo-status-filters [data-status]'),
);
const todoSearchInput = document.getElementById('todo-search');
const todoSearchClearButton = document.getElementById('todo-search-clear');
const todoCategoryFilter = document.getElementById('todo-category-filter');

let cachedTodoItems = [];
let activeStatus = 'all';
let activeCategory = 'all';
let searchQuery = '';

const UNCATEGORIZED_CATEGORY = 'uncategorized';

function setActiveFilter(tab) {
  for (const filterTab of filterTabs) {
    const isActive = filterTab === tab;
    filterTab.setAttribute('aria-selected', String(isActive));
    filterTab.setAttribute('tabindex', isActive ? '0' : '-1');
    filterTab.classList.toggle('status-tab--active', isActive);
  }
}

function activateFilter(tab) {
  setActiveFilter(tab);
  activeStatus = (tab.getAttribute('data-status') || 'all').toLowerCase();
  applyFilters();
}

function getAdjacentTab(currentTab, direction) {
  const currentIndex = filterTabs.indexOf(currentTab);
  if (currentIndex === -1) {
    return undefined;
  }

  const offset = direction === 'next' ? 1 : -1;
  const nextIndex = (currentIndex + offset + filterTabs.length) % filterTabs.length;
  return filterTabs[nextIndex];
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
  if (!todoCategoryFilter) {
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

  todoCategoryFilter.innerHTML = '';

  const defaultOption = document.createElement('option');
  defaultOption.value = 'all';
  defaultOption.textContent = 'All categories';
  todoCategoryFilter.append(defaultOption);

  for (const [value, label] of sortedCategories) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    todoCategoryFilter.append(option);
  }

  const availableValues = new Set(['all']);
  for (const [value] of sortedCategories) {
    availableValues.add(value);
  }

  if (!availableValues.has(activeCategory)) {
    activeCategory = 'all';
  }

  todoCategoryFilter.value = activeCategory;
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

  renderTodoList(todoListContainer, filteredItems, emptyStateMessage);
}

async function initTodoList() {
  if (!todoListContainer || filterTabs.length === 0) {
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
    filterTabs.find((tab) => tab.getAttribute('aria-selected') === 'true') ||
    filterTabs[0];

  if (initiallyActiveTab) {
    activeStatus = (initiallyActiveTab.getAttribute('data-status') || 'all').toLowerCase();
    setActiveFilter(initiallyActiveTab);
  }

  applyFilters();

  for (const tab of filterTabs) {
    tab.addEventListener('click', () => {
      if (tab.getAttribute('aria-selected') === 'true') {
        return;
      }

      activateFilter(tab);
    });

    tab.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown': {
          event.preventDefault();
          const nextTab = getAdjacentTab(tab, 'next');
          if (nextTab) {
            activateFilter(nextTab);
            nextTab.focus();
          }
          break;
        }
        case 'ArrowLeft':
        case 'ArrowUp': {
          event.preventDefault();
          const previousTab = getAdjacentTab(tab, 'previous');
          if (previousTab) {
            activateFilter(previousTab);
            previousTab.focus();
          }
          break;
        }
        case 'Home': {
          event.preventDefault();
          const firstTab = filterTabs[0];
          if (firstTab) {
            activateFilter(firstTab);
            firstTab.focus();
          }
          break;
        }
        case 'End': {
          event.preventDefault();
          const lastTab = filterTabs[filterTabs.length - 1];
          if (lastTab) {
            activateFilter(lastTab);
            lastTab.focus();
          }
          break;
        }
        case ' ': // Space
        case 'Enter': {
          event.preventDefault();
          if (tab.getAttribute('aria-selected') !== 'true') {
            activateFilter(tab);
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

  if (todoCategoryFilter) {
    todoCategoryFilter.addEventListener('change', () => {
      const selectedValue = todoCategoryFilter.value || 'all';
      if (selectedValue === activeCategory) {
        return;
      }

      activeCategory = selectedValue;
      applyFilters();
    });
  }
}

initTodoList();
