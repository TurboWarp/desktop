import { ipcMain, dialog, BrowserWindow } from 'electron';
import { APP_NAME } from './brand';
import { getTranslation } from './translations';

ipcMain.on('packager-moved', (e) => {
  const window = BrowserWindow.fromWebContents(e.sender);
  dialog.showMessageBox(window, {
    title: APP_NAME,
    message: getTranslation('packager-moved.title'),
    detail: getTranslation('packager-moved.details')
  });
});
