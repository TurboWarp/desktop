import {app, BrowserWindow, Menu, ipcMain, shell, dialog} from 'electron'
import pathUtil from 'path'
import fs from 'fs';
import writeFileAtomic from 'write-file-atomic';
import util from 'util';
import {format as formatUrl} from 'url'
import {version} from '../../package.json';
import checkForUpdate from './update-checker';
import setupContextMenu from './context-menu';
import getTranslation from './translations';

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const isDevelopment = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';
const isWindows = process.platform === 'win32';
const isLinux = process.platform === 'linux';

const editorWindows = new Set();
const editorWindowTitle = `TurboWarp Desktop ${version}`;
let fileToOpen = null;
let aboutWindow = null;
let settingsWindow = null;
let privacyWindow = null;

const allowedToAccessFiles = new Set();

if (isMac) {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { role: 'appMenu' },
    {
      role: 'fileMenu',
      submenu: [
        { role: 'quit' },
        {
          label: getTranslation('tw.desktop.main.menuBar.newWindow'),
          accelerator: 'Cmd+N',
          click: async () => {
            createEditorWindow();
          }
        }
      ]
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
    {
      role: 'help',
      submenu: [
        {
          label: getTranslation('tw.desktop.main.menuBar.learnMore'),
          click: () => shell.openExternal('https://desktop.turbowarp.org/')
        }
      ]
    }
  ]));
} else {
  Menu.setApplicationMenu(null);
}

function getURL(route) {
  if (isDevelopment) {
    return `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}/?route=${route}`;
  }
  return formatUrl({
    pathname: pathUtil.join(__dirname, 'index.html'),
    protocol: 'file',
    search: `route=${route}`,
    slashes: true
  });
}

function createWindow(url, options) {
  if (isLinux) {
    options.icon = pathUtil.join(__static, 'icon.png');
  }
  options.minWidth = 200;
  options.minHeight = 200;
  options.webPreferences = {
    contextIsolation: true,
    nodeIntegration: false,
    preload: pathUtil.resolve(__dirname, '../renderer/preload.js')
  };
  const window = new BrowserWindow(options);

  window.loadURL(url);

  if (!isMac) {
    // On Mac, shortcuts are handled by the menu bar.
    window.webContents.on('before-input-event', (e, input) => {
      if (input.isAutoRepeat || input.isComposing || input.type !== 'keyDown' || input.meta) {
        return;
      }
      // Ctrl+Shift+I to open dev tools
      if (
        input.control &&
        input.shift &&
        input.key.toLowerCase() === 'i' &&
        !input.alt
      ) {
        e.preventDefault();
        window.webContents.toggleDevTools();
      }
      // Ctrl+N to open new window
      if (
        input.control &&
        input.key.toLowerCase() === 'n'
      ) {
        e.preventDefault();
        createEditorWindow();
      }
      // Ctrl+R and Ctrl+Shift+R to reload
      if (
        input.control &&
        input.key.toLowerCase() === 'r'
      ) {
        e.preventDefault();
        if (input.shift) {
          window.webContents.reloadIgnoringCache();
        } else {
          window.webContents.reload();
        }
      }
    });
  }

  const webContents = window.webContents;
  setupContextMenu(webContents);

  return window;
}

function createEditorWindow() {
  // Note: the route for this must be `editor`, otherwise the dev tools keyboard shortcuts will not work.
  let url = getURL('editor');
  if (fileToOpen !== null) {
    url += `&file=${encodeURIComponent(fileToOpen)}`;
    allowedToAccessFiles.add(fileToOpen);
    fileToOpen = null;
  }

  const window = createWindow(url, {
    title: editorWindowTitle,
    width: 1280,
    height: 800
  });

  if (isDevelopment) {
    window.webContents.openDevTools();
  }

  window.on('page-title-updated', (event, title, explicitSet) => {
    event.preventDefault();
    if (explicitSet && title) {
      window.setTitle(`${title} - ${editorWindowTitle}`);
    } else {
      window.setTitle(editorWindowTitle);
    }
  });

  window.on('closed', () => {
    editorWindows.delete(window);
    if (editorWindows.size === 0) {
      if (aboutWindow) aboutWindow.close();
      if (settingsWindow) settingsWindow.close();
      if (privacyWindow) privacyWindow.close();
    }
  });

  window.webContents.on('will-prevent-unload', (e) => {
    const choice = dialog.showMessageBoxSync(window, {
      type: 'info',
      buttons: [
        getTranslation('tw.desktop.main.unload.stay'),
        getTranslation('tw.desktop.main.unload.leave')
      ],
      cancelId: 0,
      defaultId: 0,
      message: getTranslation('tw.desktop.main.unload.message'),
      detail: getTranslation('tw.desktop.main.unload.detail')
    });
    if (choice === 1) {
      e.preventDefault();
    }
  });

  editorWindows.add(window);

  return window;
}

function closeWhenPressEscape(window) {
  window.webContents.on('before-input-event', (e, input) => {
    if (
      input.type === 'keyDown' &&
      input.key === 'Escape' &&
      !input.control &&
      !input.alt &&
      !input.meta &&
      !input.isAutoRepeat &&
      !input.isComposing
    ) {
      window.close();
    }
  });
}

