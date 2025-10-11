const {app, dialog} = require('electron');
const fs = require('fs');
const path = require('path');
const settings = require('./settings');
const MigrateWindow = require('./windows/migrate');
const {APP_NAME} = require('./brand');
const {translate} = require('./l10n');
const openExternal = require('./open-external');
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

const openUpdatePage = () => {
  openExternal('https://desktop.turbowarp.org/');
};

/**
 * @returns {number}
 */
const getElectronMajorVersion = () => +process.versions.electron.split('.')[0];

/**
 * @returns {number}
 */
const getKernelMajorVersion = () => {
  // This is the only place that uses os, so try to load it lazily
  const os = require('os');
  return +os.release().split('.')[0];
};

/**
 * @returns {boolean} true if the app should continue to launch
 */
const migrate = async () => {
  // We have native ARM builds so people shouldn't use x86 to ARM translators
  if (app.runningUnderARM64Translation && dialog.showMessageBoxSync({
    title: APP_NAME,
    type: 'warning',
    message: translate('arm-translation.title'),
    detail: translate('arm-translation.message').replace('{APP_NAME}', APP_NAME),
    buttons: [
      translate('arm-translation.ok'),
      translate('arm-translation.ignore')
    ],
    cancelId: 0,
    defaultId: 0,
    noLink: true
  }) === 0) {
    openUpdatePage();
    return false;
  }

  // Ask people not to use legacy versions unnecessarily
  if (packageJSON.tw_warn_legacy && (
    // Legacy build for Windows before version 10 uses Electron 22
    // See https://en.wikipedia.org/wiki/Windows_NT#Releases for kernel versions
    (process.platform === 'win32' && getElectronMajorVersion() === 22 && getKernelMajorVersion() >= 10) ||

    // See https://en.wikipedia.org/wiki/Darwin_%28operating_system%29#Release_history for kernel versions
    (process.platform === 'darwin' && (
      // Legacy build for macOS 10.13 and 10.14 uses Electron 26
      (getElectronMajorVersion() === 26 && getKernelMajorVersion() >= 19) ||
      // Legacy build for macOS 10.15 uses Electron 32
      (getElectronMajorVersion() === 32 && getKernelMajorVersion() >= 20) ||
      // Legacy build for macOS 11 uses Electron 37
      (getElectronMajorVersion() === 37 && getKernelMajorVersion() >= 21)
    ))
  )) {
    const result = dialog.showMessageBoxSync({
      title: APP_NAME,
      type: 'warning',
      message: translate('unnecessary-legacy.title'),
      detail: translate('unnecessary-legacy.message').replace('{APP_NAME}', APP_NAME),
      buttons: [
        translate('unnecessary-legacy.ok'),
        translate('unnecessary-legacy.ignore'),
      ],
      cancelId: 0,
      defaultId: 0,
      noLink: true
    })
    if (result === 0) {
      openUpdatePage();
      return false;
    }
  }

  // On first launch, there is no data to migrate, so just save the current versions.
  if (isFirstLaunch) {
    await writeCurrentVersion();
    return true;
  }

  // If we are using the same version as before, we don't need to do anything.
  if (
    settings.dataVersion === MigrateWindow.LATEST_VERSION &&
    settings.desktopVersion === desktopVersion &&
    settings.electronVersion === electronVersion
  ) {
    return true;
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

    if (dialog.showMessageBoxSync({
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
      defaultId: 0,
      noLink: true
    }) === 0) {
      openUpdatePage();
      return false;
    }
  }

  if (settings.dataVersion < MigrateWindow.LATEST_VERSION) {
    await MigrateWindow.run(writeCurrentVersion);
  } else {
    await writeCurrentVersion();
  }

  return true;
};

module.exports = migrate;
