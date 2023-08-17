const englishTranslationsWithContext = require('./en.json');
const otherTranslations = require('./generated-translations.json');

const englishTranslations = {};
for (const [id, message] of Object.entries(englishTranslationsWithContext)) {
  englishTranslations[id] = message.string;
}

let currentLocale = 'en';
let currentTranslations = englishTranslations;

const getTranslations = locale => {
  const result = Object.assign({}, englishTranslationsWithContext);

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

const getLocales = () => [
  'en',
  ...Object.keys(otherTranslations)
];

const setLocale = locale => {
  currentLocale = locale;
  currentTranslations = getTranslations(locale);
};

const translate = id => {
  return currentTranslations[id] || id;
};

module.exports = {
  getTranslations,
  getLocales,
  setLocale,
  translate
};
