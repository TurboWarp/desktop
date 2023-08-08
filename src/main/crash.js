import {app, dialog, BrowserWindow, crashReporter} from 'electron';
import {getTranslation} from './translations';
import {APP_NAME} from './brand';

console.log('Crash dumps will be saved to', app.getPath('crashDumps'));
crashReporter.start({
  uploadToServer: false
});

const showCrashMessage = (window, type, code, reason) => {
  dialog.showMessageBoxSync(window, {
    type: 'error',
    title: APP_NAME,
    message: getTranslation('crash.title'),
    detail: getTranslation('crash.description')
      .replace('{type}', type)
      .replace('{code}', code)
      .replace('{reason}', reason)
  });
};

app.on('render-process-gone', (event, webContents, details) => {
  const window = BrowserWindow.fromWebContents(webContents);
  showCrashMessage(window, 'Renderer', details.exitCode, details.reason);
});

app.on('child-process-gone', (event, details) => {
  showCrashMessage(null, details.type, details.exitCode, details.reason);
});
