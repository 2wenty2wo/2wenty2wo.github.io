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

let cachedTodoItems = [];
let activeStatus = 'all';
let searchQuery = '';

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

function filterItemsByStatus(items, status) {
  if (status === 'all') {
    return items;
  }

  return items.filter((item) => {
    const itemStatus = typeof item.status === 'string' ? item.status.toLowerCase() : '';
    return itemStatus === status;
  });
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
    const searchableParts = [item.title, item.notes, item.status]
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
  const filteredItems = filterItemsByQuery(itemsByStatus, searchQuery);
  const hasActiveFilters =
    cachedTodoItems.length > 0 && (activeStatus !== 'all' || searchQuery.length > 0);

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
}

initTodoList();
