const BaseWindow = require('./base');
const {translate} = require('../l10n');

class DesktopSettingsWindow extends BaseWindow {
  constructor () {
    super();
    this.window.loadURL('tw-desktop-settings://./index.html');
    this.window.setTitle(translate('desktop-settings'));
    this.window.setMinimizable(false);
    this.window.setMaximizable(false);
    this.window.show();
  }

  getDimensions () {
    return [500, 450];
  }

  static show () {
    const window = BaseWindow.singleton(DesktopSettingsWindow);
    window.window.show();
  }
}

module.exports = DesktopSettingsWindow;
