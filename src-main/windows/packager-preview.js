const BaseWindow = require('./base');
const ProjectsCommonHandlers = require('../projects-common-handlers');
const {translate} = require('../l10n');

class PackagerPreviewWindow extends BaseWindow {
  constructor (parentWindow, existingWindow) {
    super(existingWindow);

    // Center the window on the parent
    const parentBounds = parentWindow.getBounds();
    const newBounds = this.window.getBounds();
    const centerX = parentBounds.x + (parentBounds.width / 2) - (newBounds.width / 2);
    const centerY = parentBounds.y + (parentBounds.height / 2) - (newBounds.height / 2);
    this.window.setPosition(centerX, centerY);

    this.show();
  }

  isPopup () {
    return true;
  }

  handlePermissionCheck (permission, details) {
    return ProjectsCommonHandlers.handlePermissionCheck(permission, details);
  }

  handlePermissionRequest (permission, details) {
    return ProjectsCommonHandlers.handlePermissionRequest(permission, details);
  }

  onBeforeRequest (details, callback) {
    ProjectsCommonHandlers.onBeforeRequest(details, callback);
  }

  onHeadersReceived (details, callback) {
    ProjectsCommonHandlers.onHeadersReceived(details, callback);
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
