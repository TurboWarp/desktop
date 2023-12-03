const BaseWindow = require('./base');
const {getStrings, getLocale, translate} = require('../l10n');
const {APP_NAME} = require('../brand');

class AddCustomExtensionWindow extends BaseWindow {
  constructor (parentWindow) {
    super({
      parentWindow
    });

    /** @type {Promise<string|null>} */
    this.promise = new Promise((resolve) => {
      this.promiseResolve = resolve;
    });

    const ipc = this.window.webContents.ipc;

    ipc.on('get-info', (e) => {
      e.returnValue = {
        locale: getLocale(),
        strings: getStrings(),
        APP_NAME: APP_NAME
      };
    });

    ipc.handle('done', (e, url, forceUnsandboxed) => {
      this.promiseResolve(url);
      this.window.destroy();
    });

    this.window.on('close', () => {
      this.promiseResolve(null);
    });

    this.window.setTitle(translate('add-extension.title'));
    this.loadURL('tw-security-prompt://./add-custom-extension.html');
    this.show();
  }

  getPreload () {
    return 'add-custom-extension';
  }

  isPopup () {
    return true;
  }

  getDimensions () {
    return {
      width: 550,
      height: 360
    };
  }

  done () {
    return this.promise;
  }
}

module.exports = AddCustomExtensionWindow;