function createAboutWindow() {
  const window = createWindow(getURL('about'), {
    title: getTranslation('tw.desktop.main.windows.about'),
    width: 800,
    height: 450,
    parent: BrowserWindow.getFocusedWindow(),
    minimizable: false,
    maximizable: false
  });

  window.on('closed', () => {
    aboutWindow = null;
  });

  closeWhenPressEscape(window);

  return window;
}

function createSettingsWindow(locale) {
  const url = `${getURL('settings')}&locale=${locale}`;
  const window = createWindow(url, {
    title: getTranslation('tw.desktop.main.windows.addonSettings'),
    width: 700,
    height: 650
  });

  window.on('closed', () => {
    settingsWindow = null;
  });

  closeWhenPressEscape(window);

  return window;
}

function createPrivacyWindow() {
  const window = createWindow(getURL('privacy'), {
    title: getTranslation('tw.desktop.main.windows.privacy'),
    width: 600,
    height: 450,
    parent: BrowserWindow.getFocusedWindow(),
    minimizable: false,
    maximizable: false
  });

  window.on('closed', () => {
    privacyWindow = null;
  });

  closeWhenPressEscape(window);

  return window;
}

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), options);
  if (!result.canceled) {
    allowedToAccessFiles.add(result.filePath);
  }
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), options);
  if (!result.canceled) {
    const [filePath] = result.filePaths;
    allowedToAccessFiles.add(filePath);
  }
  return result;
});

ipcMain.handle('read-file', async (event, file) => {
  if (!allowedToAccessFiles.has(file)) {
    throw new Error('Not allowed to access file');
  }
  return await readFile(file);
});

ipcMain.handle('write-file', async (event, file, content) => {
  if (!allowedToAccessFiles.has(file)) {
    throw new Error('Not allowed to access file');
  }
  await writeFileAtomic(file, content);
});

ipcMain.on('open-about', () => {
  if (aboutWindow === null) {
    aboutWindow = createAboutWindow();
  }
  aboutWindow.show();
  aboutWindow.focus();
});

ipcMain.on('open-addon-settings', (event, {locale}) => {
  if (settingsWindow === null) {
    settingsWindow = createSettingsWindow(locale);
  }
  settingsWindow.show();
  settingsWindow.focus();
});

ipcMain.on('open-privacy-policy', () => {
  if (privacyWindow === null) {
    privacyWindow = createPrivacyWindow();
  }
  privacyWindow.show();
  privacyWindow.focus();
});

ipcMain.on('open-source-code', () => {
  shell.openExternal('https://github.com/TurboWarp');
});

ipcMain.on('export-addon-settings', async (event, settings) => {
  const result = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
    defaultPath: 'turbowarp-addon-setting.json',
    filters: [
      {
        name: 'JSON',
        extensions: ['json']
      }
    ]
  });
  if (result.canceled) {
    return;
  }

  // Sometimes the system file pickers are stupid.
  let path = result.filePath;
  if (!path.endsWith('.json')) {
    path += '.json';
  }

  await writeFile(path, JSON.stringify(settings));
});

ipcMain.on('addon-settings-changed', (event, newSettings) => {
  for (const window of editorWindows) {
    window.webContents.send('addon-settings-changed', newSettings);
  }
});

ipcMain.on('reload-all', () => {
  for (const window of editorWindows) {
    window.reload();
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

// Handle file opening on macOS
app.on('open-file', (event, path) => {
  event.preventDefault();
  fileToOpen = path;
  // This event can be emitted before we create the main window or while we're already running.
  if (editorWindows.size > 0) {
    createEditorWindow();
  }
});

app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (e, url) => {
    e.preventDefault();
    try {
      const parsedUrl = new URL(url);
      if (
        parsedUrl.origin === 'https://scratch.mit.edu' ||
        parsedUrl.origin === 'https://desktop.turbowarp.org' ||
        parsedUrl.origin === 'https://github.com'
      ) {
        shell.openExternal(url);
      }
    } catch (e) {
      console.error(e);
    }
  });
  contents.on('will-navigate', (e, url) => {
    if (url !== 'mailto:contact@turbowarp.org') {
      e.preventDefault();
    }
  });
});

function parseArgv(argv) {
  // argv in production: ["turbowarp.exe", "..."]
  // argv in dev: ["electron.exe", "--inspect=", "main.js", "..."] (--inspect will be gone after removing arguments)
  argv = argv.slice().filter((i) => !i.startsWith('--'));
  if (isDevelopment) {
    argv.shift();
    argv.shift();
  } else {
    argv.shift();
  }
  if (argv[0]) {
    return argv[0];
  }
  return null;
}

// On windows and linux, parse argv to figure out which file to open.
if (!isMac) {
  const parsedArgv = parseArgv(process.argv);
  if (parsedArgv) {
    fileToOpen = pathUtil.resolve(parsedArgv);
  }
}

const acquiredLock = app.requestSingleInstanceLock();
if (acquiredLock) {
  app.on('second-instance', (event, argv, workingDirectory) => {
    const parsedArgv = parseArgv(argv);
    if (parsedArgv) {
      fileToOpen = pathUtil.resolve(workingDirectory, parsedArgv);
    }
    createEditorWindow();
  });

  app.on('activate', () => {
    if (editorWindows.size === 0) {
      createEditorWindow();
    }
  });

  app.on('ready', () => {
    checkForUpdate();
    createEditorWindow();
  });
} else {
  app.quit();
}
