const BaseWindow = require('./base');
const {PACKAGER_NAME} = require('../brand');
const ProjectsCommonHandlers = require('../projects-common-handlers');
const PackagerPreviewWindow = require('./packager-preview');
const prompts = require('../prompts');
const {translate} = require('../l10n');

class PackagerWindow extends BaseWindow {
  constructor (editorWindow) {
    super();

    /** @type {BaseWindow} */
    this.editorWindow = editorWindow;
    this.window.setTitle(PACKAGER_NAME);

    this.window.on('page-title-updated', (event) => {
      event.preventDefault();
    });

    const ipc = this.window.webContents.ipc;

    ipc.on('import-project-with-port', (event) => {
      const port = event.ports[0];
      if (this.editorWindow.window.isDestroyed()) {
        port.postMessage({
          error: true
        });
        return;
      }
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

    this.window.webContents.on('did-create-window', (newWindow) => {
      new PackagerPreviewWindow(this.window, newWindow);
    });

    this.loadURL('tw-packager://./standalone.html');
    this.show();
  }

  getPreload () {
    return 'packager';
  }

  getDimensions () {
    return [700, 700];
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
    ProjectsCommonHandlers.onBeforeRequest(details, callback);
  }

  static forEditor (editorWindow) {
    new PackagerWindow(editorWindow);
  }
}

module.exports = PackagerWindow;
