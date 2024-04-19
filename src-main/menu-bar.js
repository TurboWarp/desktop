const {Menu} = require('electron');
const {translate} = require('./l10n');
const openExternal = require('./open-external');
const {APP_NAME} = require('./brand');
const AbstractWindow = require('./windows/abstract');
const AboutWindow = require('./windows/about');
const DesktopSettingsWindow = require('./windows/desktop-settings');
const AddonsWindow = require('./windows/addons');
const EditorWindow = require('./windows/editor');
const PackagerWindow = require('./windows/packager');

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
            label: translate('menu.addons'),
            click: () => {
              AddonsWindow.show();
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
              EditorWindow.newWindow();
            }
          },
          {
            label: translate('menu.package'),
            click: (menuItem, browserWindow) => {
              const window = AbstractWindow.getWindowByBrowserWindow(browserWindow);
              if (window instanceof EditorWindow) {
                PackagerWindow.forEditor(window);
              }
            }
          },
          {
            label: translate('menu.close-window'),
            accelerator: 'Cmd+W',
            click: (menuItem, browserWindow) => {
              browserWindow.close();
            }
          }
        ]
      },
      {
        role: 'editMenu'
      },
      {
        role: 'viewMenu',
        submenu: [
          {
            // The default view menu contains both Reload and Force reload; we only need one
            // The default reload also lets windows navigate using pushState(), while this one
            // is a bit more secure.
            label: translate('menu.reload'),
            accelerator: 'Cmd+R',
            click: (menuItem, browserWindow) => {
              const window = AbstractWindow.getWindowByBrowserWindow(browserWindow);
              if (window) {
                window.reload();
              }
            }
          },
          {
            role: 'toggleDevTools'
          },
          {
            type: 'separator'
          },
          {
            role: 'resetZoom'
          },
          {
            role: 'zoomIn'
          },
          {
            role: 'zoomOut'
          },
          {
            type: 'separator'
          },
          {
            role: 'togglefullscreen'
          }
        ]
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
