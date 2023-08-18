const fs = require('fs');
const crypto = require('crypto');
const pathUtil = require('path');
const {fetch} = require('./lib');
const packagerInfo = require('./packager.json');

const path = pathUtil.join(__dirname, '../dist-packager/packager.html');
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

const isAlreadyDownloaded = () => {
  try {
    const data = fs.readFileSync(path);
    return sha256(data) === packagerInfo.sha256;
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
      fs.writeFileSync(path, buffer);
    })
    .then(() => {
      process.exit(0);
    })  
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
} else {
  console.log('Packager already updated');
}
