import translations from './l10n/en.json';

class Tab extends EventTarget {
    constructor () {
        super();
        this._seenElements = new WeakSet();
        this.traps = {
            onceValues: {
                // We put vm on window
                vm: window.vm
            }
        }
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

    msg (key) {
        const namespacedKey = `${this._id}/${key}`;
        if (translations[namespacedKey]) {
            return translations[namespacedKey];
        }
        return key;
    }

    safeMsg (key) {
        // TODO
        return this.msg(key);
    }
}

export default API;
