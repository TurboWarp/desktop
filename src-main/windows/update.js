const AbstractWindow = require('./abstract');
const {translate, getLocale, getStrings} = require('../l10n');
const {APP_NAME} = require('../brand');
const openExternal = require('../open-external');

class UpdateWindow extends AbstractWindow {
  constructor (currentVersion, latestVersion, security) {
    super();

    this.window.setTitle(`${translate('update.window-title')} - ${APP_NAME}`);

    this.ipc.on('get-strings', (event) => {
      event.returnValue = {
        appName: APP_NAME,
        locale: getLocale(),
        strings: getStrings()
      };
    });

    this.ipc.on('get-info', (event) => {
      event.returnValue = {
        currentVersion,
        latestVersion,
        security
      };
    });

    this.ipc.handle('download', () => {
      this.window.destroy();

      const params = new URLSearchParams();
      params.set('from', currentVersion);
      params.set('to', latestVersion);
      openExternal(`https://desktop.turbowarp.org/update_available?${params}`);
    });

    const ignore = (permanently) => {
      const SECOND = 1000;
      const MINUTE = SECOND * 60;
      const HOUR = MINUTE * 60;

      let until;
      if (security) {
        // Security updates can't be ignored.
        until = new Date(0);
      } else if (permanently) {
        // 3000 ought to be enough years into the future...
        until = new Date(3000, 0, 0);
      } else {
        until = new Date();
        until.setTime(until.getTime() + (HOUR * 6));
      }

      // Imported late due to circular dependency
      const {ignoreUpdate} = require('../update-checker');
      ignoreUpdate(latestVersion, until);
    };

    this.ipc.handle('ignore', (event, permanently) => {
      this.window.destroy();
      ignore(permanently);
    });

    this.window.on('close', () => {
      ignore(false);
    });

    this.window.webContents.on('did-finish-load', () => {
      this.show();
    });

    this.loadURL('tw-update://./update.html');
  }

  getDimensions () {
    return {
      width: 600,
      height: 500
    };
  }

  getPreload () {
    return 'update';
  }

  isPopup () {
    return true;
  }

  static updateAvailable (currentVersion, latestVersion, isSecurity) {
    new UpdateWindow(currentVersion, latestVersion, isSecurity);
  }
}

module.exports = UpdateWindow;
