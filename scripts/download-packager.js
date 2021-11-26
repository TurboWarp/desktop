const fs = require('fs');
const crypto = require('crypto');
const pathUtil = require('path');
const {fetch} = require('./lib');

const DOWNLOAD_URL = 'https://github.com/TurboWarp/packager/releases/download/v0.2.0/turbowarp-packager-standalone-0.2.0.html';
const CHECKSUM = 'f2b7c13d8920719d19be32d5f386716601ba9f24b0c8d8aff54e098706c57e0a';

console.log(`Downloading ${DOWNLOAD_URL}`);
console.time('Download packager');

fetch(DOWNLOAD_URL)
  .then((res) => res.buffer())
  .then(async (buffer) => {
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    if (CHECKSUM !== sha256) {
      throw new Error(`Checksum mismatch: expected ${CHECKSUM} but found ${sha256}`);
    }
    fs.writeFileSync(pathUtil.join(__dirname, '..', 'static', 'packager.html'), buffer);
    console.timeEnd('Download packager');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
