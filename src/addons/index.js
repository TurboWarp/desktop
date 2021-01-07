import API from './api';
import addons from './addons.json';

for (const addonId of addons) {
    if (addonId.startsWith('//')) {
        continue;
    }
    const manifest = require(`./addons/${addonId}/addon.json`);
    const api = new API(addonId, manifest);

    if (manifest.userscripts) {
        for (const userscript of manifest.userscripts) {
            require(`./addons/${addonId}/${userscript.url}`).default(api);
        }
    }

    if (manifest.userstyles) {
        for (const userstyle of manifest.userstyles) {
            const source = require(`./addons/${addonId}/${userstyle.url}`);
            const style = document.createElement('style');
            style.innerText = source;
            document.head.appendChild(style);
        }
    }
}
