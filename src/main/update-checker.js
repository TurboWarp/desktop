import {net, dialog, shell, BrowserWindow, ipcMain} from 'electron';
import lt from 'semver/functions/lt';
import {version} from '../../package.json';
import {APP_NAME} from './brand';
import {get, set} from './store';
import {getTranslation} from './translations';

const IGNORE_UPDATE_KEY = 'ignore_update';
const DISABLE_UPDATE_KEY = 'disable_update_checker';
const LAST_UPDATE_CHECK_KEY = 'last_update_check';

const log = (...args) => {
  console.log('update checker:', ...args);
};

const canUpdateCheckerBeEnabled = () => {
  if (process.env.TW_DISABLE_UPDATE_CHECKER) {
    return false;
  }
  // Note: This value is replaced at build-time
  return !!process.env.TW_ENABLE_UPDATE_CHECKER;
};

const isUpdateCheckerEnabled = () => {
  if (!canUpdateCheckerBeEnabled()) {
    return false;
  }
  if (get(DISABLE_UPDATE_KEY)) {
    return false;
  }
  return true;
};

const setUpdateCheckerEnabled = (enabled) => {
  set(DISABLE_UPDATE_KEY, !enabled);
};

ipcMain.on('update-checker/can-be-enabled', (event) => {
  event.returnValue = canUpdateCheckerBeEnabled();
});
ipcMain.on('update-checker/get-is-enabled', (event) => {
  event.returnValue = isUpdateCheckerEnabled();
});
ipcMain.handle('update-checker/set-is-enabled', (event, enabled) => {
  setUpdateCheckerEnabled(enabled);
});

const getLatestVersions = () => {
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
};

const getUpdateURL = (current, latest) => {
  return `https://desktop.turbowarp.org/update_available.html?from=${encodeURIComponent(current)}&to=${encodeURIComponent(latest)}`;
};

const updateAvailable = async (latestVersion) => {
  const ignoredUpdate = get(IGNORE_UPDATE_KEY);
  if (ignoredUpdate !== null && ignoredUpdate === latestVersion) {
    log('not showing update message: ignored by user');
    return;
  }

  const choice = await dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
    title: APP_NAME,
    type: 'info',
    buttons: [
      getTranslation('updater.download'),
      getTranslation('updater.later')
    ],
    cancelId: 1,
    message: getTranslation('updater.message').replace('{version}', latestVersion),
    detail: getTranslation('updater.detail'),
    checkboxLabel: getTranslation('updater.ignore'),
    checkboxChecked: false
  });

  if (choice.response === 0) {
    shell.openExternal(getUpdateURL(version, latestVersion));
  } else if (choice.checkboxChecked) {
    set(IGNORE_UPDATE_KEY, latestVersion);
  }
};

const urgentUpdateAvailable = (latestVersion) => {
  const choice = dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
    title: APP_NAME,
    type: 'warning',
    buttons: [
      getTranslation('updater.download'),
      getTranslation('updater.later')
    ],
    cancelId: 1,
    message: getTranslation('updater.security.message').replace('{version}', latestVersion),
    detail: getTranslation('updater.security.detail')
  });

  if (choice === 0) {
    shell.openExternal(getUpdateURL(version, latestVersion));
  }
};

const checkForUpdate = () => {
  if (!isUpdateCheckerEnabled()) {
    return;
  }

  // Limits how often we check for updates.
  // We do not want to make unnecessary requests to remote servers.
  const now = Date.now();
  const lastCheckedThreshold = now - 1000 * 60 * 60 * 6;
  const lastCheckedForUpdates = get(LAST_UPDATE_CHECK_KEY) || 0;
  if (lastCheckedForUpdates > lastCheckedThreshold) {
    log('checked for update too recently');
    return;
  }
  set(LAST_UPDATE_CHECK_KEY, now);
  log('checking for updates');

  getLatestVersions()
    .then(({latest, oldestSafe}) => {
      if (lt(version, oldestSafe)) {
        urgentUpdateAvailable(latest);
      } else if (lt(version, latest)) {
        updateAvailable(latest);
      }
    })
    .catch((err) => {
      console.error(err);
    });
};

export default checkForUpdate;
