import { initTheme } from './theme.js';
import { setRandomDevelopmentWarning } from './warning-message.js';
import { renderTodoList } from './todo/todo-renderer.js';

initTheme();

const developmentWarning = document.getElementById('development-warning');
if (developmentWarning) {
  setRandomDevelopmentWarning(developmentWarning);
}

const todoListContainer = document.querySelector('#todo-list ul');
if (todoListContainer) {
  renderTodoList(todoListContainer);
}
