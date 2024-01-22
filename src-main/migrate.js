const {app, dialog} = require('electron');
const fs = require('fs');
const path = require('path');
const settings = require('./settings');
const MigrateWindow = require('./windows/migrate');
const {APP_NAME} = require('./brand');
const {translate} = require('./l10n');
const safelyOpenExternal = require('./open-external');
const packageJSON = require('../package.json');

// Avoid running migrate logic on fresh installs when we can. Not required, just helps
// user experience. This must run before the ready event.
const isFirstLaunch = (
  settings.dataVersion !== MigrateWindow.LATEST_VERSION &&
  // Electron will always create the Cache directory in userData after the ready event,
  // so if it doesn't exist yet, this is probably a fresh install.
  !fs.existsSync(path.join(app.getPath('userData'), 'Cache'))
);

const desktopVersion = packageJSON.version;
const electronVersion = process.versions.electron;

const writeCurrentVersion = async () => {
  settings.dataVersion = MigrateWindow.LATEST_VERSION;
  settings.desktopVersion = desktopVersion;
  settings.electronVersion = electronVersion;
  await settings.save();
};

const migrate = async () => {
  // On first launch, just mark migrations as done, we don't need to do anything else.
  if (isFirstLaunch) {
    await writeCurrentVersion();
    return;
  }

  // If we are using the same version as before, we don't need to do anything.
  if (
    settings.dataVersion === MigrateWindow.LATEST_VERSION &&
    settings.desktopVersion === desktopVersion &&
    settings.electronVersion === electronVersion
  ) {
    return;
  }

  // Imported lazily as it takes about 10ms to import
  const semverLt = require('semver/functions/lt');

  if (
    settings.dataVersion > MigrateWindow.LATEST_VERSION ||
    semverLt(desktopVersion, settings.desktopVersion) ||
    semverLt(electronVersion, settings.electronVersion)
  ) {
    // Something was downgraded. This is not something we officially support.
    const changes = [];
    if (settings.dataVersion !== MigrateWindow.LATEST_VERSION) {
      changes.push(`S ${settings.dataVersion} -> ${MigrateWindow.LATEST_VERSION}`);
    }
    if (settings.desktopVersion !== desktopVersion) {
      changes.push(`D ${settings.desktopVersion} -> ${desktopVersion}`);
    }
    if (settings.electronVersion !== electronVersion) {
      changes.push(`E ${settings.electronVersion} -> ${electronVersion}`);
    }

    const result = dialog.showMessageBoxSync({
      type: 'error',
      title: APP_NAME,
      message: translate('downgrade-warning.title'),
      detail: translate('downgrade-warning.message')
        .replace('{APP_NAME}', APP_NAME)
        .replace('{website}', 'desktop.turbowarp.org')
        .replace('{debugInfo}', changes.join(', ')),
      buttons: [
        translate('downgrade-warning.exit'),
        translate('downgrade-warning.continue-anyways')
      ],
      cancelId: 0,
      defaultId: 0
    });

    if (result === 0) {
      safelyOpenExternal('https://desktop.turbowarp.org/');
      app.exit(1);
    }
  }

  if (settings.dataVersion < MigrateWindow.LATEST_VERSION) {
    await MigrateWindow.run(writeCurrentVersion);
  } else {
    await writeCurrentVersion();
  }
};

module.exports = migrate;
