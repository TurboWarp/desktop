'use strict'

import {app, BrowserWindow, Menu, ipcMain, shell, dialog} from 'electron'
import * as pathUtil from 'path'
import {format as formatUrl} from 'url'
import {version} from '../../package.json';
import checkForUpdate from './update-checker';

const isDevelopment = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';
const isWindows = process.platform === 'win32';

const editorWindows = new Set();
const editorWindowTitle = `TurboWarp Desktop v${version}`;
let fileToOpen = null;

let aboutWindow = null;
let settingsWindow = null;

Menu.setApplicationMenu(Menu.buildFromTemplate([
  ...(isMac ? [{ role: 'appMenu' }] : []),
  { role: 'fileMenu' },
  { role: 'editMenu' },
  { role: 'viewMenu' },
  { role: 'windowMenu' },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn more',
        click: () => shell.openExternal('https://desktop.turbowarp.org/')
      }
    ]
  }
]));

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
  const window = new BrowserWindow({
    autoHideMenuBar: true,
    ...options
  });

  window.loadURL(url);

  window.webContents.on('new-window', (e, url) => {
    e.preventDefault();
    shell.openExternal(url);
  });

  return window;
}

function createEditorWindow() {
  // Note: the route for this must be `editor`, otherwise the dev tools keyboard shortcuts will not work.
  let url = getURL('editor');
  if (fileToOpen !== null) {
    url += `&file=${encodeURIComponent(fileToOpen)}`;
    fileToOpen = null;
  }

  const window = createWindow(url, {
    title: editorWindowTitle,
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegration: true
    }
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
  });

  editorWindows.add(window);

  return window;
}

function createAboutWindow() {
  const window = createWindow(getURL('about'), {
    title: 'About',
    width: 700,
    height: 450,
    parent: BrowserWindow.getFocusedWindow(),
    minimizable: false,
    maximizable: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true
    }
  });

  window.on('closed', () => {
    aboutWindow = null;
  });

  return window;
}

function createSettingsWindow() {
  const window = createWindow(getURL('settings'), {
    title: 'Addon Settings',
    width: 700,
    height: 450,
    parent: BrowserWindow.getFocusedWindow(),
    minimizable: false,
    maximizable: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true
    }
  });

  window.on('closed', () => {
    settingsWindow = null;
  });

  return window;
}

ipcMain.on('about', () => {
  if (aboutWindow === null) {
    aboutWindow = createAboutWindow();
  }
  aboutWindow.focus();
});

ipcMain.on('addon-settings', () => {
  if (settingsWindow === null) {
    settingsWindow = createSettingsWindow();
  }
  settingsWindow.focus();
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

// On windows, parse argv to figure out which file to open.
if (isWindows) {
  // argv in production: ["turbowarp.exe", "..."]
  // argv in dev: ["electron.exe", "--inspect=", "main.js", "..."] (--inspect will be gone after removing arguments)
  const argv = process.argv.slice().filter((i) => !i.startsWith('--'));
  if (isDevelopment) {
    argv.shift();
    argv.shift();
  } else {
    argv.shift();
  }
  if (argv[0]) {
    fileToOpen = argv[0];
  }
}

// TODO: figure out what to do for linux, probably just use the windows logic?

app.on('activate', () => {
  if (editorWindows.size === 0) {
    createEditorWindow();
  }
});

app.on('ready', () => {
  checkForUpdate();
  createEditorWindow();
});
