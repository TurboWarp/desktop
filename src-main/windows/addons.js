const BaseWindow = require('./base');

/** @type {AddonsWindow|null} */
let singleton = null;

class AddonsWindow extends BaseWindow {
  constructor () {
    super();

    this.window.loadURL(`tw-editor://./addons/index.html`);

    this.window.on('closed', () => {
      singleton = null;
    })
  }

  getDimensions () {
    return [700, 650];
  }

  static show () {
    if (!singleton) {
      singleton = new AddonsWindow();
    }
    singleton.window.show();
  }
}

module.exports = AddonsWindow;
