import {
  getActiveLayoutPreset,
  getPresetOverride,
  setPresetOverride,
  clearPresetOverrides,
  exportLayoutPresets,
  importLayoutPresets,
  subscribePresetChanges,
  notifyPresetListeners,
} from './layoutPresets.js';

const STORAGE_KEY_ACTIVE = 'gridfinity-layout-editor-active';
const SECRET_COMBO = ['Shift', 'Alt', 'KeyL'];

let editorState = {
  active: false,
  initialized: false,
  currentHeightKey: null,
  currentPartKey: null,
  contextPartKey: null,
  contextPartLabel: '',
  context: null,
  latestToken: 0,
};

let lastKeySequence = [];

function isBrowser() {
  return typeof document !== 'undefined' && typeof window !== 'undefined';
}

function shouldActivateFromQuery() {
  if (!isBrowser()) {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  return params.get('layoutEditor');
}

function restoreActiveFlag() {
  if (!isBrowser()) {
    return false;
  }
  try {
    const flag = localStorage.getItem(STORAGE_KEY_ACTIVE);
    return flag === '1';
  } catch (error) {
    console.warn('Unable to read layout editor state.', error);
    return false;
  }
}

function persistActiveFlag(active) {
  if (!isBrowser()) {
    return;
  }
  try {
    if (active) {
      localStorage.setItem(STORAGE_KEY_ACTIVE, '1');
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE);
    }
  } catch (error) {
    console.warn('Unable to persist layout editor state.', error);
  }
}

function evaluateActivation() {
  if (editorState.active) {
    return true;
  }
  const fromQuery = shouldActivateFromQuery();
  if (fromQuery === '0') {
    editorState.active = false;
    persistActiveFlag(false);
    return false;
  }
  if (fromQuery === '1') {
    editorState.active = true;
    return true;
  }
  if (fromQuery !== null) {
    return false;
  }
  const stored = restoreActiveFlag();
  if (stored) {
    editorState.active = true;
    return true;
  }
  return false;
}

function watchKeyCombo() {
  if (!isBrowser()) {
    return;
  }
  window.addEventListener('keydown', event => {
    const identifier = event.code || event.key;
    if (!identifier) {
      return;
    }
    if (SECRET_COMBO.includes(identifier)) {
      if (!lastKeySequence.includes(identifier)) {
        lastKeySequence.push(identifier);
      }
    } else {
      lastKeySequence = [];
      return;
    }
    if (SECRET_COMBO.every(code => lastKeySequence.includes(code))) {
      editorState.active = !editorState.active;
      persistActiveFlag(editorState.active);
      lastKeySequence = [];
      notifyPresetListeners(null, {});
    }
  });
  window.addEventListener('keyup', () => {
    lastKeySequence = [];
  });
}

function createEditorPanel() {
  if (!isBrowser()) {
    return null;
  }
  let panel = document.getElementById('layout-editor-panel');
  if (panel) {
    return panel;
  }
  panel = document.createElement('div');
  panel.id = 'layout-editor-panel';
  panel.className = 'layout-editor-panel';
  panel.innerHTML = `
    <div class="layout-editor-header">
      <h3 class="layout-editor-title">Layout Editor</h3>
      <div class="layout-editor-actions">
        <button type="button" class="btn btn-sm btn-outline-secondary" data-editor-action="reset">Reset</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" data-editor-action="export">Export</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" data-editor-action="import">Import</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" data-editor-action="copy">Copy</button>
      </div>
    </div>
    <div class="layout-editor-scope" data-editor-scope-container hidden>
      <label class="layout-editor-scope__label" data-editor-scope-label for="layout-editor-scope-select">Preset scope</label>
      <div class="layout-editor-scope__controls">
        <select id="layout-editor-scope-select" class="layout-editor-scope__select" data-editor-scope></select>
        <button type="button" class="btn btn-sm btn-outline-secondary layout-editor-scope__clear" data-editor-clear-part>Clear part override</button>
      </div>
    </div>
    <div class="layout-editor-body"></div>
  `;
  document.body.appendChild(panel);
  attachPanelStyles();
  setupPanelActions(panel);
  setupScopeControls(panel);
  return panel;
}

