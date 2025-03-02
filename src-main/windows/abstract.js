const { BrowserWindow, screen, session } = require('electron');
const path = require('path');
const openExternal = require('../open-external');
const settings = require('../settings');

/** @type {Map<unknown, AbstractWindow[]>} */
const windowsByClass = new Map();

/**
 * @typedef AbstractWindowOptions
 * @property {Electron.BrowserWindow} [existingWindow]
 * @property {Electron.BrowserWindow} [parentWindow]
 */

class AbstractWindow {
  /** @param {AbstractWindowOptions} options */
  constructor (options = {}) {
    this.parentWindow = options.parentWindow || null;

    /** @type {Electron.BrowserWindow} */
    this.window = options.existingWindow || new BrowserWindow(this.getWindowOptions());
    this.window.webContents.on('before-input-event', this.handleInput.bind(this));
    this.applySettings();

    if (!options.existingWindow) {
      // getCursorScreenPoint() segfaults on Linux in Wayland if called before a BrowserWindow is created, so
      // we can't compute this in getWindowOptions().
      // https://github.com/electron/electron/issues/35471
      let bounds;
      if (this.parentWindow) {
        options.parent = this.parentWindow;
        bounds = AbstractWindow.calculateWindowBounds(this.parentWindow.getBounds(), this.getDimensions());
      } else {
        // Electron's default window placement handles multimonitor setups extremely poorly on Linux
        // This also makes the window open on whatever monitor the mouse is on, which is probably what the user wants
        const activeScreen = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
        bounds = AbstractWindow.calculateWindowBounds(activeScreen.workArea, this.getDimensions());
      }
      this.window.setBounds(bounds);
    }

    /**
     * ipcMain object scoped to the window's main frame only.
     */
    this.ipc = this.window.webContents.mainFrame.ipc;

    this.initialURL = null;
    this.protocol = null;

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
    session.defaultSession.setSpellCheckerEnabled(settings.spellchecker);

    for (const window of AbstractWindow.getAllWindows()) {
      window.applySettings();
    }
  }

  static getWindowByBrowserWindow (browserWindow) {
    for (const windows of windowsByClass.values()) {
      for (const window of windows) {
        if (window.window === browserWindow) {
          return window;
        }
      }
    }
    return null;
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

  /**
   * @template T
   * @param {{new(): T}} cls 
   * @returns {T[]}
   */
  static getWindowsByClass (cls) {
    return windowsByClass.get(cls) || [];
  }

  /**
   * @template T
   * @param {{new(): T}} cls
   * @returns {T}
   */
  static singleton (cls) {
    const windows = AbstractWindow.getWindowsByClass(cls);
    if (windows.length) {
      return windows[0];
    }
    return new cls();
  }

  /**
   * @param {Electron.Rectangle} area
   * @param {{width: number; height: number;}} preferredDimensions
   * @returns {Electron.Rectangle}
   */
  static calculateWindowBounds (area, preferredDimensions) {
    const width = Math.min(area.width, preferredDimensions.width);
    const height = Math.min(area.height, preferredDimensions.height);
    const x = area.x + ((area.width - width) / 2);
    const y = area.y + ((area.height - height) / 2);
    return {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  getPreload () {
    // to be overridden
  }

  getDimensions () {
    // to be overridden
    return {
      width: 200,
      height: 200
    };
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

    options.useContentSize = true;
    options.minWidth = 200;
    options.minHeight = 200;

    // Child classes are expected to show the window on their own
    options.show = false;

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
      // This path won't work in development but it will work in production
      options.icon = path.resolve(__dirname, '../../../icon.png');
    }

    return options;
  }

  loadURL (url) {
    this.initialURL = url;
    this.protocol = new URL(url).protocol;
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

    // Escape to exit fullscreen or close popup windows
    if (input.key === 'Escape') {
      if (settings.exitFullscreenOnEscape && this.window.isFullScreen() && this.canExitFullscreenByPressingEscape()) {
        event.preventDefault();
        this.window.setFullScreen(false);
      } else if (this.isPopup()) {
        event.preventDefault();
        this.window.close();  
      }
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
        // Don't do preventDefault() for alt+enter as then the renderer won't receive the
        // event that the alt key was unpressed, which causes the costume editor to get
        // stuck in duplicating mode.
        if (input.key === 'F11') {
          event.preventDefault();
        }
        this.window.setFullScreen(!this.window.isFullScreen());
      }

      // Ctrl+R to reload
      if (input.control && input.key.toLowerCase() === 'r') {
        event.preventDefault();
        this.reload();
      }
    }
  }

  /**
   * @param {Electron.WillNavigateEvent} event 
   * @param {string} url
   */
  handleWillNavigate (event, url) {
    // Only allow windows to refresh, not navigate anywhere.
    if (url !== this.initialURL) {
      event.preventDefault();
      openExternal(url);
    }
  }

  reload () {
    // Don't use webContents.reload() because it allows the page to navigate by using
    // history.pushState() then location.reload()
    if (this.initialURL !== null) {
      this.window.webContents.loadURL(this.initialURL);
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
   * @param {Electron.OnHeadersReceivedListenerDetails} details
   * @param {(response: Electron.HeadersReceivedResponse) => void} callback
   */
  onHeadersReceived (details, callback) {
    // to be overridden
    callback({});
  }

  /**
   * @param {Electron.RenderProcessGoneDetails} details
   * @returns {boolean} Return true to cancel default warning message.
   */
  handleRendererProcessGone (details) {
    // to be overridden
    return false;
  }

  applySettings () {
    // to be overrridden
  }

  /**
   * Whether or not this window allows leaving OS-level fullscreen by pressing escape.
   * You do not need to check `settings` here. The caller will do that for you.
   * @returns {boolean}
   */
  canExitFullscreenByPressingEscape () {
    return true;
  }
}

module.exports = AbstractWindow;
