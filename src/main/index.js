import {app, BrowserWindow, Menu, ipcMain, shell, dialog, clipboard, screen, net} from 'electron'
import pathUtil from 'path'
import fs from 'fs';
import writeFileAtomic from 'write-file-atomic';
import util from 'util';
import {format as formatUrl} from 'url';
import manifest from '../../package.json';
import checkForUpdate from './update-checker';
import {getTranslation, getTranslationOrNull} from './translations';
import './advanced-user-customizations';
import * as store from './store';

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const isDevelopment = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';
const isWindows = process.platform === 'win32';
const isLinux = process.platform === 'linux';

const editorWindows = new Set();
const editorWindowTitle = `TurboWarp Desktop`;
const filesToOpen = [];

let aboutWindow = null;
let addonSettingsWindow = null;
let privacyWindow = null;
let desktopSettingsWindow = null;
const closeAllNonEditorWindows = () => [
  aboutWindow,
  addonSettingsWindow,
  privacyWindow,
  desktopSettingsWindow
].filter((i) => i).forEach((i) => i.close())

const allowedToAccessFiles = new Set();

const isSafeOpenExternal = (url) => {
  try {
    const parsedUrl = new URL(url);
    // Don't allow file:// or other unsafe protocols
    if (
      parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:'
    ) {
      return false;
    }
    // We want to be extra careful, so we'll also limit the domains
    // Not sure if this really does anything meaningful...
    if (
      parsedUrl.origin !== 'https://scratch.mit.edu' &&
      parsedUrl.origin !== 'https://desktop.turbowarp.org' &&
      parsedUrl.origin !== 'https://docs.turbowarp.org' &&
      parsedUrl.origin !== 'https://github.com' &&
      // Addons
      parsedUrl.href !== 'https://www.youtube.com/griffpatch' &&
      // Packager
      parsedUrl.origin !== 'https://experiments.turbowarp.org' &&
      parsedUrl.origin !== 'https://turbowarp.org' &&
      parsedUrl.origin !== 'https://fosshost.org'
    ) {
      return false;
    }
    return true;
  } catch (e) {
    // ignore
  }
  return false;
};

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
          click: () => {
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

const getWindowOptions = (options) => {
  if (isLinux) {
    options.icon = pathUtil.join(__static, 'icon.png');
  }
  options.useContentSize = true;
  options.minWidth = 200;
  options.minHeight = 200;
  options.webPreferences = {
    contextIsolation: true,
    nodeIntegration: false,
    nativeWindowOpen: true,
    preload: pathUtil.resolve(pathUtil.join(__dirname, 'preload.js'))
  };

  const activeScreen = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const bounds = activeScreen.workArea;

  options.width = Math.min(bounds.width, options.width);
  options.height = Math.min(bounds.height, options.height);

  options.x = bounds.x + ((bounds.width - options.width) / 2);
  options.y = bounds.y + ((bounds.height - options.height) / 2);
  return options;
};

const createWindow = (url, options) => {
  const window = new BrowserWindow(getWindowOptions(options));
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
      // Ctrl+Equals/Plus to zoom in
      if (
        input.control &&
        input.key === '='
      ) {
        e.preventDefault();
        window.webContents.setZoomLevel(window.webContents.getZoomLevel() + 1);
      }
      // Ctrl+Minus/Underscore to zoom out
      if (
        input.control &&
        input.key === '-'
      ) {
        e.preventDefault();
        window.webContents.setZoomLevel(window.webContents.getZoomLevel() - 1);
      }
      // Ctrl+0 to reset zoom
      if (
        input.control &&
        input.key === '0'
      ) {
        e.preventDefault();
        window.webContents.setZoomLevel(0);
      }
      // F11 to toggle fullscreen
      if (
        input.key === 'F11'
      ) {
        e.preventDefault();
        window.setFullScreen(!window.isFullScreen());
      }
      // Escape to exit fullscreen
      if (
        input.key === 'Escape' &&
        window.isFullScreen()
      ) {
        e.preventDefault();
        window.setFullScreen(false);
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

  return window;
}

function createEditorWindow() {
  // Note: the route for this must be `editor`, otherwise the dev tools keyboard shortcuts will not work.
  let url = getURL('editor');

  const fileToOpen = filesToOpen.shift();
  if (typeof fileToOpen !== 'undefined') {
    url += `&file=${encodeURIComponent(fileToOpen)}`;
    allowedToAccessFiles.add(fileToOpen);
  }

  const window = createWindow(url, {
    title: editorWindowTitle,
    width: 1280,
    height: 800
  });

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
      closeAllNonEditorWindows();
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

function autoCreateEditorWindows() {
  if (filesToOpen.length) {
    while (filesToOpen.length) {
      createEditorWindow();
    }
  } else {
    createEditorWindow();
  }
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
  if (!aboutWindow) {
    aboutWindow = createWindow(getURL('about'), {
      title: getTranslation('tw.desktop.about'),
      width: 800,
      height: 450,
      parent: BrowserWindow.getFocusedWindow(),
      minimizable: false,
      maximizable: false
    });
    aboutWindow.on('closed', () => {
      aboutWindow = null;
    });
    closeWhenPressEscape(aboutWindow);
  }
  aboutWindow.show();
  aboutWindow.focus();
}

function createAddonSettingsWindow() {
  if (!addonSettingsWindow) {
    addonSettingsWindow = createWindow(getURL('settings'), {
      // The window will update its title to be something localized
      title: 'Addon Settings',
      width: 700,
      height: 650
    });
    addonSettingsWindow.on('close', () => {
      addonSettingsWindow = null;
    });
    closeWhenPressEscape(addonSettingsWindow);
  }
  addonSettingsWindow.show();
  addonSettingsWindow.focus();
}

function createPrivacyWindow() {
  if (!privacyWindow) {
    privacyWindow = createWindow(getURL('privacy'), {
      title: getTranslation('tw.desktop.privacy'),
      width: 600,
      height: 450,
      parent: BrowserWindow.getFocusedWindow(),
      minimizable: false,
      maximizable: false
    });
    privacyWindow.on('closed', () => {
      privacyWindow = null;
    });
    closeWhenPressEscape(privacyWindow);
  }
  privacyWindow.show();
  privacyWindow.focus();
}

function createDesktopSettingsWindow() {
  if (!desktopSettingsWindow) {
    desktopSettingsWindow = createWindow(getURL('desktop-settings'), {
      title: getTranslation('tw.desktop.settings'),
      width: 500,
      height: 300
    });
    desktopSettingsWindow.on('closed', () => {
      desktopSettingsWindow = null;
    });
    closeWhenPressEscape(desktopSettingsWindow);
  }
  desktopSettingsWindow.show();
  desktopSettingsWindow.focus();
}

function createPackagerWindow() {
  const window = createWindow(getURL('packager'), {
    // title will be updated by window
    title: 'TurboWarp Packager for Scratch',
    width: 800,
    height: 700
  });
  window.webContents.on('did-finish-load', () => {
    readFile(pathUtil.resolve(__static, 'packager.html'))
      .then((contents) => window.webContents.send('loaded-html', contents))
      .catch((error) => {
        console.error(error);
        window.webContents.send('error-loading-html', '' + error);
      });
  });
}

const getLastAccessedDirectory = () => store.get('last_accessed_directory') || '';
const setLastAccessedFile = (filePath) => store.set('last_accessed_directory', pathUtil.dirname(filePath));

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(BrowserWindow.fromWebContents(event.sender), {
    filters: options.filters,
    defaultPath: pathUtil.join(getLastAccessedDirectory(), options.suggestedName)
  });
  if (!result.canceled) {
    const {filePath} = result;
    setLastAccessedFile(filePath);
    allowedToAccessFiles.add(filePath);
  }
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), {
    filters: options.filters,
    properties: ['openFile'],
    defaultPath: getLastAccessedDirectory()
  });
  if (!result.canceled) {
    const [filePath] = result.filePaths;
    setLastAccessedFile(filePath);
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

ipcMain.on('open-new-window', () => {
  createEditorWindow();
});

ipcMain.on('open-about', () => {
  createAboutWindow();
});

ipcMain.on('open-addon-settings', () => {
  createAddonSettingsWindow();
});

ipcMain.on('open-privacy-policy', () => {
  createPrivacyWindow()
});

ipcMain.on('open-desktop-settings', () => {
  createDesktopSettingsWindow();
});

ipcMain.on('open-packager', () => {
  createPackagerWindow();
});

ipcMain.on('open-source-code', () => {
  shell.openExternal('https://github.com/TurboWarp');
});

ipcMain.on('open-credits', () => {
  shell.openExternal('https://turbowarp.org/credits.html');
});

ipcMain.on('export-addon-settings', async (event, settings) => {
  const result = await dialog.showSaveDialog(BrowserWindow.fromWebContents(event.sender), {
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

  const path = result.filePath;
  await writeFile(path, JSON.stringify(settings));
});

ipcMain.on('addon-settings-changed', (event, newSettings) => {
  for (const window of editorWindows) {
    window.webContents.send('addon-settings-changed', newSettings);
  }
});

ipcMain.on('set-represented-file', (event, filename) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win.setRepresentedFilename(filename || '');
});

ipcMain.on('set-file-changed', (event, changed) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win.setDocumentEdited(changed);
});

ipcMain.on('alert', (event, message) => {
  dialog.showMessageBoxSync(BrowserWindow.fromWebContents(event.sender), {
    message: '' + message,
    buttons: [
      getTranslation('tw.desktop.renderer.prompt.ok')
    ]
  });
  // set returnValue to something to reply so the renderer can resume
  event.returnValue = 1;
});

ipcMain.on('confirm', (event, message) => {
  const result = dialog.showMessageBoxSync(BrowserWindow.fromWebContents(event.sender), {
    message: '' + message,
    buttons: [
      getTranslation('tw.desktop.renderer.prompt.ok'),
      getTranslation('tw.desktop.renderer.prompt.cancel')
    ],
    defaultId: 0,
    cancelId: 1
  }) === 0;
  event.returnValue = result;
});

ipcMain.handle('request-url', (event, url) => new Promise((resolve, reject) => {
  const request = net.request(url);
  request.on('response', (response) => {
    const statusCode = response.statusCode;
    if (statusCode !== 200) {
      reject(new Error(`Unexpected status code: ${statusCode}`))
      return;
    }
    const chunks = [];
    response.on('data', (chunk) => {
      chunks.push(chunk);
    });
    response.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const slice = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      resolve(slice);
    });
  });
  request.on('error', (e) => {
    reject(e);
  });
  request.end();
}));

