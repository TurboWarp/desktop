const {app, dialog} = require('electron');
const path = require('path');
const AbstractWindow = require('./abstract');
const {translate} = require('../l10n/index');
const {APP_NAME} = require('../brand');
const prompts = require('../prompts');
const {writeFileAtomic} = require('../atomic-write-stream');

class AddonsWindow extends AbstractWindow {
  /**
   * @param {string|null} search
   */
  constructor (search) {
    super();

    this.window.on('page-title-updated', event => {
      event.preventDefault();
    });
    this.window.setTitle(`${translate('addon-settings')} - ${APP_NAME}`);

    this.ipc.on('alert', (event, message) => {
      event.returnValue = prompts.alert(this.window, message);
    });

    this.ipc.on('confirm', (event, message) => {
      event.returnValue = prompts.confirm(this.window, message);
    });

    this.ipc.handle('export-settings', async (event, settings) => {
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

    this.loadURL(`tw-editor://./addons/addons.html${search ? `#${search}` : ''}`);
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

  static show (search) {
    // If we were asked to show a specific search query, always open a new window
    // Even if the search was the same as an existing window, we don't have a way to
    // know if the user changed the search.
    let window;
    if (search) {
      const windows = AbstractWindow.getWindowsByClass(AddonsWindow);
      windows.forEach(i => i.window.destroy());
      window = new AddonsWindow(search);
    } else {
      window = AbstractWindow.singleton(AddonsWindow);
    }
    window.show();
  }
}

module.exports = AddonsWindow;
