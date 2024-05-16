const path = require('path');
const zlib = require('zlib');
const nodeURL = require('url');
const {app, protocol, net} = require('electron');
const {getDist, getPlatform} = require('./platform');
const packageJSON = require('../package.json');

/**
 * @typedef Metadata
 * @property {string} root
 * @property {boolean} [standard]
 * @property {boolean} [supportFetch]
 * @property {boolean} [secure]
 * @property {boolean} [brotli]
 */

/** @type {Record<string, Metadata>} */
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
MIME_TYPES.set('.map', 'application/json');
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
 * Promisified zlib.brotliDecompress
 */
const brotliDecompress = (input) => new Promise((resolve, reject) => {
  zlib.brotliDecompress(input, (error, result) => {
    if (error) {
      reject(error);
    } else {
      resolve(result);
    }
  });
});

/**
 * @param {unknown} xml
 * @returns {string}
 */
const escapeXML = (xml) => String(xml).replace(/[<>&'"]/g, c => {
  switch (c) {
    case '<': return '&lt;';
    case '>': return '&gt;';
    case '&': return '&amp;';
    case '\'': return '&apos;';
    case '"': return '&quot;';
  }
});

/**
 * Note that custom extensions will be able to access this page and all of the information in it.
 * @param {Request | Electron.ProtocolRequest} request
 * @param {unknown} errorMessage
 * @returns {string}
 */
const createErrorPageHTML = (request, errorMessage) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf8">
    <title>Protocol handler error</title>
  </head>
  <body bgcolor="white" text="black">
    <h1>Protocol handler error</h1>
    <p>If you can see this page, <a href="https://github.com/TurboWarp/desktop/issues" target="_blank" rel="noreferrer">please open a GitHub issue</a> or <a href="mailto:contact@turbowarp.org" target="_blank" rel="noreferrer">email us</a> with all the information below.</p>
    <pre>${escapeXML(errorMessage)}</pre>
    <pre>URL: ${escapeXML(request.url)}</pre>
    <pre>Version ${escapeXML(packageJSON.version)}, Electron ${escapeXML(process.versions.electron)}, Platform ${escapeXML(getPlatform())} ${escapeXML(process.arch)}, Distribution ${escapeXML(getDist())}</pre>
  </body>
</html>`;

const errorPageHeaders = {
  'content-type': 'text/html',
  'content-security-policy': 'default-src \'none\''
};

/** @param {Metadata} metadata */
const createModernProtocolHandler = (metadata) => {
  const root = path.join(metadata.root, '/');

  /**
   * @param {Request} request
   * @returns {Promise<Response>}
   */
  return async (request) => {
    const createErrorResponse = (error) => {
      console.error(error);
      return new Response(createErrorPageHTML(request, error), {
        status: 400,
        headers: errorPageHeaders
      });
    };

    try {
      const parsedURL = new URL(request.url);
      const resolved = path.join(root, parsedURL.pathname);
      if (!resolved.startsWith(root)) {
        return createErrorResponse(new Error('Path traversal blocked'));
      }
  
      const fileExtension = path.extname(resolved);
      const mimeType = MIME_TYPES.get(fileExtension);
      if (!mimeType) {
        return createErrorResponse(new Error(`Invalid file extension: ${fileExtension}`));
      }
  
      const headers = {
        'content-type': mimeType
      };
  
      if (metadata.brotli) {
        // Reading it all into memory is not ideal, but we've had so many problems with streaming
        // files from the asar that I can settle with this.
        const brotliResponse = await net.fetch(nodeURL.pathToFileURL(`${resolved}.br`));
        const brotliData = await brotliResponse.arrayBuffer();
        const decompressed = await brotliDecompress(brotliData);
        return new Response(decompressed, {
          headers
        });
      }
  
      const response = await net.fetch(nodeURL.pathToFileURL(resolved));
      return new Response(response.body, {
        headers
      });
    } catch (error) {
      return createErrorResponse(error);
    }
  };
};

/** @param {Metadata} metadata */
const createLegacyBrotliProtocolHandler = (metadata) => {
  const root = path.join(metadata.root, '/');

  /**
   * @param {Electron.ProtocolRequest} request
   * @param {(result: {data: Buffer; statusCode?: number; headers?: Record<string, string>;}) => void} callback
   */
  return async (request, callback) => {
    const fsPromises = require('fs/promises');

    const returnErrorPage = (error) => {
      console.error(error);
      callback({
        data: Buffer.from(createErrorPageHTML(request, error)),
        statusCode: 400,
        headers: errorPageHeaders
      });
    };

    try {
      const parsedURL = new URL(request.url);
      const resolved = path.join(root, parsedURL.pathname);
      if (!resolved.startsWith(root)) {
        returnErrorPage(new Error('Path traversal blocked'));
        return;
      }
  
      const fileExtension = path.extname(resolved);
      const mimeType = MIME_TYPES.get(fileExtension);
      if (!mimeType) {
        returnErrorPage(new Error(`Invalid file extension: ${fileExtension}`));
        return;
      }

      // Reading it all into memory is not ideal, but we've had so many problems with streaming
      // files from the asar that I can settle with this.
      const brotliData = await fsPromises.readFile(`${resolved}.br`);
      const decompressed = await brotliDecompress(brotliData);

      callback({
        data: decompressed,
        headers: {
          'content-type': mimeType
        }
      });
    } catch (error) {
      returnErrorPage(error);
    }
  };
};

/** @param {Metadata} metadata */
const createLegacyFileProtocolHandler = (metadata) => {
  const root = path.join(metadata.root, '/');

  /**
   * @param {Electron.ProtocolRequest} request
   * @param {(result: {path: string; statusCode?: number; headers?: Record<string, string>;}) => void} callback
   */
  return (request, callback) => {
    const returnErrorResponse = (error, errorPage) => {
      console.error(error);
      callback({
        status: 400,
        // All we can return is a file path, so we just have a few different ones baked in
        // for each error that we expect.
        path: path.join(__dirname, `../src-protocol-error/legacy-file/${errorPage}.html`),
        headers: errorPageHeaders
      });
    };

    try {
      const parsedURL = new URL(request.url);
      const resolved = path.join(root, parsedURL.pathname);
      if (!resolved.startsWith(root)) {
        returnErrorResponse(new Error('Path traversal blocked'), 'path-traversal');
        return;
      }
  
      const fileExtension = path.extname(resolved);
      const mimeType = MIME_TYPES.get(fileExtension);
      if (!mimeType) {
        returnErrorResponse(new Error(`Invalid file extension: ${fileExtension}`), 'invalid-extension');
        return;
      }

      callback({
        path: resolved,
        headers: {
          'content-type': mimeType
        }
      });
    } catch (error) {
      returnErrorResponse(error, 'unknown');
    }
  };
};

app.whenReady().then(() => {
  for (const [scheme, metadata] of Object.entries(FILE_SCHEMES)) {
    // Electron 22 (used by Windows 7/8/8.1 build) does not support protocol.handle() or new Response()
    if (protocol.handle) {
      protocol.handle(scheme, createModernProtocolHandler(metadata));
    } else {
      if (metadata.brotli) {
        protocol.registerBufferProtocol(scheme, createLegacyBrotliProtocolHandler(metadata));
      } else {
        protocol.registerFileProtocol(scheme, createLegacyFileProtocolHandler(metadata));
      }
    }
  }
});
