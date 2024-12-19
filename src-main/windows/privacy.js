const AbstractWindow = require('./abstract');
const DesktopSettingsWindow = require('./desktop-settings');
const {translate} = require('../l10n');
const {APP_NAME} = require('../brand');
const {isUpdateCheckerAllowed} = require('../update-checker');

class PrivacyWindow extends AbstractWindow {
  constructor () {
    super();

    this.ipc.on('is-update-checker-allowed', (e) => {
      e.returnValue = isUpdateCheckerAllowed();
    });

    this.ipc.handle('open-desktop-settings', () => {
      DesktopSettingsWindow.show();
    });

    this.window.setTitle(`${translate('privacy-policy')} - ${APP_NAME}`);
    this.window.setMinimizable(false);
    this.window.setMaximizable(false);
    this.loadURL('tw-privacy://./privacy.html');
  }

  getDimensions () {
    return {
      width: 800,
      height: 700
    };
  }

  getPreload () {
    return 'privacy';
  }

  isPopup () {
    return true;
  }

  static show () {
    const window = AbstractWindow.singleton(PrivacyWindow);
    window.show();
  }
}

module.exports = PrivacyWindow;
