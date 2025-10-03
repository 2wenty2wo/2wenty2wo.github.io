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
  context: null,
};

let lastKeySequence = [];

function isBrowser() {
  return typeof document !== 'undefined' && typeof window !== 'undefined';
}

function shouldActivateFromQuery() {
  if (!isBrowser()) {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  return params.get('layoutEditor') === '1';
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
  if (fromQuery) {
    editorState.active = true;
    persistActiveFlag(true);
    return true;
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
      notifyPresetListeners();
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
    <div class="layout-editor-body"></div>
  `;
  document.body.appendChild(panel);
  attachPanelStyles();
  setupPanelActions(panel);
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
    .layout-editor-section-title {
      margin: 1rem 0 0.25rem;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: rgba(226, 232, 240, 0.7);
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
        notifyPresetListeners();
      } else if (action === 'export') {
        const json = exportLayoutPresets(true);
        prompt('Layout presets JSON', json);
      } else if (action === 'import') {
        const json = window.prompt('Paste layout preset JSON');
        if (json) {
          try {
            importLayoutPresets(json, false);
            notifyPresetListeners();
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

function bindPresetInputs(panel, heightKey) {
  const body = panel.querySelector('.layout-editor-body');
  body.textContent = '';
  const preset = getActiveLayoutPreset(heightKey);
  const override = getPresetOverride(heightKey) || {};

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
    setPresetOverride(heightKey, override);
    notifyPresetListeners(heightKey);
  };

  const addSectionTitle = title => {
    const heading = document.createElement('div');
    heading.className = 'layout-editor-section-title';
    heading.textContent = title;
    body.appendChild(heading);
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

  addSectionTitle('Padding & Zones');
  body.appendChild(
    createNumberField({
      label: 'Padding (mm)',
      min: 0,
      max: 4,
      step: 0.1,
      value: preset.padding_mm,
      onChange: value => setValue('padding_mm', value),
    }),
  );
  body.appendChild(
    createNumberField({
      label: 'Media width %',
      min: 10,
      max: 90,
      step: 0.5,
      value: preset.media_zone_width_pct,
      onChange: value => setValue('media_zone_width_pct', value),
    }),
  );
  body.appendChild(
    createNumberField({
      label: 'Media width % min',
      min: 5,
      max: 90,
      step: 0.5,
      value: preset.media_zone_width_pct_min,
      onChange: value => setValue('media_zone_width_pct_min', value),
    }),
  );
  body.appendChild(
    createNumberField({
      label: 'Media width % max',
      min: 5,
      max: 90,
      step: 0.5,
      value: preset.media_zone_width_pct_max,
      onChange: value => setValue('media_zone_width_pct_max', value),
    }),
  );

  addSectionTitle('Icons');
  body.appendChild(
    createSelectField({
      label: 'Icon layout',
      value: preset.icon_layout,
      options: [
        { label: 'Row', value: 'row' },
        { label: 'Column', value: 'column' },
      ],
      onChange: value => setValue('icon_layout', value),
    }),
  );
  body.appendChild(
    createNumberField({
      label: 'Icon gap (mm)',
      min: 0,
      max: 4,
      step: 0.1,
      value: preset.icon_gap_mm,
      onChange: value => setValue('icon_gap_mm', value),
    }),
  );
  body.appendChild(
    createNumberField({
      label: 'Icon min size (mm)',
      min: 1,
      max: 12,
      step: 0.1,
      value: preset.icon_min_mm,
      onChange: value => setValue('icon_min_mm', value),
    }),
  );

  addSectionTitle('Text Zones');
  body.appendChild(
    createNumberField({
      label: 'Main zone %',
      min: 20,
      max: 80,
      step: 0.5,
      value: preset.text_zone.top_pct,
      onChange: value => setValue('text_zone.top_pct', value),
    }),
  );
  body.appendChild(
    createNumberField({
      label: 'Zone gap (mm)',
      min: 0,
      max: 2,
      step: 0.05,
      value: preset.text_zone.gap_mm,
      onChange: value => setValue('text_zone.gap_mm', value),
    }),
  );

  addSectionTitle('Main line');
  body.appendChild(
    createNumberField({
      label: 'Min size (pt)',
      min: 5,
      max: 24,
      step: 0.1,
      value: preset.text_zone.main.min_pt,
      onChange: value => setValue('text_zone.main.min_pt', value),
    }),
  );
  body.appendChild(
    createNumberField({
      label: 'Max size (pt)',
      min: 6,
      max: 40,
      step: 0.1,
      value: preset.text_zone.main.max_pt,
      onChange: value => setValue('text_zone.main.max_pt', value),
    }),
  );
  body.appendChild(
    createNumberField({
      label: 'Letter spacing adj (px)',
      min: -2,
      max: 1,
      step: 0.05,
      value: preset.text_zone.main.letter_spacing_adj || 0,
      onChange: value => setValue('text_zone.main.letter_spacing_adj', value),
    }),
  );

  addSectionTitle('Subtitles');
  body.appendChild(
    createNumberField({
      label: 'Min size (pt)',
      min: 4,
      max: 16,
      step: 0.1,
      value: preset.text_zone.sub.min_pt,
      onChange: value => setValue('text_zone.sub.min_pt', value),
    }),
  );
  body.appendChild(
    createNumberField({
      label: 'Max size (pt)',
      min: 4,
      max: 24,
      step: 0.1,
      value: preset.text_zone.sub.max_pt,
      onChange: value => setValue('text_zone.sub.max_pt', value),
    }),
  );
  body.appendChild(
    createNumberField({
      label: 'Line height %',
      min: 90,
      max: 160,
      step: 1,
      value: preset.text_zone.sub.line_height_pct,
      onChange: value => setValue('text_zone.sub.line_height_pct', value),
    }),
  );
  body.appendChild(
    createSelectField({
      label: 'Compact subtitles',
      value: preset.text_zone.compact_join_subtitles ? '1' : '0',
      options: [
        { label: 'Disabled', value: '0' },
        { label: 'Enabled', value: '1' },
      ],
      onChange: value => setValue('text_zone.compact_join_subtitles', value === '1'),
    }),
  );

  body.appendChild(
    createTextField({
      label: 'Compact separator',
      value: preset.text_zone.compact_separator || ' · ',
      onChange: value => setValue('text_zone.compact_separator', value),
    }),
  );

  addSectionTitle('QR');
  body.appendChild(
    createNumberField({
      label: 'QR side (mm)',
      min: 4,
      max: 20,
      step: 0.1,
      value: preset.qr.side_mm,
      onChange: value => setValue('qr.side_mm', value),
    }),
  );
  body.appendChild(
    createNumberField({
      label: 'QR margin (mm)',
      min: 0,
      max: 4,
      step: 0.1,
      value: preset.qr.margin_mm,
      onChange: value => setValue('qr.margin_mm', value),
    }),
  );
  body.appendChild(
    createNumberField({
      label: 'QR max % text width',
      min: 5,
      max: 80,
      step: 1,
      value: preset.qr.max_pct_of_text_zone_width,
      onChange: value => setValue('qr.max_pct_of_text_zone_width', value),
    }),
  );
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
      const panel = document.getElementById('layout-editor-panel');
      if (!panel) {
        return;
      }
      const ctx = editorState.context;
      const key = ctx?.geometry?.printableHeightMm || ctx?.geometry?.labelHeightMm || 12;
      bindPresetInputs(panel, key);
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
  editorState.context = context;
  const key = context?.geometry?.printableHeightMm || context?.geometry?.labelHeightMm || 12;
  if (editorState.currentHeightKey !== key) {
    editorState.currentHeightKey = key;
    bindPresetInputs(panel, key);
  }
  return { active: true };
}
