import {net, dialog, shell, BrowserWindow} from 'electron';
import lt from 'semver/functions/lt';
import {version} from '../../package.json';
import {get, set} from './store';
import {getTranslation} from './translations';

// Flags for debugging.
// Please make sure these are both `false` in release.
const FORCE_URGENT_UPDATE = false;
const FORCE_UPDATE = false;

const IGNORE_UPDATE_KEY = 'ignore_update';
const CURRENT_VERSION_KEY = 'version';
const DISABLE_UPDATE_KEY = 'disable_update_checker';

function log(...args) {
  console.log('update checker:', ...args);
}

function getLatestVersions() {
  return new Promise((resolve, reject) => {
    const request = net.request('https://desktop.turbowarp.org/version.json');
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
          const parsedData = JSON.parse(data);
          const latest = parsedData.latest;
          const oldestSafe = parsedData.oldest_safe;
          log(`latest is ${latest}, oldest safe is ${oldestSafe}, current is ${version}`);
          resolve({
            latest,
            oldestSafe
          });
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
}

function getUpdateURL(current, latest) {
  return `https://desktop.turbowarp.org/update_available.html?from=${encodeURIComponent(current)}&to=${encodeURIComponent(latest)}`;
}

async function updateAvailable(latestVersion) {
  const ignoredUpdate = get(IGNORE_UPDATE_KEY);
  if (ignoredUpdate !== null && ignoredUpdate === latestVersion) {
    log('not showing update message: ignored by user');
    return;
  }

  const choice = await dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
    type: 'info',
    buttons: [
      getTranslation('tw.desktop.main.updater.download'),
      getTranslation('tw.desktop.main.updater.later')
    ],
    cancelId: 1,
    message: getTranslation('tw.desktop.main.updater.message').replace('{version}', latestVersion),
    detail: getTranslation('tw.desktop.main.updater.detail'),
    checkboxLabel: getTranslation('tw.desktop.main.updater.ignore'),
    checkboxChecked: false
  });

  if (choice.response === 0) {
    shell.openExternal(getUpdateURL(version, latestVersion));
  } else if (choice.checkboxChecked) {
    set(IGNORE_UPDATE_KEY, latestVersion);
  }
}

function urgentUpdateAvailable(latestVersion) {
  const choice = dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
    type: 'warning',
    buttons: [
      getTranslation('tw.desktop.main.updater.download'),
      getTranslation('tw.desktop.main.updater.later')
    ],
    cancelId: 1,
    message: getTranslation('tw.desktop.main.updater.security.message').replace('{version}', latestVersion),
    detail: getTranslation('tw.desktop.main.updater.security.detail')
  });

  if (choice === 0) {
    shell.openExternal(getUpdateURL(version, latestVersion));
  }
}

function checkForUpdate() {
  // Snap handles updates on its own
  if (process.env.SNAP) {
    return;
  }
  // Updates can be disabled via build-time or runtime environment variable
  if (process.env.TW_DISABLE_UPDATE_CHECKER) {
    return;
  }
  // Updates can be disabled via config
  if (get(DISABLE_UPDATE_KEY)) {
    return;
  }
  set(CURRENT_VERSION_KEY, version);
  getLatestVersions()
    .then(({latest, oldestSafe}) => {
      if (FORCE_URGENT_UPDATE || lt(version, oldestSafe)) {
        urgentUpdateAvailable(latest);
      } else if (FORCE_UPDATE || lt(version, latest)) {
        updateAvailable(latest);
      }
    })
    .catch((err) => {
      console.error(err);
    });
}

export default checkForUpdate;
