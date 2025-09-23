const scriptPromises = new Map();

function loadScript(src, globalName) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Script loading is only available in the browser.'));
  }

  if (globalName && window[globalName]) {
    return Promise.resolve(window[globalName]);
  }

  if (scriptPromises.has(src)) {
    return scriptPromises.get(src);
  }

  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.crossOrigin = 'anonymous';

    script.addEventListener('load', () => {
      if (globalName) {
        const globalValue = window[globalName];
        if (!globalValue) {
          scriptPromises.delete(src);
          reject(new Error(`Global ${globalName} was not found after loading ${src}.`));
          return;
        }
        resolve(globalValue);
        return;
      }
      resolve();
    });

    script.addEventListener('error', () => {
      scriptPromises.delete(src);
      reject(new Error(`Failed to load script: ${src}`));
    });

    document.head.appendChild(script);
  });

  scriptPromises.set(src, promise);
  return promise;
}

export function loadQrCodeLibrary() {
  return loadScript('https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js', 'QRCode');
}
