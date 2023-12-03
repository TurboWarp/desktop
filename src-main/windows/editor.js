const fsPromises = require('fs/promises');
const path = require('path');
const {app, dialog} = require('electron');
const ProjectRunningWindow = require('./project-running-window');
const AddonsWindow = require('./addons');
const DesktopSettingsWindow = require('./desktop-settings');
const PrivacyWindow = require('./privacy');
const AboutWindow = require('./about');
const PackagerWindow = require('./packager');
const AddCustomExtensionWindow = require('./add-custom-extension');
const {createAtomicWriteStream} = require('../atomic-write-stream');
const {translate, updateLocale, getStrings} = require('../l10n');
const {APP_NAME} = require('../brand');
const prompts = require('../prompts');
const settings = require('../settings');
const privilegedFetch = require('../fetch');

const TYPE_FILE = 'file';
const TYPE_URL = 'url';
const TYPE_SCRATCH = 'scratch';
const TYPE_SAMPLE = 'sample';

class OpenedFile {
  constructor (type, path) {
    /** @type {TYPE_FILE|TYPE_URL|TYPE_SCRATCH|TYPE_SAMPLE} */
    this.type = type;

    /**
     * Absolute file path or URL
     * @type {string}
     */
    this.path = path;
  }

  async read () {
    if (this.type === TYPE_FILE) {
      return {
        name: path.basename(this.path),
        data: await fsPromises.readFile(this.path)
      };
    }

    if (this.type === TYPE_URL) {
      const response = await privilegedFetch(this.path);
      return {
        name: decodeURIComponent(path.basename(this.path)),
        data: await response.arrayBuffer()
      };
    }

    if (this.type === TYPE_SCRATCH) {
      const metadataResponse = await privilegedFetch(`https://api.scratch.mit.edu/projects/${this.path}`);
      const metadata = await metadataResponse.json();
      const token = metadata.project_token;
      const title = metadata.title;

      const projectResponse = await privilegedFetch(`https://projects.scratch.mit.edu/${this.path}?token=${token}`);
      return {
        name: title,
        data: await projectResponse.arrayBuffer()
      };
    }

    if (this.type === TYPE_SAMPLE) {
      const sampleRoot = path.resolve(__dirname, '../../dist-extensions/samples/');
      const joined = path.join(sampleRoot, this.path);
      if (joined.startsWith(sampleRoot)) {
        return {
          name: this.path,
          data: await fsPromises.readFile(joined)
        };
      }
      throw new Error('Unsafe join');
    }

    throw new Error(`Unknown type: ${this.type}`);
  }
}

const parseOpenedFile = (file, workingDirectory) => {
  let url;
  try {
    url = new URL(file);
  } catch (e) {
    // Error means it was not a valid full URL
  }

  if (url) {
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      // Scratch URLs require special treatment as they are not direct downloads.
      const scratchMatch = file.match(/^https?:\/\/scratch\.mit\.edu\/projects\/(\d+)\/?/);
      if (scratchMatch) {
        return new OpenedFile(TYPE_SCRATCH, scratchMatch[1]);
      }

      // Need to manually redirect extension samples to the copies we already have offline as the
      // fetching code will not go through web request handlers or custom protocols.
      const sampleMatch = file.match(/^https?:\/\/extensions\.turbowarp\.org\/samples\/(.+\.sb3)$/);
      if (sampleMatch) {
        return new OpenedFile(TYPE_SAMPLE, decodeURIComponent(sampleMatch[1]));
      }

      return new OpenedFile(TYPE_URL, file);
    }

    // Don't throw an error just because we don't recognize the URL protocol as
    // Windows paths look close enough to real URLs to be parsed successfully.
  }

  return new OpenedFile(TYPE_FILE, path.resolve(workingDirectory, file));
};

