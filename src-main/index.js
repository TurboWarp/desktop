const {app} = require('electron');
const path = require('path');
require('./protocols');
const EditorWindow = require('./windows/editor');
const openExternal = require('./open-external');

if (!app.requestSingleInstanceLock()) {
  app.exit();
}

app.enableSandbox();

app.on('session-created', (session) => {
  session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    return (
      // Allow AudioContexts to autoplay
      permission === 'media'
    );
  });
});

app.on('web-contents-created', (_event, webContents) => {
  webContents.on('will-navigate', (event, url) => {
    event.preventDefault();
    openExternal(event.url);
  });

  webContents.setWindowOpenHandler((event) => {
    openExternal(event.url);
    return {
      action: 'deny'
    };
  });
});

app.on('activate', () => {
  if (app.isReady()) {
    // TODO
  }
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
