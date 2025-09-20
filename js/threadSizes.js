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
      threadSizeSelect.appendChild(placeholder);
      threadSizeSelect.value = '';
      threadSizeSelect.disabled = true;
    }
    state.threadSize = '';
    updateDownloadState();
    updatePreview();
    return;
  }
  if (threadSizeSelect) {
    threadSizeSelect.disabled = false;
  }
  const list = state.systemType === 'Metric' ? metricThreadSizes : imperialThreadSizes;
  if (!threadSizeSelect) {
    return;
  }
  threadSizeSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select size…';
  threadSizeSelect.appendChild(placeholder);
  list.forEach(size => {
    const opt = document.createElement('option');
    opt.value = size;
    opt.textContent = size;
    threadSizeSelect.appendChild(opt);
  });
  state.threadSize = '';
  threadSizeSelect.value = '';
  updateDownloadState();
  updatePreview();
}
