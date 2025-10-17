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

let cachedTodoItems = [];

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
  const status = (tab.getAttribute('data-status') || 'all').toLowerCase();
  const filteredItems = filterItemsByStatus(status);
  renderTodoList(todoListContainer, filteredItems);
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

function filterItemsByStatus(status) {
  if (status === 'all') {
    return cachedTodoItems;
  }

  return cachedTodoItems.filter((item) => {
    const itemStatus = typeof item.status === 'string' ? item.status.toLowerCase() : '';
    return itemStatus === status;
  });
}

async function initTodoList() {
  if (!todoListContainer || filterTabs.length === 0) {
    return;
  }

  try {
    cachedTodoItems = await fetchTodoItems();
    renderTodoList(todoListContainer, cachedTodoItems);
  } catch (error) {
    console.error('Failed to load to-do items:', error);
    renderTodoList(todoListContainer, undefined);
    return;
  }

  const initiallyActiveTab =
    filterTabs.find((tab) => tab.getAttribute('aria-selected') === 'true') ||
    filterTabs[0];

  if (initiallyActiveTab) {
    activateFilter(initiallyActiveTab);
  }

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
}

initTodoList();
