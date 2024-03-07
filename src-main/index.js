const {app} = require('electron');

// requestSingleInstanceLock() crashes the app in signed MAS builds
// https://github.com/electron/electron/issues/15958
if (!process.mas && !app.requestSingleInstanceLock()) {
  app.exit();
}

const path = require('path');
const openExternal = require('./open-external');
const BaseWindow = require('./windows/base');
const EditorWindow = require('./windows/editor');
const {checkForUpdates} = require('./update-checker');
const {tranlateOrNull} = require('./l10n');
const migrate = require('./migrate');
const {getPlatform} = require('./platform');
require('./protocols');
require('./context-menu');
require('./menu-bar');
require('./crash-messages');

app.enableSandbox();

// Allows certain versions of Scratch Link to work without an internet connection
// https://github.com/LLK/scratch-desktop/blob/4b462212a8e406b15bcf549f8523645602b46064/src/main/index.js#L45
app.commandLine.appendSwitch('host-resolver-rules', 'MAP device-manager.scratch.mit.edu 127.0.0.1');

app.on('session-created', (session) => {
  // Permission requests are delegated to BaseWindow

  session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (!details.isMainFrame) {
      return false;
    }
    const window = BaseWindow.getWindowByWebContents(webContents);
    if (!window) {
      return false;
    }
    const allowed = window.handlePermissionCheck(permission, details);
    return allowed;
  });

  session.setPermissionRequestHandler((webContents, permission, callback, details) => {
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
      // Background requests for things like loading service workers in iframes
      // are not associated with a specific webcontents, so we'll just have to
      // allow these to avoid breakage.
      return callback({});
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

  // Ignore macOS process serial number argument eg. "-psn_0_98328"
  // https://github.com/TurboWarp/desktop/issues/939
  argv = argv.filter((i) => !i.startsWith('-psn_'));

  // Remove turbowarp.exe, electron.exe, etc. and the path to the app if it exists
  // defaultApp is true when the path to the app is in argv
  argv = argv.slice(process.defaultApp ? 2 : 1);

  // If we are given a file:// URL, remove the protocol prefix.
  // For example this happens in flatpak if we don't have access to a file.
  argv = argv.map(i => i.replace(/^file:\/\//i, ''));

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
  BaseWindow.settingsChanged();

  migratePromise = migrate().then((shouldContinue) => {
    if (!shouldContinue) {
      // If we use exit() instead of quit() then openExternal() calls made before the app quits
      // won't work on Windows.
      app.quit();
      return;
    }

    isMigrating = false;

    EditorWindow.openFiles([
      ...filesQueuedToOpen,
      ...parseFilesFromArgv(process.argv)
    ], process.cwd());

    if (BaseWindow.getAllWindows().length === 0) {
      // No windows were successfully opened. Let's just quit.
      app.quit();
    }

    checkForUpdates()
      .catch((error) => {
        // We don't want to show a full error message when updates couldn't be fetched.
        // The website might be down, the internet might be broken, might be a school
        // network that blocks turbowarp.org, etc.
        console.error('Error checking for updates:', error);
      });
  });
});
