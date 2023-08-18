const { BrowserWindow, screen } = require('electron');
const path = require('path');
const openExternal = require('../open-external');

/** @type {Map<unknown, BaseWindow[]>} */
const windowsByClass = new Map();

class BaseWindow {
  constructor () {
    this.window = new BrowserWindow(this.getWindowOptions());
    this.window.webContents.setWindowOpenHandler(this.handleWindowOpen.bind(this));
    this.applySettings();

    const cls = this.constructor;
    if (!windowsByClass.has(cls)) {
      windowsByClass.set(cls, []);
    }
    windowsByClass.get(cls).push(this);
    this.window.on('closed', () => {
      const windows = windowsByClass.get(cls);
      const idx = windows.indexOf(this);
      if (idx !== -1) {
        windows.splice(idx, 1);
      }
    });
  }

  static getAllWindows () {
    const allWindows = [];
    for (const windows of windowsByClass.values()) {
      for (const window of windows) {
        allWindows.push(window);
      }
    }
    return allWindows;
  }

  static settingsChanged () {
    for (const window of BaseWindow.getAllWindows()) {
      window.applySettings();
    }
  }

  static getWindowByWebContents (webContents) {
    for (const windows of windowsByClass.values()) {
      for (const window of windows) {
        if (window.window.webContents === webContents) {
          return window;
        }
      }
    }
    return null;
  }

  static getWindowsByClass (cls) {
    return windowsByClass.get(cls) || [];
  }

  static singleton (cls) {
    const windows = BaseWindow.getWindowsByClass(cls);
    if (windows.length) {
      return windows[0];
    }
    return new cls();
  }

  getPreload () {
    // to be overridden
  }

  getDimensions () {
    return [200, 200];
  }

  getWindowOptions () {
    /** @type {Electron.BrowserWindowConstructorOptions} */
    const options = {};

    const dimensions = this.getDimensions();
    options.width = dimensions[0];
    options.height = dimensions[1];

    options.useContentSize = true;
    options.minWidth = 200;
    options.minHeight = 200;

    // Child classes are expected to show the window on their own
    options.show = false;

    // Electron's default window placement handles multimonitor setups extremely poorly on Linux
    const activeScreen = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    const bounds = activeScreen.workArea;
    options.width = Math.min(bounds.width, options.width);
    options.height = Math.min(bounds.height, options.height);
    options.x = bounds.x + ((bounds.width - options.width) / 2);
    options.y = bounds.y + ((bounds.height - options.height) / 2);

    // These should all be redundant already, but defense-in-depth.
    options.webPreferences = {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    };

    const preloadName = this.getPreload();
    if (preloadName) {
      options.webPreferences.preload = path.resolve(__dirname, '../../src-preload/', `${preloadName}.js`);
    }

    // On Linux the icon doesn't get baked into the executable as it does on other platforms
    if (process.platform === 'linux') {
      options.icon = path.resolve(__dirname, '../../icon.png');
    }

    return options;
  }

  show () {
    this.window.show();
    this.window.focus();
  }

  /**
   * @see {Electron.WebContents.setWindowOpenHandler}
   * @param {Electron.HandlerDetails} details
   */
  handleWindowOpen (details) {
    openExternal(details.url);
    return {
      action: 'deny'
    };
  }

  /**
   * @see {Electron.Session.setPermissionCheckHandler}
   * @param {string} permisson
   * @param {Electron.PermissionCheckHandlerHandlerDetails} details
   * @returns {boolean}
   */
  handlePermissionCheck (permisson, details) {
    // to be overridden
    return false;
  }

  /**
   * @see {Electron.Session.setPermissionRequestHandler}
   * @param {string} permisson
   * @param {Electron.PermissionRequestHandlerHandlerDetails} details
   * @returns {Promise<boolean>}
   */
  async handlePermissionRequest (permisson, details) {
    // to be overridden
    return false;
  }

  /**
   * @param {Electron.OnBeforeRequestListenerDetails} details
   * @param {(response: Electron.CallbackResponse) => void} callback
   */
  onBeforeRequest (details, callback) {
    // to be overridden
    callback({});
  }

  /**
   *
   * @param {Electron.OnHeadersReceivedListenerDetails} details
   * @param {(response: Electron.HeadersReceivedResponse) => void} callback
   */
  onHeadersReceived (details, callback) {
    // to be overridden
    callback({});
  }

  applySettings () {
    // to be overrridden
  }
}

module.exports = BaseWindow;
