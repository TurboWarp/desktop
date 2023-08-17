const {app, protocol} = require('electron');
const path = require('path');

const FILE_SCHEMES = {
  'tw-editor': {
    root: path.resolve(__dirname, '../dist-renderer-webpack/editor'),
    standard: true,
    supportFetch: true
  },
  'tw-desktop-settings': {
    root: path.resolve(__dirname, '../src-renderer/desktop-settings')
  },
  'tw-privacy': {
    root: path.resolve(__dirname, '../src-renderer/privacy')
  },
  'tw-about': {
    root: path.resolve(__dirname, '../src-renderer/about')
  }
};

protocol.registerSchemesAsPrivileged(Object.entries(FILE_SCHEMES).map(([scheme, metadata]) => ({
  scheme,
  privileges: {
    standard: !!metadata.standard,
    supportFetchAPI: !!metadata.supportFetch
  }
})));

app.whenReady().then(() => {
  for (const [scheme, metadata] of Object.entries(FILE_SCHEMES)) {
    // Forcing a trailing / slightly improves security
    const root = path.join(metadata.root, '/');

    protocol.registerFileProtocol(scheme, (request, callback) => {
      const url = new URL(request.url);
      const resolved = path.join(root, url.pathname);
      console.log(resolved);
      if (resolved.startsWith(root)) {
        callback(resolved);
      } else {
        callback({
          statusCode: 404
        });
      }
    });
  }
});