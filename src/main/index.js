'use strict'

import {app, BrowserWindow, Menu, ipcMain, shell} from 'electron'
import * as pathUtil from 'path'
import {format as formatUrl} from 'url'
import {version} from '../../package.json';

const isDevelopment = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';

// Used to keep global references to windows so that they don't get garbage collected
const windows = {
  main: null,
  about: null
};

const mainWindowTitle = `TurboWarp Desktop v${version}`;

const menu = Menu.buildFromTemplate([
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
]);

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

function createWindow(title, width, height, route) {
  const window = new BrowserWindow({
    width,
    height,
    title,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegration: true
    }
  });

  window.setMenu(menu);
  window.loadURL(getURL(route));

  window.webContents.on('new-window', (e, url) => {
    e.preventDefault();
    shell.openExternal(url);
  });

  return window;
}

function createMainWindow() {
  // Note: the route for this must be `editor`, otherwise the dev tools keyboard shortcuts will not work.
  const window = createWindow(mainWindowTitle, 1280, 800, 'editor');

  if (isDevelopment) {
    window.webContents.openDevTools();
  }

  window.on('page-title-updated', (event, title, explicitSet) => {
    event.preventDefault();
    if (explicitSet && title) {
      window.setTitle(`${title} - ${mainWindowTitle}`);
    } else {
      window.setTitle(mainWindowTitle);
    }
  });

  window.on('close', (e) => {
    const choice = require('electron').dialog.showMessageBoxSync(window, {
      type: 'question',
      buttons: ['Yes', 'No'],
      title: 'Confirm',
      message: 'Are you sure you want to quit?'
    });
    if (choice === 1) {
      e.preventDefault();
    }
  });

  window.on('closed', () => {
    windows.main = null;
  });

  return window;
}

function createAboutWindow() {
  const window = createWindow('About', 700, 450, 'about');

  window.on('closed', () => {
    windows.about = null;
  });

  return window;
}

ipcMain.on('about', () => {
  if (windows.about === null) {
    windows.about = createAboutWindow();
  }
  windows.about.focus();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (windows.main === null) {
    windows.main = createMainWindow();
  }
});

app.on('ready', () => {
  windows.main = createMainWindow();
});
