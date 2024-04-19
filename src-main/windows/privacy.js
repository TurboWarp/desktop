const AbstractWindow = require('./abstract');
const DesktopSettingsWindow = require('./desktop-settings');
const {translate} = require('../l10n');
const {APP_NAME} = require('../brand');
const {isEnabledAtBuildTime} = require('../update-checker');

class PrivacyWindow extends AbstractWindow {
  constructor () {
    super();

    const ipc = this.window.webContents.ipc;

    ipc.on('is-update-checker-allowed', (e) => {
      e.returnValue = isEnabledAtBuildTime();
    });

    ipc.handle('open-desktop-settings', () => {
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
