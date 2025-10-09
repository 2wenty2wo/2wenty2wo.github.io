import { state } from './state.js';
import { findConnectorCategory, boltHeadMap, boltDriveMap, screwTypeMap } from './data.js';
import { renderLabelPng } from './render.js';
import { buildShareUrl } from './url-state.js';

function captureStateSnapshot() {
  try {
    return structuredClone(state);
  } catch {
    return JSON.parse(JSON.stringify(state));
  }
}

function isImageElement(element) {
  if (!element || typeof element !== 'object') {
    return false;
  }
  const tagName =
    typeof element.tagName === 'string'
      ? element.tagName.toLowerCase()
      : element.nodeName && typeof element.nodeName === 'string'
        ? element.nodeName.toLowerCase()
        : '';
  return tagName === 'img';
}

async function copyLinkToClipboard(link) {
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    await navigator.clipboard.writeText(link);
    return;
  }

  if (typeof document === 'undefined' || !document.body) {
    throw new Error('Clipboard API not available');
  }

  const textarea = document.createElement('textarea');
  textarea.value = link;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();

  let succeeded = false;
  try {
    succeeded = typeof document.execCommand === 'function' ? document.execCommand('copy') : false;
  } catch {
    succeeded = false;
  }
  document.body.removeChild(textarea);

  if (!succeeded) {
    throw new Error('Copy command was unsuccessful');
  }
}

function sanitizeTitle(str) {
  if (!str) {
    return '';
  }
  return str
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/_+/g, '_')
    .replace(/^[-_]+|[-_]+$/g, '');
}

function formatTimestamp(date) {
  const pad = value => String(value).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}${month}${day}-${hours}${minutes}`;
}

export function downloadLabel() {
  captureStateSnapshot();
  renderLabelPng()
    .then(({ blob }) => {
      const link = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      link.href = objectUrl;
      const fileParts = [];
      const includeText = Boolean(state.showText);
      const includeMainText = includeText && state.showTextMain;
      const includeInfoLine2 = includeText && state.showTextInfo && state.showTextInfoLine2;
      const includeInfoLine3 = includeText && state.showTextInfo && state.showTextInfoLine3;
      const includeInfoText = includeInfoLine2 || includeInfoLine3;
      if (state.hardwareType === 'Fuse') {
        fileParts.push('Fuse');
        if (includeInfoLine2 && state.fuseType) {
          fileParts.push(state.fuseType);
        }
        if (includeMainText && state.fuseValue) {
          fileParts.push(`${state.fuseValue}A`);
        }
        if (state.fuseType === 'Glass') {
          if (includeInfoLine2 && state.glassSize) {
            fileParts.push(state.glassSize);
          }
          if (includeInfoLine3 && state.glassSpeed) {
            fileParts.push(state.glassSpeed);
          }
        }
      } else if (state.hardwareType === 'Connector') {
        fileParts.push('Connector');
        if ((includeMainText || includeInfoText) && state.connectorCategory) {
          const category = findConnectorCategory(state.connectorCategory);
          if (category) {
            fileParts.push(category.label);
          }
        }
        if (includeInfoLine2 && state.notes) {
          fileParts.push(state.notes);
        }
      } else if (state.hardwareType === 'Custom') {
        fileParts.push('Custom');
        if (includeMainText && state.customLine1) {
          fileParts.push(state.customLine1);
        }
        if (includeInfoLine2 && state.customLine2) {
          fileParts.push(state.customLine2);
        }
      } else if (state.hardwareType === 'Bearing') {
        if (includeMainText && state.bearingType) {
          fileParts.push(state.bearingType);
        }
        if (includeInfoLine2 && state.bearingDetails) {
          fileParts.push(state.bearingDetails);
        }
      } else if (state.hardwareType === 'Bolt') {
        if (includeMainText && state.threadSize) {
          fileParts.push(state.threadSize);
        }
        if (includeMainText && state.length) {
          fileParts.push(`x${state.length}`);
        }
        const headEntry = boltHeadMap.get((state.boltHead || '').trim());
        const driveEntry = boltDriveMap.get((state.boltDrive || '').trim());
        if (includeInfoLine2 && headEntry && headEntry.label) {
          fileParts.push(headEntry.label);
        }
        if (includeInfoLine3 && driveEntry && driveEntry.label) {
          fileParts.push(driveEntry.label);
        }
      } else if (state.hardwareType === 'Screw') {
        if (includeMainText && state.threadSize) {
          fileParts.push(state.threadSize);
        }
        if (includeMainText && state.length) {
          fileParts.push(`x${state.length}`);
        }
        const typeEntry = screwTypeMap.get((state.boltHead || '').trim());
        const driveEntry = boltDriveMap.get((state.boltDrive || '').trim());
        if (includeInfoLine2 && typeEntry && typeEntry.label) {
          fileParts.push(typeEntry.label);
        }
        if (includeInfoLine3 && driveEntry && driveEntry.label) {
          fileParts.push(driveEntry.label);
        }
      } else {
        if (includeMainText && state.threadSize) {
          fileParts.push(state.threadSize);
        }
      }
      if (state.hardwareType !== 'Bolt' && state.hardwareType !== 'Screw') {
        if (includeInfoLine2 && state.standardCode) {
          fileParts.push(state.standardCode);
        }
        if ((includeInfoLine2 || includeInfoLine3) && state.standard && state.standard !== state.standardCode) {
          fileParts.push(state.standard);
        }
      }
      const rawTitle = fileParts.filter(Boolean).join(' ');
      const sanitizedTitle = sanitizeTitle(rawTitle) || 'label';
      const widthMm =
        Number.isFinite(state.widthMm) && state.widthMm > 0 ? Math.round(state.widthMm) : 1;
      const heightMm =
        Number.isFinite(state.heightMm) && state.heightMm > 0 ? Math.round(state.heightMm) : 1;
      const timestamp = formatTimestamp(new Date());
      link.download = `gridfinity-label_${sanitizedTitle}_${widthMm}x${heightMm}mm_${timestamp}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    })
    .catch(err => {
      console.error('Label download failed', err);
      alert('Unable to prepare the label image for download.');
    });
}

