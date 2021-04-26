import {ipcRenderer} from 'electron';
import getTranslations from '../../l10n/index';

let locale = navigator.language;
let translations = getTranslations(locale);

export const localeChanged = newLocale => {
  ipcRenderer.send('locale-changed', newLocale);
  if (newLocale === locale) {
    return;
  }
  locale = newLocale;
  translations = getTranslations(locale);
};

export const getTranslation = key => {
  return translations[key] || key;
};
