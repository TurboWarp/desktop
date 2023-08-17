const fs = require('fs');
const {promisify} = require('util');
const BaseWindow = require('./base');
const path = require('path');

const readFile = promisify(fs.readFile);

class EditorWindow extends BaseWindow {
  constructor (file) {
    super();

    /** @type {string|null} */
    this.openedFile = file;

    this.window.loadURL(`tw-file://./editor/index.html`);
    this.window.show();
    this.window.webContents.openDevTools();

    const ipc = this.window.webContents.ipc;

    ipc.handle('has-initial-file', () => {
      return !!this.openedFile;
    });

    ipc.handle('get-initial-file', async () => {
      if (!this.openedFile) {
        throw new Error('No file opened');
      }
      const data = await readFile(this.openedFile);
      return {
        name: path.basename(this.openedFile),
        data: data
      }
    });

    ipc.handle('changed', changed => {
      this.window.setDocumentEdited(changed);
    });

    ipc.handle('loaded-file', () => {
      this.window.setRepresentedFilename(this.openedFile);
    });

    ipc.handle('closed-file', () => {
      this.window.setRepresentedFilename(null);
      this.openedFile = null;
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
