'use strict'

import { app, BrowserWindow, Menu } from 'electron'
import * as path from 'path'
import { format as formatUrl } from 'url'
import { version } from '../../package.json';

const isDevelopment = process.env.NODE_ENV !== 'production';

const isMac = process.platform === 'darwin';

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow;

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    title: `TurboWarp Desktop v${version}`,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegration: true
    }
  })

  if (isDevelopment) {
    window.webContents.openDevTools()
  }

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
  } else {
    window.loadURL(formatUrl({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true
    }))
  }

  window.on('close', (e) => {
    const choice = require('electron').dialog.showMessageBoxSync(window, {
      type: 'question',
      buttons: ['Yes', 'No'],
      title: 'Confirm',
      message: 'Are you sure you want to quit?'
    })
    if (choice === 1) {
      e.preventDefault();
    }
  })

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.on('devtools-opened', () => {
    window.focus()
    setImmediate(() => {
      window.focus()
    })
  })

  window.setMenu(Menu.buildFromTemplate([
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
            click: async () => {
              const { shell } = require('electron')
              await shell.openExternal('https://desktop.turbowarp.org/')
            }
          }
        ]
      }
    ]
  ));

  window.webContents.on('new-window', (e, url) => {
    e.preventDefault();
    require('electron').shell.openExternal(url);
  })

  return window
}

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) {
    mainWindow = createMainWindow()
  }
})

app.on('ready', () => {
  mainWindow = createMainWindow()
})
