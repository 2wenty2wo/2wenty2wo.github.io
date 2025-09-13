import Iconify from './icons.js';

window.labelApp = function labelApp() {
  return {
    tab: 'screw',
    system: 'metric',
    screwType: 'bolt',
    headType: 'hex',
    thread: 'M3',
    length: '20',
    standard: 'DIN 912',
    standardRef: true,
    image: true,
    qrCode: false,
    labelWidth: 55,
    labelHeight: 12,
    headOptions: {
      hex: 'Hex',
      torx: 'Torx',
      'torx-sec': 'Security Torx',
      button: 'Button Head',
      countersunk: 'Countersunk',
      cap: 'Cap Head'
    },
    headStandards: {
      hex: 'DIN 912',
      torx: 'DIN 7985',
      'torx-sec': 'DIN 7985 Security',
      button: 'DIN 7380',
      countersunk: 'DIN 7991',
      cap: 'DIN 912'
    },
    iconMap: {
      hex: 'screw-head:hex',
      torx: 'screw-head:torx',
      'torx-sec': 'screw-head:torx_sec',
      button: 'screw-head:button',
      countersunk: 'screw-head:countersunk',
      cap: 'screw-head:cap'
    },
    metricSizes: ['M1','M2','M2.5','M3','M4','M5','M6','M8','M10'],
    imperialSizes: ['#4','#6','#8','#10','#12','1/4"','5/16"','3/8"'],
    lengths: ['5','10','15','20','25','30','35','40'],
    get sizes() { return this.system === 'metric' ? this.metricSizes : this.imperialSizes; },
    get canDownload() { return this.thread && this.length && (!this.standardRef || this.standard); },
    previewText() {
      let text = `${this.thread} × ${this.length}`;
      if (this.standardRef && this.standard) text += ` ${this.standard}`;
      return text;
    },
    svgContent() {
      const mmToPx = 3.7795;
      const W = this.labelWidth * mmToPx;
      const H = this.labelHeight * mmToPx;
      const iconEl = this.image ? Iconify.renderSVG(this.iconMap[this.headType], {height: 12}) : null;
      if (iconEl) {
        iconEl.setAttribute('x', '2');
        iconEl.setAttribute('y', (H/2 - 6).toString());
      }
      const icon = iconEl ? iconEl.outerHTML : '';
      const textX = this.image ? 18 : 4;
      const mainText = `${this.thread} × ${this.length}`;
      const refText = this.standardRef ? this.standard : '';
      const qr = this.qrCode ? `<rect x='${W-14}' y='2' width='12' height='12' fill='none' stroke='black' stroke-width='1' />` : '';
      return `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}' viewBox='0 0 ${W} ${H}'>
            <rect width='100%' height='100%' rx='4' fill='#FFE500' stroke='#000' />
            ${icon}
            ${qr}
            <text x='${textX}' y='${H/2}' dominant-baseline='middle' font-size='${H*0.6}' font-family='sans-serif' font-weight='700'>${mainText}</text>
            <text x='${textX}' y='${H-2}' font-size='${H*0.3}' font-family='sans-serif'>${refText}</text>
          </svg>`;
    },
    download() {
      if (!this.canDownload) return;
      const blob = new Blob([this.svgContent()], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.thread}_${this.length}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };
};
