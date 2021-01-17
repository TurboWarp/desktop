import addons from './addons';

export default function getTranslations (lang) {
  const result = {};
  for (const addon of addons) {
    try {
      const english = require(`./addons-l10n/en/${addon}.json`);
      Object.assign(result, english);
    } catch (e) {
      // ignore
    }
    if (lang !== 'en') {
      try {
        const translations = require(`./addons-l10n/${lang}/${addon}.json`);
        Object.assign(result, translations);
      } catch (e) {
        // ignore
      }
    }
  }
  return result;
}
