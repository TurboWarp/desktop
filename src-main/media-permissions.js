const {systemPreferences, dialog} = require('electron');
const {translate} = require('./l10n');
const {APP_NAME} = require('./brand');

const showPermissionDeniedWarning = (window, mediaType) => {
  const title = translate(`permission.${mediaType}-denied`);
  const description = translate(`permission.${mediaType}-denied-description`);
  // This prompt currently is only visible in macOS
  const instructions = translate('permission.macos-instructions');
  dialog.showMessageBox(window, {
    title: APP_NAME,
    type: 'warning',
    message: title,
    detail: `${description}\n\n${instructions}`
  });
};

const askForMediaAccess = async (window, mediaType) => {
  const mediaTypeToPermissionType = {
    audio: 'microphone',
    video: 'camera'
  };
  if (!Object.prototype.hasOwnProperty.call(mediaTypeToPermissionType, mediaType)) {
    return false;
  }

  if (systemPreferences.askForMediaAccess) {
    const allowed = await systemPreferences.askForMediaAccess(mediaTypeToPermissionType[mediaType]);
    if (!allowed) {
      showPermissionDeniedWarning(window, mediaType);
    }
    return allowed;
  }

  // For now we'll just assume we have access which is usually the case.
  // In the future we should see if it's possible to detect this in snap and flatpak
  return true;
};

module.exports = askForMediaAccess;
