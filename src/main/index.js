import {app, BrowserWindow, Menu, ipcMain, shell, dialog, clipboard, screen, net, session} from 'electron'
import pathUtil from 'path'
import fs from 'fs';
import util from 'util';
import {format as formatUrl} from 'url';
import zlib from 'zlib';
import checkForUpdate from './update-checker';
import {getTranslation, getTranslationOrNull} from './translations';
import {APP_NAME, EXTENSION_GALLERY_NAME, PACKAGER_NAME} from './brand';
import './advanced-user-customizations';
import * as store from './store';
import './crash';
import parseArgs from './parse-args';
import {isDevelopment, isMac, isLinux, staticDir} from './environment';
import './library-files';
import './user-agent';
import './hardware-acceleration';
import './get-debug-info';
import {handlePermissionRequest} from './permissions';
import './detect-arm-translation';
import {isBackgroundThrottlingEnabled, whenBackgroundThrottlingChanged} from './background-throttling';
import './extensions';
import {createAtomicWriteStream, writeFileAtomic} from './atomic-file-write-stream';
import './protocols';

const readFile = util.promisify(fs.readFile);
const brotliDecompress = util.promisify(zlib.brotliDecompress);

const filesToOpen = [];

const editorWindows = new Set();
let aboutWindow = null;
let addonSettingsWindow = null;
let privacyWindow = null;
let desktopSettingsWindow = null;
const dataWindows = new Set();
const extensionWindows = new Set();
const closeAllNonEditorWindows = () => [
  aboutWindow,
  addonSettingsWindow,
  privacyWindow,
  desktopSettingsWindow,
  ...dataWindows,
  ...extensionWindows
].filter((i) => i).forEach((i) => i.close())

const allowedToAccessFiles = new Set();

const isSafeOpenExternal = (url) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:';
  } catch (e) {
    // ignore
  }
  return false;
};

const isDataURL = (url) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'data:';
  } catch (e) {
    // ignore
  }
  return false;
};

const isExtensionURL = (url) => url === 'https://extensions.turbowarp.org/';

