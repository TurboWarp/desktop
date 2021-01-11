import {net, dialog, shell, BrowserWindow} from 'electron';
import lt from 'semver/functions/lt';
import {version} from '../../package.json';
import {get, set} from './store';

// Flags for debugging.
// Please make sure these are both `false` in release.
const FORCE_URGENT_UPDATE = false;
const FORCE_UPDATE = false;

const IGNORE_UPDATE_KEY = 'ignore_update';

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
          resolve({
            latest: parsedData.latest,
            oldestSafe: parsedData.oldest_safe
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
    return;
  }

  const choice = await dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
    type: 'info',
    buttons: [
      'Download Update',
      'Remind me later'
    ],
    cancelId: 1,
    message: `An update is available: v${latestVersion}`,
    detail: 'This update may contain new features or bug fixes.',
    checkboxLabel: 'Don\'t remind me again for this update',
    checkboxChecked: false
  });

  if (choice.response === 0) {
    shell.openExternal(getUpdateURL(currentVersion, latestVersion));
  } else if (choice.checkboxChecked) {
    set(IGNORE_UPDATE_KEY, latestVersion);
  }
}

function urgentUpdateAvailable(latestVersion) {
  const choice = dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
    type: 'warning',
    buttons: [
      'Download update',
      'Not now'
    ],
    cancelId: 1,
    message: `An important security update is available: v${latestVersion}`,
    detail: 'This version of TurboWarp may be vulnerable to an exploit that puts your computer at risk of infection. Updating is highly recommended.'
  });

  if (choice === 0) {
    shell.openExternal(getUpdateURL(version, latestVersion));
  }
}

function checkForUpdate() {
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
