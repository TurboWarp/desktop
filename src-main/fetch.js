// The version of Electron we use does not yet support fetch()

const {version} = require('../package.json');

/**
 * @param {string} url
 * @returns {Promise<Buffer>}
 */
const privilegedFetchAsBuffer = (url) => new Promise((resolve, reject) => {
  const parsedURL = new URL(url);
  // Import http and https lazily as they take about 17ms to import
  const mod = parsedURL.protocol === 'http:' ? require('http') : require('https');
  const request = mod.get(url, {
    headers: {
      'user-agent': `turbowarp-desktop/${version}`
    }
  });

  request.on('response', (response) => {
    const statusCode = response.statusCode;
    if (statusCode !== 200) {
      reject(new Error(`HTTP status ${statusCode}`))
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

module.exports = privilegedFetchAsBuffer;
