const {app, dialog} = require('electron');
const path = require('path');
const BaseWindow = require('./base');
const {translate} = require('../l10n/index');
const {APP_NAME} = require('../brand');
const prompts = require('../prompts');
const {writeFileAtomic} = require('../atomic-write-stream');

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

    ipc.handle('export-settings', async (event, settings) => {
      const result = await dialog.showSaveDialog(this.window, {
        defaultPath: path.join(app.getPath('downloads'), 'turbowarp-addon-settings.json'),
        filters: [
          {
            name: 'JSON',
            extensions: ['json']
          }
        ]
      });
      if (result.canceled) {
        return;
      }
      await writeFileAtomic(result.filePath, settings);
    });

    this.loadURL(`tw-editor://./addons/addons.html`);
  }

  getDimensions () {
    return {
      width: 700,
      height: 650
    };
  }

  getPreload () {
    return 'addons';
  }

  isPopup () {
    return true;
  }

  getBackgroundColor () {
    return '#111111';
  }

  static show () {
    const window = BaseWindow.singleton(AddonsWindow);
    window.show();
  }
}

module.exports = AddonsWindow;
