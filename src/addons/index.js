import API from './api';
import addons from './addons.json';

for (const addonId of addons) {
    if (addonId.startsWith('//')) {
        continue;
    }
    const manifest = require(`./addons/${addonId}/addon.json`);
    const api = new API(addonId, manifest);

    for (const userscript of manifest.userscripts) {
        require(`./addons/${addonId}/${userscript.url}`).default(api);
    }
}
