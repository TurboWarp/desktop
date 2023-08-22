const englishTranslationsWithContext = require('./en.json');
const otherTranslations = require('./generated-translations.json');
const settings = require('../settings');

const englishTranslations = {};
for (const [id, message] of Object.entries(englishTranslationsWithContext)) {
  englishTranslations[id] = message.string;
}

let currentLocale;
let currentStrings;

const loadTranslations = (locale) => {
  const result = Object.assign({}, englishTranslations);

  // Try with and without the - for regional variants
  const possible = [locale];
  if (locale.includes('-')) {
    possible.push(locale.split('-')[0]);
  }
  for (const language of possible) {
    const translations = otherTranslations[language];
    if (translations) {
      Object.assign(result, translations);
      break;
    }
  }

  return result;
};

const updateLocale = (locale) => {
  currentLocale = locale;
  currentStrings = loadTranslations(locale);
};

const translate = (id) => currentStrings[id] || id;

const tranlateOrNull = (id) => currentStrings[id] || null;

const getLocale = () => currentLocale;

const getStrings = () => currentStrings;

updateLocale(settings.locale);

module.exports = {
  updateLocale,
  translate,
  tranlateOrNull,
  getLocale,
  getStrings
};
