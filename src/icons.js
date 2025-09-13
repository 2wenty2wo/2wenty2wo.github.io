import Iconify from 'https://code.iconify.design/3/3.1.1/iconify.min.js';

Iconify.addCollection({
  prefix: 'screw-head',
  icons: {
    hex: { body: '<path d="M19 6.5l-7-4-7 4v7l7 4 7-4z"/>', width: 24, height: 24 },
    torx: { body: '<path d="M12 2l2.4 4.8 5.3.7-3.8 3.5 1 5.3-4.9-2.6-4.9 2.6 1-5.3-3.8-3.5 5.3-.7z"/>', width: 24, height: 24 },
    torx_sec: { body: '<path d="M12 2l2.4 4.8 5.3.7-3.8 3.5 1 5.3-4.9-2.6-4.9 2.6 1-5.3-3.8-3.5 5.3-.7z"/><circle cx="12" cy="12" r="2"/>', width: 24, height: 24 },
    button: { body: '<circle cx="12" cy="12" r="10"/>', width: 24, height: 24 },
    countersunk: { body: '<path d="M12 2L2 22h20z"/>', width: 24, height: 24 },
    cap: { body: '<circle cx="12" cy="12" r="10"/><path d="M19 6.5l-7-4-7 4v7l7 4 7-4z" fill="white"/>', width: 24, height: 24 }
  }
});

export default Iconify;
