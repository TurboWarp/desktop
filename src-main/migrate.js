const {app, dialog} = require('electron');
const fs = require('fs');
const path = require('path');
const settings = require('./settings');
const MigrateWindow = require('./windows/migrate');
const {APP_NAME} = require('./brand');
const {translate} = require('./l10n');
const safelyOpenExternal = require('./open-external');

// Avoid running migrate logic on fresh installs when we can. Not required, just helps
// user experience. This must run before the ready event.
const isFirstLaunch = (
  settings.dataVersion !== MigrateWindow.LATEST_VERSION &&
  // Electron will always create the Cache directory in userData after the ready event,
  // so if it doesn't exist yet, this is probably a fresh install.
  !fs.existsSync(path.join(app.getPath('userData'), 'Cache'))
);

const migrate = async () => {
  if (settings.dataVersion > MigrateWindow.LATEST_VERSION) {
    const result = dialog.showMessageBoxSync({
      type: 'error',
      title: APP_NAME,
      message: translate('migrate-future.message')
        .replace('{APP_NAME}', APP_NAME)
        .replace('{website}', 'desktop.turbowarp.org')
        .replace('{debugInfo}', `${MigrateWindow.LATEST_VERSION} < ${settings.dataVersion}`),
      buttons: [
        translate('migrate-future.exit'),
        translate('migrate-future.continue-anyways')
      ],
      cancelId: 0,
      defaultId: 0
    });
    if (result === 0) {
      safelyOpenExternal('https://desktop.turbowarp.org/');
      app.exit(1);
    } else {
      // Hope for the best!
      settings.dataVersion = MigrateWindow.LATEST_VERSION;
      await settings.save();
      return;
    }
  }

  if (settings.dataVersion === MigrateWindow.LATEST_VERSION) {
    return;
  }

  // Don't need to migrate anything on a fresh install
  if (isFirstLaunch) {
    settings.dataVersion = MigrateWindow.LATEST_VERSION;
    await settings.save();
    return;
  }

  return MigrateWindow.run();
};

module.exports = migrate;
