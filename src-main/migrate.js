const {app} = require('electron');
const fs = require('fs');
const path = require('path');
const settings = require('./settings');
const MigrateWindow = require('./windows/migrate');

// Avoid running migrate logic on fresh installs when we can. Not required, just helps
// user experience. This must run before the ready event.
const isFirstLaunch = (
  settings.dataVersion !== MigrateWindow.LATEST_VERSION &&
  // Electron will always create the Cache directory in userData after the ready event,
  // so if it doesn't exist yet, this is probably a fresh install.
  !fs.existsSync(path.join(app.getPath('userData'), 'Cache'))
);

const migrate = async () => {
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
