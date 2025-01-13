const fsPromises = require('fs/promises');
const pathUtil = require('path');
const {getPlatform} = require('../platform');
const AbstractWindow = require('./abstract');
const {translate, getLocale, getStrings} = require('../l10n');
const {APP_NAME} = require('../brand');

/**
 * @param {string} path
 * @returns {Promise<boolean>} Promise that resolves to true if access seems to be missing.
 */
const missingFileAccess = async (path) => {
  // Sanity check.
  if (!pathUtil.isAbsolute(path)) {
    return false;
  }

  try {
    await fsPromises.stat(path);
  } catch (e) {
    if (e.code === 'ENOENT') {
      return true;
    }
  }

  // We were able to access the file, or the stat failed for a reason other than it not existing.
  // Asking for more permission won't fix this.
  return false;
};

class FileAccessWindow extends AbstractWindow {
  constructor () {
    super();

    /** @type {string[]} */
    this.paths = [];

    /** @type {boolean} */
    this.ready = false;

    this.ipc.on('init', (e) => {
      this.ready = true;

      e.returnValue = {
        locale: getLocale(),
        strings: getStrings(),
        APP_NAME,
        FLATPAK_ID: process.env.FLATPAK_ID || '[No App ID]',
        initialPaths: this.paths,
      };
    });

    this.window.setTitle(`${translate('file-access.window-title')} - ${APP_NAME}`);
    this.window.setMinimizable(false);
    this.window.setMaximizable(false);
    this.loadURL('tw-file-access://./file-access.html');
  }

  getDimensions () {
    return {
      width: 600,
      height: 300
    };
  }

  getPreload () {
    return 'file-access';
  }

  isPopup () {
    return true;
  }

  /**
   * @param {string} path
   */
  addPath (path) {
    if (!this.paths.includes(path)) {
      this.paths.push(path);
      if (this.ready) {
        this.window.webContents.postMessage('new-path', path);
      }
    }
  }

  /**
   * @param {string} path
   */
  static async check (path) {
    // This window only does anything in the Flatpak build for Linux
    // https://github.com/electron/electron/issues/30650
    if (getPlatform() === 'linux-flatpak' && await missingFileAccess(path)) {
      const window = AbstractWindow.singleton(FileAccessWindow);
      window.addPath(path);
      window.show();
    }
  }
}

module.exports = FileAccessWindow;
