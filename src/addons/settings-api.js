const SETTINGS_KEY = 'tw:addons';

const readLocalStorage = () => {
    try {
        const value = localStorage.getItem(SETTINGS_KEY);
        if (value) {
            return JSON.parse(value);
        }
    } catch (e) {
        // ignore
    }
    return {};
};

const saveToLocalStorage = () => {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(storage));
    } catch (e) {
        // ignore
    }
};

let storage = readLocalStorage();

const getAddonStorage = (addonId) => {
    return storage[addonId] || null;
};

const getOrCreateAddonStorage = (addonId) => {
    if (!storage[addonId]) {
        storage[addonId] = {};
    }
    return storage[addonId];
};

const getEnabled = (addonId, manifest) => {
    const settingStorage = getAddonStorage(addonId);
    if (settingStorage && settingStorage.hasOwnProperty('enabled')) {
        return settingStorage.enabled;
    }
    return manifest.enabledByDefault;
};

const getSettingValue = (addonId, manifest, settingId) => {
    const settingStorage = getAddonStorage(addonId);
    if (settingStorage && settingStorage.hasOwnProperty(settingId)) {
        return settingStorage[settingId];
    }
    if (manifest.settings) {
        for (const setting of manifest.settings) {
            if (setting.id === settingId) {
                return setting.default;
            }
        }
    }
    throw new Error(`Unknown setting: ${settingId}`);
};

const setSettingValue = (addonId, settingId, value) => {
    const settingStorage = getOrCreateAddonStorage(addonId);
    settingStorage[settingId] = value;
    saveToLocalStorage();
};

const setEnabled = (addonId, enabled) => {
    setSettingValue(addonId, 'enabled', enabled);
};

const resetAll = () => {
    for (const key of Object.keys(storage)) {
        delete storage[key];
    }
    saveToLocalStorage();
};

const hasSettingsForAddon = (addonId) => {
    const storage = getAddonStorage(addonId);
    return !!storage;
};

const resetAddon = (addonId) => {
    delete storage[addonId];
    saveToLocalStorage();
};

const reread = () => {
    storage = readLocalStorage();
};

export default {
    getEnabled,
    getSettingValue,
    setSettingValue,
    setEnabled,
    resetAll,
    hasSettingsForAddon,
    resetAddon,
    reread
};
