import {app, dialog, shell} from 'electron';
import {isMac} from './environment';
import {getTranslation} from './translations';

// For now, we'll ignore Windows on ARM because we don't have ARM builds for Windows.
if (isMac && app.runningUnderARM64Translation) {
  app.whenReady().then(async () => {
    const result = await dialog.showMessageBox({
      type: 'warning',
      message: getTranslation('rosetta.title'),
      detail: getTranslation('rosetta.details'),
      buttons: [
        getTranslation('rosetta.ignore'),
        getTranslation('rosetta.download')
      ],
      cancelId: 0,
      defaultId: 1
    });
    if (result.response === 1) {
      shell.openExternal('https://desktop.turbowarp.org/');
    }
  });
}
