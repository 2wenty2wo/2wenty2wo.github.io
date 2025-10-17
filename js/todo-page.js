import { initTheme } from './theme.js';
import { setRandomDevelopmentWarning } from './warning-message.js';
import { fetchTodoItems, renderTodoList } from './todo/todo-renderer.js';

initTheme();

const developmentWarning = document.getElementById('development-warning');
if (developmentWarning) {
  setRandomDevelopmentWarning(developmentWarning);
}

const todoListContainer = document.querySelector('#todo-list ul');
const filterButtons = document.querySelectorAll('#todo-status-filters [data-status]');

let cachedTodoItems = [];

function setActiveFilter(button) {
  for (const filterButton of filterButtons) {
    const isActive = filterButton === button;
    const variant = filterButton.getAttribute('data-variant') || 'primary';
    filterButton.setAttribute('aria-pressed', String(isActive));
    filterButton.classList.toggle(`btn-${variant}`, isActive);
    filterButton.classList.toggle(`btn-outline-${variant}`, !isActive);
  }
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
  if (!todoListContainer) {
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

  const initiallyActiveButton = Array.from(filterButtons).find(
    (button) => button.getAttribute('aria-pressed') === 'true',
  );
  if (initiallyActiveButton) {
    setActiveFilter(initiallyActiveButton);
  }

  for (const button of filterButtons) {
    button.addEventListener('click', () => {
      if (button.getAttribute('aria-pressed') === 'true') {
        return;
      }

      setActiveFilter(button);
      const status = (button.getAttribute('data-status') || 'all').toLowerCase();
      const filteredItems = filterItemsByStatus(status);
      renderTodoList(todoListContainer, filteredItems);
    });
  }
}

initTodoList();
