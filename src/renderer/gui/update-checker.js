const {ipcRenderer} = require('electron');
const currentVersion = require('../../../package.json').version;

fetch('https://desktop.turbowarp.org/latest.txt')
  .then((res) => {
    if (res.status !== 200) {
      throw new Error('Unexpected status code');
    }
    return res.text();
  })
  .then((latestVersion) => {
    if (latestVersion.trim() !== currentVersion.trim()) {
      ipcRenderer.send('update-available', currentVersion, latestVersion);
    }
  })
  .catch((err) => {
    console.error('cannot check for update', err);
  });
