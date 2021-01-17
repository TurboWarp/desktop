import API from './api';
import addons from './addons';
import AddonSettingsAPI from './settings-api';

try {
    for (const addonId of addons) {
        const manifest = require(`./addons/${addonId}/addon.json`);
        if (!AddonSettingsAPI.getEnabled(addonId, manifest)) {
            continue;
        }

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
                // Insert styles at the start of the body so that they have higher precedence than those in <head>
                document.body.insertBefore(style, document.body.firstChild);
            }
        }
    }
} catch (e) {
    console.error('Addon error', e);
}
