const ProjectRunningWindow = require('./project-running-window');
const {translate} = require('../l10n');
const {APP_NAME} = require('../brand');

/**
 * @fileoverview Used when a ProjectRunningWindow opens a data: URL.
 */

class DataPreviewWindow extends ProjectRunningWindow {
  /**
   * @param {Electron.BrowserWindow} parentWindow
   * @param {string} dataURL
   */
  constructor (parentWindow, dataURL) {
    super({
      parentWindow
    });

    this.window.setTitle(`${translate('data-preview.title')} - ${APP_NAME}`);
    this.loadURL(dataURL);
    this.show();
  }

  getDimensions () {
    return {
      width: 480,
      height: 360
    };
  }

  isPopup () {
    return true;
  }

  static open (parentWindow, dataURL) {
    new DataPreviewWindow(parentWindow, dataURL);
  }
}

module.exports = DataPreviewWindow;
