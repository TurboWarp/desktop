const {app, crashReporter, dialog, BrowserWindow} = require('electron');
const {translate} = require('./l10n');
const {APP_NAME} = require('./brand');
const settings = require('./settings');
const openExternal = require('./open-external');
const AbstractWindow = require('./windows/abstract');
const DesktopSettingsWindow = require('./windows/desktop-settings');

const DOCS_URL = 'https://docs.turbowarp.org/desktop/crash-reports';

// This can only be controlled before the ready event, so we're stuck with it once we launch.
const isCollectingCrashLogs = settings.crashDumps === 'local';
if (isCollectingCrashLogs) {
  crashReporter.start({
    uploadToServer: false
  });
}

const showCrashMessage = (window, type, code, reason) => {
  // non-technical users won't know what "OOM" means but may be able to understand
  // what "out of memory" means
  if (reason === 'oom') {
    reason = 'out of memory';
  }

  const crashDetail = translate('crash.description')
    .replace('{type}', type)
    .replace('{code}', code)
    .replace('{reason}', reason);

  if (isCollectingCrashLogs) {
    const clicked = dialog.showMessageBoxSync(window, {
      title: APP_NAME,
      type: 'error',
      message: translate('crash.title'),
      detail: `${crashDetail}\n\n${translate('crash.reporting-enabled')}`,
      buttons: [
        translate('prompt.ok'),
        translate('crash.learn-more')
      ],
      defaultId: 0,
      cancelId: 0,
      noLink: true
    });

    if (clicked === 1) {
      openExternal(DOCS_URL);
    }
  } else {
    const clicked = dialog.showMessageBoxSync(window, {
      title: APP_NAME,
      type: 'error',
      message: translate('crash.title'),
      detail: `${crashDetail}\n\n${translate('crash.reporting-disabled')}`,
      buttons: [
        translate('prompt.ok'),
        translate('crash.open-desktop-settings'),
        translate('crash.learn-more')
      ],
      defaultId: 0,
      cancelId: 0,
      noLink: true
    });

    if (clicked === 1) {
      DesktopSettingsWindow.show();
    } else if (clicked === 2) {
      openExternal(DOCS_URL);
    }
  }
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
