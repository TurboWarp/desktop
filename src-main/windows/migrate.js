const path = require('path');
const BaseWindow = require('./base');
const {translate} = require('../l10n');
const settings = require('../settings');

class MigrateWindow extends BaseWindow {
  constructor () {
    super();

    this.promise = new Promise((resolve) => {
      this.resolveCallback = resolve;
    });

    const ipc = this.window.webContents.ipc;
    
    ipc.handle('set-microphone', async (event, microphone) => {
      settings.microphone = microphone;
      await settings.save();
    });

    ipc.handle('set-camera', async (event, camera) => {
      settings.camera = camera;
      await settings.save();
    });

    ipc.handle('done', async () => {
      settings.migrated = true;
      await settings.save();
      this.resolveCallback();
      this.window.close();
    });

    this.window.setTitle(translate('migrate.title'));
    this.window.webContents.setBackgroundThrottling(false);
    this.window.loadFile(path.join(__dirname, '../../src-renderer/migrate/migrate.html'));
    this.show();
  }

  getDimensions () {
    return [300, 300];
  }

  getPreload () {
    return 'migrate';
  }

  static run () {
    const window = new MigrateWindow();
    return window.promise;
  }
}

module.exports = MigrateWindow;
