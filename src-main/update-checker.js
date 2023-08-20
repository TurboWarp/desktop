const https = require('https');
const semverLt = require('semver/functions/lt');
const semverSatisfies = require('semver/functions/satisfies');
const settings = require('./settings');
const UpdateWindow = require('./windows/update');
const packageJSON = require('../package.json');

const currentVersion = packageJSON.version;
const URL = 'https://desktop.turbowarp.org/version.json';

const fetchVersionJSON = () => new Promise((resolve, reject) => {
  const request = https.request(URL);

  request.on('response', (response) => {
    const statusCode = response.statusCode;
    if (statusCode !== 200) {
      reject(new Error(`Unexpected status code: ${statusCode}`))
      return;
    }

    let data = '';
    response.on('data', (chunk) => {
      data += chunk.toString();
    });

    response.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(new Error('Could not parse'));
      }
    })
  });

  request.on('error', (e) => {
    reject(e);
  });

  request.end();
});

const checkForUpdates = async () => {
  if (settings.updateChecker === 'never') {
    return;
  }

  const json = await fetchVersionJSON();
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
  checkForUpdates,
  ignoreUpdate
};
