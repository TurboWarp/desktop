const {name, version} = require('../package.json');

/**
 * Fetch any URL without care for CORS.
 * @param {string} url
 * @returns {Promise<Response>} Rejects if status was not okay
 */
const privilegedFetch = (url) => {
  // Don't use Electron's net.fetch because we don't want to be affected by the
  // networking stack which would include our request filtering, and we have no
  // reason for this to be able to fetch file:// URLs.
  return fetch(url, {
    headers: {
      'User-Agent': `${name}/${version}`
    }
  }).then((res) => {
    if (!res.ok) {
      throw new Error(`HTTP Error while fetching ${url}: ${res.status}`);
    }
    return res;
  });
};

module.exports = privilegedFetch;
