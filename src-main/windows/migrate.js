const path = require('path');
const {app, dialog} = require('electron');
const AbstractWindow = require('./abstract');
const {translate, getStrings, getLocale} = require('../l10n');
const settings = require('../settings');
const {APP_NAME} = require('../brand');

const EMAIL = 'contact@turbowarp.org';

class MigrateWindow extends AbstractWindow {
  static LATEST_VERSION = 3;

  /**
   * @param {() => Promise<void>} saveCallback
   */
  constructor (saveCallback) {
    super();

    const oldDataVersion = settings.dataVersion;

    this.saveCallback = saveCallback;

    this.promise = new Promise((resolve) => {
      this.resolveCallback = resolve;
    });

    this.ipc.on('get-info', (event) => {
      event.returnValue = {
        oldDataVersion,
        locale: getLocale(),
        strings: getStrings()
      };
    });

    this.ipc.handle('done', async () => {
      await this.done(true);
    });

    this.ipc.handle('continue-anyways', async () => {
      await this.done(false);
    });

    this.window.on('close', () => {
      // If migration is closed mid-process, don't let the app continue
      app.exit(1);
    });

    this.window.setTitle(translate('migrate.title'));
    this.window.webContents.setBackgroundThrottling(false);
    this.window.loadFile(path.join(__dirname, '../../src-renderer/migrate/migrate.html'));
    this.show();
  }

  async done (success) {
    if (!success) {
      dialog.showMessageBoxSync(this.window, {
        title: APP_NAME,
        type: 'warning',
        message: translate('migrate.continue-anyways-afterword')
          .replace('{email}', EMAIL)
      });
    }

    try {
      await this.saveCallback();
    } catch (error) {
      // If success === false, we are continuing anyways, so ignore this error.
      if (!success) {
        throw error;
      }
    }

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
      defaultId: 0,
      noLink: true
    });

    if (button === 0) {
      this.done(false);
    } else {
      app.exit(1);
    }

    // We dealt with the crash, no need to show another message
    return true;
  }

  static run (saveCallback) {
    const window = new MigrateWindow(saveCallback);
    return window.promise;
  }
}

module.exports = MigrateWindow;
