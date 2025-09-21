import { state } from './state.js';
import { elements } from './dom-elements.js';
import { metricThreadSizes, imperialThreadSizes } from './data.js';
import { updatePreview, updateDownloadState } from './render.js';

const { threadSizeSelect } = elements;

export function populateThreadSizes() {
  if (
    state.hardwareType === 'Fuse' ||
    state.hardwareType === 'Connector' ||
    state.hardwareType === 'Custom' ||
    state.hardwareType === 'Bearing' ||
    state.hardwareType === 'Component'
  ) {
    if (threadSizeSelect) {
      threadSizeSelect.innerHTML = '';
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Not applicable';
      placeholder.selected = true;
      threadSizeSelect.appendChild(placeholder);
      threadSizeSelect.disabled = true;
    }
    state.threadSize = '';
    updateDownloadState();
    updatePreview();
    return;
  }

  const list = state.systemType === 'Metric' ? metricThreadSizes : imperialThreadSizes;
  if (!threadSizeSelect) {
    state.threadSize = '';
    updateDownloadState();
    updatePreview();
    return;
  }

  threadSizeSelect.disabled = false;
  threadSizeSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select size…';
  threadSizeSelect.appendChild(placeholder);

  const validSizes = new Set(list);
  list.forEach(size => {
    const opt = document.createElement('option');
    opt.value = size;
    opt.textContent = size;
    threadSizeSelect.appendChild(opt);
  });

  const previous = typeof state.threadSize === 'string' ? state.threadSize.trim() : '';
  const normalized = previous && validSizes.has(previous) ? previous : '';
  state.threadSize = normalized;
  threadSizeSelect.value = normalized;
  if (!normalized) {
    placeholder.selected = true;
  }
  updateDownloadState();
  updatePreview();
}
