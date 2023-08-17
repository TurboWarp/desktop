// This is horrible. Scratch.fetch disables redirects, but in the desktop app, extensions.turbowarp.org
// is implemented with a redirect. So just until we find a better way to do this, we'll do this horrible
// hack instead.
const originalFetch = window.fetch;
window.fetch = function fetchWithRedirectFix (url, options) {
    if (typeof url === 'string' && url.startsWith('https://extensions.turbowarp.org/') && options) {
        options.redirect = 'follow';
    }
    return originalFetch.call(this, url, options);
};
