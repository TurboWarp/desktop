const fs = require('fs');
const path = require('path');
const {PassThrough, Readable} = require('stream');
const zlib = require('zlib');
const {app, protocol} = require('electron');

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
    root: path.resolve(__dirname, '../src-renderer/update'),
  },
  'tw-security-prompt': {
    root: path.resolve(__dirname, '../src-renderer/security-prompt'),
  }
};

const MIME_TYPES = new Map();
MIME_TYPES.set('.html', 'text/html');
MIME_TYPES.set('.js', 'text/javascript');
MIME_TYPES.set('.txt', 'text/plain');
MIME_TYPES.set('.json', 'application/json');
MIME_TYPES.set('.wav', 'audio/wav');
MIME_TYPES.set('.svg', 'image/svg+xml');
MIME_TYPES.set('.png', 'image/png');
MIME_TYPES.set('.jpg', 'image/jpeg');
MIME_TYPES.set('.gif', 'image/gif');
MIME_TYPES.set('.cur', 'image/x-icon');
MIME_TYPES.set('.ico', 'image/x-icon');
MIME_TYPES.set('.mp3', 'audio/mpeg');
MIME_TYPES.set('.wav', 'audio/wav');
MIME_TYPES.set('.ogg', 'audio/ogg');
MIME_TYPES.set('.ttf', 'font/ttf');
MIME_TYPES.set('.otf', 'font/otf');
MIME_TYPES.set('.woff', 'font/woff');
MIME_TYPES.set('.woff2', 'font/woff2');
MIME_TYPES.set('.hex', 'application/octet-stream');

protocol.registerSchemesAsPrivileged(Object.entries(FILE_SCHEMES).map(([scheme, metadata]) => ({
  scheme,
  privileges: {
    standard: !!metadata.standard,
    supportFetchAPI: !!metadata.supportFetch,
    secure: !!metadata.secure
  }
})));

const createStream = (text) => {
  const stream = new PassThrough();
  stream.end(text);
  return stream;
};

const createSchemeHandler = (metadata) => {
  // Forcing a trailing / slightly improves security of the path traversal check later
  const root = path.join(metadata.root, '/');

  /**
   * @param {Electron.ProtocolRequest} request
   * @returns {Promise<{statusCode: number; data: ReadableStream; headers?: Record<string, string>}>}
   */
  return async (request) => {
    const url = new URL(request.url);
    const resolved = path.join(root, url.pathname);
    if (!resolved.startsWith(root)) {
      return {
        statusCode: 404,
        data: createStream('not found')
      };
    }

    const fileExtension = path.extname(url.pathname);
    const mimeType = MIME_TYPES.get(fileExtension);
    if (!mimeType) {
      return {
        statusCode: 404,
        data: createStream('invalid file extension')
      };
    }

    const headers = {
      'content-type': mimeType
    };

    if (metadata.brotli) {
      const fileStream = fs.createReadStream(`${resolved}.br`);
      const decompressStream = zlib.createBrotliDecompress();
      fileStream.pipe(decompressStream);

      return new Promise((resolve) => {
        // TODO: this still returns 200 OK when brotli stream errors
        fileStream.on('open', () => {
          resolve({
            data: decompressStream,
            headers
          });
        });
        fileStream.on('error', () => {
          resolve({
            statusCode: 404,
            data: createStream('read error')
          });
        });
      });
    }

    const fileStream = fs.createReadStream(resolved);
    return new Promise((resolve) => {
      fileStream.on('open', () => {
        resolve({
          data: fileStream,
          headers
        });
      });
      fileStream.on('error', () => {
        resolve({
          statusCode: 404,
          data: createStream('read error')
        });
      });
    });
  };
};

app.whenReady().then(() => {
  for (const [scheme, metadata] of Object.entries(FILE_SCHEMES)) {
    const handle = createSchemeHandler(metadata);

    // Electron 22 does not support protocol.handle() or new Response()
    if (protocol.handle) {
      protocol.handle(scheme, (request) => {
        return handle(request)
          .then((response) => {
            return new Response(Readable.toWeb(response.data), {
              status: response.statusCode,
              headers: response.headers
            });
          })
          .catch((error) => {
            console.error(error);
            return new Response('protocol handler error', {
              status: 500
            })
          });
      });
    } else {
      protocol.registerStreamProtocol(scheme, (request, callback) => {
        handle(request)
          .then(callback)
          .catch((error) => {
            console.error(error);
            callback({
              statusCode: 500,
              data: createStream('protocol handler error')
            });
          });
      });
    }
  }
});
