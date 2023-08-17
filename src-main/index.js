const {app} = require('electron');
const EditorWindow = require('./windows/editor');
require('./protocols/index');

app.enableSandbox();

if (!app.requestSingleInstanceLock()) {
  process.exit(0);
}

app.on('session-created', (session) => {
  session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    return (
      // Allow AudioContexts to autoplay
      permission === 'media'
    );
  });
});

app.on('web-contents-created', (_event, webContents) => {
  webContents.on('will-naviate', (event, url) => {
    console.log('Denying navigate', url);
    event.preventDefault();
  });

  webContents.setWindowOpenHandler((event) => {
    console.log('Denying open window', event.url);
    return {
      action: 'deny'
    };
  });
});

// for (const path of parseArgs(process.argv)) {
//   filesToOpen.push(resolveFilePath('', path));
// }

// app.on('second-instance', (event, argv, workingDirectory) => {
//   for (const i of parseArgs(argv)) {
//     filesToOpen.push(resolveFilePath(workingDirectory, i));
//   }
//   autoCreateEditorWindows();
// });

app.on('activate', () => {
  if (app.isReady()) {
    console.log('Activate!');
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

app.on('second-instance', (event, argv) => {
  EditorWindow.openFiles(parseFilesFromArgv(argv));
});

app.whenReady().then(() => {
  EditorWindow.openFiles(parseFilesFromArgv(process.argv));
});