const defaultWindowOpenHandler = (details) => {
  if (isSafeOpenExternal(details.url)) {
    setImmediate(() => {
      shell.openExternal(details.url);
    });
  } else if (isDataURL(details.url)) {
    createDataWindow(details.url);
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
  options.webPreferences ||= {};
  if (typeof options.webPreferences.preload === 'undefined') {
    // only undefined should be replaced as null is interpreted as "no preload script"
    options.webPreferences.preload = pathUtil.resolve(__dirname, 'preload.js')
  }

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
    height: 800,
    webPreferences: {
      backgroundThrottling: isBackgroundThrottlingEnabled()
    }
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
  window.webContents.setWindowOpenHandler((details) => {
    if (isExtensionURL(details.url)) {
      createExtensionsWindow(window.webContents);
      return {
        action: 'deny'
      };
    }
    return defaultWindowOpenHandler(details);
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
      height: 450
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
    title: PACKAGER_NAME,
    width: 700,
    height: 700,
  });
  closeWindowWhenPressEscape(window);

  let defaultWindowTitle;
  window.on('page-title-updated', (e, newTitle, explicitSet) => {
    e.preventDefault();
    if (!explicitSet) {
      return;
    }
    // The packager's default name is quite long and we want to display a shorter title instead
    if (!defaultWindowTitle) {
      defaultWindowTitle = newTitle;
    }
    if (newTitle === defaultWindowTitle) {
      window.setTitle(PACKAGER_NAME);
    } else {
      window.setTitle(newTitle);
    }
  });

  window.webContents.setWindowOpenHandler((details) => {
    if (details.url === 'about:blank') {
      // Opening preview window
      return {
        action: 'allow',
        overrideBrowserWindowOptions: getWindowOptions({
          title: getTranslation('loading-preview'),
          width: 640,
          height: 480,
          webPreferences: {
            // preview window can have arbitrary custom JS and should not have access to special APIs
            preload: null
          }
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

const createDataWindow = (url) => {
  const window = createWindow(url, {
    title: 'data: URL',
    width: 480,
    height: 360,
    webPreferences: {
      preload: null,
      session: session.fromPartition('unsafe-data-url')
    }
  });
  closeWindowWhenPressEscape(window);
  window.on('closed', () => {
    dataWindows.delete(window);
  });
  dataWindows.add(window);
};

const createExtensionsWindow = (editorWebContents) => {
  const window = createWindow(`tw-extensions://./index.html?editor_id=${editorWebContents.id}`, {
    title: EXTENSION_GALLERY_NAME,
    width: 950,
    height: 700,
  });
  closeWindowWhenPressEscape(window);
  extensionWindows.add(window);
  window.on('closed', () => {
    extensionWindows.delete(window);
  });
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

ipcMain.on('write-file-with-port', async (startEvent, path) => {
  const port = startEvent.ports[0];

  /** @type {NodeJS.WritableStream|null} */
  let writeStream = null;

  const handleError = (error) => {
    console.error(error);
    port.postMessage({
      error
    });
    // Make sure the port is started as we can encounter an error before we normally
    // begin to accept messages.
    port.start();
  };

  try {
    if (!allowedToAccessFiles.has(path)) {
      throw new Error('Not allowed to access path');
    }
    writeStream = await createAtomicWriteStream(path);
  } catch (error) {
    handleError(error);
    return;
  }

  writeStream.on('atomic-error', handleError);

  const handleMessage = (data) => {
    if (data.write) {
      if (writeStream.write(data.write)) {
        // Still more space in the buffer. Ask for more immediately.
        return;
      }
      // Wait for the buffer to become empty before asking for more.
      return new Promise(resolve => {
        writeStream.once('drain', resolve);
      });
    } else if (data.finish) {
      // Wait for the atomic file write to complete.
      return new Promise(resolve => {
        writeStream.once('atomic-finish', resolve);
        writeStream.end();
      });
    }
    throw new Error('Unknown message from renderer'); 
  };

  port.on('message', async (messageEvent) => {
    try {
      const data = messageEvent.data;
      const id = data.id;
      const result = await handleMessage(data);
      port.postMessage({
        response: {
          id,
          result
        }
      });
    } catch (error) {
      handleError(error);
    }
  });

  port.start();
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

ipcMain.handle('get-packager-html', async () => {
  const compressed = await readFile(pathUtil.join(staticDir, 'packager.html.br'));
  const uncomressed = await brotliDecompress(compressed);
  return uncomressed;
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
  await writeFileAtomic(path, JSON.stringify(settings));
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

const requestURLAsArrayBuffer = (url) => new Promise((resolve, reject) => {
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
});

ipcMain.handle('request-url', (event, url) => {
  if (!allowedToAccessFiles.has(url)) {
    throw new Error('Not allowed to access URL');
  }
  return requestURLAsArrayBuffer(url);
});

ipcMain.handle('get-project-metadata', (event, id) => {
  if (!/^\d+$/.test(id)) {
    throw new Error('Invalid project ID');
  }
  return requestURLAsArrayBuffer(`https://api.scratch.mit.edu/projects/${id}`);
});

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

app.on('session-created', (session) => {
  session.setPermissionRequestHandler(handlePermissionRequest);

  session.on('will-download', (event, item, webContents) => {
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

  const rootFileURL = new URL(`file://${__dirname}/`).href;

  // Enforce additional restrictions when fetching file:// URIs
  session.webRequest.onBeforeRequest((details, callback) => {
    const destinationURL = new URL(details.url);
    if (destinationURL.protocol === 'file:' && !destinationURL.href.startsWith(rootFileURL)) {
      return callback({
        cancel: true
      });
    }
    callback({});
  });

  // Enforce CORS when a file:// URI fetches something from the broader internet
  session.webRequest.onHeadersReceived((details, callback) => {
    if (details.resourceType === 'xhr') {
      const sourceURL = new URL(details.frame.url);
      const destinationURL = new URL(details.url);
      if ((destinationURL.protocol === 'http:' || destinationURL.protocol === 'https:') && sourceURL.protocol === 'file:') {
        const corsHeaders = details.responseHeaders?.['access-control-allow-origin'] || [];
        const corsHeader = corsHeaders.join(',');
        if (corsHeader !== '*') {
          return callback({
            cancel: true
          });
        }
      }
    }
    callback({});
  });
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
      // Ctrl+Equals/Plus to zoom in (depends on keyboard layout)
      if (
        input.control &&
        (input.key === '=' || input.key === '+')
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

  webContents.setWindowOpenHandler(defaultWindowOpenHandler);

  webContents.on('will-navigate', (e, url) => {
    if (url === 'mailto:contact@turbowarp.org') {
      // If clicking on the contact email address, we'll let the OS figure out how to open it
      return;
    }
    try {
      const newURL = new URL(url);
      const baseURL = new URL(getURL(''));
      if (newURL.href.startsWith(baseURL.href)) {
        // Let the editor reload itself
        // For example, reloading to apply settings
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

whenBackgroundThrottlingChanged((backgroundThrottlingEnabled) => {
  for (const editorWindow of editorWindows) {
    editorWindow.webContents.setBackgroundThrottling(backgroundThrottlingEnabled);
  }
});

// Allows certain versions of Scratch Link to work without an internet connection
// https://github.com/LLK/scratch-desktop/blob/4b462212a8e406b15bcf549f8523645602b46064/src/main/index.js#L45
app.commandLine.appendSwitch('host-resolver-rules', 'MAP device-manager.scratch.mit.edu 127.0.0.1');

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

  app.whenReady().then(() => {
    checkForUpdate();
    autoCreateEditorWindows();
  });
} else {
  console.log('Handing off to existing instance.');
  app.quit();
}
