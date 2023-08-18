const BaseWindow = require('./base');
const {PACKAGER_NAME} = require('../brand');
const {onBeforeRequest, onHeadersReceived} = require('../project-request-filtering');
const prompts = require('../prompts');
const {translate} = require('../l10n');

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
      // We can't do this from the preload script
      this.window.webContents.executeJavaScript(`
        window.alert = (message) => PromptsPreload.alert(message);
        window.confirm = (message) => PromptsPreload.confirm(message);
 
        // Electron will try to clone the last value returned here, so make sure it doesn't try to clone a function
        void 0;
      `);
    });

    this.window.webContents.on('did-create-window', (newWindow, details) => {
      // Center the window on the parent
      const parentBounds = this.window.getBounds();
      const newBounds = newWindow.getBounds();
      const centerX = parentBounds.x + (parentBounds.width / 2) - (newBounds.width / 2);
      const centerY = parentBounds.y + (parentBounds.height / 2) - (newBounds.height / 2);
      newWindow.setPosition(centerX, centerY);
      newWindow.show();
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

  handleWindowOpen (details) {
    if (details.url === 'about:blank') {
      return {
        action: 'allow',
        outlivesOpener: true,
        overrideBrowserWindowOptions: {
          title: translate('packager.loading-preview'),
          // TODO: would be best to autodetect the right size
          width: 480,
          height: 360,
          backgroundColor: '#000000',
          webPreferences: {
            preload: null
          },
          // Visibility will be handled by did-create-window
          show: false
        }
      };
    }
    return super.handleWindowOpen(details);
  }

  onBeforeRequest (details, callback) {
    onBeforeRequest(details, callback);
  }

  onHeadersReceived (details, callback) {
    onHeadersReceived(details, callback);
  }
}

module.exports = PackagerWindow;
