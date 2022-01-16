import {app, dialog, BrowserWindow} from 'electron';
import {getTranslation} from './translations';

app.on('render-process-gone', (event, webContents, details) => {
  const window = BrowserWindow.fromWebContents(webContents);
  dialog.showMessageBoxSync(window, {
    message: getTranslation('crash.renderer')
      .replace('{code}', details.exitCode)
      .replace('{reason}', details.reason)
  });
});
