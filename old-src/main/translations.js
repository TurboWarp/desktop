import {ipcMain} from 'electron'
import {getTranslations} from '../l10n/';
import {get, set} from './store';

const STORAGE_KEY = 'locale';

let locale = get(STORAGE_KEY) || 'en';
let translations = getTranslations(locale);

const log = (...args) => {
  console.log('translations:', ...args);
};

ipcMain.on('locale-changed', (event, newLocale) => {
  if (newLocale === locale) {
    return;
  }
  log(`new locale: ${newLocale}`);
  locale = newLocale;
  set(STORAGE_KEY, locale);
  translations = getTranslations(locale);
});

export const getTranslation = key => {
  return translations[key] || key;
};

export const getTranslationOrNull = key => {
  return translations[key] || null;
};
