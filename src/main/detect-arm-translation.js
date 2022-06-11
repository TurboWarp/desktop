import {app, dialog} from 'electron';
import {isMac} from './environment';
import {getTranslation} from './translations';

// For now, we'll ignore Windows on ARM because we don't have ARM builds for Windows.
if (isMac && app.runningUnderARM64Translation) {
  app.whenReady().then(async () => {
    await dialog.showMessageBox({
      type: 'warning',
      message: getTranslation('rosetta.title'),
      detail: getTranslation('rosetta.details'),
      buttons: [
        getTranslation('rosetta.ignore')
      ]
    });
  });
}
