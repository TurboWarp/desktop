import translations from './l10n/en.json';
import IntlMessageFormat from 'intl-messageformat';

const escapeHTML = (str) => str.replace(/([<>'"&])/g, (_, l) => `&#${l.charCodeAt(0)};`);

class Redux extends EventTarget {
    constructor () {
        super();
        this.initialized = false;
    }

    initialize () {
        if (!this.initialized) {
            window.__APP_STATE_REDUCER__ = (s) => {
                this.dispatchEvent(new CustomEvent('statechanged', {detail: {action: s}}));
            };

            this.initialized = true;
        }
    }

    dispatch (m) {
        return __APP_STATE_STORE__.dispatch(m);
    }

    get state () {
        return __APP_STATE_STORE__.getState();
    }
}

const tabReduxInstance = new Redux();

class Tab extends EventTarget {
    constructor () {
        super();
        this._seenElements = new WeakSet();
        this.traps = {
            onceValues: {
                get vm () {
                    // We expose VM on window
                    return window.vm;
                }
            }
        };
    }

    get redux () {
        return tabReduxInstance;
    }

    loadScript (src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Cannot load script'));
            script.src = src;
            document.body.appendChild(script);
        });
    }

    waitForElement (selector, { markAsSeen = false } = {}) {
        const firstQuery = document.querySelectorAll(selector);
        for (const element of firstQuery) {
            if (this._seenElements.has(element)) continue;
            if (markAsSeen) this._seenElements.add(element);
            return Promise.resolve(element);
        }

        return new Promise((resolve) =>
            new MutationObserver((mutationsList, observer) => {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    if (this._seenElements.has(element)) continue;
                    observer.disconnect();
                    resolve(element);
                    if (markAsSeen) this._seenElements.add(element);
                    break;
                }
            }).observe(document.documentElement, {
                attributes: false,
                childList: true,
                subtree: true,
            })
        );
    }

    get editorMode () {
        // stubbed
        return 'editor';
    }
}

class Settings {
    constructor (manifest) {
        this._settings = manifest.settings;
    }

    get (id) {
        for (const setting of this._settings) {
            if (setting.id === id) {
                return setting.default;
            }
        }
        throw new Error('No setting: ' + id);
    }
}

class Self {
    constructor (id) {
        this.dir = `addon-files/${id}`;
        this.lib = 'addon-files/libraries-raw';
    }
}

const addonInstances = [];
class Addon {
    constructor (addonId, manifest) {
        this.tab = new Tab();
        this.settings = new Settings(manifest);
        this.self = new Self(addonId);
    }
}

const emitUrlChange = () => {
    setTimeout(() => {
        for (const addon of addonInstances) {
            // TODO: event detail
            addon.tab.dispatchEvent(new CustomEvent('urlChange'));
        }
    });
};

const originalReplaceState = history.replaceState;
history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    emitUrlChange();
};
const originalPushState = history.pushState;
history.pushState = function (...args) {
    originalPushState.apply(this, args);
    emitUrlChange();
};

class API {
    constructor (id, manifest) {
        this._id = id;
        this.global = global;
        this.console = console;
        this.addon = new Addon(id, manifest);
        this.msg = this.msg.bind(this);
        this.safeMsg = this.safeMsg.bind(this);
    }

    _msg(key, vars, handler) {
        const namespacedKey = `${this._id}/${key}`;
        let translation = translations[namespacedKey];
        if (!translation) {
            return namespacedKey;
        }
        if (handler) {
            translation = handler(translation);
        }
        // TODO: probably a good idea to cache these?
        const messageFormat = new IntlMessageFormat(translation, 'en-US');
        return messageFormat.format(vars);
    }

    msg (key, vars) {
        return this._msg(key, vars, null);
    }

    safeMsg (key, vars) {
        return this._msg(key, vars, escapeHTML);
    }
}

export default API;
