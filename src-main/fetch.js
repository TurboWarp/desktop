// The version of Electron we use does not yet support fetch()

const http = require('http');
const https = require('https');
const {version} = require('../package.json');

/**
 * @param {string} url
 * @returns {Promise<Buffer>}
 */
const privilegedFetchAsBuffer = (url) => new Promise((resolve, reject) => {
  const parsedURL = new URL(url);
  const mod = parsedURL.protocol === 'http:' ? http : https;
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
