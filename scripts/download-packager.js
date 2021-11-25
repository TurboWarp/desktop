const fs = require('fs');
const pathUtil = require('path');
const {fetch} = require('./lib');
const promisify = require('util').promisify;
const writeFile = promisify(fs.writeFile);

const DOWNLOAD = 'https://github.com/TurboWarp/packager/releases/download/v0.2.0/turbowarp-packager-standalone-0.2.0.html';
console.log(`Downloading ${DOWNLOAD}`);

fetch(DOWNLOAD)
  .then((res) => res.buffer())
  .then(async (buffer) => {
    await writeFile(pathUtil.join(__dirname, '..', 'static', 'packager.html'), buffer);
  });
