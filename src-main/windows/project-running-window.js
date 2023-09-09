const fs = require('fs');
const path = require('path')
const {promisify} = require('util');
const BaseWindow = require('./base');
const settings = require('../settings');
const askForMediaAccess = require('../media-permissions');

const readdir = promisify(fs.readdir);

const listLocalFiles = async () => {
  const files = await readdir(path.join(__dirname, '../../dist-library-files/'));
  return files.map(filename => filename.replace('.br', ''));
};

let cached = null;
const listLocalFilesCached = () => {
  if (!cached) {
    cached = listLocalFiles()
      .catch((error) => {
        console.error(error);
        return [];
      });
  }
  return cached;
};

class ProjectRunningWindow extends BaseWindow {
  constructor (...args) {
    super(...args);

    this.window.webContents.on('did-create-window', (newWindow) => {
      new DataWindow(this.window, newWindow);
    });
  }

  handlePermissionCheck (permission, details) {
    return (
      // Autoplay audio and media device enumeration
      permission === 'media' ||

      // Entering fullscreen with enhanced fullscreen addon
      permission === 'window-placement' ||

      // Notifications extension
      permission === 'notifications' ||

      // Custom fonts menu
      permission === 'local-fonts'
    );
  }

  async handlePermissionRequest (permission, details) {
    // Attempting to record video or audio
    if (permission === 'media') {
      // mediaTypes is not guaranteed to exist
      const mediaTypes = details.mediaTypes || [];
      for (const mediaType of mediaTypes) {
        const hasPermission = await askForMediaAccess(this.window, mediaType);
        if (!hasPermission) {
          return false;
        }
      }
      return true;
    }

    return (
      // Enhanced fullscreen addon
      permission === 'fullscreen' ||

      // Pointerlock extension and experiment
      permission === 'pointerLock' ||

      // Notifications extension
      permission === 'notifications' ||

      // Clipboard extension
      permission === 'clipboard-sanitized-write' ||
      permission === 'clipboard-read'
    );
  }

  onBeforeRequest (details, callback) {
    const parsed = new URL(details.url);

    if (parsed.origin === 'https://cdn.assets.scratch.mit.edu' || parsed.origin === 'https://assets.scratch.mit.edu') {
      const match = parsed.href.match(/[0-9a-f]{32}\.\w{3}/i);
      if (match) {
        const md5ext = match[0];
        return listLocalFilesCached().then((localLibraryFiles) => {
          if (localLibraryFiles.includes(md5ext)) {
            return callback({
              redirectURL: `tw-library://./${md5ext}`
            });
          }
          callback({});
        });
      }
    }

    if (parsed.origin === 'https://extensions.turbowarp.org') {
      return callback({
        redirectURL: `tw-extensions://./${parsed.pathname}`
      });
    }

    super.onBeforeRequest(details, callback);
  }

  onHeadersReceived (details, callback) {
    if (settings.bypassCORS) {
      const newHeaders = {
        'access-control-allow-origin': '*',
      };
      for (const key of Object.keys(details.responseHeaders)) {
        // Headers from Electron are not normalized, so we have to make sure to remove uppercased
        // variations on our own.
        const normalized = key.toLowerCase();
        if (normalized !== 'access-control-allow-origin' && normalized !== 'x-frame-options') {
          newHeaders[key] = details.responseHeaders[key];
        }
      }

      return callback({
        responseHeaders: newHeaders
      });
    }

    super.onHeadersReceived(details, callback);
  }
}

module.exports = ProjectRunningWindow;
