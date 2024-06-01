const settings = require('./settings');
const UpdateWindow = require('./windows/update');
const packageJSON = require('../package.json');
const privilegedFetch = require('./fetch');

const currentVersion = packageJSON.version;
const URL = 'https://desktop.turbowarp.org/version.json';

/**
 * Determines whether the update checker is even allowed to be enabled
 * in this build of the app.
 * @returns {boolean}
 */
const isUpdateCheckerAllowed = () => {
  if (process.env.TW_DISABLE_UPDATE_CHECKER) {
    return false;
  }

  // Must be enabled in package.json
  return !!packageJSON.tw_update;
};

const checkForUpdates = async () => {
  if (!isUpdateCheckerAllowed() || settings.updateChecker === 'never') {
    return;
  }

  const json = await privilegedFetch.json(URL);
  const latestStable = json.latest;
  const latestUnstable = json.latest_unstable;
  const oldestSafe = json.oldest_safe;

  // Imported lazily as it takes about 10ms to import
  const semverLt = require('semver/functions/lt');

  // Security updates can not be ignored.
  if (semverLt(currentVersion, oldestSafe)) {
    UpdateWindow.updateAvailable(currentVersion, latestStable, true);
    return;
  }

  if (settings.updateChecker === 'security') {
    // Nothing further to check
    return;
  }

  const latest = settings.updateChecker === 'unstable' ? latestUnstable : latestStable;
  const now = Date.now();
  const ignoredUpdate = settings.ignoredUpdate;
  const ignoredUpdateUntil = settings.ignoredUpdateUntil * 1000;
  if (ignoredUpdate === latest && now < ignoredUpdateUntil) {
    // This update was ignored
    return;
  }

  if (semverLt(currentVersion, latest)) {
    UpdateWindow.updateAvailable(currentVersion, latest, false);
  }
};

/**
 * @param {string} version
 * @param {Date} until
 */
const ignoreUpdate = async (version, until) => {
  settings.ignoredUpdate = version;
  settings.ignoredUpdateUntil = Math.floor(until.getTime() / 1000);
  await settings.save();
};

module.exports = {
  isUpdateCheckerAllowed,
  checkForUpdates,
  ignoreUpdate
};
