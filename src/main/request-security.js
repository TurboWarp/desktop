import {app} from 'electron';

const isRequestAllowed = (details) => {
  const url = new URL(details.url);
  if (url.protocol === 'file:') {
    // Requests to files must be inside the application
    return url.pathname.startsWith(__dirname);
  }

  if (details.resourceType !== 'xhr') {
    // Immune to CORS even in standard browsers
    return true;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    // Special protocols are immune to CORS
    return true;
  }

  const allowOriginHeader = details.responseHeaders['access-control-allow-origin'];
  if (!Array.isArray(allowOriginHeader)) {
    // No header, not allowed
    return false;
  }

  // Header must be set to "*"
  // We don't have a real Origin that we can check
  return allowOriginHeader.join(',') === '*';
};

app.on('session-created', (session) => {
  session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      cancel: !isRequestAllowed(details)
    });
  });
});
