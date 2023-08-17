const BaseWindow = require('./base');
const {translate} = require('../l10n/index');
const {APP_NAME} = require('../brand');

/** @type {AddonsWindow|null} */
let singleton = null;

class AddonsWindow extends BaseWindow {
  constructor () {
    super();

    this.window.loadURL(`tw-editor://./addons/index.html`);

    this.window.setTitle(`${translate('addon-settings')} - ${APP_NAME}`);
    this.window.on('page-title-updated', event => {
      event.preventDefault();
    });

    this.window.on('closed', () => {
      singleton = null;
    });
  }

  getDimensions () {
    return [700, 650];
  }

  static show () {
    const window = BaseWindow.singleton(AddonsWindow);
    window.window.show();
  }
}

module.exports = AddonsWindow;
