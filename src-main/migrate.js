const {session} = require('electron');
const settings = require('./settings');
const MigrateWindow = require('./windows/migrate');

const migrate = async () => {
  if (settings.dataVersion === MigrateWindow.LATEST_VERSION) {
    return;
  }

  // Don't need to migrate anything on a fresh install
  const cacheSize = await session.defaultSession.getCacheSize();
  if (cacheSize === 0) {
    settings.dataVersion = MigrateWindow.LATEST_VERSION;
    await settings.save();
    return;
  }

  return MigrateWindow.run();
};

module.exports = migrate;
