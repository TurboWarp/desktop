import addons from './addons';

export default function getTranslations (lang) {
  const result = {};
  for (const addonId of Object.keys(addons)) {
    try {
      const english = require(`./addons-l10n/en/${addonId}.json`);
      Object.assign(result, english);
    } catch (e) {
      // ignore
    }
    if (lang !== 'en') {
      try {
        const translations = require(`./addons-l10n/${lang}/${addonId}.json`);
        Object.assign(result, translations);
      } catch (e) {
        // ignore
      }
    }
  }
  return result;
}
