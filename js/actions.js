import { state } from './state.js';
import { findConnectorCategory } from './data.js';
import { renderLabelCanvas } from './preview.js';

export function downloadLabel() {
  renderLabelCanvas()
    .then(canvas => {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      const fileParts = [];
      if (state.hardwareType === 'Fuse') {
        fileParts.push('Fuse');
        if (state.fuseType) {
          fileParts.push(state.fuseType);
        }
        if (state.fuseValue) {
          fileParts.push(`${state.fuseValue}A`);
        }
        if (state.fuseType === 'Glass') {
          if (state.glassSize) {
            fileParts.push(state.glassSize);
          }
          if (state.glassSpeed) {
            fileParts.push(state.glassSpeed);
          }
        }
      } else if (state.hardwareType === 'Connector') {
        fileParts.push('Connector');
        if (state.connectorCategory) {
          const category = findConnectorCategory(state.connectorCategory);
          if (category) {
            fileParts.push(category.label);
          }
        }
        if (state.notes) {
          fileParts.push(state.notes);
        }
      } else if (state.hardwareType === 'Custom') {
        fileParts.push('Custom');
        if (state.customLine1) {
          fileParts.push(state.customLine1);
        }
        if (state.customLine2) {
          fileParts.push(state.customLine2);
        }
      } else if (state.hardwareType === 'Bearing') {
        if (state.bearingType) {
          fileParts.push(state.bearingType);
        }
        if (state.showStandard && state.bearingDetails) {
          fileParts.push(state.bearingDetails);
        }
      } else {
        if (state.threadSize) {
          fileParts.push(state.threadSize);
        }
        if (state.hardwareType === 'Screw' && state.length) {
          fileParts.push(`x${state.length}`);
        }
      }
      if (state.standardCode) {
        fileParts.push(state.standardCode);
      }
      if (state.standard && state.standard !== state.standardCode) {
        fileParts.push(state.standard);
      }
      const safeName = fileParts
        .filter(Boolean)
        .map(part => part.replace(/[^a-zA-Z0-9]+/g, '_'))
        .join('_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
      link.download = `${safeName || 'label'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch(err => {
      console.error('Label download failed', err);
      alert('Unable to prepare the label image for download.');
    });
}

export function printLabel() {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) {
    alert('Please allow pop-ups to print the label.');
    return;
  }
  printWindow.opener = null;
  const doc = printWindow.document;
  doc.title = 'Print Label';
  const style = doc.createElement('style');
  style.textContent = 'html,body{margin:0;height:100%;font-family:system-ui,-apple-system,Segoe UI,sans-serif;}body{display:flex;align-items:center;justify-content:center;background:#fff;color:#111;} .status{padding:1rem;text-align:center;}';
  doc.head.appendChild(style);
  doc.body.innerHTML = '';
  const statusDiv = doc.createElement('div');
  statusDiv.className = 'status';
  statusDiv.textContent = 'Preparing print preview…';
  doc.body.appendChild(statusDiv);
  renderLabelCanvas()
    .then(canvas => {
      const dataUrl = canvas.toDataURL('image/png');
      const img = doc.createElement('img');
      img.src = dataUrl;
      img.alt = 'Gridfinity label';
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.onload = () => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      };
      doc.body.innerHTML = '';
      doc.body.appendChild(img);
    })
    .catch(err => {
      console.error('Print preview generation failed', err);
      doc.body.innerHTML = '<div class="status">Unable to prepare the label for printing.</div>';
    });
}
