const BaseWindow = require('./base');
const {PACKAGER_NAME} = require('../brand');
const onBeforeRequest = require('../projects-on-before-request');
const prompts = require('../prompts');

class PackagerWindow extends BaseWindow {
  constructor (editorWindow) {
    super();

    this.editorWindow = editorWindow;
    this.window.setTitle(PACKAGER_NAME);

    const ipc = this.window.webContents.ipc;

    ipc.on('import-project-with-port', (event) => {
      // TODO: editor window may have been destroyed by this point
      const port = event.ports[0];
      this.editorWindow.window.webContents.postMessage('export-project-to-port', null, [port]);
    });

    ipc.on('alert', (event, message) => {
      event.returnValue = prompts.alert(this.window, message);
    });

    ipc.on('confirm', (event, message) => {
      event.returnValue = prompts.confirm(this.window, message);
    });

    this.window.webContents.on('did-finish-load', () => {
      this.window.webContents.executeJavaScript(`
        window.alert = (message) => PromptsPreload.alert(message);
        window.confirm = (message) => PromptsPreload.confirm(message);
 
        // Electron will try to clone the last value returned here, so make sure it doesn't try to clone a function
        void 0;
      `);
    });

    this.window.loadURL('tw-packager://./packager.html');
    this.show();
  }

  getPreload () {
    return 'packager';
  }

  getDimensions () {
    return [700, 700];
  }

  static forEditor (editorWindow) {
    new PackagerWindow(editorWindow);
  }

  onBeforeRequest (details, callback) {
    return onBeforeRequest(details, callback);
  }
}

module.exports = PackagerWindow;
