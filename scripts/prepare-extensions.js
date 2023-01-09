const pathUtil = require('path');

let Builder;
try {
  Builder = require('../extensions/development/builder');
} catch (e) {
  if (e.code === 'MODULE_NOT_FOUND') {
    console.error('Could not load TurboWarp/extensions build scripts, most likely because the submodule is missing.');
    console.error('Try running: `git submodule init` and `git submodule update`');
  } else {
    console.error(e);
  }
  process.exit(1);
}

// Even if the desktop app is in development mode, always build extensions in production mode.
const isProduction = true;

const outputDirectory = pathUtil.join(__dirname, '..', 'static', 'extensions.turbowarp.org');
const builder = new Builder(isProduction);
const build = builder.build();
build.export(outputDirectory);

console.log(`Built copy of extensions.turbowarp.org to ${outputDirectory}`);
