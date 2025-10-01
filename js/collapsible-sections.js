const STORAGE_KEY = 'gridfinity-collapsible-sections';
const MOBILE_BREAKPOINT_QUERY = '(max-width: 768px)';
const sections = new Map();
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let storedStates = {};

function loadStoredStates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch {
    // Ignore storage access errors and fall back to defaults.
  }
  return {};
}

function persistStates() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedStates));
  } catch {
    // Ignore storage write errors to avoid breaking the UI when storage is unavailable.
  }
}

function saveState(id, expanded) {
  storedStates[id] = expanded;
  persistStates();
}

function cancelOngoingAnimation(content) {
  if (typeof content._collapsibleCleanup === 'function') {
    content._collapsibleCleanup();
  }
}

function animateSection(content, expand) {
  cancelOngoingAnimation(content);

  if (reduceMotionQuery.matches) {
    content.hidden = !expand;
    content.style.maxHeight = '';
    content.style.opacity = '';
    content.style.overflow = '';
    content._collapsibleCleanup = undefined;
    return;
  }

  content.style.overflow = 'hidden';

  if (expand) {
    content.hidden = false;
    content.style.opacity = '0';
    content.style.maxHeight = '0px';
    const fullHeight = content.scrollHeight;
    requestAnimationFrame(() => {
      content.style.maxHeight = `${fullHeight}px`;
      content.style.opacity = '1';
    });
  } else {
    const fullHeight = content.scrollHeight;
    content.style.maxHeight = `${fullHeight}px`;
    content.style.opacity = '1';
    requestAnimationFrame(() => {
      content.style.maxHeight = '0px';
      content.style.opacity = '0';
    });
  }

  const onTransitionEnd = event => {
    if (event.target !== content || event.propertyName !== 'max-height') {
      return;
    }
    content.removeEventListener('transitionend', onTransitionEnd);
    if (!expand) {
      content.hidden = true;
    }
    content.style.maxHeight = '';
    content.style.opacity = '';
    content.style.overflow = '';
    content._collapsibleCleanup = undefined;
  };

  content._collapsibleCleanup = () => {
    content.removeEventListener('transitionend', onTransitionEnd);
    if (!expand) {
      content.hidden = true;
    }
    content.style.maxHeight = '';
    content.style.opacity = '';
    content.style.overflow = '';
    content._collapsibleCleanup = undefined;
  };

  content.addEventListener('transitionend', onTransitionEnd);
}

function updateToggleLabel(toggle, label, expanded) {
  const action = expanded ? 'Collapse' : 'Expand';
  const message = `${action} ${label}`;
  toggle.setAttribute('aria-label', message);
  toggle.setAttribute('title', message);
}

function applySectionState(sectionData, expanded, options = {}) {
  const { animate = true, save = true } = options;
  const { id, section, toggle, content, label } = sectionData;
  const currentlyExpanded = toggle.getAttribute('aria-expanded') === 'true';

  toggle.setAttribute('aria-expanded', String(expanded));
  content.setAttribute('aria-hidden', String(!expanded));
  section.classList.toggle('is-collapsed', !expanded);
  updateToggleLabel(toggle, label, expanded);

  if (currentlyExpanded === expanded) {
    cancelOngoingAnimation(content);
    content.hidden = !expanded;
    content.style.maxHeight = '';
    content.style.opacity = '';
    content.style.overflow = '';
    if (save) {
      saveState(id, expanded);
    }
    return;
  }

  if (animate) {
    animateSection(content, expanded);
  } else {
    cancelOngoingAnimation(content);
    content.hidden = !expanded;
    content.style.maxHeight = '';
    content.style.opacity = '';
    content.style.overflow = '';
  }

  if (save) {
    saveState(id, expanded);
  }
}

function deriveLabel(section, fallback) {
  const primary = section.querySelector('.section-heading span');
  if (primary && primary.textContent) {
    const text = primary.textContent.trim();
    if (text) {
      return text;
    }
  }
  const heading = section.querySelector('.section-heading');
  if (heading && heading.textContent) {
    const text = heading.textContent.trim();
    if (text) {
      return text;
    }
  }
  return fallback;
}

function registerSection(section, defaultExpanded) {
  const id = section.getAttribute('data-collapsible');
  const toggle = section.querySelector('[data-collapsible-toggle]');
  const content = section.querySelector('[data-collapsible-content]');

  if (!id || !toggle || !content) {
    return;
  }

  if (!content.id) {
    content.id = `${id}-content`;
  }

  toggle.setAttribute('aria-controls', content.id);

  const label = section.getAttribute('data-collapsible-label')
    || toggle.getAttribute('data-collapsible-label')
    || deriveLabel(section, id);

  const sectionData = { id, section, toggle, content, label };
  sections.set(id, sectionData);

  const hasStoredState = Object.prototype.hasOwnProperty.call(storedStates, id);
  const initialExpanded = hasStoredState ? Boolean(storedStates[id]) : defaultExpanded;

  applySectionState(sectionData, initialExpanded, { animate: false, save: hasStoredState });

  toggle.addEventListener('click', event => {
    event.preventDefault();
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    applySectionState(sectionData, !expanded);
  });
}

function initCollapsibleSections() {
  storedStates = loadStoredStates();
  const defaultExpanded = !window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches;
  const sectionElements = document.querySelectorAll('[data-collapsible]');
  sectionElements.forEach(section => registerSection(section, defaultExpanded));
}

function expandAllCollapsibleSections({ animate = true } = {}) {
  sections.forEach(sectionData => {
    applySectionState(sectionData, true, { animate, save: true });
  });
}

function collapseAllCollapsibleSections({ animate = true } = {}) {
  sections.forEach(sectionData => {
    applySectionState(sectionData, false, { animate, save: true });
  });
}

export {
  initCollapsibleSections,
  expandAllCollapsibleSections,
  collapseAllCollapsibleSections,
};
