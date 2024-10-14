const pathUtil = require('path');

(async () => {
  let Builder;
  try {
    Builder = await import('../extensions/development/builder');
  } catch (e) {
    console.error('Could not load TurboWarp/extensions build scripts, most likely because the submodule is missing.');
    console.error('Try running: `git submodule init` and `git submodule update`');
    console.error(e);
    process.exit(1);
  }

  const outputDirectory = pathUtil.join(__dirname, '../dist-extensions/');
  const mode = 'desktop';
  const builder = new Builder(mode);
  const build = await builder.build();
  await build.export(outputDirectory);

  console.log(`Built ${mode} copy of extensions.turbowarp.org to ${outputDirectory}`);
})();
