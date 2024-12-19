const AbstractWindow = require('./abstract');
const {translate} = require('../l10n');
const packageJSON = require('../../package.json');
const {APP_NAME} = require('../brand');
const {getDist, getPlatform} = require('../platform');

class AboutWindow extends AbstractWindow {
  constructor () {
    super();

    this.window.setMinimizable(false);
    this.window.setMaximizable(false);
    this.window.setTitle(translate('about').replace('{APP_NAME}', APP_NAME));

    this.ipc.on('get-info', (event) => {
      event.returnValue = {
        version: packageJSON.version,
        dist: getDist(),
        electron: process.versions.electron,
        platform: getPlatform(),
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
    const window = AbstractWindow.singleton(AboutWindow);
    window.show();
  }
}

module.exports = AboutWindow;
