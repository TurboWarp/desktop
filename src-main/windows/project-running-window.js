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
    this.manuallyTrustedFetchOrigins = new Set();

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
      return this.canReadClipboard();
    }

    // Notifications extension
    if (permission === 'notifications') {
      return this.canNotify();
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

  async onBeforeRequest (details, callback) {
    // TODO remove this later
    console.log(details.url, details.resourceType);

    const parsed = new URL(details.url);
    const resourceType = details.resourceType;

    if (resourceType === 'mainFrame') {
      callback({
        cancel: details.url !== this.initialURL
      });
      return;
    }

    if (resourceType === 'subFrame') {
      // TODO: canEmbed support
    }

    if (
      resourceType === 'stylesheet' ||
      resourceType === 'script' ||
      resourceType === 'image' ||
      resourceType === 'font' ||
      resourceType === 'xhr' ||
      resourceType === 'ping' ||
      resourceType === 'media' ||
      resourceType === 'webSocket'
    ) {
      // Redirect asset library to local files.
      if (parsed.origin === 'https://cdn.assets.scratch.mit.edu' || parsed.origin === 'https://assets.scratch.mit.edu') {
        const match = parsed.href.match(/[0-9a-f]{32}\.\w{3}/i);
        if (match) {
          const md5ext = match[0];
          getLocalLibraryFiles().then((localLibraryFiles) => {
            if (localLibraryFiles.includes(md5ext)) {
              return callback({
                redirectURL: `tw-library://./${md5ext}`
              });
            }
            callback({});
          });
          return;
        }
      }

      // Redirect extension library to local files.
      if (parsed.origin === 'https://extensions.turbowarp.org') {
        callback({
          redirectURL: `tw-extensions://./${parsed.pathname}`
        });
        return;
      }

      callback({
        cancel: !await this.canFetch(details.url)
      });
      return;
    }

    callback({
      cancel: true
    });
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

  /**
   * @param {() => boolean} isAllowed May be called repeatedly.
   * @param {() => Promise<void>} callback Should have side effects that change isAllowed()'s result if allowed.
   * @returns {Promise<boolean>}
   */
  async conditionalPromptLock (isAllowed, callback) {
    // If already allowed, don't wait for previous prompts to close.
    if (isAllowed()) {
      return true;
    }

    return this.withPromptLock(async () => {
      // In the time between withPromptLock() being called and us getting the lock, permission
      // could've been granted by a previous prompt.
      if (!isAllowed()) {
        await callback();
      }

      return isAllowed();
    });
  }

  /**
   * @template T
   * @param {() => Promise<T>} callback
   * @returns {Promise<T>}
   */
  async withPromptLock (callback) {
    // Wait for any previous prompt to finish.
    await new Promise((resolve) => {
      if (this._isPromptLocked) {
        this._queuedPromptCallbacks.push(resolve);
      } else {
        this._isPromptLocked = true;
        resolve();
      }
    });
    
    const result = await callback();

    // Run the next prompt, if any.
    if (this._queuedPromptCallbacks.length === 0) {
      this._isPromptLocked = false;
    } else {
      // The callbacks are promise resolve()s, so it won't actually run until the next microtask.
      const nextPromptCallback = this._queuedPromptCallbacks.shift();
      nextPromptCallback();
    }

    return result;
  }
  
  async canFetch (url) {
    // If we would trust loading an extension from here, we can trust loading resources too.
    if (ProjectRunningWindow.isAlwaysTrustedResource(url)) {
      return true;
    }

    try {
      const parsed = new URL(url);
      const parsedInitial = new URL(this.initialURL);

      // Loading the initial URL and adjacent resources must always be allowed.
      if (parsed.origin === parsedInitial.origin) {
        return true;
      }

      return this.conditionalPromptLock(
        () => this.manuallyTrustedFetchOrigins.has(parsed.origin),
        async () => {
          if (await SecurityPromptWindow.requestFetch(this.window, url)) {
            this.manuallyTrustedFetchOrigins.add(parsed.origin);
          }
        }
      );
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async canOpenWindow (url) {
    // TODO
  }

  async canRedirect (url) {
    // TODO
  }

  async canEmbed (url) {
    // TODO
  }

  async canReadClipboard () {
    return this.conditionalPromptLock(
      () => this.allowedReadClipboard,
      async () => {
        this.allowedReadClipboard = await SecurityPromptWindow.requestReadClipboard(this.window);
      }
    );
  }

  async canNotify () {
    return this.conditionalPromptLock(
      () => this.allowedNotifications,
      async () => {
        this.allowedNotifications = await SecurityPromptWindow.requestNotifications(this.window);
      }
    );
  }

  /**
   * @param {string} url
   * @returns {boolean}
   */
  static isAlwaysTrustedResource (url) {
    // If we would trust loading an extension from there, we can trust loading resources too.
    if (ProjectRunningWindow.isAlwaysTrustedExtension(url)) {
      return true;
    }

    try {
      const parsed = new URL(url);
      return (
        // Any TurboWarp service such as trampoline
        parsed.origin === 'https://turbowarp.org' ||
        parsed.origin.endsWith('.turbowarp.org') ||
        parsed.origin.endsWith('.turbowarp.xyz') ||

        // GitHub
        parsed.origin === 'https://raw.githubusercontent.com' ||
        parsed.origin === 'https://api.github.com' ||

        // GitLab
        parsed.origin === 'https://gitlab.com' ||

        // Itch
        parsed.origin.endsWith('.itch.io') ||

        // GameJolt
        parsed.origin === 'https://api.gamejolt.com' ||

        // httpbin
        parsed.origin === 'https://httpbin.org' ||

        // ScratchDB
        parsed.origin === 'https://scratchdb.lefty.one'
      );
    } catch (e) {
      console.error(e);
      return false;
    }
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
      console.error(e);
      return false;
    }
  }
}

module.exports = ProjectRunningWindow;
