import {ipcRenderer} from 'electron';
import {version} from '../../../package.json';

fetch('https://desktop.turbowarp.org/latest.txt')
  .then((res) => {
    if (res.status !== 200) {
      throw new Error('Unexpected status code');
    }
    return res.text();
  })
  .then((latestVersion) => {
    if (latestVersion.trim() !== version.trim()) {
      ipcRenderer.send('update-available', version, latestVersion);
    }
  })
  .catch((err) => {
    console.error('cannot check for update', err);
  });
