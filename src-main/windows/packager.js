const AbstractWindow = require('./abstract');
const {PACKAGER_NAME} = require('../brand');
const PackagerPreviewWindow = require('./packager-preview');
const prompts = require('../prompts');
const FileAccessWindow = require('./file-access-window');

class PackagerWindow extends AbstractWindow {
  constructor (editorWindow) {
    super();

    /** @type {AbstractWindow} */
    this.editorWindow = editorWindow;

    this.window.setTitle(PACKAGER_NAME);
    this.window.on('page-title-updated', (event) => {
      event.preventDefault();
    });

    this.ipc.on('import-project-with-port', (event) => {
      const port = event.ports[0];
      if (this.editorWindow.window.isDestroyed()) {
        port.postMessage({
          error: true
        });
        return;
      }
      this.editorWindow.window.webContents.postMessage('export-project-to-port', null, [port]);
    });

    this.ipc.on('alert', (event, message) => {
      event.returnValue = prompts.alert(this.window, message);
    });

    this.ipc.on('confirm', (event, message) => {
      event.returnValue = prompts.confirm(this.window, message);
    });

    this.ipc.handle('check-drag-and-drop-path', (event, path) => {
      FileAccessWindow.check(path);
    });

    this.window.webContents.on('did-finish-load', () => {
      // We can't do this from the preload script
      this.window.webContents.executeJavaScript(`
        window.alert = (message) => PromptsPreload.alert(message);
        window.confirm = (message) => PromptsPreload.confirm(message);

        // Electron will try to clone the last value returned here, so make sure it doesn't try to clone a function
        void 0;
      `);
    });

    this.window.webContents.on('did-create-window', (newWindow) => {
      const childWindow = new PackagerPreviewWindow(this.window, newWindow);
      childWindow.protocol = this.protocol;
    });

    this.loadURL('tw-packager://./standalone.html');
    this.show();
  }

  getPreload () {
    return 'packager';
  }

  getDimensions () {
    return {
      width: 700,
      height: 700
    };
  }

  isPopup () {
    return true;
  }

  getBackgroundColor () {
    return '#111111';
  }

  handleWindowOpen (details) {
    if (details.url === 'about:blank') {
      return {
        action: 'allow',
        outlivesOpener: true,
        overrideBrowserWindowOptions: PackagerPreviewWindow.getBrowserWindowOverrides()
      };
    }
    return super.handleWindowOpen(details);
  }

  onBeforeRequest (details, callback) {
    const parsed = new URL(details.url);
    if (parsed.origin === 'https://extensions.turbowarp.org') {
      return callback({
        redirectURL: `tw-extensions://./${parsed.pathname}`
      });
    }

    return super.onBeforeRequest(details, callback);
  }

  static forEditor (editorWindow) {
    new PackagerWindow(editorWindow);
  }
}

module.exports = PackagerWindow;
