const {Menu} = require('electron');
const {translate} = require('./l10n');
const openExternal = require('./open-external');
const EditorWindow = require('./windows/editor');

if (process.platform === 'darwin') {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      role: 'appMenu'
    },
    {
      role: 'fileMenu',
      submenu: [
        {
          role: 'quit'
        },
        {
          label: translate('menu.new-window'),
          accelerator: 'Cmd+N',
          click: () => {
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
