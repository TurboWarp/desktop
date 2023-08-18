const path = require('path');
const fs = require('fs');
const {promisify} = require('util');
const settings = require('./settings');

const readdir = promisify(fs.readdir);

const listLocalFiles = async () => {
  const files = await readdir(path.join(__dirname, '../dist-library-files/'));
  return files.map(filename => filename.replace('.br', ''));
};

let cached = null;
const listLocalFilesCached = () => {
  if (!cached) {
    cached = listLocalFiles()
      .catch((error) => {
        console.error(error);
        return [];
      });
  }
  return cached;
};

const onBeforeRequest = (details, callback) => {
  const parsed = new URL(details.url);

  if (parsed.origin === 'https://cdn.assets.scratch.mit.edu' || parsed.origin === 'https://assets.scratch.mit.edu') {
    const match = parsed.href.match(/[0-9a-f]{32}\.\w{3}/i);
    if (match) {
      const md5ext = match[0];
      return listLocalFilesCached().then((localLibraryFiles) => {
        if (localLibraryFiles.includes(md5ext)) {
          return callback({
            redirectURL: `tw-library://./${md5ext}`
          });
        }
        callback({});
      });
    }
  }

  if (parsed.origin === 'https://extensions.turbowarp.org') {
    return callback({
      redirectURL: `tw-extensions://./${parsed.pathname}`
    });
  }

  callback({});
};

const onHeadersReceived = (details, callback) => {
  if (settings.bypassCORS) {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'access-control-allow-origin': '*'
      }
    })
  } else {
    callback({});
  }
};

module.exports = {
  onBeforeRequest,
  onHeadersReceived
};
