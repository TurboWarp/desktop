const fs = require('fs');
const crypto = require('crypto');
const pathUtil = require('path');
const {fetch} = require('./lib');

const DOWNLOAD_URL = 'https://github.com/TurboWarp/packager/releases/download/v0.3.0/turbowarp-packager-standalone-0.3.0.html';
const CHECKSUM = '1b850c944e5a852c81a6132e60af2887065675d5ae8fa2380a3498b562898116';

const path = pathUtil.join(__dirname, '..', 'static', 'packager.html');
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

const needToFetch = () => {
  try {
    if (sha256(fs.readFileSync(path)) === CHECKSUM) {
      return false;
    }
  } catch (e) {
    // file might not exist, ignore
  }
  return true;
};


if (needToFetch()) {
  console.log(`Downloading ${DOWNLOAD_URL}`);
  console.time('Download packager');

  fetch(DOWNLOAD_URL)
    .then((res) => res.buffer())
    .then((buffer) => {
      const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
      if (CHECKSUM !== sha256) {
        throw new Error(`Hash mismatch: expected ${CHECKSUM} but found ${sha256}`);
      }
      fs.writeFileSync(pathUtil.join(__dirname, '..', 'static', 'packager.html'), buffer);
      console.timeEnd('Download packager');
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
} else {
  console.log('Packager already updated');
}
