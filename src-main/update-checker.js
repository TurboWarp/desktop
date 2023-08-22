const semverLt = require('semver/functions/lt');
const semverSatisfies = require('semver/functions/satisfies');
const settings = require('./settings');
const UpdateWindow = require('./windows/update');
const packageJSON = require('../package.json');
const privilegedFetchAsBuffer = require('./fetch');

const currentVersion = packageJSON.version;
const URL = 'https://desktop.turbowarp.org/version.json';

const isEnabledAtBuildTime = () => packageJSON.tw_update === 'yes';

const checkForUpdates = async () => {
  if (!isEnabledAtBuildTime() || settings.updateChecker === 'never') {
    return;
  }

  const jsonBuffer = await privilegedFetchAsBuffer(URL);
  const json = JSON.parse(jsonBuffer.toString());
  const latestVersion = json.latest;
  const yanked = json.yanked;

  // Security updates can not be ignored.
  if (semverSatisfies(currentVersion, yanked)) {
    UpdateWindow.updateAvailable(currentVersion, latestVersion, true);
    return;
  }

  if (settings.updateChecker === 'security') {
    // Nothing further to check
    return;
  }

  const now = Date.now();
  const ignoredUpdate = settings.ignoredUpdate;
  const ignoredUpdateUntil = settings.ignoredUpdateUntil * 1000;
  if (ignoredUpdate === latestVersion && now < ignoredUpdateUntil) {
    // This update was ignored
    return;
  }

  if (semverLt(currentVersion, latestVersion)) {
    UpdateWindow.updateAvailable(currentVersion, latestVersion, false);
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
  isEnabledAtBuildTime,
  checkForUpdates,
  ignoreUpdate
};
