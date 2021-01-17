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

        if (manifest.userstyles) {
            for (const userstyle of manifest.userstyles) {
                const source = require(`./addons/${addonId}/${userstyle.url}`);
                const style = document.createElement('style');
                style.className = 'scratch-addons-theme';
                style.dataset.addonId = addonId;
                style.innerText = source;
                // Insert styles at the start of the body so that they have higher precedence than those in <head>
                document.body.insertBefore(style, document.body.firstChild);
            }
        }

        if (manifest.settings) {
            for (const setting of manifest.settings) {
                const settinId = setting.id;
                document.documentElement.style.setProperty(
                    `--${addonId.replace(/-([a-z])/g, (g) => g[1].toUpperCase())}-${settinId.replace(/-([a-z])/g, (g) =>
                        g[1].toUpperCase()
                    )}`,
                    AddonSettingsAPI.getSettingValue(addonId, manifest, settinId)
                );
            }
        }

        if (manifest.userscripts) {
            for (const userscript of manifest.userscripts) {
                require(`./addons/${addonId}/${userscript.url}`).default(api);
            }
        }
    }
} catch (e) {
    console.error('Addon error', e);
}
