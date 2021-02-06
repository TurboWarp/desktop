import englishTranslations from './en.json';
import otherTranslations from './translations.json';

const getTranslations = locale => {
  const result = Object.assign({}, englishTranslations);
  if (locale !== 'en') {
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
  }
  return result;
};

export default getTranslations;
