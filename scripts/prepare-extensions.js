const pathUtil = require('path');
const Builder = require('@turbowarp/extensions/builder');

const outputDirectory = pathUtil.join(__dirname, '../dist-extensions/');
const mode = 'desktop';
const builder = new Builder(mode);
const build = builder.build();
build.export(outputDirectory);

console.log(`Built ${mode} copy of extensions.turbowarp.org to ${outputDirectory}`);