app.on('window-all-closed', () => {
  app.quit();
});

// Handle file opening on macOS
app.on('open-file', (event, path) => {
  event.preventDefault();
  filesToOpen.push(path);
  // This event can be emitted before we create the main window or while we're already running.
  if (editorWindows.size > 0) {
    createEditorWindow();
  }
});

app.on('web-contents-created', (event, webContents) => {
  webContents.on('context-menu', (event, params) => {
    const text = params.selectionText;
    const hasText = !!text;
    const menuItems = [];

    if (params.linkURL) {
      menuItems.push({
        id: 'openLink',
        label: getTranslation('tw.desktop.main.context.openLink'),
        click() {
          const url = params.linkURL;
          if (isSafeOpenExternal(url)) {
            shell.openExternal(url);
          }
        }
      });
      menuItems.push({
        type: 'separator'
      });
    }

    if (params.isEditable) {
      menuItems.push({
        id: 'cut',
        label: getTranslation('tw.desktop.main.context.cut'),
        enabled: hasText,
        click: () => {
          clipboard.writeText(text);
          webContents.cut();
        }
      });
    }
    if (hasText || params.isEditable) {
      menuItems.push({
        id: 'copy',
        label: getTranslation('tw.desktop.main.context.copy'),
        enabled: hasText,
        click: () => {
          clipboard.writeText(text);
        }
      });
    }
    if (params.isEditable) {
      menuItems.push({
        id: 'Paste',
        label: getTranslation('tw.desktop.main.context.paste'),
        click: () => {
          webContents.paste();
        }
      });
    }

    if (menuItems.length > 0) {
      const menu = Menu.buildFromTemplate(menuItems);
      menu.popup();
    }
  });
  webContents.session.on('will-download', (event, item, webContents) => {
    const extension = pathUtil.extname(item.getFilename()).replace(/^\./, '').toLowerCase();
    const extensionName = getTranslationOrNull(`files.${extension}`);
    if (extensionName) {
      item.setSaveDialogOptions({
        filters: [
          {
            name: extensionName,
            extensions: [extension]
          }
        ]
      });
    }
  });
  webContents.setWindowOpenHandler((details) => {
    if (isSafeOpenExternal(details.url)) {
      setImmediate(() => {
        shell.openExternal(details.url);
      });
    }
    return {action: 'deny'};
  });
  webContents.on('will-navigate', (e, url) => {
    if (isSafeOpenExternal(url)) {
      e.preventDefault();
      shell.openExternal(url);
    } else if (url !== 'mailto:contact@turbowarp.org') {
      e.preventDefault();
    }
  });
});

