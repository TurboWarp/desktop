const AbstractWindow = require('./abstract');
const {APP_NAME} = require('../brand');
const {translate, getLocale, getStrings} = require('../l10n');

class SecurityState {
  constructor () {
    this.allowedReadClipboard = false;
    this.allowedNotifications = false;

    this._isPromptLocked = false;
    this._queuedPromptCallbacks = [];
  }

  acquirePromptLock () {
    let released = false;

    const lock = {
      releaseLock: () => {
        // This should only be called once per lock, but since this is security sensitive, we'll still try to avoid
        // letting this get into a bad state.
        if (released) {
          throw new Error('releaseLock() called twice');
        }
        released = true;

        if (this._queuedPromptCallbacks.length === 0) {
          this._isPromptLocked = false;
        } else {
          const nextCallback = this._queuedPromptCallbacks.shift();
          nextCallback();
        }
      }
    };

    return new Promise((resolve) => {
      if (this._isPromptLocked) {
        this._queuedPromptCallbacks.push(() => resolve(lock));
      } else {
        this._isPromptLocked = true;
        resolve(lock);
      }
    });
  }

  /**
   * @private
   * @type {WeakMap<Electron.BrowserWindow, SecurityState>}
   */
  static _windowMap = new WeakMap();

  /**
   * @param {Electron.BrowserWindow} window
   * @returns {SecurityState}
   */
  static forWindow (window) {
    if (!SecurityState._windowMap.has(window)) {
      SecurityState._windowMap.set(window, new SecurityState());
    }
    return SecurityState._windowMap.get(window);
  }
}

class SecurityPromptWindow extends AbstractWindow {
  /**
   * @param {Electron.BrowserWindow} projectWindow
   * @param {string} type
   */
  constructor (projectWindow, type) {
    super({
      parentWindow: projectWindow
    });

    /** @type {Promise<boolean>} */
    this.promptPromise = new Promise((resolve) => {
      this.promptResolve = resolve;
    });

    this.ipc.on('init', (event) => {
      event.returnValue = {
        type,
        APP_NAME,
        locale: getLocale(),
        strings: getStrings()
      };
    });

    this.ipc.handle('ready', (event, options) => {
      const contentHeight = +options.height;

      const [minWidth, minHeight] = this.window.getMinimumSize();
      if (contentHeight < minHeight) {
        this.window.setMinimumSize(minWidth, contentHeight);
      }
      this.window.setContentSize(this.getDimensions().width, contentHeight, false);

      this.show();
    });

    this.ipc.handle('done', (event, allowed) => {
      this.promptResolve(!!allowed);

      // destroy() won't run the close event
      this.window.destroy();
    });

    this.window.on('close', () => {
      this.promptResolve(false);
    });

    this.window.setTitle(`${translate('security-prompt.title')} - ${APP_NAME}`);
    this.loadURL('tw-security-prompt://./security-prompt.html');
  }

  getDimensions () {
    return {
      width: 440,
      height: 320
    };
  }

  getPreload () {
    return 'security-prompt';
  }

  isPopup () {
    return true;
  }

  done () {
    return this.promptPromise;
  }

  static async requestReadClipboard (window) {
    const state = SecurityState.forWindow(window);
    if (!state.allowedReadClipboard) {
      const {releaseLock} = await state.acquirePromptLock();
      state.allowedReadClipboard = await new SecurityPromptWindow(window, 'read-clipboard').done();
      releaseLock();
    }
    return state.allowedReadClipboard;  
  }

  static async requestNotifications (window) {
    const state = SecurityState.forWindow(window);
    if (!state.allowedNotifications) {
      const {releaseLock} = await state.acquirePromptLock();
      state.allowedNotifications = await new SecurityPromptWindow(window, 'notifications').done();
      releaseLock();
    }
    return state.allowedNotifications;  
  }
}

module.exports = SecurityPromptWindow;
