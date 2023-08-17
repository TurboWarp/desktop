const {app, protocol} = require('electron');
const path = require('path');

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'tw-file',
    privileges: {
      standard: true,
      supportFetchAPI: true
    }
  }
]);

app.whenReady().then(() => {
  protocol.registerFileProtocol('tw-file', (request, callback) => {
    const url = new URL(request.url);
    const rendererRoot = path.join(__dirname, '../../dist-renderer/');
    const resolved = path.join(rendererRoot, url.pathname);
    if (resolved.startsWith(rendererRoot)) {
      callback(resolved);
    } else {
      callback({
        statusCode: 404
      });
    }
  });
});