export function printLabel() {
  captureStateSnapshot();
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
  const rawImage = doc.getElementById('print-image');
  const imageElement = isImageElement(rawImage) ? rawImage : null;
  if (imageElement) {
    imageElement.style.width = widthValue;
    imageElement.style.height = heightValue;
    imageElement.style.maxWidth = 'none';
    imageElement.style.maxHeight = 'none';
    imageElement.style.imageRendering = 'pixelated';
  }
  renderLabelPng()
    .then(({ blob, widthPx, heightPx }) => {
      if (!imageElement) {
        throw new Error('Print image element was not created.');
      }
      const objectUrl = URL.createObjectURL(blob);
      imageElement.setAttribute('width', String(widthPx));
      imageElement.setAttribute('height', String(heightPx));
      const handleLoad = () => {
        if (printBody) {
          printBody.setAttribute('data-ready', 'true');
        }
        if (statusDiv) {
          statusDiv.textContent = 'Label ready – opening printer dialog…';
        }
        URL.revokeObjectURL(objectUrl);
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      };
      imageElement.addEventListener('load', handleLoad, { once: true });
      imageElement.addEventListener(
        'error',
        () => {
          URL.revokeObjectURL(objectUrl);
        },
        { once: true },
      );
      imageElement.src = objectUrl;
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

export async function shareLabel() {
  const shareUrl = buildShareUrl();
  if (!shareUrl) {
    alert('Unable to generate a share link right now.');
    return;
  }

  const shareData = {
    title: 'Gridfinity Label Maker',
    text: 'Gridfinity label preset',
    url: shareUrl,
  };

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  if (canShare) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if (error && error.name === 'AbortError') {
        return;
      }
      console.warn('Native share failed, falling back to clipboard', error);
    }
  }

  try {
    await copyLinkToClipboard(shareUrl);
    alert('Share link copied to your clipboard.');
  } catch (error) {
    console.error('Unable to copy share link', error);
    alert(`Unable to copy the share link automatically. Copy this URL instead:\n${shareUrl}`);
  }
}
