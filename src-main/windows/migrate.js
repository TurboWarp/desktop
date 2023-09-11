const path = require('path');
const {app, dialog} = require('electron');
const BaseWindow = require('./base');
const {translate, getStrings, getLocale} = require('../l10n');
const settings = require('../settings');
const {APP_NAME} = require('../brand');

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
      await this.done();
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

  async done () {
    settings.dataVersion = MigrateWindow.LATEST_VERSION;
    await settings.save();
    this.resolveCallback();

    // destroy() to skip close event listener
    this.window.destroy();
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

  handleRendererProcessGone (details) {
    const EMAIL = 'contact@turbowarp.org';
    const button = dialog.showMessageBoxSync(this.window, {
      type: 'error',
      title: APP_NAME,
      message: `${translate('migrate.renderer-gone')} ${EMAIL}`
        .replace('{code}', details.exitCode)
        .replace('{reason}', details.reason),
      buttons: [
        translate('migrate.continue-anyways'),
        translate('migrate.exit')
      ],
      cancelId: 1,
      defaultId: 0
    });

    if (button === 0) {
      this.done();
    } else {
      app.exit(1);
    }

    // We dealt with the crash, no need to show another message
    return true;
  }

  static run () {
    const window = new MigrateWindow();
    return window.promise;
  }
}

module.exports = MigrateWindow;
