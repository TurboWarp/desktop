import {app, protocol} from 'electron';
import pathUtil from 'path';
import fs from 'fs';
import {promisify} from 'util';
import {staticDir} from './environment';

const readFile = promisify(fs.readFile);

const extensionDirectory = pathUtil.join(staticDir, 'extensions.turbowarp.org', '/');

app.on('session-created', (session) => {
  session.webRequest.onBeforeRequest({
    urls: ['https://extensions.turbowarp.org/*']
  }, (details, callback) => {
    const path = new URL(details.url).pathname;
    callback({
      redirectURL: `tw-extensions://${path}`
    });
  });
});

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'tw-extensions',
    privileges: {
      supportFetchAPI: true
    }
  }
]);

app.whenReady().then(() => {
  protocol.registerBufferProtocol('tw-extensions', (request, callback) => {
    const path = pathUtil.basename(new URL(request.url).pathname);
    const absolutePath = pathUtil.join(extensionDirectory, path);

    if (!absolutePath.startsWith(extensionDirectory)) {
      callback({
        statusCode: 404
      });
      return;
    }

    readFile(absolutePath)
      .then((buffer) => callback(buffer))
      .catch((err) => callback({
        statusCode: 404
      }));
  });  
});
