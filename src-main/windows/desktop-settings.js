const {app, shell} = require('electron');
const AbstractWindow = require('./abstract');
const {translate, getStrings, getLocale} = require('../l10n');
const {APP_NAME} = require('../brand');
const settings = require('../settings');
const {isEnabledAtBuildTime} = require('../update-checker');
const RichPresence = require('../rich-presence');

class DesktopSettingsWindow extends AbstractWindow {
  constructor () {
    super();

    this.window.setTitle(`${translate('desktop-settings.title')} - ${APP_NAME}`);
    this.window.setMinimizable(false);
    this.window.setMaximizable(false);

    const ipc = this.window.webContents.ipc;

    ipc.on('get-strings', (event) => {
      event.returnValue = {
        locale: getLocale(),
        strings: getStrings()
      }
    });

    ipc.on('get-settings', (event) => {
      event.returnValue = {
        updateCheckerAllowed: isEnabledAtBuildTime(),
        updateChecker: settings.updateChecker,
        microphone: settings.microphone,
        camera: settings.camera,
        hardwareAcceleration: settings.hardwareAcceleration,
        backgroundThrottling: settings.backgroundThrottling,
        bypassCORS: settings.bypassCORS,
        spellchecker: settings.spellchecker,
        exitFullscreenOnEscape: settings.exitFullscreenOnEscape,
        richPresence: settings.richPresence
      };
    });

    ipc.handle('set-update-checker', async (event, updateChecker) => {
      settings.updateChecker = updateChecker;
      await settings.save();
    });

    ipc.handle('enumerate-media-devices', async () => {
      // Imported late due to circular dependencies
      const EditorWindow = require('./editor');
      const anEditorWindow = AbstractWindow.getWindowsByClass(EditorWindow)[0];
      if (!anEditorWindow) {
        // If you change this error message, please make sure to update desktop settings' error handling
        throw new Error('Editor must be open');
      }
      return anEditorWindow.enumerateMediaDevices();
    });

    ipc.handle('set-microphone', async (event, microphone) => {
      settings.microphone = microphone;
      await settings.save();
    });

    ipc.handle('set-camera', async (event, camera) => {
      settings.camera = camera;
      await settings.save();
    });

    ipc.handle('set-hardware-acceleration', async (event, hardwareAcceleration) => {
      settings.hardwareAcceleration = hardwareAcceleration;
      await settings.save();
    });

    ipc.handle('set-background-throttling', async (event, backgroundThrottling) => {
      settings.backgroundThrottling = backgroundThrottling;
      AbstractWindow.settingsChanged();
      await settings.save();
    });

    ipc.handle('set-bypass-cors', async (event, bypassCORS) => {
      settings.bypassCORS = bypassCORS;
      await settings.save();
    });

    ipc.handle('set-spellchecker', async (event, spellchecker) => {
      settings.spellchecker = spellchecker;
      AbstractWindow.settingsChanged();
      await settings.save();
    });

    ipc.handle('set-exit-fullscreen-on-escape', async (event, exitFullscreenOnEscape) => {
      settings.exitFullscreenOnEscape = exitFullscreenOnEscape;
      await settings.save();
    });

    ipc.handle('set-rich-presence', async (event, richPresence) => {
      settings.richPresence = richPresence;
      if (richPresence) {
        RichPresence.enable();
      } else {
        RichPresence.disable();
      }
      await settings.save();
    });

    ipc.handle('open-user-data', async () => {
      shell.showItemInFolder(app.getPath('userData'));
    });

    this.loadURL('tw-desktop-settings://./desktop-settings.html');
  }

  getDimensions () {
    return {
      width: 500,
      height: 450
    };
  }

  getPreload () {
    return 'desktop-settings';
  }

  isPopup () {
    return true;
  }

  static show () {
    const window = AbstractWindow.singleton(DesktopSettingsWindow);
    window.show();
  }
}

module.exports = DesktopSettingsWindow;
