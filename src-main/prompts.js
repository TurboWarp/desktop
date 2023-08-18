// Electron ships confirm() and prompt() by default, but for some reason they break can window focus, for example.
// Thus we reimplement our own.

const {dialog} = require('electron');
const {translate} = require('./l10n');

/**
 * @param {Electron.BrowserWindow} window
 * @param {string} message
 */
const alert = (window, message) => {
  dialog.showMessageBoxSync(window, {
    message: '' + message,
    buttons: [
      translate('prompts.ok')
    ],
    noLink: true
  });
};

/**
 * @param {Electron.BrowserWindow} window
 * @param {string} message
 * @returns {boolean}
 */
const confirm = (window, message) => {
  const result = dialog.showMessageBoxSync(window, {
    message: '' + message,
    buttons: [
      translate('prompts.ok'),
      translate('prompts.cancel')
    ],
    defaultId: 0,
    cancelId: 1,
    noLink: true
  });
  return result === 0;
};

module.exports = {
  alert,
  confirm
};
