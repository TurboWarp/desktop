const BaseWindow = require('./base');
const {APP_NAME} = require('../brand');
const {translate, getLocale, getStrings} = require('../l10n');

/**
 * @fileoverview This file just has the logic for the window that asks the user to
 * allow/deny permissions from the project, it doesn't do the actual enforcing.
 */

class SecurityPromptWindow extends BaseWindow {
  /**
   * @param {Electron.BrowserWindow} projectWindow
   * @param {string} type
   * @param {string|null} data
   */
  constructor (projectWindow, type, data) {
    super({
      parentWindow: projectWindow
    });

    /** @type {Promise<boolean>} */
    this.promptPromise = new Promise((resolve) => {
      this.promptResolve = resolve;
    });

    const ipc = this.window.webContents.ipc;

    ipc.on('init', (event) => {
      event.returnValue = {
        type,
        data,
        APP_NAME,
        locale: getLocale(),
        strings: getStrings()
      };
    });

    ipc.handle('ready', (event, options) => {
      const contentHeight = +options.height;

      const [minWidth, minHeight] = this.window.getMinimumSize();
      if (contentHeight < minHeight) {
        this.window.setMinimumSize(minWidth, contentHeight);
      }
      this.window.setContentSize(this.getDimensions().width, contentHeight, false);

      this.show();
    });

    ipc.handle('done', (event, allowed) => {
      this.promptResolve(!!allowed);

      // destroy() won't run the close event
      this.window.destroy();
    });

    this.window.on('close', () => {
      this.promptResolve(false);
    });

    this.window.setTitle(`${translate('security-prompt.title')} - ${APP_NAME}`);
    this.loadURL('tw-security-prompt://./security-prompt.html');
  }

  getDimensions () {
    return {
      width: 440,
      height: 320
    };
  }

  getPreload () {
    return 'security-prompt';
  }

  isPopup () {
    return true;
  }

  done () {
    return this.promptPromise;
  }

  static canFetch (window, url) {
    return new SecurityPromptWindow(window, 'fetch', url).done();
  }

  static canOpenWindow (window, url) {
    return new SecurityPromptWindow(window, 'open-window', url).done();
  }

  static canEmbedURL (window, url) {
    return new SecurityPromptWindow(window, 'embed-url', url).done();
  }

  static canEmbedHTML (window, url) {
    return new SecurityPromptWindow(window, 'embed-html', url).done();
  }

  static canReadClipboard (window) {
    return new SecurityPromptWindow(window, 'read-clipboard', null).done();
  }

  static canNotify (window) {
    return new SecurityPromptWindow(window, 'notify', null).done();
  }
}

module.exports = SecurityPromptWindow;
