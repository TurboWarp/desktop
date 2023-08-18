const BaseWindow = require('./base');
const {PACKAGER_NAME} = require('../brand');
const onBeforeRequest = require('../projects-on-before-request');

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