class EditorWindow extends ProjectRunningWindow {
  /**
   * @param {OpenedFile|null} file
   */
  constructor (file) {
    super();

    // This file ID system is not quite perfect. Ideally we would completely revoke permission to access
    // old projects after you load the next one, but our handling of file handles in scratch-gui is
    // pretty bad right now, so this is the best compromise.
    this.openedFiles = [];
    this.activeFileIndex = -1;

    if (file !== null) {
      this.openedFiles.push(file);
      this.activeFileIndex = 0;
    }

    const getFileByIndex = (index) => {
      if (typeof index !== 'number') {
        throw new Error('File ID not number');
      }
      const value = this.openedFiles[index];
      if (!(value instanceof OpenedFile)) {
        throw new Error('Invalid file ID');
      }
      return this.openedFiles[index];
    };

    this.window.webContents.on('will-prevent-unload', (event) => {
      const choice = dialog.showMessageBoxSync(this.window, {
        title: APP_NAME,
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
      if (this.activeFileIndex === -1) {
        return null;
      }
      return this.activeFileIndex;
    });

    ipc.handle('get-file', async (event, index) => {
      const file = getFileByIndex(index);
      const {name, data} = await file.read();
      return {
        name,
        type: file.type,
        data
      };
    });

    ipc.on('set-locale', async (event, locale) => {
      if (settings.locale !== locale) {
        settings.locale = locale;
        updateLocale(locale);

        // Imported late due to circular dependency
        const rebuildMenuBar = require('../menu-bar');
        rebuildMenuBar();

        // Let the save happen in the background, not important
        Promise.resolve().then(() => settings.save());
      }
      event.returnValue = {
        strings: getStrings(),
        mas: !!process.mas
      };
    });

    ipc.handle('set-changed', (event, changed) => {
      this.window.setDocumentEdited(changed);
    });

    ipc.handle('opened-file', (event, index) => {
      const file = getFileByIndex(index);
      if (file.type !== TYPE_FILE) {
        throw new Error('Not a file');
      }
      this.activeFileIndex = index;
      this.window.setRepresentedFilename(file.path);
    });

    ipc.handle('closed-file', () => {
      this.activeFileIndex = -1;
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

      this.openedFiles.push(new OpenedFile(TYPE_FILE, file));
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

      this.openedFiles.push(new OpenedFile(TYPE_FILE, file));
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

    ipc.on('start-write-stream', async (startEvent, index) => {
      const file = getFileByIndex(index);
      if (file.type !== TYPE_FILE) {
        throw new Error('Not a file');
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
        writeStream = await createAtomicWriteStream(file.path);
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
      EditorWindow.newWindow();
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
        fsPromises.readFile(USERSCRIPT_PATH, 'utf-8').catch(() => ''),
        fsPromises.readFile(USERSTYLE_PATH, 'utf-8').catch(() => '')
      ]);

      return {
        userscript,
        userstyle
      };
    });

    /** @type {Set<string>} */
    const manuallyTrustedExtensions = new Set();

    ipc.handle('open-add-custom-extension-window', async () => {
      const window = new AddCustomExtensionWindow(this.window);
      const result = await window.done();
      if (!result) {
        return null;
      }
      manuallyTrustedExtensions.add(result.url);
      return result.url;
    });

    ipc.handle('security-manager/get-sandbox-mode', async (e, url) => {
      if (ProjectRunningWindow.isAlwaysTrustedExtension(url)) {
        return 'unsandboxed';
      }
      return manuallyTrustedExtensions.has(url) ? 'unsandboxed' : 'iframe';
    });

    ipc.handle('security-manager/can-fetch', async (e, url) => {
      return this.canFetch(url);
    });

    ipc.handle('security-manager/can-read-clipboard', async (e, url) => {
      return this.canReadClipboard();
    });

    ipc.handle('security-manager/can-notify', async (e, url) => {
      return this.canNotify();
    });

    this.loadURL('tw-editor://./gui/gui.html');
    this.show();
  }

  getPreload () {
    return 'editor';
  }

  getDimensions () {
    return {
      width: 1280,
      height: 800
    };
  }

  getBackgroundColor () {
    return '#333333';
  }

  applySettings () {
    this.window.webContents.setBackgroundThrottling(settings.backgroundThrottling);
  }

  enumerateMediaDevices () {
    // Used by desktop settings
    return new Promise((resolve, reject) => {
      this.window.webContents.ipc.once('enumerated-media-devices', (event, result) => {
        if (typeof result.error !== 'undefined') {
          reject(result.error);
        } else {
          resolve(result.devices);
        }
      });
      this.window.webContents.send('enumerate-media-devices');
    });
  }

  handleWindowOpen (details) {
    // Open extension sample projects in-app
    const match = details.url.match(
      /^tw-editor:\/\/\.\/gui\/editor\?project_url=(https:\/\/extensions\.turbowarp\.org\/samples\/.+\.sb3)$/
    );
    if (match) {
      EditorWindow.openFiles([
        match[1]
      ]);
    }
    return super.handleWindowOpen(details);
  }

  /**
   * @param {string[]} files
   * @param {string} workingDirectory
   */
  static openFiles (files, workingDirectory) {
    if (files.length === 0) {
      EditorWindow.newWindow();
    } else {
      for (const file of files) {
        new EditorWindow(parseOpenedFile(file, workingDirectory));
      }
    }
  }

  static newWindow () {
    new EditorWindow(null);
  }
}

module.exports = EditorWindow;
