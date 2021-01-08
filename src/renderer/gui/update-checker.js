const {remote} = require('electron');
const dialog = remote.dialog;

const currentVersion = require('../../../package.json').version + 'a';

fetch('https://desktop.turbowarp.org/latest.txt')
  .then((res) => {
    if (res.status !== 200) {
      throw new Error('Unexpected status code');
    }
    return res.text();
  })
  .then(async (latestVersion) => {
    if (latestVersion.trim() !== currentVersion.trim()) {
      const choice = await dialog.showMessageBox({
        type: 'info',
        buttons: [
          'Download Update',
          'Later'
        ],
        message: 'An update is available',
        detail: 'Updating is highly recommended as TurboWarp Desktop is in a very early state.'
      });
      if (choice.response === 0) {
        require('electron').shell.openExternal('https://desktop.turbowarp.org');
      }
    }
  })
  .catch((err) => {
    console.error('cannot check for update', err);
  });
