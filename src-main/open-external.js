const {shell} = require('electron');

const safelyOpenExternal = (url) => {
  try {
    const parsed = new URL(url);
    const ALLOWED_PROTOCOLS = [
      'http:',
      'https:',
      'mailto:'
    ];
    if (ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return shell.openExternal(url);
    }
  } catch (e) {
    // ignore
  }
};

module.exports = safelyOpenExternal;
