const fsPromises = require('fs/promises');
const path = require('path')
const AbtractWindow = require('./abstract');
const settings = require('../settings');
const askForMediaAccess = require('../media-permissions');
const SecurityPromptWindow = require('./security-prompt');

const listLocalFiles = async () => {
  const files = await fsPromises.readdir(path.join(__dirname, '../../dist-library-files/'));
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

class ProjectRunningWindow extends AbtractWindow {
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
      return SecurityPromptWindow.requestReadClipboard(this.window);
    }

    // Notifications extension
    if (permission === 'notifications') {
      return SecurityPromptWindow.requestNotifications(this.window);
    }

    return (
      // Enhanced fullscreen addon
      permission === 'fullscreen' ||

      // Pointerlock extension and experiment
      permission === 'pointerLock' ||

      // Clipboard extension
      // Writing is safer than reading
      permission === 'clipboard-sanitized-write' ||

      // Wake Lock extension
      permission === 'screen-wake-lock'
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

        if (
          // Above we forced this header to be *, so ignore any other value
          normalized === 'access-control-allow-origin' ||
          // Remove x-frame-options so that embedding is allowed
          normalized === 'x-frame-options'
        ) {
          // Ignore header.
        } else if (
          normalized === 'content-security-policy' ||
          // We include the report-only header so that we send fewer useless reports
          normalized === 'content-security-policy-report-only'
        ) {
          // Seems to be an Electron quirk where CSP with custom protocols can't do specific
          // origins, only an entire protocol. We use a lot of separate protocols so that's fine.
          // It is possible for protocol to be null, so handle that.
          const extraSources = this.protocol ? this.protocol : null;

          if (extraSources) {
            // If the page has a frame-ancestors directive, add ourselves to it so that we can embed
            // the page without compromising security more than absolutely necessary.
            // frame-ancestors does not fall back to default-src so we don't need to worry about that.
            // Regex based on ABNF from https://www.w3.org/TR/CSP3/#grammardef-serialized-policy
            newHeaders[key] = details.responseHeaders[key].map(csp => (
              csp.replace(
                /((?:;[\x09\x0A\x0C\x0D\x20]*)?frame-ancestors[\x09\x0A\x0C\x0D\x20]+)([^;,]+)/ig,
                (_, directiveName, directiveValue) => `${directiveName}${directiveValue} ${extraSources}`
              )
            ));
          }
        } else {
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
