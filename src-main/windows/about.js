const BaseWindow = require('./base');
const {translate} = require('../l10n');
const packageJSON = require('../../package.json');

class AboutWindow extends BaseWindow {
  constructor () {
    super();

    this.window.setMinimizable(false);
    this.window.setMaximizable(false);
    this.window.setTitle(translate('about'));

    const ipc = this.window.webContents.ipc;

    ipc.on('get-info', (event) => {
      event.returnValue = {
        version: packageJSON.version,
        electron: process.versions.electron,
        platform: process.platform,
        arch: process.arch
      };
    });

    this.window.loadURL('tw-about://./index.html');
  }

  getDimensions () {
    return [750, 650];
  }

  getPreload () {
    return 'about';
  }

  static show () {
    const window = BaseWindow.singleton(AboutWindow);
    window.show();
  }
}

module.exports = AboutWindow;
