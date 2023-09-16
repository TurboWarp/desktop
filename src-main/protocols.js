const path = require('path');
const zlib = require('zlib');
const fs = require('fs');
const {app, protocol, net} = require('electron');

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
    // Forcing a trailing / slightly improves security of the path traversal check later
    const root = path.join(metadata.root, '/');

    protocol.handle(scheme, async (request) => {
      const url = new URL(request.url);
      const resolved = path.join(root, url.pathname);
      if (!resolved.startsWith(root)) {
        return new Response('not found', {
          status: 404
        });
      }

      if (metadata.brotli) {
        const fileExtension = path.extname(url.pathname);
        const mimeType = MIME_TYPES.get(fileExtension);
        if (!mimeType) {
          return new Response('not found', {
            status: 404
          });
        }

        // Would be best if we could somehow stream this (ideally using
        // Content-Encoding: br), but that doesn't seem to work very easily
        // right now.
        const compressed = await new Promise((resolve, reject) => {
          fs.readFile(`${resolved}.br`, (error, data) => {
            if (error) {
              reject(error);
            } else {
              resolve(data);
            }
          });
        });

        const decompressed = await new Promise((resolve, reject) => {
          zlib.brotliDecompress(compressed, (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          });
        });

        return new Response(decompressed, {
          headers: {
            'Content-Type': mimeType
          }
        });
      }

      // net.fetch is probably more efficient than reading the entire file
      // into memory at once.
      return net.fetch(`file://${resolved}`);
    });
  }
});
