const https = require('https');
const fetch = require('node-fetch');

const httpsAgent = new https.Agent({
  keepAlive: true
});

const persistentFetch = async (url, opts = {}) => {
  opts.agent = httpsAgent;
  let err;
  for (let i = 0; i < 3; i++) {
    try {
      const response = await fetch(url, opts);
      if (response.status !== 200) {
        throw new Error(`${md5ext}: Unexpected status code: ${response.status}`);
      }
      return response;
    } catch (e) {
      if (i === 0) err = e;
      console.warn(`Attempt to fetch ${url} failed, trying again...`);
    }
  }
  throw err;
};

module.exports = {
  fetch: persistentFetch
};
