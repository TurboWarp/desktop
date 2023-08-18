const {shell} = require('electron');

const safelyOpenExternal = url => {
  try {
    const parsed = new URL(url);
    const ALLOWED_PROTOCOLS = [
      'http:',
      'https:',
    ];
    if (ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return shell.openExternal(parsed.protocol);
    }
  } catch (e) {
    // ignore
  }
};

module.exports = safelyOpenExternal;