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
  const stylesheetHref = new URL('print.css', window.location.href).href;
  const initialHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Print Label</title>
<link rel="stylesheet" href="${stylesheetHref}" />
</head>
<body class="print-window" data-ready="false">
  <main>
    <div id="print-status" class="print-status" role="status" aria-live="polite">Preparing print preview…</div>
    <img id="print-image" class="print-label-image" alt="Gridfinity label" decoding="async" />
  </main>
</body>
</html>`;
  doc.open();
  doc.write(initialHtml);
  doc.close();

  const widthMm = Number.isFinite(state.widthMm) && state.widthMm > 0 ? state.widthMm : 1;
  const heightMm = Number.isFinite(state.heightMm) && state.heightMm > 0 ? state.heightMm : 1;
  const widthValue = `${widthMm}mm`;
  const heightValue = `${heightMm}mm`;
  doc.documentElement.style.setProperty('--label-width-mm', widthValue);
  doc.documentElement.style.setProperty('--label-height-mm', heightValue);
  const printBody = doc.body;
  const statusDiv = doc.getElementById('print-status');
  const img = doc.getElementById('print-image');
  if (img instanceof HTMLImageElement) {
    img.style.width = widthValue;
    img.style.height = heightValue;
    img.style.maxWidth = 'none';
    img.style.maxHeight = 'none';
    img.style.imageRendering = 'pixelated';
  }
  renderLabelCanvas()
    .then(canvas => {
      const dataUrl = canvas.toDataURL('image/png');
      if (!(img instanceof HTMLImageElement)) {
        throw new Error('Print image element was not created.');
      }
      img.setAttribute('width', String(canvas.width));
      img.setAttribute('height', String(canvas.height));
      const handleLoad = () => {
        if (printBody) {
          printBody.setAttribute('data-ready', 'true');
        }
        if (statusDiv) {
          statusDiv.textContent = 'Label ready – opening printer dialog…';
        }
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      };
      img.addEventListener('load', handleLoad, { once: true });
      img.src = dataUrl;
    })
    .catch(err => {
      console.error('Print preview generation failed', err);
      if (printBody) {
        printBody.setAttribute('data-ready', 'error');
      }
      if (statusDiv) {
        statusDiv.textContent = 'Unable to prepare the label for printing.';
      }
    });
}
