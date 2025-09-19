import { elements } from './dom-elements.js';

const themeStorageKey = 'gridfinity-theme-preference';
const prefersDarkScheme = typeof window.matchMedia === 'function'
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : { matches: false };

function isValidTheme(value) {
  return value === 'light' || value === 'dark';
}

function getStoredTheme() {
  try {
    const storedTheme = localStorage.getItem(themeStorageKey);
    return isValidTheme(storedTheme) ? storedTheme : null;
  } catch (error) {
    return null;
  }
}

function setStoredTheme(theme) {
  if (!isValidTheme(theme)) {
    return;
  }
  try {
    localStorage.setItem(themeStorageKey, theme);
  } catch (error) {
    // Ignore storage errors (e.g., private browsing modes).
  }
}

function getPreferredTheme() {
  const storedTheme = getStoredTheme();
  if (storedTheme) {
    return storedTheme;
  }
  return prefersDarkScheme.matches ? 'dark' : 'light';
}

function updateThemeToggleUi(theme) {
  const { themeToggleButton, themeToggleIcon, themeToggleText } = elements;
  if (!themeToggleButton) {
    return;
  }
  const isDark = theme === 'dark';
  themeToggleButton.setAttribute('aria-pressed', String(isDark));
  const actionLabel = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  themeToggleButton.setAttribute('aria-label', actionLabel);
  themeToggleButton.title = actionLabel;
  if (themeToggleIcon) {
    themeToggleIcon.classList.toggle('fa-moon', !isDark);
    themeToggleIcon.classList.toggle('fa-sun', isDark);
  }
  if (themeToggleText) {
    themeToggleText.textContent = isDark ? 'Light mode' : 'Dark mode';
  }
}

function applyTheme(theme) {
  const normalized = isValidTheme(theme) ? theme : 'light';
  document.documentElement.setAttribute('data-theme', normalized);
  document.documentElement.setAttribute('data-bs-theme', normalized);
  if (document.body) {
    document.body.setAttribute('data-theme', normalized);
    document.body.setAttribute('data-bs-theme', normalized);
  }
  updateThemeToggleUi(normalized);
}

function handleSystemThemeChange(event) {
  if (getStoredTheme()) {
    return;
  }
  applyTheme(event.matches ? 'dark' : 'light');
}

export function initTheme() {
  const { themeToggleButton } = elements;
  applyTheme(getPreferredTheme());
  if (themeToggleButton) {
    themeToggleButton.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      setStoredTheme(nextTheme);
    });
  }
  const systemChangeHandler = event => handleSystemThemeChange(event);
  if (typeof prefersDarkScheme.addEventListener === 'function') {
    prefersDarkScheme.addEventListener('change', systemChangeHandler);
  } else if (typeof prefersDarkScheme.addListener === 'function') {
    prefersDarkScheme.addListener(systemChangeHandler);
  }
}
