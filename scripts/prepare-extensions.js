const pathUtil = require('path');
const fs = require('fs');
const zlib = require('zlib');
const Builder = require('@turbowarp/extensions/builder');

const mode = 'desktop';
const builder = new Builder(mode);
const build = builder.build();
console.log(`Built extensions (mode: ${mode})`);

const outputDirectory = pathUtil.join(__dirname, '../dist-extensions/');
fs.rmSync(outputDirectory, {
  recursive: true,
  force: true,
});
for (const [relativePath, file] of Object.entries(build.files)) {
  console.log(`Compressing ${relativePath}`);
  const directoryName = pathUtil.dirname(relativePath);
  fs.mkdirSync(pathUtil.join(outputDirectory, directoryName), {
    recursive: true,
  });
  const contents = file.read();
  const compressed = zlib.brotliCompressSync(contents);
  fs.writeFileSync(pathUtil.join(outputDirectory, `${relativePath}.br`), compressed);
}

console.log(`Exported to ${outputDirectory}`);
