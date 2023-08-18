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
      data = JSON.stringify({
        latest: '1.99.0-fake-version',
        yanked: '1.8.1'
      });

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
  if (settings.updateChecker === 'disabled') {
    return;
  }

  const json = await fetchVersionJSON();
  const latestVersion = json.latest;
  const yanked = json.yanked;

  if (semverSatisfies(currentVersion, yanked)) {
    UpdateWindow.updateAvailable(latestVersion, true);
    return;
  }

  if (settings.updateChecker === 'stable' && semverLt(currentVersion, latestVersion)) {
    UpdateWindow.updateAvailable(latestVersion, false);
  }
};

module.exports = checkForUpdates;
