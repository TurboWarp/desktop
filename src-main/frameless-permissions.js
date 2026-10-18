// Some Electron permission requests and checks are not tied to a web contents, so we can't delegate
// permission checks to the AbstractWindow instance. Those requests get handled here.

const PROJECT_RUNNING_ORIGINS = [
  'tw-editor://./'
];

/**
 * @param {string} permission
 * @param {string} requestingOrigin
 * @param {Electron.PermissionRequest} details
 * @returns {boolean}
 */
const check = (permission, requestingOrigin, details) => {
  return PROJECT_RUNNING_ORIGINS.includes(requestingOrigin) && permission === 'fileSystem';
};

/**
 * @param {string} permission
 * @param {Electron.PermissionRequest} details 
 * @returns {boolean}
 */
const request = (permission, details) => {
  return false;
};

module.exports = {
  check,
  request
};
