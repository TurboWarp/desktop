import {app, BrowserWindow, Menu, ipcMain, shell, dialog, clipboard, screen, net} from 'electron'
import pathUtil from 'path'
import fs from 'fs';
import writeFileAtomic from 'write-file-atomic';
import util from 'util';
import {format as formatUrl} from 'url';
import checkForUpdate from './update-checker';
import {getTranslation, getTranslationOrNull} from './translations';
import {APP_NAME} from './brand';
import './advanced-user-customizations';
import * as store from './store';
import './crash';
import parseArgs from './parse-args';
import {isDevelopment, isMac, isLinux, staticDir} from './environment';

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const filesToOpen = [];

const editorWindows = new Set();
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
      parsedUrl.origin !== 'https://packager.turbowarp.org' &&
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

const defaultWindowOpenHandler = (details) => {
  if (isSafeOpenExternal(details.url)) {
    setImmediate(() => {
      shell.openExternal(details.url);
    });
  }
  return {
    action: 'deny'
  }
};

if (isMac) {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { role: 'appMenu' },
    {
      role: 'fileMenu',
      submenu: [
        { role: 'quit' },
        {
          label: getTranslation('menu.new-window'),
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
          label: getTranslation('menu.learn-more'),
          click: () => shell.openExternal('https://desktop.turbowarp.org/')
        }
      ]
    }
  ]));
} else {
  Menu.setApplicationMenu(null);
}

const getURL = (route) => {
  if (isDevelopment) {
    return `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}/?route=${route}`;
  }
  return formatUrl({
    pathname: pathUtil.join(__dirname, 'index.html'),
    protocol: 'file',
    search: `route=${route}`,
    slashes: true
  });
};

const closeWindowWhenPressEscape = (window) => {
  window.webContents.on('before-input-event', (e, input) => {
    if (
      input.type === 'keyDown' &&
      input.key === 'Escape' &&
      !input.control &&
      !input.alt &&
      !input.meta &&
      !input.isAutoRepeat &&
      !input.isComposing &&
      // set by logic in web-contents-created
      !e.didJustLeaveFullScreen
    ) {
      window.close();
    }
  });
};

const getWindowOptions = (options) => {
  if (isLinux) {
    options.icon = pathUtil.join(staticDir, 'icon.png');
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
  return window;
};

const createEditorWindow = () => {
  // Note: the route for this must be `editor`, otherwise the dev tools keyboard shortcuts will not work.
  let url = getURL('editor');
  const fileToOpen = filesToOpen.shift();
  if (typeof fileToOpen !== 'undefined') {
    url += `&file=${encodeURIComponent(fileToOpen)}`;
    allowedToAccessFiles.add(fileToOpen);
  }
  const window = createWindow(url, {
    title: APP_NAME,
    width: 1280,
    height: 800
  });
  window.on('page-title-updated', (event, title, explicitSet) => {
    event.preventDefault();
    if (explicitSet && title) {
      window.setTitle(`${title} - ${APP_NAME}`);
    } else {
      window.setTitle(APP_NAME);
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
      title: APP_NAME,
      type: 'info',
      buttons: [
        getTranslation('unload.stay'),
        getTranslation('unload.leave')
      ],
      cancelId: 0,
      defaultId: 0,
      message: getTranslation('unload.message'),
      detail: getTranslation('unload.detail')
    });
    if (choice === 1) {
      e.preventDefault();
    }
  });
  editorWindows.add(window);
  return window;
};

const createAboutWindow = () => {
  if (!aboutWindow) {
    aboutWindow = createWindow(getURL('about'), {
      title: getTranslation('about'),
      width: 800,
      height: 450,
      minimizable: false,
      maximizable: false
    });
    aboutWindow.on('closed', () => {
      aboutWindow = null;
    });
    closeWindowWhenPressEscape(aboutWindow);
  }
  aboutWindow.show();
  aboutWindow.focus();
};

const createAddonSettingsWindow = () => {
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
    closeWindowWhenPressEscape(addonSettingsWindow);
  }
  addonSettingsWindow.show();
  addonSettingsWindow.focus();
};

const createPrivacyWindow = () => {
  if (!privacyWindow) {
    privacyWindow = createWindow(getURL('privacy'), {
      title: getTranslation('privacy'),
      width: 800,
      height: 700,
      minimizable: false,
      maximizable: false
    });
    privacyWindow.on('closed', () => {
      privacyWindow = null;
    });
    closeWindowWhenPressEscape(privacyWindow);
  }
  privacyWindow.show();
  privacyWindow.focus();
};

const createDesktopSettingsWindow = () => {
  if (!desktopSettingsWindow) {
    desktopSettingsWindow = createWindow(getURL('desktop-settings'), {
      title: getTranslation('desktop-settings'),
      width: 500,
      height: 300
    });
    desktopSettingsWindow.on('closed', () => {
      desktopSettingsWindow = null;
    });
    closeWindowWhenPressEscape(desktopSettingsWindow);
  }
  desktopSettingsWindow.show();
  desktopSettingsWindow.focus();
};

