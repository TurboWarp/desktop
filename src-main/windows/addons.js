const BaseWindow = require('./base');
const {translate} = require('../l10n/index');
const {APP_NAME} = require('../brand');
const prompts = require('../prompts');

class AddonsWindow extends BaseWindow {
  constructor () {
    super();

    this.window.on('page-title-updated', event => {
      event.preventDefault();
    });
    this.window.setTitle(`${translate('addon-settings')} - ${APP_NAME}`);

    const ipc = this.window.webContents.ipc;

    ipc.on('alert', (event, message) => {
      event.returnValue = prompts.alert(this.window, message);
    });

    ipc.on('confirm', (event, message) => {
      event.returnValue = prompts.confirm(this.window, message);
    });

    this.window.loadURL(`tw-editor://./addons/index.html`);
  }

  getDimensions () {
    return [700, 650];
  }

  getPreload () {
    return 'addons';
  }

  static show () {
    const window = BaseWindow.singleton(AddonsWindow);
    window.show();
  }
}

module.exports = AddonsWindow;
