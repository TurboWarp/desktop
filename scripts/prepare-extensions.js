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

const outputDirectory = pathUtil.join(__dirname, '../dist-extensions/');
const mode = 'desktop';
const builder = new Builder(mode);
const build = builder.build();
build.export(outputDirectory);

console.log(`Built ${mode} copy of extensions.turbowarp.org to ${outputDirectory}`);
