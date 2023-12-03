const fsPromises = require('fs/promises');
const path = require('path')
const BaseWindow = require('./base');
const settings = require('../settings');
const askForMediaAccess = require('../media-permissions');
const SecurityPromptWindow = require('./security-prompt');

/**
 * @fileoverview Common logic shared between windows that run possibly untrusted projects.
 */

let _cachedLocalLibraryFiles = null;
const getLocalLibraryFiles = () => {
  if (!_cachedLocalLibraryFiles) {
    _cachedLocalLibraryFiles = fsPromises.readdir(path.join(__dirname, '../../dist-library-files/'))
      .then((files) => files.map(filename => filename.replace('.br', '')))
      .catch((error) => {
        console.error(error);
        return [];
      });
  }
  return _cachedLocalLibraryFiles;
};

class ProjectRunningWindow extends BaseWindow {
  constructor (...args) {
    super(...args);

    this.allowedReadClipboard = false;
    this.allowedNotifications = false;

    this._isPromptLocked = false;
    this._queuedPromptCallbacks = [];
  }

  handlePermissionCheck (permission, details) {
    return (
      // Autoplay audio and media device enumeration
      permission === 'media' ||

      // Entering fullscreen with enhanced fullscreen addon
      permission === 'window-placement' ||

      // Notifications extension
      // Actually displaying notifications also requires handlePermissionRequest check
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

    // Clipboard extension
    if (permission === 'clipboard-read') {
      if (!this.allowedReadClipboard) {
        const releaseLock = await this.acquirePromptLock();
        this.allowedReadClipboard = await SecurityPromptWindow.requestReadClipboard(this.window);
        releaseLock();
      }
      return this.allowedReadClipboard;
    }

    // Notifications extension
    if (permission === 'notifications') {
      if (!this.allowedNotifications) {
        const releaseLock = await this.acquirePromptLock();
        this.allowedNotifications = await SecurityPromptWindow.requestNotifications(this.window);
        releaseLock();
      }
      return this.allowedNotifications;
    }

    return (
      // Enhanced fullscreen addon
      permission === 'fullscreen' ||

      // Pointerlock extension and experiment
      permission === 'pointerLock' ||

      // Clipboard extension
      // Writing is safer than reading
      permission === 'clipboard-sanitized-write'
    );
  }

  onBeforeRequest (details, callback) {
    const parsed = new URL(details.url);

    // Redirect requests to asset library to local files.
    if (parsed.origin === 'https://cdn.assets.scratch.mit.edu' || parsed.origin === 'https://assets.scratch.mit.edu') {
      const match = parsed.href.match(/[0-9a-f]{32}\.\w{3}/i);
      if (match) {
        const md5ext = match[0];
        return getLocalLibraryFiles().then((localLibraryFiles) => {
          if (localLibraryFiles.includes(md5ext)) {
            return callback({
              redirectURL: `tw-library://./${md5ext}`
            });
          }
          callback({});
        });
      }
    }

    // Redirect requests to extension library to lcoal files.
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
        // Headers from Electron could be in any capitalization
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

  acquirePromptLock () {
    let released = false;

    const releaseLock = () => {
      if (released) {
        // Should never happen, but it's important we don't let this get into a bad state.
        throw new Error('releaseLock() called twice');
      }
      released = true;

      if (this._queuedPromptCallbacks.length === 0) {
        this._isPromptLocked = false;
      } else {
        const nextCallback = this._queuedPromptCallbacks.shift();
        nextCallback();
      }
    };

    return new Promise((resolve) => {
      if (this._isPromptLocked) {
        this._queuedPromptCallbacks.push(() => resolve(releaseLock));
      } else {
        this._isPromptLocked = true;
        resolve(releaseLock);
      }
    });
  }

  /**
   * @param {string} url
   * @returns {boolean}
   */
  static isAlwaysTrustedExtension (url) {
    try {
      const parsed = new URL(url);
      return (
        parsed.origin === 'https://extensions.turbowarp.org' ||
        parsed.origin === 'http://localhost:8000'
      );
    } catch (e) {
      return false;
    }
  }
}

module.exports = ProjectRunningWindow;
