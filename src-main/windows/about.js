const BaseWindow = require('./base');
const {translate} = require('../l10n');

class AboutWindow extends BaseWindow {
  constructor () {
    super();
    this.window.loadURL('tw-about://./index.html');
    this.window.setTitle(translate('about'));
    this.window.setMinimizable(false);
    this.window.setMaximizable(false);
    this.window.show();
  }

  getDimensions () {
    return [700, 650];
  }

  static show () {
    const window = BaseWindow.singleton(AboutWindow);
    window.window.show();
  }
}

module.exports = AboutWindow;
