const fs = require('fs');
const pathUtil = require('path');
const {computeSHA256, persistentFetch} = require('./lib');
const packagerInfo = require('./packager.json');

const path = pathUtil.join(__dirname, '../src-renderer/packager/standalone.html');

const isAlreadyDownloaded = () => {
  try {
    const data = fs.readFileSync(path);
    return computeSHA256(data) === packagerInfo.sha256;
  } catch (e) {
    // file might not exist, ignore
  }
  return false;
};

if (!isAlreadyDownloaded()) {
  console.log(`Downloading ${packagerInfo.src}`);
  console.time('Download packager');

  persistentFetch(packagerInfo.src)
    .then((res) => res.arrayBuffer())
    .then((buffer) => {
      const sha256 = computeSHA256(buffer);
      if (packagerInfo.sha256 !== sha256) {
        throw new Error(`Hash mismatch: expected ${packagerInfo.sha256} but found ${sha256}`);
      }

      fs.mkdirSync(pathUtil.dirname(path), {
        recursive: true
      });
      fs.writeFileSync(path, new Uint8Array(buffer));
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
