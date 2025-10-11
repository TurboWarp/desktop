import * as pathUtil from 'node:path';
import { promisify } from 'node:util';
import * as fs from 'node:fs';
import * as zlib from 'node:zlib';
import Builder from '@turbowarp/extensions/builder';

const mode = 'desktop';
const builder = new Builder(mode);
const build = builder.build();
console.log(`Built extensions (mode: ${mode})`);

const outputDirectory = pathUtil.join(import.meta.dirname, '../dist-extensions/');
fs.rmSync(outputDirectory, {
  recursive: true,
  force: true,
});

const brotliCompress = promisify(zlib.brotliCompress);
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

const exportFile = async (relativePath, file) => {
  // This part is unfortunately still synchronous
  const contents = file.read();
  console.log(`Generated ${relativePath}`);

  const compressed = await brotliCompress(contents);

  const directoryName = pathUtil.dirname(relativePath);
  await mkdir(pathUtil.join(outputDirectory, directoryName), {
    recursive: true
  });

  await writeFile(pathUtil.join(outputDirectory, `${relativePath}.br`), compressed)

  console.log(`Compressed ${relativePath}`);
};

const promises = Object.entries(build.files).map(([relativePath, file]) => exportFile(relativePath, file));
Promise.all(promises)
  .then(() => {
    console.log(`Exported to ${outputDirectory}`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
