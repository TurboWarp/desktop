const {app} = require('electron');

// requestSingleInstanceLock() crashes the app in signed MAS builds
// https://github.com/electron/electron/issues/15958
if (!process.mas && !app.requestSingleInstanceLock()) {
  app.exit();
}

const path = require('path');
const AbstractWindow = require('./windows/abstract');
const EditorWindow = require('./windows/editor');
const {checkForUpdates} = require('./update-checker');
const {tranlateOrNull} = require('./l10n');
const migrate = require('./migrate');
const settings = require('./settings');
require('./protocols');
require('./context-menu');
require('./menu-bar');
require('./crash-messages');

app.enableSandbox();

// Allows certain versions of Scratch Link to work without an internet connection
// https://github.com/LLK/scratch-desktop/blob/4b462212a8e406b15bcf549f8523645602b46064/src/main/index.js#L45
app.commandLine.appendSwitch('host-resolver-rules', 'MAP device-manager.scratch.mit.edu 127.0.0.1');

if (!settings.hardwareAcceleration) {
  app.disableHardwareAcceleration();

  // SwiftShader is Chromium's software WebGL fallback. Starting in Chrome 139,
  // it is disabled by default. Enabling SwiftShader is required for the editor
  // to work without hardware acceleration, so adding this flag will be
  // required. Google considers this dangerous, so only add the flag when it is
  // needed.
  // https://github.com/TurboWarp/desktop/issues/1158
  // https://chromestatus.com/feature/5166674414927872
  // https://chromium.googlesource.com/chromium/src/+/main/docs/gpu/swiftshader.md
  app.commandLine.appendSwitch('enable-unsafe-swiftshader');
}

app.on('session-created', (session) => {
  // Permission requests are delegated to AbstractWindow

  session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (!details.isMainFrame) {
      return false;
    }
    const window = AbstractWindow.getWindowByWebContents(webContents);
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
    const window = AbstractWindow.getWindowByWebContents(webContents);
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
    const window = AbstractWindow.getWindowByWebContents(webContents);
    if (!webContents || !window) {
      // Background requests for things like loading service workers in iframes
      // are not associated with a specific webcontents, so we'll just have to
      // allow these to avoid breakage.
      return callback({});
    }

    window.onBeforeRequest(details, callback);
  });

  session.webRequest.onHeadersReceived((details, callback) => {
    const window = AbstractWindow.getWindowByWebContents(details.webContents);
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
  // For safety reasons, we add these listeners here so that they apply to any web contents,
  // even ones that somehow got created without an associated one of our AbstractWindows
  // also being created.

  webContents.on('will-navigate', (event, url) => {
    const window = AbstractWindow.getWindowByWebContents(webContents);
    if (window) {
      window.handleWillNavigate(event, url);
    } else {
      // Unknown web contents; give minimal possible permissions.
      event.preventDefault();
    }
  });

  webContents.setWindowOpenHandler((details) => {
    const window = AbstractWindow.getWindowByWebContents(webContents);
    if (window) {
      return window.handleWindowOpen(details);
    }
    // Unknown web contents; give minimal possible permissions.
    return {
      action: 'deny'
    };
  });

  // We don't use Electron's webview, so disable it entirely as an extra layer of security.
  webContents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });
});

app.on('window-all-closed', () => {
  if (!isMigrating) {
    app.quit();
  }
});

// macOS
app.on('activate', () => {
  if (app.isReady() && !isMigrating && AbstractWindow.getWindowsByClass(EditorWindow).length === 0) {
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

/**
 * @param {string[]} argv
 * @returns {{files: string[]; fullscreen: boolean;}}
 */
const parseCommandLine = (argv) => {
  // argv could be any of:
  // turbowarp.exe project.sb3
  // electron.exe --inspect=sdf main.js project.sb3
  // electron.exe main.js project.sb3

  const files = argv
    // Remove --inspect= and other flags
    .filter((i) => !i.startsWith('--'))
    // Ignore macOS process serial number argument eg. "-psn_0_98328"
    // https://github.com/TurboWarp/desktop/issues/939
    .filter((i) => !i.startsWith('-psn_'))
    // Remove turbowarp.exe, electron.exe, etc. and the path to the app if it exists
    // defaultApp is true when the path to the app is in argv
    .slice(process.defaultApp ? 2 : 1);

  const fullscreen = argv.includes('--fullscreen');

  return {
    files,
    fullscreen
  };
};

let isMigrating = true;
let migratePromise = null;

app.on('second-instance', (event, argv, workingDirectory) => {
  migratePromise.then(() => {
    const commandLineOptions = parseCommandLine(argv);
    EditorWindow.openFiles(commandLineOptions.files, commandLineOptions.fullscreen, workingDirectory);
  });
});

app.whenReady().then(() => {
  AbstractWindow.settingsChanged();

  migratePromise = migrate().then((shouldContinue) => {
    if (!shouldContinue) {
      // If we use exit() instead of quit() then openExternal() calls made before the app quits
      // won't work on Windows.
      app.quit();
      return;
    }

    isMigrating = false;

    const commandLineOptions = parseCommandLine(process.argv);
    EditorWindow.openFiles([
      ...filesQueuedToOpen,
      ...commandLineOptions.files
    ], commandLineOptions.fullscreen, process.cwd());

    if (AbstractWindow.getAllWindows().length === 0) {
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