function attachPanelStyles() {
  if (!isBrowser()) {
    return;
  }
  if (document.getElementById('layout-editor-styles')) {
    return;
  }
  const style = document.createElement('style');
  style.id = 'layout-editor-styles';
  style.textContent = `
    .layout-editor-panel {
      position: fixed;
      top: 80px;
      right: 16px;
      width: 340px;
      max-height: calc(100vh - 120px);
      overflow-y: auto;
      background: rgba(15, 23, 42, 0.92);
      color: #f8fafc;
      border-radius: 12px;
      box-shadow: 0 20px 45px rgba(15, 23, 42, 0.35);
      z-index: 9999;
      padding: 16px;
      display: none;
    }
    .layout-editor-panel.layout-editor-panel--active {
      display: block;
    }
    .layout-editor-title {
      margin: 0 0 0.5rem 0;
      font-size: 1.1rem;
      font-weight: 700;
    }
    .layout-editor-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    .layout-editor-scope {
      display: grid;
      gap: 0.3rem;
      margin-bottom: 1rem;
    }
    .layout-editor-scope[hidden] {
      display: none;
    }
    .layout-editor-scope__label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(226, 232, 240, 0.78);
    }
    .layout-editor-scope__controls {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    .layout-editor-scope__select {
      flex: 1;
      min-width: 0;
      background: rgba(15, 23, 42, 0.7);
      color: #f8fafc;
      border: 1px solid rgba(148, 163, 184, 0.35);
      border-radius: 6px;
      padding: 0.35rem 0.5rem;
      font-size: 0.82rem;
    }
    .layout-editor-scope__select:focus {
      outline: none;
      border-color: rgba(148, 163, 184, 0.75);
      box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.25);
    }
    .layout-editor-scope__clear[hidden] {
      display: none;
    }
    .layout-editor-body {
      display: grid;
      gap: 0.75rem;
    }
    .layout-editor-field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.85rem;
    }
    .layout-editor-field label {
      font-weight: 600;
    }
    .layout-editor-field input,
    .layout-editor-field select,
    .layout-editor-field textarea {
      font-size: 0.85rem;
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.3);
      padding: 0.35rem 0.5rem;
      background: rgba(15, 23, 42, 0.6);
      color: #f8fafc;
    }
    .layout-editor-section {
      background: rgba(15, 23, 42, 0.55);
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.25);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    }
    .layout-editor-section__header {
      position: sticky;
      top: 0;
      background: linear-gradient(
        180deg,
        rgba(15, 23, 42, 0.95) 0%,
        rgba(15, 23, 42, 0.8) 100%
      );
      padding: 0.6rem 0.75rem;
      border-bottom: 1px solid rgba(148, 163, 184, 0.35);
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 1;
    }
    .layout-editor-section__title {
      margin: 0;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
      color: rgba(226, 232, 240, 0.78);
    }
    .layout-editor-section__body {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem;
      background: rgba(15, 23, 42, 0.4);
    }
  `;
  document.head.appendChild(style);
}

function setupPanelActions(panel) {
  panel.querySelectorAll('[data-editor-action]').forEach(button => {
    button.addEventListener('click', event => {
      const action = event.currentTarget.getAttribute('data-editor-action');
      if (action === 'reset') {
        clearPresetOverrides();
        notifyPresetListeners(null, {});
      } else if (action === 'export') {
        const json = exportLayoutPresets(true);
        prompt('Layout presets JSON', json);
      } else if (action === 'import') {
        const json = window.prompt('Paste layout preset JSON');
        if (json) {
          try {
            importLayoutPresets(json, false);
            notifyPresetListeners(null, {});
          } catch (error) {
            window.alert(`Invalid preset JSON: ${error.message}`);
          }
        }
      } else if (action === 'copy') {
        const json = exportLayoutPresets(true);
        navigator.clipboard.writeText(json).catch(error => {
          console.warn('Unable to copy presets to clipboard.', error);
        });
      }
    });
  });
}

