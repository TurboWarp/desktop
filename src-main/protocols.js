const fs = require('fs');
const path = require('path');
const {PassThrough, Readable} = require('stream');
const zlib = require('zlib');
const {app, protocol} = require('electron');
const {getDist, getPlatform} = require('./platform');
const packageJSON = require('../package.json');

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

/**
 * @param {string} xml
 * @returns {string}
 */
const escapeXML = (xml) => xml.replace(/[<>&'"]/g, c => {
  switch (c) {
    case '<': return '&lt;';
    case '>': return '&gt;';
    case '&': return '&amp;';
    case '\'': return '&apos;';
    case '"': return '&quot;';
  }
});

/**
 * @param {string} text
 * @returns {NodeJS.ReadStream}
 */
const createStreamWithText = (text) => {
  const stream = new PassThrough();
  stream.end(text);
  return stream;
};

/**
 * Note that custom extensions will be able to access this page and all of the information in it.
 * @param {Request | Electron.ProtocolRequest} request
 * @param {unknown} errorMessage
 * @returns {string}
 */
const createErrorPage = (request, errorMessage) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf8">
    <meta name="color-scheme" content="dark light">
  </head>
  <body>
    <h1>Protocol handler error</h1>
    <pre>${escapeXML('' + errorMessage)}</pre>
    <pre>URL: ${escapeXML(request.url)}</pre>
    <pre>Version ${packageJSON.version}, Electron ${process.versions.electron}, Platform ${getPlatform()} ${process.arch}, Distribution ${getDist()}</pre>
    <p>If you can see this page, <a href="https://github.com/TurboWarp/desktop/issues">please open a GitHub issue</a> with all the information above.</p>
  </body>
</html>`;

const errorPageHeaders = {
  'content-type': 'text/html',
  'content-security-policy': 'default-src \'none\''
};

const createSchemeHandler = (metadata) => {
  // Forcing a trailing / slightly improves security of the path traversal check later
  const root = path.join(metadata.root, '/');

  /**
   * @param {Electron.ProtocolRequest} request
   * @returns {Promise<{data: ReadableStream; error?: unknown; headers?: Record<string, string>}>}
   */
  return async (request) => {
    const url = new URL(request.url);
    const resolved = path.join(root, url.pathname);
    if (!resolved.startsWith(root)) {
      throw new Error('Path traversal blocked');
    }

    const fileExtension = path.extname(url.pathname);
    const mimeType = MIME_TYPES.get(fileExtension);
    if (!mimeType) {
      throw new Error(`Invalid file extension: ${fileExtension}`);
    }

    const headers = {
      'content-type': mimeType
    };

    if (metadata.brotli) {
      const fileStream = fs.createReadStream(`${resolved}.br`);
      const decompressStream = zlib.createBrotliDecompress();
      fileStream.pipe(decompressStream);

      return new Promise((resolve, reject) => {
        // TODO: this still returns 200 OK when brotli stream errors
        fileStream.on('open', () => {
          resolve({
            data: decompressStream,
            headers
          });
        });
        fileStream.on('error', (error) => {
          console.error(error);
          reject(new Error(`Brotli file stream error: ${error.code || 'unknown'}`));
        });
      });
    }

    const fileStream = fs.createReadStream(resolved);
    return new Promise((resolve, reject) => {
      fileStream.on('open', () => {
        resolve({
          data: fileStream,
          headers
        });
      });
      fileStream.on('error', (error) => {
        console.error(error);
        reject(new Error(`File stream error: ${error.code || 'unknown'}`));
      });
    });
  };
};

app.whenReady().then(() => {
  for (const [scheme, metadata] of Object.entries(FILE_SCHEMES)) {
    const handle = createSchemeHandler(metadata);

    // Electron 22 does not support protocol.handle() or new Response()
    if (protocol.handle) {
      protocol.handle(scheme, async (request) => {
        try {
          const response = await handle(request);
          return new Response(Readable.toWeb(response.data), {
            status: 200,
            headers: response.headers
          });
        } catch (error) {
          return new Response(createErrorPage(request, error), {
            status: 404,
            headers: errorPageHeaders
          });
        }
      });
    } else {
      protocol.registerStreamProtocol(scheme, (request, callback) => {
        handle(request)
          .then(callback)
          .catch((error) => {
            console.error(error);
            callback({
              statusCode: 404,
              data: createStreamWithText(createErrorPage(request, error)),
              headers: errorPageHeaders
            });
          });
      });
    }
  }
});
