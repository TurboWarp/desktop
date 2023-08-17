const {shell} = require('electron');

const safelyOpenExternal = url => {
  const parsed = new URL(url);
  const ALLOWED_PROTOCOLS = [
    'http:',
    'https:',
    'mailto:'
  ];
  if (ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    return shell.openExternal(parsed.protocol);
  }
};

module.exports = safelyOpenExternal;
