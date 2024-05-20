const {app, dialog, BrowserWindow} = require('electron');
const {translate} = require('./l10n');
const {APP_NAME} = require('./brand');
const AbstractWindow = require('./windows/abstract');

const showCrashMessage = (window, type, code, reason) => {
  // non-technical users won't know what "OOM" means but may be able to understand
  // what "out of memory" means
  if (reason === 'oom') {
    reason = 'out of memory';
  }

  dialog.showMessageBoxSync(window, {
    title: APP_NAME,
    type: 'error',
    message: translate('crash.title'),
    detail: translate('crash.description')
      .replace('{type}', type)
      .replace('{code}', code)
      .replace('{reason}', reason),
    noLink: true
  });
};

app.on('render-process-gone', (event, webContents, details) => {
  const abstractWindow = AbstractWindow.getWindowByWebContents(webContents);
  const handled = (
    abstractWindow &&
    abstractWindow.handleRendererProcessGone(details)
  );
  if (!handled) {
    const browserWindow = BrowserWindow.fromWebContents(webContents);
    showCrashMessage(browserWindow, 'Renderer', details.exitCode, details.reason);
  }
});

app.on('child-process-gone', (event, details) => {
  showCrashMessage(null, details.type, details.exitCode, details.reason);
});
