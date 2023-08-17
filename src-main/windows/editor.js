const fs = require('fs');
const {promisify} = require('util');
const path = require('path');
const {dialog, inAppPurchase} = require('electron');
const BaseWindow = require('./base');
const AddonsWindow = require('./addons');
const DesktopSettingsWindow = require('./desktop-settings');
const PrivacyWindow = require('./privacy');
const AboutWindow = require('./about');
const {createAtomicWriteStream} = require('../atomic-write-stream');
const {translate} = require('../l10n');
const {APP_NAME} = require('../brand');

const readFile = promisify(fs.readFile);

class EditorWindow extends BaseWindow {
  constructor (file) {
    super();

    /** @type {string|null} */
    this.openedFile = file;

    /** @type {string|null} */
    this.openingFile = null;

    this.window.loadURL(`tw-editor://./gui/index.html`);
    this.window.show();
    this.window.webContents.openDevTools();

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

    ipc.handle('has-file', () => {
      this.openingFile = null;
      return !!this.openedFile;
    });

    ipc.handle('get-file', async () => {
      this.openingFile = null;
      if (!this.openedFile) {
        throw new Error('No file opened');
      }
      const data = await readFile(this.openedFile);
      return {
        name: path.basename(this.openedFile),
        data: data
      }
    });

    ipc.handle('set-changed', changed => {
      this.window.setDocumentEdited(changed);
    });

    ipc.handle('opened-file', () => {
      if (this.openingFile) {
        this.openedFile = this.openingFile;
        this.openingFile = null;
      }
      this.window.setRepresentedFilename(this.openedFile);
    });

    ipc.handle('closed-file', () => {
      this.window.setRepresentedFilename('');
      this.openedFile = null;
      this.openingFile = null;
    });

    ipc.handle('show-open-file-picker', async () => {
      const result = await dialog.showOpenDialog(this.window, {
        // TODO: remember last location
        properties: ['openFile'],
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
      this.openingFile = result.filePaths[0];
      return path.basename(this.openingFile);
    });

    ipc.handle('show-save-file-picker', async (suggestedName) => {
      const result = await dialog.showSaveDialog(this.window, {
        // TODO: remember last location,
        defaultPath: `${suggestedName}.sb3`,
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
      this.openedFile = result.filePath;
      return path.basename(this.openedFile);
    });

    ipc.on('start-write-stream', async (startEvent) => {
      if (!this.openedFile) {
        throw new Error('No file opened');
      }

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
        writeStream = await createAtomicWriteStream(this.openedFile);
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

    ipc.handle('open-new-window', () => {
      EditorWindow.openFiles([]);
    });

    ipc.handle('open-addon-settings', () => {
      AddonsWindow.show();
    });

    ipc.handle('open-desktop-settings', () => {
      DesktopSettingsWindow.show();
    })

    ipc.handle('open-privacy', () => {
      PrivacyWindow.show();
    });

    ipc.handle('open-about', () => {
      AboutWindow.show();
    });
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

  getPreload () {
    return 'editor';
  }

  getDimensions () {
    return [1280, 800];
  }
}

module.exports = EditorWindow;
