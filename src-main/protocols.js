const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const {promisify} = require('util');
const {app, protocol} = require('electron');

const readFile = promisify(fs.readFile);
const brotliDecompress = promisify(zlib.brotliDecompress);

const FILE_SCHEMES = {
  'tw-editor': {
    root: path.resolve(__dirname, '../dist-renderer-webpack/editor'),
    standard: true,
    supportFetch: true,
    secure: true
  },
  'tw-desktop-settings': {
    root: path.resolve(__dirname, '../src-renderer/desktop-settings')
  },
  'tw-privacy': {
    root: path.resolve(__dirname, '../src-renderer/privacy')
  },
  'tw-about': {
    root: path.resolve(__dirname, '../src-renderer/about')
  },
  'tw-packager': {
    root: path.resolve(__dirname, '../src-renderer/packager'),
    standard: true,
    secure: true
  },
  'tw-library': {
    root: path.resolve(__dirname, '../dist-library-files'),
    supportFetch: true,
    brotli: true
  },
  'tw-extensions': {
    root: path.resolve(__dirname, '../dist-extensions'),
    supportFetch: true
  },
  'tw-update': {
    root: path.resolve(__dirname, '../src-renderer/update')
  }
};

const MIME_TYPES = new Map();
MIME_TYPES.set('.wav', 'audio/wav');
MIME_TYPES.set('.svg', 'image/svg+xml');
MIME_TYPES.set('.png', 'image/png');

protocol.registerSchemesAsPrivileged(Object.entries(FILE_SCHEMES).map(([scheme, metadata]) => ({
  scheme,
  privileges: {
    standard: !!metadata.standard,
    supportFetchAPI: !!metadata.supportFetch,
    secure: !!metadata.secure
  }
})));

app.whenReady().then(() => {
  for (const [scheme, metadata] of Object.entries(FILE_SCHEMES)) {
    // Forcing a trailing / slightly improves security
    const root = path.join(metadata.root, '/');

    if (metadata.brotli) {
      protocol.registerBufferProtocol(scheme, (request, callback) => {
        const url = new URL(request.url);
        const resolved = path.join(root, `${url.pathname}.br`);
        const fileExtension = path.extname(url.pathname);

        if (!resolved.startsWith(root) || !MIME_TYPES.has(fileExtension)) {
          callback({
            statusCode: 404
          });
          return;
        }

        readFile(resolved)
          .then((compressed) => brotliDecompress(compressed))
          .then((decompressed) => {
            callback({
              data: decompressed,
              mimeType: MIME_TYPES.get(fileExtension)
            });
          })
          .catch((error) => {
            console.error(error);
            callback({
              statusCode: 404
            });
          });
      });
    } else {
      protocol.registerFileProtocol(scheme, (request, callback) => {
        // Don't need to check mime types ourselves as Electron will do it for us.
        const url = new URL(request.url);
        const resolved = path.join(root, url.pathname);
        if (resolved.startsWith(root)) {
          callback(resolved);
        } else {
          callback({
            statusCode: 404
          });
        }
      });
    }
  }
});