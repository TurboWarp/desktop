window.electron = require('electron');

window.require = function (m) {
  // Implement or stub some things to satisfy electron-webpack
  if (m === 'module') {
    return {
      globalPaths: []
    };
  }
  if (m === 'source-map-support/source-map-support.js') {
    return require('source-map-support/source-map-support.js');
  }
  throw new Error(`Refusing to require() module: ${m}`);
};
