const {app} = require('electron');
const path = require('path');

if (!app.requestSingleInstanceLock()) {
  app.exit();
}

const openExternal = require('./open-external');
const BaseWindow = require('./windows/base');
const EditorWindow = require('./windows/editor');
const checkForUpdates = require('./updates');
require('./protocols');
require('./context-menu');
require('./shortcuts');
require('./menu-bar');
require('./crash-messages');

app.enableSandbox();

app.on('session-created', (session) => {
  // Permission requests are delegated to BaseWindow

  session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    console.log('check', permission);
    if (!details.isMainFrame) {
      return false;
    }
    const window = BaseWindow.getWindowByWebContents(webContents);
    if (!window) {
      return false;
    }
    return window.handlePermissionCheck(permission, details);
  });

  session.setPermissionRequestHandler((webContents, permission, callback, details) => {
    console.log('request', permission);
    if (!details.isMainFrame) {
      callback(false);
      return;
    }
    const window = BaseWindow.getWindowByWebContents(webContents);
    if (!window) {
      callback(false);
      return;
    }
    window.handlePermissionRequest(permission, details).then((allowed) => {
      callback(allowed);
    });
  });

  session.webRequest.onBeforeRequest((details, callback) => {
    const url = details.url.toLowerCase();
    // Always allow devtools
    if (url.startsWith('devtools:')) {
      return callback({});
    }

    const webContents = details.webContents;
    const window = BaseWindow.getWindowByWebContents(webContents);
    if (!webContents || !window) {
      return callback({
        cancel: true
      });
    }

    window.onBeforeRequest(details, callback);
  });

  session.webRequest.onHeadersReceived((details, callback) => {
    const window = BaseWindow.getWindowByWebContents(details.webContents);
    if (!window) {
      return callback({});
    }
    window.onHeadersReceived(details, callback);
  });
});

app.on('web-contents-created', (event, webContents) => {
  webContents.on('will-navigate', (event, url) => {
    // Only allow windows to refresh
    if (webContents.getURL() !== url) {
      event.preventDefault();
      openExternal(event.url);
    }
  });

  // Overwritten by BaseWindow. We just set this here as a safety measure.
  webContents.setWindowOpenHandler((details) => ({
    action: 'deny'
  }));
});

// macOS
app.on('activate', () => {
  if (app.isReady() && BaseWindow.getWindowsByClass(EditorWindow).length === 0) {
    EditorWindow.openFiles([]);
  }
});

// macOS
app.on('open-file', (event, path) => {
  event.preventDefault();
  EditorWindow.openFiles([path]);
});

const parseFilesFromArgv = (argv, workingDirectory) => {
  // argv could be any of:
  // turbowarp.exe project.sb3
  // electron.exe --inspect=sdf main.js project.sb3
  // electron.exe main.js project.sb3

  // Remove --inspect= and other flags
  argv = argv.filter((i) => !i.startsWith('--'));

  // Remove turbowarp.exe, electron.exe, etc. and the path to the app if it exists
  // defaultApp is true when the path to the app is in argv
  argv = argv.slice(process.defaultApp ? 2 : 1);

  return argv.map(i => path.resolve(workingDirectory, i));
};

app.on('second-instance', (event, argv, workingDirectory) => {
  EditorWindow.openFiles(parseFilesFromArgv(argv, workingDirectory));
});

app.whenReady().then(() => {
  EditorWindow.openFiles(parseFilesFromArgv(process.argv, process.cwd()));
});