function getScopeControlElements(panel) {
  if (!panel) {
    return null;
  }
  const container = panel.querySelector('[data-editor-scope-container]');
  if (!container) {
    return null;
  }
  const select = container.querySelector('[data-editor-scope]');
  const clearButton = container.querySelector('[data-editor-clear-part]');
  return { container, select, clearButton };
}

function updateScopeControls(panel, { contextPartKey, partLabel, selectedPartKey, heightKey }) {
  const controls = getScopeControlElements(panel);
  if (!controls) {
    return;
  }
  const { container, select, clearButton } = controls;
  if (!contextPartKey) {
    container.hidden = true;
    if (select) {
      select.value = '';
    }
    if (clearButton) {
      clearButton.hidden = true;
    }
    return;
  }
  container.hidden = false;
  const displayLabel = partLabel || contextPartKey;
  if (select) {
    select.textContent = '';
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'All parts';
    const partOption = document.createElement('option');
    partOption.value = contextPartKey;
    partOption.textContent = displayLabel;
    select.append(allOption, partOption);
    const value = selectedPartKey === contextPartKey ? contextPartKey : '';
    select.value = value;
  }
  if (clearButton) {
    clearButton.textContent = `Clear ${displayLabel} override`;
    const hasOverride = Boolean(heightKey && getPresetOverride(heightKey, { partType: contextPartKey }));
    clearButton.hidden = false;
    clearButton.disabled = !hasOverride;
  }
}

function setupScopeControls(panel) {
  const controls = getScopeControlElements(panel);
  if (!controls) {
    return;
  }
  const { select, clearButton } = controls;
  if (select) {
    select.addEventListener('change', () => {
      const selectedValue = select.value;
      const contextPartKey = editorState.contextPartKey;
      editorState.currentPartKey = selectedValue && selectedValue === contextPartKey ? contextPartKey : null;
      const heightKey = editorState.currentHeightKey || resolveHeightKeyFromContext(editorState.context);
      if (!heightKey) {
        return;
      }
      bindPresetInputs(panel, heightKey, {
        partType: editorState.currentPartKey,
        contextPartType: editorState.contextPartKey,
        partLabel: editorState.contextPartLabel,
      });
    });
  }
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      const heightKey = editorState.currentHeightKey || resolveHeightKeyFromContext(editorState.context);
      const partKey = editorState.contextPartKey;
      if (!heightKey || !partKey) {
        return;
      }
      setPresetOverride(heightKey, null, { partType: partKey });
      bindPresetInputs(panel, heightKey, {
        partType: editorState.currentPartKey,
        contextPartType: editorState.contextPartKey,
        partLabel: editorState.contextPartLabel,
      });
    });
  }
}

function createSection({ title }) {
  const section = document.createElement('div');
  section.className = 'layout-editor-section';

  const header = document.createElement('div');
  header.className = 'layout-editor-section__header';

  const heading = document.createElement('h4');
  heading.className = 'layout-editor-section__title';
  heading.textContent = title;

  const body = document.createElement('div');
  body.className = 'layout-editor-section__body';

  header.appendChild(heading);
  section.append(header, body);

  return { section, body };
}

function createNumberField({ label, min, max, step, value, onChange }) {
  const field = document.createElement('div');
  field.className = 'layout-editor-field';
  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  const input = document.createElement('input');
  input.type = 'number';
  if (Number.isFinite(min)) input.min = String(min);
  if (Number.isFinite(max)) input.max = String(max);
  input.step = step ? String(step) : '0.1';
  input.value = String(value ?? '');
  input.addEventListener('input', () => {
    const numeric = Number(input.value);
    if (Number.isFinite(numeric)) {
      onChange(numeric);
    }
  });
  field.append(labelEl, input);
  return field;
}

