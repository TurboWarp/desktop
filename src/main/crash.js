import {app, dialog, BrowserWindow} from 'electron';
import {getTranslation} from './translations';
import {APP_NAME} from './brand';

app.on('render-process-gone', (event, webContents, details) => {
  const window = BrowserWindow.fromWebContents(webContents);
  dialog.showMessageBoxSync(window, {
    type: 'error',
    title: APP_NAME,
    message: getTranslation('crash.title'),
    detail: getTranslation('crash.renderer')
      .replace('{code}', details.exitCode)
      .replace('{reason}', details.reason)
  });
});
