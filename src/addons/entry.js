import {ipcRenderer} from 'electron';
import AddonRunner from './api';
import addons from './addons';
import SettingsStore from './settings-store';

try {
    const enabledAddons = [];

    for (const id of Object.keys(addons)) {
        if (!SettingsStore.getEnabled(id)) {
            continue;
        }

        const manifest = addons[id];
        const runner = new AddonRunner(id, manifest);
        enabledAddons.push(runner);
        runner.run();
    }

    ipcRenderer.on('addon-settings-changed', () => {
        SettingsStore.reread();
        for (const runner of enabledAddons) {
            runner.settingsChanged();
        }
    });
} catch (e) {
    console.error('Addon error', e);
}