function createSelectField({ label, options, value, onChange }) {
  const field = document.createElement('div');
  field.className = 'layout-editor-field';
  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  const select = document.createElement('select');
  options.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.value;
    opt.textContent = option.label;
    if (option.value === value) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });
  select.addEventListener('change', () => {
    onChange(select.value);
  });
  field.append(labelEl, select);
  return field;
}

function bindPresetInputs(panel, heightKey, options = {}) {
  const body = panel.querySelector('.layout-editor-body');
  body.textContent = '';
  const { partType: selectedPartType = null, contextPartType = null, partLabel = '' } = options || {};
  updateScopeControls(panel, {
    contextPartKey: contextPartType,
    partLabel,
    selectedPartKey: selectedPartType,
    heightKey,
  });
  const preset = getActiveLayoutPreset(heightKey, selectedPartType ? { partType: selectedPartType } : undefined);
  const override = getPresetOverride(heightKey, selectedPartType ? { partType: selectedPartType } : undefined) || {};

  const setValue = (path, value) => {
    let target = override;
    const keys = path.split('.');
    for (let i = 0; i < keys.length - 1; i += 1) {
      if (!target[keys[i]] || typeof target[keys[i]] !== 'object') {
        target[keys[i]] = {};
      }
      target = target[keys[i]];
    }
    target[keys[keys.length - 1]] = value;
    setPresetOverride(heightKey, override, selectedPartType ? { partType: selectedPartType } : undefined);
    notifyPresetListeners(heightKey, { partType: selectedPartType || null });
  };

  const createTextField = ({ label, value, onChange }) => {
    const field = document.createElement('div');
    field.className = 'layout-editor-field';
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value || '';
    input.addEventListener('input', () => {
      onChange(input.value);
    });
    field.append(labelEl, input);
    return field;
  };

  const addSection = (title, build) => {
    const { section, body: sectionBody } = createSection({ title });
    build(sectionBody);
    body.appendChild(section);
  };

  addSection('Padding & Zones', sectionBody => {
    sectionBody.append(
      createNumberField({
        label: 'Padding (mm)',
        min: 0,
        max: 4,
        step: 0.1,
        value: preset.padding_mm,
        onChange: value => setValue('padding_mm', value),
      }),
      createNumberField({
        label: 'Media width %',
        min: 10,
        max: 100,
        step: 0.5,
        value: preset.media_zone_width_pct,
        onChange: value => setValue('media_zone_width_pct', value),
      }),
      createNumberField({
        label: 'Media width % min',
        min: 5,
        max: 100,
        step: 0.5,
        value: preset.media_zone_width_pct_min,
        onChange: value => setValue('media_zone_width_pct_min', value),
      }),
      createNumberField({
        label: 'Media width % max',
        min: 5,
        max: 100,
        step: 0.5,
        value: preset.media_zone_width_pct_max,
        onChange: value => setValue('media_zone_width_pct_max', value),
      }),
      createNumberField({
        label: 'Media width % max (user override)',
        min: 5,
        max: 100,
        step: 0.5,
        value: preset.media_zone_width_pct_max_user,
        onChange: value => setValue('media_zone_width_pct_max_user', value),
      }),
      createNumberField({
        label: 'Media/Text gap (mm)',
        min: 0,
        max: 4,
        step: 0.1,
        value: preset.media_text_gap_mm,
        onChange: value => setValue('media_text_gap_mm', value),
      }),
    );
  });

  addSection('Icons', sectionBody => {
    sectionBody.append(
      createSelectField({
        label: 'Icon layout',
        value: preset.icon_layout,
        options: [
          { label: 'Row', value: 'row' },
          { label: 'Column', value: 'column' },
        ],
        onChange: value => setValue('icon_layout', value),
      }),
      createNumberField({
        label: 'Icon padding (mm)',
        min: 0,
        max: 4,
        step: 0.1,
        value: preset.icon_padding_mm,
        onChange: value => setValue('icon_padding_mm', value),
      }),
      createNumberField({
        label: 'Icon gap (mm)',
        min: 0,
        max: 4,
        step: 0.1,
        value: preset.icon_gap_mm,
        onChange: value => setValue('icon_gap_mm', value),
      }),
      createNumberField({
        label: 'Icon min size (mm)',
        min: 1,
        max: 12,
        step: 0.1,
        value: preset.icon_min_mm,
        onChange: value => setValue('icon_min_mm', value),
      }),
    );
  });

  addSection('Text Zones', sectionBody => {
    sectionBody.append(
      createNumberField({
        label: 'Main zone %',
        min: 20,
        max: 80,
        step: 0.5,
        value: preset.text_zone.top_pct,
        onChange: value => setValue('text_zone.top_pct', value),
      }),
      createNumberField({
        label: 'Zone gap (mm)',
        min: 0,
        max: 2,
        step: 0.05,
        value: preset.text_zone.gap_mm,
        onChange: value => setValue('text_zone.gap_mm', value),
      }),
      createSelectField({
        label: 'Text alignment',
        value: preset.text_zone.alignment || 'start',
        options: [
          { label: 'Left', value: 'start' },
          { label: 'Center', value: 'middle' },
          { label: 'Right', value: 'end' },
        ],
        onChange: value => setValue('text_zone.alignment', value),
      }),
      createNumberField({
        label: 'Block offset (mm)',
        min: -10,
        max: 10,
        step: 0.1,
        value: preset.text_zone.block_offset_mm || 0,
        onChange: value => setValue('text_zone.block_offset_mm', value),
      }),
      createNumberField({
        label: 'Horizontal offset (mm)',
        min: -15,
        max: 15,
        step: 0.1,
        value: preset.text_zone.horizontal_offset_mm || 0,
        onChange: value => setValue('text_zone.horizontal_offset_mm', value),
      }),
    );
  });

  addSection('Main line', sectionBody => {
    sectionBody.append(
      createNumberField({
        label: 'Min size (pt)',
        min: 5,
        max: 24,
        step: 0.1,
        value: preset.text_zone.main.min_pt,
        onChange: value => setValue('text_zone.main.min_pt', value),
      }),
      createNumberField({
        label: 'Max size (pt)',
        min: 6,
        max: 40,
        step: 0.1,
        value: preset.text_zone.main.max_pt,
        onChange: value => setValue('text_zone.main.max_pt', value),
      }),
      createNumberField({
        label: 'Letter spacing adj (px)',
        min: -2,
        max: 1,
        step: 0.05,
        value: preset.text_zone.main.letter_spacing_adj || 0,
        onChange: value => setValue('text_zone.main.letter_spacing_adj', value),
      }),
      createSelectField({
        label: 'Font weight',
        value: String(Math.min(700, preset.text_zone.main.font_weight ?? 700)),
        options: [{ label: 'Bold (700)', value: '700' }],
        onChange: value => setValue('text_zone.main.font_weight', Number(value)),
      }),
    );
  });

  addSection('Subtitles', sectionBody => {
    sectionBody.append(
      createNumberField({
        label: 'Min size (pt)',
        min: 4,
        max: 16,
        step: 0.1,
        value: preset.text_zone.sub.min_pt,
        onChange: value => setValue('text_zone.sub.min_pt', value),
      }),
      createNumberField({
        label: 'Max size (pt)',
        min: 4,
        max: 24,
        step: 0.1,
        value: preset.text_zone.sub.max_pt,
        onChange: value => setValue('text_zone.sub.max_pt', value),
      }),
      createNumberField({
        label: 'Line height %',
        min: 90,
        max: 160,
        step: 1,
        value: preset.text_zone.sub.line_height_pct,
        onChange: value => setValue('text_zone.sub.line_height_pct', value),
      }),
      createSelectField({
        label: 'Compact subtitles',
        value: preset.text_zone.compact_join_subtitles ? '1' : '0',
        options: [
          { label: 'Disabled', value: '0' },
          { label: 'Enabled', value: '1' },
        ],
        onChange: value => setValue('text_zone.compact_join_subtitles', value === '1'),
      }),
      createTextField({
        label: 'Compact separator',
        value: preset.text_zone.compact_separator || ' · ',
        onChange: value => setValue('text_zone.compact_separator', value),
      }),
    );
  });

  addSection('QR', sectionBody => {
    sectionBody.append(
      createNumberField({
        label: 'QR side (mm)',
        min: 4,
        max: 20,
        step: 0.1,
        value: preset.qr.side_mm,
        onChange: value => setValue('qr.side_mm', value),
      }),
      createNumberField({
        label: 'QR margin (mm)',
        min: 0,
        max: 4,
        step: 0.1,
        value: preset.qr.margin_mm,
        onChange: value => setValue('qr.margin_mm', value),
      }),
      createNumberField({
        label: 'QR max % text width',
        min: 5,
        max: 80,
        step: 1,
        value: preset.qr.max_pct_of_text_zone_width,
        onChange: value => setValue('qr.max_pct_of_text_zone_width', value),
      }),
    );
  });
}

