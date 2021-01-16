import addons from './addons';

export default function getTranslations (lang) {
  const result = {};
  for (const addon of addons) {
    try {
      const english = require(`./addons-l10n/en/${addon}.json`);
      const translations = require(`./addons-l10n/${lang}/${addon}.json`);
      Object.assign(result, english, translations);
    } catch (e) {
      // Probably couldn't find a translation file. This is fine to ignore as not all addons have translations.
    }
  }
  return result;
}
