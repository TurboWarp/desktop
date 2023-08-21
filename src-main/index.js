const {app, dialog} = require('electron');
const path = require('path');

if (!app.requestSingleInstanceLock()) {
  app.exit();
}

const openExternal = require('./open-external');
const BaseWindow = require('./windows/base');
const EditorWindow = require('./windows/editor');
const {checkForUpdates} = require('./update-checker');
const {translate, tranlateOrNull} = require('./l10n');
const migrate = require('./migrate');
const {APP_NAME} = require('./brand');
require('./protocols');
require('./context-menu');
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
    const allowed = window.handlePermissionCheck(permission, details);
    console.log('finish check', allowed);
    return allowed;
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
      console.log('finish request', permission, allowed);
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

  session.on('will-download', (event, item, webContents) => {
    const options = {
      // The default filename is a better title than "blob:..."
      title: item.getFilename()
    };

    // Ensure that the type selector shows proper names on Windows instead of things like "SPRITE3 File"
    const extension = path.extname(item.getFilename()).replace(/^\./, '').toLowerCase();
    const translated = tranlateOrNull(`files.${extension}`);
    if (translated !== null) {
      options.filters = [
        {
          name: translated,
          extensions: [extension]
        }
      ];
    }

    item.setSaveDialogOptions(options);
  });
});

app.on('web-contents-created', (event, webContents) => {
  webContents.on('will-navigate', (event, url) => {
    // Only allow windows to refresh, not navigate anywhere.
    const window = BaseWindow.getWindowByWebContents(webContents);
    if (!window || url !== window.initialURL) {
      event.preventDefault();
      openExternal(url);
    }
  });

  // Overwritten by BaseWindow. We just set this here as a safety measure.
  webContents.setWindowOpenHandler((details) => ({
    action: 'deny'
  }));
});

app.on('window-all-closed', () => {
  if (!isMigrating) {
    app.quit();
  }
});

// macOS
app.on('activate', () => {
  if (app.isReady() && !isMigrating && BaseWindow.getWindowsByClass(EditorWindow).length === 0) {
    EditorWindow.newWindow();
  }
});

// macOS
const filesQueuedToOpen = [];
app.on('open-file', (event, path) => {
  event.preventDefault();
  // This event can be called before ready.
  if (app.isReady() && !isMigrating) {
    // The path we get should already be absolute
    EditorWindow.openFiles([path], '');
  } else {
    filesQueuedToOpen.push(path);
  }
});

const parseFilesFromArgv = (argv) => {
  // argv could be any of:
  // turbowarp.exe project.sb3
  // electron.exe --inspect=sdf main.js project.sb3
  // electron.exe main.js project.sb3

  // Remove --inspect= and other flags
  argv = argv.filter((i) => !i.startsWith('--'));

  // Remove turbowarp.exe, electron.exe, etc. and the path to the app if it exists
  // defaultApp is true when the path to the app is in argv
  argv = argv.slice(process.defaultApp ? 2 : 1);

  return argv;
};

let isMigrating = true;
let migratePromise = null;

app.on('second-instance', (event, argv, workingDirectory) => {
  migratePromise.then(() => {
    EditorWindow.openFiles(parseFilesFromArgv(argv), workingDirectory);
  });
});

app.whenReady().then(() => {
  migratePromise = migrate().then(() => {
    isMigrating = false;

    if (app.runningUnderARM64Translation) {
      dialog.showMessageBox({
        title: APP_NAME,
        type: 'warning',
        message: translate('arm-translation.title'),
        detail: translate('arm-translation.detail').replace('{APP_NAME}', APP_NAME)
      });
    }

    EditorWindow.openFiles([
      ...filesQueuedToOpen,
      ...parseFilesFromArgv(process.argv)
    ], process.cwd());

    checkForUpdates();
  });
});