function resolveHeightKeyFromContext(ctx) {
  return ctx?.geometry?.labelHeightMm || ctx?.geometry?.printableHeightMm || 12;
}

export function ensureLayoutEditor(context) {
  if (!isBrowser()) {
    return { active: false };
  }
  evaluateActivation();
  if (!editorState.initialized) {
    watchKeyCombo();
    subscribePresetChanges(() => {
      if (!editorState.active) {
        return;
      }
      if (!isBrowser()) {
        return;
      }
      const panel = document.getElementById('layout-editor-panel');
      if (!panel) {
        return;
      }
      const ctx = editorState.context;
      const key = resolveHeightKeyFromContext(ctx);
      bindPresetInputs(panel, key, {
        partType: editorState.currentPartKey,
        contextPartType: editorState.contextPartKey,
        partLabel: editorState.contextPartLabel,
      });
    });
    editorState.initialized = true;
  }

  const panel = createEditorPanel();
  if (!panel) {
    return { active: false };
  }
  if (!editorState.active) {
    panel.classList.remove('layout-editor-panel--active');
    return { active: false };
  }
  panel.classList.add('layout-editor-panel--active');
  const token = Number.isFinite(context?.layoutEditorToken) ? context.layoutEditorToken : null;
  if (token !== null && token < editorState.latestToken) {
    return { active: true };
  }
  if (token !== null && token >= editorState.latestToken) {
    editorState.latestToken = token;
  }
  editorState.context = context;
  const key = resolveHeightKeyFromContext(context);
  const contextPartKey =
    typeof context?.partType === 'string' && context.partType ? context.partType : null;
  const contextPartLabel =
    typeof context?.partLabel === 'string' && context.partLabel
      ? context.partLabel
      : contextPartKey || '';
  let shouldRebind = false;
  if (editorState.contextPartKey !== contextPartKey) {
    editorState.contextPartKey = contextPartKey;
    editorState.contextPartLabel = contextPartLabel;
    editorState.currentPartKey = contextPartKey;
    shouldRebind = true;
  } else if (editorState.contextPartLabel !== contextPartLabel) {
    editorState.contextPartLabel = contextPartLabel;
    shouldRebind = true;
  }
  if (editorState.currentHeightKey !== key) {
    editorState.currentHeightKey = key;
    shouldRebind = true;
  }
  if (shouldRebind) {
    bindPresetInputs(panel, key, {
      partType: editorState.currentPartKey,
      contextPartType: editorState.contextPartKey,
      partLabel: editorState.contextPartLabel,
    });
  } else {
    updateScopeControls(panel, {
      contextPartKey: editorState.contextPartKey,
      partLabel: editorState.contextPartLabel,
      selectedPartKey: editorState.currentPartKey,
      heightKey: key,
    });
  }
  return { active: true };
}
