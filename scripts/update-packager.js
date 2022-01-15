const fs = require('fs');
const crypto = require('crypto');
const pathUtil = require('path');
const {fetch} = require('./lib');

const run = async () => {
  const releases = await (await fetch('https://api.github.com/repos/TurboWarp/packager/releases')).json();
  const packagerURL = releases[0].assets[0].browser_download_url;
  console.log(`Source: ${packagerURL}`);
  const packagerBuffer = await (await fetch(packagerURL)).buffer();
  const sha256 = crypto.createHash('sha256').update(packagerBuffer).digest('hex');
  console.log(`SHA-256: ${sha256}`);
  fs.writeFileSync(pathUtil.join(__dirname, 'packager.json'), JSON.stringify({
    src: packagerURL,
    sha256,
  }, null, 2));
};

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
