const {session} = require('electron');
const settings = require('./settings');
const MigrateWindow = require('./windows/migrate');

const migrate = async () => {
  if (settings.migrated) {
    return;
  }

  // Detect fresh installs
  const cacheSize = await session.defaultSession.getCacheSize();
  if (cacheSize === 0) {
    settings.migrated = true;
    await settings.save();
    return;
  }

  return MigrateWindow.run();
};

module.exports = migrate;