// We might have a user agent like:
// Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) turbowarp-desktop/0.8.0 Chrome/91.0.4472.124 Electron/13.1.7 Safari/537.36
// We want to remove the Electron/ and turbowarp-desktop/ parts.
app.userAgentFallback = app.userAgentFallback
  .replace(/Electron\/[0-9.]+/, '')
  .replace(`${manifest.name}/${manifest.version}`, '')
  .replace(/ {2,}/g, ' '); 

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
  return argv;
}

const resolveFilePath = (workingDirectory, file) => {
  try {
    // Absolute URLs should not be modified.
    const _ = new URL(file);
    return file;
  } catch (e) {
    return pathUtil.resolve(workingDirectory, file);
  }
};

const acquiredLock = app.requestSingleInstanceLock();
if (acquiredLock) {
  for (const path of parseArgv(process.argv)) {
    filesToOpen.push(resolveFilePath('', path));
  }

  app.on('second-instance', (event, argv, workingDirectory) => {
    for (const i of parseArgv(argv)) {
      filesToOpen.push(resolveFilePath(workingDirectory, i));
    }
    autoCreateEditorWindows();
  });

  app.on('activate', () => {
    if (app.isReady() && editorWindows.size === 0) {
      createEditorWindow();
    }
  });

  app.on('ready', () => {
    checkForUpdate();
    autoCreateEditorWindows();
  });
} else {
  app.quit();
}
