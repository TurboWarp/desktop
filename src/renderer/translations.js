import {ipcRenderer} from 'electron';
import {getTranslations, getLanguages} from '../l10n/';
import {detectLocale} from 'scratch-gui/src/lib/detect-locale';

export let locale = detectLocale(getLanguages());
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
