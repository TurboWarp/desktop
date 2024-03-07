const packageJSON = require('../package.json');

/**
 * @returns {'win32-appx'|'darwin-mas'|'linux-flatpak'|'linux-snap'|NodeJS.Platform}
 */
const getPlatform = () => {
  if (process.platform === 'win32' && process.windowsStore) {
    return 'win32-appx';
  }

  if (process.platform === 'darwin' && process.mas) {
    return 'darwin-mas';
  }

  if (process.platform === 'linux') {
    if (process.env.FLATPAK_ID) {
      return 'linux-flatpak';
    }
    if (process.env.SNAP) {
      return 'linux-snap';
    }
  }

  return process.platform;
};

/**
 * @returns {string}
 */
const getDist = () => {
  if (process.env.TW_DIST_ID) {
    return `${process.env.TW_DIST_ID}-env`;
  }
  if (packageJSON.tw_dist) {
    return packageJSON.tw_dist;
  }
  return 'none';
};

module.exports = {
  getPlatform,
  getDist
};
