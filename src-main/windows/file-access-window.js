const fsPromises = require('fs/promises');
const {getPlatform} = require('../platform');
const AbstractWindow = require('./abstract');
const {translate, getLocale, getStrings} = require('../l10n');
const {APP_NAME} = require('../brand');

/**
 * @param {string} path
 * @returns {Promise<boolean>}
 */
const missingFileAccess = async (path) => {
  try {
    await fsPromises.stat(path);
  } catch (e) {
    if (e.code === 'ENOENT') {
      return true;
    }
  }
  return false;
};

class FileAccessWindow extends AbstractWindow {
  constructor () {
    super();

    /** @type {string[]} */
    this.paths = [];

    /** @type {boolean} */
    this.ready = false;

    const ipc = this.window.webContents.ipc;

    ipc.on('init', (e) => {
      this.ready = true;

      e.returnValue = {
        locale: getLocale(),
        strings: getStrings(),
        APP_NAME,
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
