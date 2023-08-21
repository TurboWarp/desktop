const BaseWindow = require('./base');
const ProjectsCommonHandlers = require('../projects-common-handlers');

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
}

module.exports = PackagerPreviewWindow;
