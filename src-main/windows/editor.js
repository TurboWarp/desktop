const fs = require('fs');
const {promisify} = require('util');
const path = require('path');
const {app, dialog} = require('electron');
const BaseWindow = require('./base');
const AddonsWindow = require('./addons');
const DesktopSettingsWindow = require('./desktop-settings');
const PrivacyWindow = require('./privacy');
const AboutWindow = require('./about');
const PackagerWindow = require('./packager');
const {createAtomicWriteStream} = require('../atomic-write-stream');
const {translate, updateLocale, getAllStrings} = require('../l10n');
const {APP_NAME} = require('../brand');
const askForMediaAccess = require('../media-permissions');
const {onBeforeRequest, onHeadersReceived} = require('../project-request-filtering');
const prompts = require('../prompts');
const settings = require('../settings');

const readFile = promisify(fs.readFile);

class EditorWindow extends BaseWindow {
  /**
   * @param {string|null} file
   */
  constructor (file) {
    super();

    // This file ID system is not quite perfect. Ideally we would completely revoke permission to access
    // old projects after you load the next one, but our handling of file handles in scratch-gui is
    // pretty bad right now, so this is the best compromise.
    this.openedFiles = [];
    this.activeFileId = -1;

    if (file !== null) {
      this.openedFiles.push(file);
      this.activeFileId = 0;
    }

    const getFileById = (id) => {
      if (typeof id !== 'number' || typeof this.openedFiles[id] !== 'string') {
        throw new Error('Invalid file ID');
      }
      return this.openedFiles[id];
    };

    this.window.webContents.on('will-prevent-unload', (event) => {
      const choice = dialog.showMessageBoxSync(this.window, {
        type: 'info',
        buttons: [
          translate('unload.stay'),
          translate('unload.leave')
        ],
        cancelId: 0,
        defaultId: 0,
        message: translate('unload.message'),
        detail: translate('unload.detail')
      });
      if (choice === 1) {
        event.preventDefault();
      }
    });

    this.window.on('page-title-updated', (event, title, explicitSet) => {
      event.preventDefault();
      if (explicitSet && title) {
        this.window.setTitle(`${title} - ${APP_NAME}`);
      } else {
        this.window.setTitle(APP_NAME);
      }
    });
    this.window.setTitle(APP_NAME);

    const ipc = this.window.webContents.ipc;

    ipc.handle('get-initial-file', () => {
      if (this.activeFileId === -1) {
        return null;
      }
      return this.activeFileId;
    });

    ipc.handle('get-file', async (event, id) => {
      const file = getFileById(id);
      const data = await readFile(file);
      return {
        name: path.basename(file),
        data: data
      }
    });

    ipc.on('set-locale', async (event, locale) => {
      if (settings.locale !== locale) {
        settings.locale = locale;
        updateLocale(locale);
        // Let the save happen in the background, not important
        Promise.resolve().then(() => settings.save());
      }
      event.returnValue = getAllStrings();
    });

    ipc.handle('set-changed', (event, changed) => {
      this.window.setDocumentEdited(changed);
    });

    ipc.handle('opened-file', (event, id) => {
      const file = getFileById(id);
      this.activeFileId = id;
      this.window.setRepresentedFilename(file);
    });

    ipc.handle('closed-file', () => {
      this.activeFileId = -1;
      this.window.setRepresentedFilename('');
    });

    ipc.handle('show-open-file-picker', async () => {
      const result = await dialog.showOpenDialog(this.window, {
        properties: ['openFile'],
        defaultPath: settings.lastDirectory,
        filters: [
          {
            name: 'Scratch Project',
            extensions: ['sb3', 'sb2', 'sb'],
          }
        ]
      });
      if (result.canceled) {
        return null;
      }

      const file = result.filePaths[0];
      settings.lastDirectory = path.dirname(file);
      await settings.save();

      this.openedFiles.push(file);
      return {
        id: this.openedFiles.length - 1,
        name: path.basename(file)
      };
    });

    ipc.handle('show-save-file-picker', async (event, suggestedName) => {
      const result = await dialog.showSaveDialog(this.window, {
        defaultPath: path.join(settings.lastDirectory, suggestedName),
        filters: [
          {
            name: 'Scratch 3 Project',
            extensions: ['sb3'],
          }
        ]
      });
      if (result.canceled) {
        return null;
      }

      const file = result.filePath;
      settings.lastDirectory = path.dirname(file);
      await settings.save();

      this.openedFiles.push(file);
      return {
        id: this.openedFiles.length - 1,
        name: path.basename(file)
      };
    });

    ipc.handle('get-preferred-media-devices', () => {
      return {
        microphone: settings.microphone,
        camera: settings.camera
      };
    });

    ipc.on('start-write-stream', async (startEvent, id) => {
      const file = getFileById(id);
      const port = startEvent.ports[0];

      /** @type {NodeJS.WritableStream|null} */
      let writeStream = null;

      const handleError = (error) => {
        console.error('Write stream error', error);
        port.postMessage({
          error
        });

        // Make sure the port is started in case we encounter an error before we normally
        // begin to accept messages.
        port.start();
      };

      try {
        writeStream = await createAtomicWriteStream(file);
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
        } else if (data.abort) {
          writeStream.emit('error', new Error('Aborted by renderer process'));
          return;
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

    ipc.on('alert', (event, message) => {
      event.returnValue = prompts.alert(this.window, message);
    });

    ipc.on('confirm', (event, message) => {
      event.returnValue = prompts.confirm(this.window, message);
    });

    ipc.handle('open-packager', () => {
      PackagerWindow.forEditor(this);
    });

    ipc.handle('open-new-window', () => {
      EditorWindow.openFiles([]);
    });

    ipc.handle('open-addon-settings', () => {
      AddonsWindow.show();
    });

    ipc.handle('open-desktop-settings', () => {
      DesktopSettingsWindow.show();
    });

    ipc.handle('open-privacy', () => {
      PrivacyWindow.show();
    });

    ipc.handle('open-about', () => {
      AboutWindow.show();
    });

    ipc.handle('get-advanced-customizations', async () => {
      const USERSCRIPT_PATH = path.join(app.getPath('userData'), 'userscript.js');
      const USERSTYLE_PATH = path.join(app.getPath('userData'), 'userstyle.css');

      const [userscript, userstyle] = await Promise.all([
        readFile(USERSCRIPT_PATH, 'utf-8').catch(() => ''),
        readFile(USERSTYLE_PATH, 'utf-8').catch(() => '')
      ]);

      return {
        userscript,
        userstyle
      };
    });

    this.window.loadURL('tw-editor://./gui/index.html');
    this.show();
  }

  getPreload () {
    return 'editor';
  }

  getDimensions () {
    return [1280, 800];
  }

  getBackgroundColor () {
    return '#333333';
  }

  handlePermissionCheck (permission, details) {
    // Autoplay audio and media device filtering
    if (permission === 'media') {
      return true;
    }

    return false;
  }

  async handlePermissionRequest (permission, details) {
    // Pointerlock extension and experiment
    if (permission === 'pointerLock') {
      return true;
    }

    // Notifications extension
    if (permission === 'notifications') {
      return callback(true);
    }

    // Attempting to record video or audio
    if (permission === 'media') {
      // mediaTypes is not guaranteed to exist
      const mediaTypes = details.mediaTypes || [];
      for (const mediaType of mediaTypes) {
        const hasPermission = await askForMediaAccess(this.window, mediaType);
        if (!hasPermission) {
          return false;
        }
      }
      return true;
    }

    return false;
  }

  onBeforeRequest (details, callback) {
    onBeforeRequest(details, callback);
  }

  onHeadersReceived (details, callback) {
    onHeadersReceived(details, callback);
  }

  applySettings () {
    this.window.webContents.setBackgroundThrottling(settings.backgroundThrottling);
  }

  /**
   * @param {string[]} files
   */
  static openFiles (files) {
    if (files.length === 0) {
      new EditorWindow(null);
    } else {
      for (const file of files) {
        new EditorWindow(file);
      }
    }
  }
}

module.exports = EditorWindow;
