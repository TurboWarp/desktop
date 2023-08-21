const { BrowserWindow, screen } = require('electron');
const path = require('path');
const openExternal = require('../open-external');

/** @type {Map<unknown, BaseWindow[]>} */
const windowsByClass = new Map();

class BaseWindow {
  constructor (existingWindow) {
    this.window = existingWindow || new BrowserWindow(this.getWindowOptions());
    this.window.webContents.setWindowOpenHandler(this.handleWindowOpen.bind(this));
    this.window.webContents.on('before-input-event', this.handleInput.bind(this));
    this.applySettings();

    this.initialURL = 'about:blank';

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
    // to be overridden
    return [200, 200];
  }

  isPopup () {
    // to be overridden
    return false;
  }

  getBackgroundColor () {
    // to be overridden
    return '#ffffff';
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

    options.backgroundColor = this.getBackgroundColor();

    // On Linux the icon doesn't get baked into the executable as it does on other platforms
    if (process.platform === 'linux') {
      options.icon = path.resolve(__dirname, '../../art/icon.png');
    }

    return options;
  }

  loadURL (url) {
    this.initialURL = url;
    return this.window.loadURL(url);
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
   * @param {Electron.Event} event
   * @param {Electron.Input} input
   */
  handleInput (event, input) {
    if (input.isAutoRepeat || input.isComposing || input.type !== 'keyDown' || input.meta) {
      return;
    }

    // On macOS, these shortcuts are handled by the menu bar
    if (process.platform !== 'darwin') {
      const webContents = this.window.webContents;

      // Ctrl+Shift+I to open dev tools
      if (input.control && input.shift && input.key.toLowerCase() === 'i' && !input.alt) {
        event.preventDefault();
        webContents.toggleDevTools();
      }

      // Ctrl+N to open new window
      if (input.control && input.key.toLowerCase() === 'n') {
        event.preventDefault();

        // Imported late to due circular dependencies
        const EditorWindow = require('./editor');
        EditorWindow.newWindow();
      }

      // Ctrl+Equals/Plus to zoom in (depends on keyboard layout)
      if (input.control && (input.key === '=' || input.key === '+')) {
        event.preventDefault();
        webContents.setZoomLevel(webContents.getZoomLevel() + 1);
      }

      // Ctrl+Minus/Underscore to zoom out
      if (input.control && input.key === '-') {
        event.preventDefault();
        webContents.setZoomLevel(webContents.getZoomLevel() - 1);
      }

      // Ctrl+0 to reset zoom
      if (input.control && input.key === '0') {
        event.preventDefault();
        webContents.setZoomLevel(0);
      }

      // F11 and alt+enter to toggle fullscreen
      if (input.key === 'F11' || (input.key === 'Enter' && input.alt)) {
        event.preventDefault();
        this.window.setFullScreen(!this.window.isFullScreen());
      }

      // Escape to exit fullscreen or close popup windows
      if (input.key === 'Escape') {
        if (this.window.isFullScreen()) {
          event.preventDefault();
          this.window.setFullScreen(false);
        } else if (this.isPopup()) {
          event.preventDefault();
          this.window.close();
        }
      }

      // Ctrl+R to reload
      if (input.control && input.key.toLowerCase() === 'r' && this.initialURL !== 'about:blank') {
        event.preventDefault();
        webContents.loadURL(this.initialURL);
      }
    }
  }

  /**
   * @see {Electron.Session.setPermissionCheckHandler}
   * @param {string} permisson
   * @param {Electron.PermissionCheckHandlerHandlerDetails} details
   * @returns {boolean}
   */
  handlePermissionCheck (permisson, details) {
    // to be overridden
    return permisson === 'accessibility-events';
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