const createPackagerWindow = (editorWebContents) => {
  const window = createWindow(`${getURL('packager')}&editor_id=${editorWebContents.id}`, {
    title: 'TurboWarp Packager',
    width: 700,
    height: 700,
    parent: BrowserWindow.fromWebContents(editorWebContents)
  });
  closeWindowWhenPressEscape(window);
  window.on('page-title-updated', (e, title) => {
    e.preventDefault();
    // title will be something like "Project - TurboWarp Packager for Scratch"
    // the for Scratch looks ugly in a native window, so remove that
    window.setTitle(title.replace(/ for Scratch$/, ''));
  });
  window.webContents.setWindowOpenHandler((details) => {
    if (details.url === 'about:blank') {
      // Opening preview window
      return {
        action: 'allow',
        overrideBrowserWindowOptions: getWindowOptions({
          title: 'Loading Preview',
          width: 640,
          height: 480,
          parent: window
        })
      };
    }
    return defaultWindowOpenHandler(details);
  });
  window.webContents.on('did-create-window', (newWindow) => {
    closeWindowWhenPressEscape(newWindow);
  });
  return window;
};

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

ipcMain.on('open-packager', (event) => {
  createPackagerWindow(event.sender);
});

ipcMain.handle('get-packager-html', () => readFile(pathUtil.join(staticDir, 'packager.html')));

ipcMain.on('open-source-code', () => {
  shell.openExternal('https://github.com/TurboWarp');
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
    title: APP_NAME,
    message: '' + message,
    buttons: [
      getTranslation('prompt.ok')
    ],
    noLink: true
  });
  // set returnValue to something to reply so the renderer can resume
  event.returnValue = 1;
});

ipcMain.on('confirm', (event, message) => {
  const result = dialog.showMessageBoxSync(BrowserWindow.fromWebContents(event.sender), {
    title: APP_NAME,
    message: '' + message,
    buttons: [
      getTranslation('prompt.ok'),
      getTranslation('prompt.cancel')
    ],
    defaultId: 0,
    cancelId: 1,
    noLink: true
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

ipcMain.on('open-user-data', () => {
  shell.showItemInFolder(app.getPath('userData'));
});

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

    if (params.misspelledWord && params.dictionarySuggestions.length > 0) {
      for (const word of params.dictionarySuggestions) {
        menuItems.push({
          label: word,
          click: () => {
            webContents.replaceMisspelling(word);
          }
        });
      }
      menuItems.push({
        type: 'separator'
      });
    }

    const url = params.linkURL;
    if (params.linkURL) {
      menuItems.push({
        id: 'openLink',
        label: getTranslation('context.open-link'),
        enabled: !url.startsWith('blob:'),
        click() {
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
        label: getTranslation('context.cut'),
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
        label: getTranslation('context.copy'),
        enabled: hasText,
        click: () => {
          clipboard.writeText(text);
        }
      });
    }
    if (params.isEditable) {
      menuItems.push({
        id: 'Paste',
        label: getTranslation('context.paste'),
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

  if (!isMac) {
    // On Mac, shortcuts are handled by the menu bar.
    webContents.on('before-input-event', (e, input) => {
      if (input.isAutoRepeat || input.isComposing || input.type !== 'keyDown' || input.meta) {
        return;
      }
      const window = BrowserWindow.fromWebContents(webContents);
      // Ctrl+Shift+I to open dev tools
      if (
        input.control &&
        input.shift &&
        input.key.toLowerCase() === 'i' &&
        !input.alt
      ) {
        e.preventDefault();
        webContents.toggleDevTools();
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
        webContents.setZoomLevel(webContents.getZoomLevel() + 1);
      }
      // Ctrl+Minus/Underscore to zoom out
      if (
        input.control &&
        input.key === '-'
      ) {
        e.preventDefault();
        webContents.setZoomLevel(webContents.getZoomLevel() - 1);
      }
      // Ctrl+0 to reset zoom
      if (
        input.control &&
        input.key === '0'
      ) {
        e.preventDefault();
        webContents.setZoomLevel(0);
      }
      // F11 and alt+enter to toggle fullscreen
      if (
        input.key === 'F11' ||
        (input.key === 'Enter' && input.alt)
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
        // used by closeWindowWhenPressEscape
        e.didJustLeaveFullScreen = true;
        window.setFullScreen(false);
      }
      // Ctrl+R and Ctrl+Shift+R to reload
      if (
        input.control &&
        input.key.toLowerCase() === 'r'
      ) {
        e.preventDefault();
        if (input.shift) {
          webContents.reloadIgnoringCache();
        } else {
          webContents.reload();
        }
      }
    });
  }

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

  webContents.setWindowOpenHandler(defaultWindowOpenHandler);

  webContents.on('will-navigate', (e, url) => {
    if (url === 'mailto:contact@turbowarp.org') {
      // If clicking on the contact email address, we'll let the OS figure out how to open it
      return;
    }
    try {
      const newURL = new URL(url);
      const baseURL = new URL(getURL('editor'));
      if (newURL.href.startsWith(baseURL.href)) {
        // editor is probably reloading itself (for example, changing custom stage size), let it
      } else {
        e.preventDefault();
        if (isSafeOpenExternal(url)) {
          shell.openExternal(url);
        }
      }
    } catch (e) {
      e.preventDefault();
    }
  });
});

const acquiredLock = app.requestSingleInstanceLock();
if (acquiredLock) {
  const autoCreateEditorWindows = () => {
    if (filesToOpen.length) {
      while (filesToOpen.length) {
        createEditorWindow();
      }
    } else {
      createEditorWindow();
    }
  };

  const resolveFilePath = (workingDirectory, file) => {
    try {
      // If the file is a full absolute URL, pass it through unmodified.
      const _ = new URL(file);
      return file;
    } catch (e) {
      return pathUtil.resolve(workingDirectory, file);
    }
  };

  for (const path of parseArgs(process.argv)) {
    filesToOpen.push(resolveFilePath('', path));
  }

  app.on('second-instance', (event, argv, workingDirectory) => {
    for (const i of parseArgs(argv)) {
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
