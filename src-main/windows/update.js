const BaseWindow = require('./base');
const {translate} = require('../l10n');

class UpdateWindow extends BaseWindow {
  constructor (latestVersion, isSecurity) {
    super();

    this.window.setTitle(translate('update.title'));

    const params = new URLSearchParams();
    params.set('version', latestVersion);
    params.set('security', isSecurity);

    this.window.on('ready-to-show', () => {
      this.show();
    })

    this.window.loadURL(`tw-update://./update.html?${params.toString()}`);
  }

  getDimensions () {
    return [500, 500];
  }

  enableWebview () {
    return true;
  }

  static updateAvailable (latestVersion, isSecurity) {
    new UpdateWindow(latestVersion, isSecurity);
  }
}

module.exports = UpdateWindow;
