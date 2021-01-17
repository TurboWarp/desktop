import AddonRunner from './api';
import addons from './addons';
import AddonSettingsAPI from './settings-api';
import {ipcRenderer} from 'electron';

try {
    const enabledAddons = [];

    for (const addonId of addons) {
        const manifest = require(`./addons/${addonId}/addon.json`);
        if (!AddonSettingsAPI.getEnabled(addonId, manifest)) {
            continue;
        }

        const runner = new AddonRunner(addonId, manifest);
        enabledAddons.push(runner);
        runner.run();
    }

    ipcRenderer.on('addon-settings-changed', () => {
        AddonSettingsAPI.reread();
        for (const runner of enabledAddons) {
            runner.settingsChanged();
        }
    });
} catch (e) {
    console.error('Addon error', e);
}
