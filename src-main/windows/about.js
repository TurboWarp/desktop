const BaseWindow = require('./base');
const {translate} = require('../l10n');
const packageJSON = require('../../package.json');
const {APP_NAME} = require('../brand');

class AboutWindow extends BaseWindow {
  constructor () {
    super();

    this.window.setMinimizable(false);
    this.window.setMaximizable(false);
    this.window.setTitle(translate('about').replace('{APP_NAME}', APP_NAME));

    const ipc = this.window.webContents.ipc;

    ipc.on('get-info', (event) => {
      event.returnValue = {
        version: packageJSON.version,
        electron: process.versions.electron,
        platform: process.platform,
        arch: process.arch
      };
    });

    this.loadURL('tw-about://./about.html');
  }

  getDimensions () {
    return {
      width: 750,
      height: 650
    };
  }

  getPreload () {
    return 'about';
  }

  isPopup () {
    return true;
  }

  static show () {
    const window = BaseWindow.singleton(AboutWindow);
    window.show();
  }
}

module.exports = AboutWindow;
