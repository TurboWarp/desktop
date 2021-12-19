const fs = require('fs');
const crypto = require('crypto');
const pathUtil = require('path');
const {fetch} = require('./lib');
const packagerInfo = require('./packager.json');

const path = pathUtil.join(__dirname, '..', 'static', 'packager.html');
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

const isAlreadyDownloaded = () => {
  try {
    if (sha256(fs.readFileSync(path)) === packagerInfo.sha256) {
      return true;
    }
  } catch (e) {
    // file might not exist, ignore
  }
  return false;
};


if (!isAlreadyDownloaded()) {
  console.log(`Downloading ${packagerInfo.src}`);
  console.time('Download packager');

  fetch(packagerInfo.src)
    .then((res) => res.buffer())
    .then((buffer) => {
      const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
      if (packagerInfo.sha256 !== sha256) {
        throw new Error(`Hash mismatch: expected ${packagerInfo.sha256} but found ${sha256}`);
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
