const BaseWindow = require('./base');
const {translate} = require('../l10n');

class PrivacyWindow extends BaseWindow {
  constructor () {
    super();
    this.window.loadURL('tw-privacy://./index.html');
    this.window.setTitle(translate('privacy-policy'));
    this.window.setMinimizable(false);
    this.window.setMaximizable(false);
    this.window.show();
  }

  getDimensions () {
    return [800, 700];
  }

  static show () {
    const window = BaseWindow.singleton(PrivacyWindow);
    window.window.show();
  }
}

module.exports = PrivacyWindow;
