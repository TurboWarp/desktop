const addons = [
    "editor-devtools",
    "block-switching",
    "editor-searchable-dropdowns",
    "color-picker",
    "data-category-tweaks-v2",
    "mediarecorder",
    "onion-skinning",
    "editor-stage-left",
    "remove-sprite-confirm",
    "bitmap-copy",
    "editor-theme3",
    "hide-flyout",
    "fix-uploaded-svgs",
];

const addonMap = {};
for (const addonId of addons) {
    const manifest = require(`./addons/${addonId}/addon.json`);
    addonMap[addonId] = manifest;
}

export default addonMap;
