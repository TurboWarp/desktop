const BaseWindow = require('./base');
const ProjectRunningWindow = require('./project-running-window');
const {translate} = require('../l10n');

class PackagerPreviewWindow extends ProjectRunningWindow {
  constructor (parentWindow, existingWindow) {
    super(existingWindow);

    this.window.setBounds(BaseWindow.calculateWindowBounds(parentWindow.getBounds(), this.window.getBounds()));

    this.show();
  }

  isPopup () {
    return true;
  }

  static getBrowserWindowOverrides () {
    return {
      title: translate('packager.loading-preview'),
      // TODO: would be best to autodetect the right size
      width: 480,
      height: 360,
      useContentSize: true,
      backgroundColor: '#000000',
      webPreferences: {
        preload: null
      },
      // constructor will show it
      show: false
    };
  }
}

module.exports = PackagerPreviewWindow;
