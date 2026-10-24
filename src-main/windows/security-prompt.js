const AbstractWindow = require('./abstract');
const {APP_NAME} = require('../brand');
const {translate, getLocale, getStrings} = require('../l10n');

class SecurityState {
  constructor () {
    this.allowedReadClipboard = false;
    this.allowedNotifications = false;

    // Incremented each time the window chose to drop permissions.
    this.generation = 0;

    /** @type {SecurityPromptWindow|null} */
    this.activePrompt = null;

    this._isPromptLocked = false;
    this._queuedPromptCallbacks = [];
  }

  dropPermissions () {
    this.generation++;

    this.allowedReadClipboard = false;
    this.allowedNotifications = false;

    if (this.activePrompt) {
      this.activePrompt.window.close();
    }
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

  /**
   * @param {Electron.BrowserWindow} window
   * @param {string} type
   * @returns {Promise<boolean>}
   */
  static async _prompt (window, type) {
    const state = SecurityState.forWindow(window);
    const generation = state.generation;
    const {releaseLock} = await state.acquirePromptLock();
    if (generation !== state.generation) {
      // Request is from a previous project.
      releaseLock();
      return false;
    }
    const prompt = new SecurityPromptWindow(window, type);
    state.activePrompt = prompt;
    const allowed = await prompt.done();
    state.activePrompt = null;
    releaseLock();
    return allowed && generation === state.generation;
  }

  static async requestReadClipboard (window) {
    const state = SecurityState.forWindow(window);
    if (!state.allowedReadClipboard && await SecurityPromptWindow._prompt(window, 'read-clipboard')) {
      state.allowedReadClipboard = true;
    }
    return state.allowedReadClipboard;
  }

  static async requestNotifications (window) {
    const state = SecurityState.forWindow(window);
    if (!state.allowedNotifications && await SecurityPromptWindow._prompt(window, 'notifications')) {
      state.allowedNotifications = true;
    }
    return state.allowedNotifications;
  }

  /**
   * Voluntarily drop permissions granted to the project in a window. The renderer asks for this, so
   * this is not a security boundary: if malicious unsandboxed code already ran in the renderer, it
   * can simply not call this. It only protects the next project from permissions granted to the
   * previous one when nothing in the renderer has been compromised.
   * @param {Electron.BrowserWindow} window
   */
  static dropPermissions (window) {
    SecurityState.forWindow(window).dropPermissions();
  }
}

module.exports = SecurityPromptWindow;
