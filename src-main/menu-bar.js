const {Menu} = require('electron');
const {translate} = require('./l10n');
const openExternal = require('./open-external');
const {APP_NAME} = require('./brand');
const AboutWindow = require('./windows/about');
const DesktopSettingsWindow = require('./windows/desktop-settings');

const rebuildMenuBar = () => {
  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      {
        label: APP_NAME,
        submenu: [
          {
            label: translate('menu.about').replace('{APP_NAME}', APP_NAME),
            click: () => {
              AboutWindow.show();
            }
          },
          {
            type: 'separator'
          },
          {
            label: translate('menu.settings'),
            accelerator: 'Cmd+,',
            click: () => {
              DesktopSettingsWindow.show()
            }
          },
          {
            type: 'separator'
          },
          {
            role: 'services'
          },
          {
            type: 'separator'
          },
          {
            role: 'hide'
          },
          {
            role: 'hideOthers'
          },
          {
            role: 'unhide'
          },
          {
            type: 'separator'
          },
          {
            role: 'quit'
          }
        ]
      },
      {
        role: 'fileMenu',
        submenu: [
          {
            label: translate('menu.new-window'),
            accelerator: 'Cmd+N',
            click: () => {
              // Imported late due to circular dependency
              const EditorWindow = require('./windows/editor');
              EditorWindow.newWindow();
            }
          }
        ]
      },
      {
        role: 'editMenu'
      },
      {
        role: 'viewMenu'
      },
      {
        role: 'windowMenu'
      },
      {
        role: 'help',
        submenu: [
          {
            label: translate('menu.learn-more'),
            click: () => {
              openExternal('https://desktop.turbowarp.org/')
            }
          }
        ]
      }
    ]));
  } else {
    Menu.setApplicationMenu(null);
  }
};

rebuildMenuBar();

module.exports = rebuildMenuBar;
