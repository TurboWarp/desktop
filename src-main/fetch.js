// Can't use fetch() because we still need to support Electron 22

const {name, version} = require('../package.json');

/**
 * @param {string} url
 * @returns {Promise<Buffer>}
 */
const privilegedFetch = (url) => new Promise((resolve, reject) => {
  const parsedURL = new URL(url);
  // Import http and https lazily as they take about 17ms to import the first time
  const mod = parsedURL.protocol === 'http:' ? require('http') : require('https');
  const request = mod.get(url, {
    headers: {
      'user-agent': `${name}/${version}`
    }
  });

  request.on('response', (response) => {
    const statusCode = response.statusCode;
    if (statusCode !== 200) {
      reject(new Error(`HTTP error ${statusCode} while fetching ${url}`))
      return;
    }
  
    let chunks = [];
    response.on('data', (chunk) => {
      chunks.push(chunk);
    });
  
    response.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });

  request.on('error', (e) => {
    reject(e);
  });
});

/**
 * @param {string} url
 * @returns {unknown} parsed JSON object
 */
privilegedFetch.json = async (url) => {
  const buffer = await privilegedFetch(url);
  return JSON.parse(buffer.toString('utf-8'));
};

module.exports = privilegedFetch;
