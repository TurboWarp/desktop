const path = require('path');
const {app} = require('electron');
const BaseWindow = require('./base');
const {translate, getStrings, getLocale} = require('../l10n');
const settings = require('../settings');

class MigrateWindow extends BaseWindow {
  static LATEST_VERSION = 2;

  constructor () {
    super();

    this.promise = new Promise((resolve) => {
      this.resolveCallback = resolve;
    });

    const ipc = this.window.webContents.ipc;

    ipc.on('get-strings', (event) => {
      event.returnValue = {
        locale: getLocale(),
        strings: getStrings()
      };
    });

    ipc.handle('done', async () => {
      settings.dataVersion = MigrateWindow.LATEST_VERSION;
      await settings.save();
      this.resolveCallback();

      // destroy() to skip close event listener
      this.window.destroy();
    });

    this.window.on('close', () => {
      // If migration is closed mid-process, don't let the app continue
      app.quit();
    });

    this.window.setTitle(translate('migrate.title'));
    this.window.webContents.setBackgroundThrottling(false);
    this.window.loadFile(path.join(__dirname, '../../src-renderer/migrate/migrate.html'));
    this.show();
  }

  getDimensions () {
    return {
      width: 450,
      height: 400
    };
  }

  getPreload () {
    return 'migrate';
  }

  getBackgroundColor () {
    return '#333333';
  }

  static run () {
    const window = new MigrateWindow();
    return window.promise;
  }
}

module.exports = MigrateWindow;
