import addons from './addons';

const SETTINGS_KEY = 'tw:addons';

class SettingsStore extends EventTarget {
    constructor () {
        super();
        this.store = this.readLocalStorage();
    }

    /**
     * @private
     */
    readLocalStorage () {
        try {
            const value = localStorage.getItem(SETTINGS_KEY);
            if (value) {
                return JSON.parse(value);
            }
        } catch (e) {
            // ignore
        }
        return {};
    }

    /**
     * @private
     */
    saveToLocalStorage () {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.store));
        } catch (e) {
            // ignore
        }
    }

    /**
     * @private
     */
    getStorageKey (addonId, key) {
        return `${addonId}/${key}`;
    }

    /**
     * @private
     */
    getAddonManifest (addonId) {
        if (addons[addonId]) {
            return addons[addonId];
        }
        throw new Error(`Unknown addon: ${addonId}`);
    }

    getAddonEnabled (addonId) {
        const key = this.getStorageKey(addonId, 'enabled');
        if (this.store.hasOwnProperty(key)) {
            return this.store[key];
        }
        const manifest = this.getAddonManifest(addonId);
        return !!manifest.enabledByDefault;
    }

    getAddonSetting (addonId, settingId) {
        const key = this.getStorageKey(addonId, settingId);
        if (this.store.hasOwnProperty(key)) {
            return this.store[key];
        }
        const manifest = this.getAddonManifest(addonId);
        if (manifest.settings) {
            for (const setting of manifest.settings) {
                if (setting.id === settingId) {
                    return setting.default;
                }
            }
        }
        throw new Error(`Unknown setting: ${settingId}`);
    }

    getDefaultSettings (addonId) {
        const result = {};
        const manifest = this.getAddonManifest(addonId);
        for (const {id, default: value} of manifest.settings) {
            result[id] = value;
        }
        return result;
    }

    /**
     * @private
     */
    getAddonSettingObject (addonId, settingId) {
        const manifest = this.getAddonManifest(addonId);
        if (!manifest.settings) {
            return null;
        }
        for (const setting of manifest.settings) {
            if (setting.id === settingId) {
                return setting;
            }
        }
        return null;
    }

    doesAddonHaveSettings (addonId) {
        for (const key of Object.keys(this.store)) {
            if (key.startsWith(addonId)) {
                return true;
            }
        }
        return false;
    }

    setAddonSetting (addonId, settingId, value) {
        const settingObject = this.getAddonSettingObject(addonId, settingId);
        const reloadRequired = !(settingObject && settingObject.reloadRequired === false);
        const key = this.getStorageKey(addonId, settingId);
        this.store[key] = value;
        this.saveToLocalStorage();
        this.dispatchEvent(new CustomEvent('setting-changed', {
            detail: {
                addonId,
                settingId,
                reloadRequired,
                value
            }
        }));
    }

    setAddonEnabled (addonId, enabled) {
        this.setAddonSetting(addonId, 'enabled', enabled);
    }

    applyAddonPreset (addonId, presetId) {
        const manifest = this.getAddonManifest();
        for (const {id, values} of manifest.presets) {
            if (id !== presetId) {
                continue;
            }
            const settings = {
                ...this.getDefaultSettings(addonId),
                ...values
            };
            for (const key of Object.keys(settings)) {
                this.setAddonSetting(addonId, key, settings[key]);
            }
            break;
        }
        throw new Error(`Unknown preset: ${presetId}`);
    }

    resetAllAddons () {
        this.store = {};
        this.saveToLocalStorage();
        this.dispatchEvent(new CustomEvent('reset-all'));
    }

    resetAddon (addonId) {
        for (const key of Object.keys(this.store)) {
            if (key.startsWith(addonId)) {
                delete this.store[key];
            }
        }
        this.saveToLocalStorage();
        this.dispatchEvent(new CustomEvent('reset-addon', {
            detail: {
                addonId
            }
        }));
    }

    reread () {
        this.store = this.readLocalStorage();
        this.dispatchEvent(new CustomEvent('reread'));
    }
}

export default new SettingsStore();
