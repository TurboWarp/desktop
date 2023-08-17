const { BrowserWindow, screen } = require('electron');
const path = require('path');

class BaseWindow {
  constructor () {
    this.window = new BrowserWindow(this.getWindowOptions());
  }

  getPreload () {
    // to be overridden
  }

  getDimensions () {
    return [200, 200];
  }

  getWindowOptions () {
    const options = {};

    const dimensions = this.getDimensions();
    options.width = dimensions[0];
    options.height = dimensions[1];

    options.useContentSize = true;
    options.minWidth = 200;
    options.minHeight = 200;

    // Electron's default window placement sucks, at least on Linux
    const activeScreen = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    const bounds = activeScreen.workArea;
    options.width = Math.min(bounds.width, options.width);
    options.height = Math.min(bounds.height, options.height);
    options.x = bounds.x + ((bounds.width - options.width) / 2);
    options.y = bounds.y + ((bounds.height - options.height) / 2);

    options.webPreferences = {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    };

    const preloadName = this.getPreload();
    if (preloadName) {
      options.webPreferences.preload = path.resolve(__dirname, '../../src-preload/', `${preloadName}.js`);
    }

    if (process.platform === 'linux') {
      options.icon = path.resolve(__dirname, '../../icon.png');
    }

    return options;
  }
}

module.exports = BaseWindow;
