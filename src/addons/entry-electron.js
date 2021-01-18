import {ipcRenderer} from 'electron';
import AddonRunner from './api';
import addons from './addons';
import SettingsStore from './settings-store';

for (const [id, manifest] of Object.entries(addons)) {
    if (!SettingsStore.getAddonEnabled(id)) {
        continue;
    }
    const runner = new AddonRunner(id, manifest);
    runner.run();
}

ipcRenderer.on('addon-settings-changed', () => {
    SettingsStore.reread();
});
